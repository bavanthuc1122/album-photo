const CONFIG = {
<<<<<<< HEAD
  API_URL: process.env.PYTHON_API_URL || 'http://localhost:3000',
=======
  API_URL: process.env.PYTHON_API_URL || 'http://localhost:3000,
>>>>>>> d9dc322e7dd5c6f75b65786234d2ae7f64044279
  DOWNLOAD_API_URL: 'http://localhost:5003',
  STORAGE: {
    DEFAULT_COVER: '../icon_folder/1.png',
    BASE_PATH: 'storage/dataclient'
  },
  API: {
    ENDPOINTS: {
      UPLOAD: '/api/upload',
      CREATE_ALBUM: '/api/albums',
      GET_ALBUM: '/api/albums',
      GET_COVER: '/api/albums/{id}/cover',
      GET_METADATA: '/api/albums/{id}/metadata'
    }
  }
};

// Helper functions
export const getApiUrl = (endpoint, params = {}) => {
  let url = CONFIG.API_URL + endpoint;
  // Replace path parameters
  Object.keys(params).forEach(key => {
    url = url.replace(`{${key}}`, params[key]);
  });
  return url;
};

export const getImageUrl = (path) => {
  if (!path) return CONFIG.STORAGE.DEFAULT_COVER;
  
  // Ensure we're using the Python server URL (5002)
  // Remove dataclient if it exists in path since it's part of storage structure
  const cleanPath = path.replace(/^(\/)?dataclient\//, '');
  
  // Construct full URL with API_URL (port 5002)
  const url = `${CONFIG.API_URL}/dataclient/${cleanPath}`;
  console.log("Image URL:", url); // Debug
  return url;
};

export const getAlbumCoverUrl = (albumId, username) => {
  if (!albumId || !username) return CONFIG.STORAGE.DEFAULT_COVER;
  return `${CONFIG.API_URL}/api/albums/${albumId}/cover?username=${username}`;
};

// Chỉ log cấu hình cơ bản
if (typeof window !== 'undefined') {
  console.log('API Config:', {
    baseUrl: CONFIG.API_URL,
    endpoints: {
      upload: CONFIG.API.ENDPOINTS.UPLOAD,
      createAlbum: CONFIG.API.ENDPOINTS.CREATE_ALBUM
    }
  });
}

export default CONFIG;