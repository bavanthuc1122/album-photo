const CONFIG = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002',
  DOWNLOAD_API_URL: 'http://localhost:5003',
  STORAGE: {
    DEFAULT_COVER: '/icon_folder/default_album.png'
  },
  API: {
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002',
    ENDPOINTS: {
      UPLOAD: '/api/upload',
      CREATE_ALBUM: '/api/albums'
    }
  }
};

export const getApiUrl = (endpoint) => {
  return `${CONFIG.API_URL}${endpoint}`;
};

export const getImageUrl = (path) => {
  if (!path) return CONFIG.STORAGE.DEFAULT_COVER;
  const cleanPath = path.replace(/^dataclient\//, '');
  return `${CONFIG.API_URL}/dataclient/${cleanPath}`;
};

export const getAlbumCoverUrl = (albumId, username) => {
  if (!albumId || !username) return CONFIG.STORAGE.DEFAULT_COVER;
  return `${CONFIG.API_URL}/api/albums/${albumId}/cover?username=${username}`;
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