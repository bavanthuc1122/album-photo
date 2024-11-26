import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { imageName } = req.query;

  // Đường dẫn đến thư mục chứa hình ảnh (ví dụ: nằm trong project nhưng ngoài public)
  const imagePath = path.join(process.cwd(), 'private_images', imageName as string);

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
