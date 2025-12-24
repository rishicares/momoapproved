const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3000/api'; // Replace with real API Gateway URL

export const getPresignedUrl = async (fileType) => {
  // In a real app, you would fetch this from your Lambda/API Gateway
  // For now, we'll simulate it or if VITE_API_ENDPOINT is set, try to call it.
  
  if (!import.meta.env.VITE_API_ENDPOINT) {
    console.warn("VITE_API_ENDPOINT not set. Using mock response.");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          uploadUrl: 'https://mock-s3-bucket.s3.amazonaws.com/upload', // Fake URL
          fileId: `mock-${Date.now()}`
        });
      }, 500);
    });
  }

  const response = await fetch(`${API_ENDPOINT}/generate-presigned-url?contentType=${encodeURIComponent(fileType)}`);
  if (!response.ok) {
    throw new Error('Failed to get upload URL');
  }
  return response.json();
};

export const uploadToS3 = async (file, presignedUrl) => {
  if (presignedUrl.includes('mock-s3-bucket')) {
    console.log("Mocking S3 upload to:", presignedUrl);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 1000);
    });
  }

  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type
    }
  });

  if (!response.ok) {
    throw new Error('Failed to upload image to S3');
  }
  
  return response;
};

export const listImages = async () => {
  if (!import.meta.env.VITE_API_ENDPOINT) {
    console.warn("VITE_API_ENDPOINT not set. Using mock response.");
    return { images: [] };
  }

  const response = await fetch(`${API_ENDPOINT}/list-images`);
  if (!response.ok) {
    throw new Error('Failed to fetch images');
  }
  return response.json(); // Returns { images: [], stats: {} }
};
