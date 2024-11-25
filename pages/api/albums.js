import { join } from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  try {
    // Check token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token không tồn tại' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    // Lấy username từ token
    const username = decoded.username;
    
    // Tạo đường dẫn tới thư mục của user
    const userPath = join(process.cwd(), 'storage/dataclient', `user_${username}`, 'data');

    if (req.method === 'GET') {
      // Kiểm tra thư mục có tồn tại
      if (!fs.existsSync(userPath)) {
        return res.status(404).json({ error: 'Thư mục không tồn tại' });
      }

      // Đọc nội dung thư mục
      const items = fs.readdirSync(userPath);
      const albums = items.filter(item => {
        const itemPath = join(userPath, item);
        return fs.statSync(itemPath).isDirectory();
      }).map(albumName => {
        const albumPath = join(userPath, albumName);
        const photos = fs.readdirSync(albumPath).filter(file => 
          /\.(jpg|jpeg|png)$/i.test(file)
        );
        
        return {
          id: albumName,
          name: albumName,
          photoCount: photos.length,
          coverUrl: photos.length > 0 ? `/dataclient/user_${username}/data/${albumName}/${photos[0]}` : null
        };
      });

      return res.status(200).json(albums);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
