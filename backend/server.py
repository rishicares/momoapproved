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

# Configure CORS to allow frontend domain
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:5173",  # Local development
            "http://momo.rishikesh.info.np",  # Production HTTP
            "https://momo.rishikesh.info.np"  # Production HTTPS
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

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

@app.route('/api/get-image-status', methods=['GET'])
def get_image_status():
    BUCKET_NAME = os.environ.get('S3_BUCKET_NAME')
    key = request.args.get('key')
    
    if not BUCKET_NAME or not key:
        return jsonify({'error': 'Missing configuration or key'}), 400
        
    try:
        region = os.environ.get('AWS_REGION', 'us-east-1')
        s3_client = boto3.client('s3', region_name=region, config=Config(signature_version='s3v4'))
        
        # Fetch tags directly - NO CACHING for status check
        tags_response = s3_client.get_object_tagging(Bucket=BUCKET_NAME, Key=key)
        tags = {tag['Key']: tag['Value'] for tag in tags_response.get('TagSet', [])}
        status = tags.get('status', None)
        reason = tags.get('reason', None)
        
        # Generate URL
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': key
            },
            ExpiresIn=3600
        )
        
        # Get metadata for uploadedAt
        # We can skip this if we just want status, but it's good for the frontend object
        # head_object is fast
        head = s3_client.head_object(Bucket=BUCKET_NAME, Key=key)
        uploaded_at = head['LastModified'].isoformat()
        timestamp = head['LastModified'].timestamp()
        
        return jsonify({
            'id': key,
            'status': status,
            'reason': reason,
            'url': url,
            'uploadedAt': uploaded_at,
            'timestamp': timestamp
        })
        
    except ClientError as e:
        # If 404, it might not be tagged yet or doesn't exist
        print(f"AWS Error checking status for {key}: {e}")
        return jsonify({'status': None, 'error': 'Image not found or not ready'}), 404
    except Exception as e:
        print(f"Error checking status: {str(e)}")
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
        from datetime import datetime
        current_time = time.time()
        
        # Get 'after' timestamp from query params (optional)
        after_timestamp = request.args.get('after')
        
        if 'Contents' in response:
            # Sort objects by LastModified descending (newest first)
            sorted_objects = sorted(
                response['Contents'], 
                key=lambda x: x['LastModified'], 
                reverse=True
            )

            for obj in sorted_objects:
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
                        reason = tags.get('reason', None) # Extract reason
                    except:
                        status = None
                        reason = None
                    
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
                        'reason': reason,
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
                
                # Filter by timestamp if 'after' param is present
                if after_timestamp:
                    try:
                        # Convert both to timestamps for comparison
                        # S3 LastModified is a datetime object with timezone info
                        obj_ts = obj['LastModified'].timestamp()
                        after_ts = float(after_timestamp)
                        
                        # Only include if newer than 'after'
                        if obj_ts <= after_ts:
                            continue
                    except (ValueError, TypeError) as e:
                        print(f"Error comparing timestamps: {e}")
                        # If error, include it to be safe
                        pass

                images.append({
                    'id': obj['Key'],
                    'url': url,
                    'status': status,
                    'reason': cached_data.get('reason') if cached_data else reason,
                    'uploadedAt': obj['LastModified'].isoformat(),
                    'timestamp': obj['LastModified'].timestamp() # Add timestamp for easier frontend comparison
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
    app.run(host='0.0.0.0', port=3000, debug=True)
