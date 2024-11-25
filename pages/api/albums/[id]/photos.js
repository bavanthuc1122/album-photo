import path from 'path';
import fs from 'fs';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { id } = req.query;
      const username = req.query.username;
      console.log('Debug photos API:', {
        albumId: id,
        username: username,
        path: albumPath
      });

      if (!username) {
        return res.status(400).json({ 
          error: 'Username is required' 
        });
      }

      const albumPath = path.join($1, "storage", 'dataclient', `user_${username}`, 'data', id);

      if (!fs.existsSync(albumPath)) {
        return res.status(404).json({ error: 'Album not found' });
      }

      const files = fs.readdirSync(albumPath);
      const photos = files
        .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
        .map(file => ({
          id: path.parse(file).name,
          name: file,
          url: `/dataclient/user_${username}/data/${id}/${file}`
        }));

      console.log('API Response:', {
        folders: files,
        photos: photos
      });

      res.status(200).json({
        success: true,
        photos: photos
      });

    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}