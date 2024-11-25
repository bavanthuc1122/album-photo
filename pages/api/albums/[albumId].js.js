import { join } from 'path';
import fs from 'fs';
import { authMiddleware } from '../../../middleware/auth';

const handler = async (req, res) => {
  const { id } = req.query;
  const username = req.user.username;

  try {
    const userPath = join(process.cwd(), 'storage/dataclient', `user_${username}`, 'data', id);

    if (req.method === 'GET') {
      if (!fs.existsSync(userPath)) {
        return res.status(404).json({ error: 'Album not found' });
      }
      const photos = fs.readdirSync(userPath).filter(file => 
        /\.(jpg|jpeg|png)$/i.test(file)
      );
      
      return res.status(200).json({
        id: id,
        name: id,
        photos: photos.map(photo => ({
          name: photo,
          url: `/dataclient/user_${username}/data/${id}/${photo}`
        }))
      });
    }

    if (req.method === 'DELETE') {
      if (!fs.existsSync(userPath)) {
        return res.status(404).json({ error: 'Album not found' });
      }
      fs.rmSync(userPath, { recursive: true });
      return res.status(200).json({ success: true });
    }

    if (req.method === 'PUT') {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }
      const newPath = join(process.cwd(), 'storage/dataclient', `user_${username}`, 'data', name);
      fs.renameSync(userPath, newPath);
      return res.status(200).json({ success: true });
    }

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default authMiddleware(handler);