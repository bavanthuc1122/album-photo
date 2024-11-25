import { CONFIG, getApiUrl } from './config';
import { createFormattedUrl } from './helpers';

export async function getAlbums() {
  try {
    const response = await fetch(getApiUrl(CONFIG.API.ENDPOINTS.ALBUMS));
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Error fetching albums:', error);
    throw error;
  }
}

export async function getAlbum(slug) {
  try {
    const id = slug.split('-').pop();
    const response = await fetch(getApiUrl(CONFIG.API.ENDPOINTS.ALBUM(id)));
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return {
      ...data,
      name: decodeURIComponent(data.name)
    };
  } catch (error) {
    console.error('Error fetching album:', error);
    throw error;
  }
}

export async function getAllAlbumSlugs() {
  try {
    const albums = await getAlbums();
    return albums.map(album => {
      const slug = `${album.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${album.id}`;
      return {
        params: { slug }
      };
    });
  } catch (error) {
    console.error('Error getting album slugs:', error);
    return [];
  }
}