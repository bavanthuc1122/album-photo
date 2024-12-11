const CONFIG = {
  API_URL: 'http://localhost:3000',
  STORAGE: {
    DEFAULT_COVER: '/icon_folder/default_cover.jpg'
  }
};

export const getPhotoUrl = (photo, username, albumName) => {
  if (!photo?.path) {
    return '';
  }
  return `${CONFIG.API_URL}/dataclient/user_${username}/data/${albumName}/${photo.path}`;
};

export const getAlbumCoverUrl = (username, albumId) => {
  return `${CONFIG.API_URL}/dataclient/user_${username}/data/${albumId}`;
};

export default CONFIG; 