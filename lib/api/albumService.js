const albumService = {
  createAlbum: async (name, username) => {
    try {
      const response = await fetch(
        getApiUrl(`${CONFIG.API.ENDPOINTS.ALBUMS}?username=${username}`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim() })
        }
      );

      if (!response.ok) throw new Error('Không thể tạo album');
      return await response.json();
    } catch (error) {
      throw new Error(`Lỗi tạo album: ${error.message}`);
    }
  },

  uploadToAlbum: async (files, links, albumId, username) => {
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      links.forEach(link => formData.append('links', link));

      const response = await fetch(
        getApiUrl(`${CONFIG.API.ENDPOINTS.UPLOAD}/${albumId}?username=${username}`),
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) throw new Error('Upload thất bại');
      return await response.json();
    } catch (error) {
      throw new Error(`Lỗi upload: ${error.message}`);
    }
  }
};
