const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || '/api';
console.log("Using API_ENDPOINT:", API_ENDPOINT, "from env:", import.meta.env.VITE_API_ENDPOINT);

export const getPresignedUrl = async (fileType) => {
  // In a real app, you would fetch this from your Lambda/API Gateway
  // For now, we'll simulate it or if VITE_API_ENDPOINT is set, try to call it.
  
  // if (!import.meta.env.VITE_API_ENDPOINT) {
  //   console.warn("VITE_API_ENDPOINT not set. Using mock response.");
  //   return new Promise((resolve) => {
  //     setTimeout(() => {
  //       resolve({
  //         uploadUrl: 'https://mock-s3-bucket.s3.amazonaws.com/upload', // Fake URL
  //         fileId: `mock-${Date.now()}`
  //       });
  //     }, 500);
  //   });
  // }

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

export const listImages = async (afterTimestamp = null) => {
  // if (!import.meta.env.VITE_API_ENDPOINT) {
  //   console.warn("VITE_API_ENDPOINT not set. Using mock response.");
  //   return { images: [] };
  // }

  let url = `${API_ENDPOINT}/list-images`;
  if (afterTimestamp) {
    url += `?after=${afterTimestamp}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch images');
  }
  return response.json(); // Returns { images: [], stats: {} }
};

export const getImageStatus = async (key) => {
  // if (!import.meta.env.VITE_API_ENDPOINT) {
  //   console.warn("VITE_API_ENDPOINT not set. Using mock response.");
  //   return { status: null };
  // }

  const response = await fetch(`${API_ENDPOINT}/get-image-status?key=${encodeURIComponent(key)}`);
  if (response.status === 404) {
      return { status: null }; // Not ready yet
  }
  if (!response.ok) {
    throw new Error('Failed to fetch image status');
  }
  return response.json();
};
