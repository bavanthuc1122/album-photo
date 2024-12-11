import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { imageName } = req.query;


  const imagePath = path.join(process.cwd(), 'storage/', imageName );

  // Kiểm tra xem file có tồn tại không
  if (fs.existsSync(imagePath)) {
    // Đọc file hình ảnh
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Thiết lập Content-Type (ví dụ: image/png)
    res.setHeader('Content-Type', 'image/png');
    res.send(imageBuffer);
  } else {
    res.status(404).json({ error: 'Image not found' });
  }
}
