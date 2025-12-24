from flask import Flask, jsonify, request
from flask_cors import CORS
import boto3
import os
import uuid
from botocore.exceptions import ClientError
from botocore.config import Config
from dotenv import load_dotenv

# Load environment variables from root .env
# Try loading from parent directory first (development structure)
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))
# Also try loading from current directory (production/docker structure)
load_dotenv()

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

@app.route('/api/generate-presigned-url', methods=['GET'])
def generate_presigned_url():
    # Get bucket name from environment variable
    BUCKET_NAME = os.environ.get('S3_BUCKET_NAME')
    
    if not BUCKET_NAME:
        return jsonify({'error': 'Server configuration error: S3_BUCKET_NAME not set'}), 500
    
    try:
        # Generate a unique file name
        file_id = str(uuid.uuid4())
        file_name = f"{file_id}" 
        
        # Initialize S3 client with explicit region and force signature v4
        region = os.environ.get('AWS_REGION', 'us-east-1')
        s3_client = boto3.client('s3', region_name=region, config=Config(signature_version='s3v4'))
        
        # Get content type for logging, but don't enforce it in signature to avoid mismatches
        content_type = request.args.get('contentType', 'image/jpeg')
        
        print(f"DEBUG: Generating URL for Bucket: {BUCKET_NAME}, Key: {file_name}, ContentType: {content_type}")
        
        # Generate the presigned URL for PUT request
        # We REMOVED ContentType from Params to allow the frontend to send any header without breaking signature
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': file_name
            },
            ExpiresIn=300 # URL expires in 5 minutes
        )
        
        return jsonify({
            'uploadUrl': presigned_url,
            'fileId': file_name,
            'bucket': BUCKET_NAME
        })
        
    except ClientError as e:
        print(f"AWS Error: {e}")
        return jsonify({'error': 'Failed to generate upload URL'}), 500
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# In-memory cache: {etag: {'status': str, 'url': str, 'expires_at': float}}
IMAGE_CACHE = {}

@app.route('/api/list-images', methods=['GET'])
def list_images():
    BUCKET_NAME = os.environ.get('S3_BUCKET_NAME')
    
    if not BUCKET_NAME:
        return jsonify({'error': 'Server configuration error: S3_BUCKET_NAME not set'}), 500
    
    try:
        region = os.environ.get('AWS_REGION', 'us-east-1')
        s3_client = boto3.client('s3', region_name=region, config=Config(signature_version='s3v4'))
        
        # List all objects in the bucket
        response = s3_client.list_objects_v2(Bucket=BUCKET_NAME)
        
        images = []
        stats = {
            'total': 0,
            'approved': 0,
            'blurred': 0,
            'blocked': 0,
            'processing': 0
        }
        
        import time
        current_time = time.time()
        
        if 'Contents' in response:
            for obj in response['Contents']:
                stats['total'] += 1
                etag = obj['ETag']
                
                # Check cache
                cached_data = IMAGE_CACHE.get(etag)
                if cached_data and cached_data['expires_at'] > current_time + 60: # Buffer of 60s
                    status = cached_data['status']
                    url = cached_data['url']
                else:
                    # Cache miss or expired - fetch tags and generate new URL
                    try:
                        tags_response = s3_client.get_object_tagging(Bucket=BUCKET_NAME, Key=obj['Key'])
                        tags = {tag['Key']: tag['Value'] for tag in tags_response.get('TagSet', [])}
                        status = tags.get('status', None)
                    except:
                        status = None
                    
                    # Generate presigned GET URL (valid for 1 hour)
                    url = s3_client.generate_presigned_url(
                        'get_object',
                        Params={
                            'Bucket': BUCKET_NAME,
                            'Key': obj['Key']
                        },
                        ExpiresIn=3600  # 1 hour
                    )
                    
                    # Update cache
                    # CRITICAL: If status is None or PROCESSING, cache for a very short time (e.g., 5s)
                    # because tags might change soon. If APPROVED/BLOCKED/BLURRED, cache for longer (e.g., 1h).
                    ttl = 3600 if status in ['APPROVED', 'BLURRED', 'BLOCKED'] else 5
                    
                    IMAGE_CACHE[etag] = {
                        'status': status,
                        'url': url,
                        'expires_at': current_time + ttl
                    }
                
                # Update stats
                if status == 'APPROVED':
                    stats['approved'] += 1
                elif status == 'BLURRED':
                    stats['blurred'] += 1
                elif status == 'BLOCKED':
                    stats['blocked'] += 1
                elif status == 'PROCESSING':
                    stats['processing'] += 1
                else:
                    pass

                # Skip images without status, with BLOCKED status, OR PROCESSING status
                # User requested: "do not keep anything in processing" -> hide them from feed
                if not status or status == 'BLOCKED' or status == 'PROCESSING':
                    continue
                
                images.append({
                    'id': obj['Key'],
                    'url': url,
                    'status': status,
                    'uploadedAt': obj['LastModified'].isoformat()
                })
        
        return jsonify({'images': images, 'stats': stats})
        
    except ClientError as e:
        print(f"AWS Error: {e}")
        return jsonify({'error': 'Failed to list images'}), 500
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("Starting standalone backend server on port 3000...")
    print(f"Using Bucket: {os.environ.get('S3_BUCKET_NAME')}")
    print(f"Using Region: {os.environ.get('AWS_REGION')}")
    app.run(port=3000, debug=True)
