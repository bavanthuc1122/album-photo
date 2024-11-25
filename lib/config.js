const CONFIG = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002',
  DOWNLOAD_API_URL: 'http://localhost:5003',
  STORAGE: {
    DEFAULT_COVER: '/icon_folder/default_album.png'
  },
  API: {
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002',
    ENDPOINTS: {
      PHOTOS: (albumId) => `/api/albums/${albumId}/photos`,
      UPLOAD: '/api/upload',
      CREATE_ALBUM: '/api/upload_album',
      DOWNLOAD: (albumId) => `/api/albums/${albumId}/download`,
      METADATA: (albumId) => `/api/albums/${albumId}/metadata`
    }
  }
};

export const getApiUrl = (path) => {
  return `${CONFIG.API_URL}${path}`;
};

export const getImageUrl = (path) => {
  return path.startsWith('http') ? path : `${CONFIG.API_URL}${path}`;
};

// Chỉ log cấu hình cơ bản
if (typeof window !== 'undefined') {
  console.log('API Config:', {
    baseUrl: CONFIG.API.BASE_URL,
    endpoints: {
      upload: CONFIG.API.ENDPOINTS.UPLOAD,
      createAlbum: CONFIG.API.ENDPOINTS.CREATE_ALBUM
    }
  });
}

export default CONFIG;