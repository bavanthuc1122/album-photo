import path from 'path';
import fs from 'fs';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const storagePath = path.join(process.cwd(), 'storage');
    
    // Kiểm tra thư mục có tồn tại
    if (!fs.existsSync(storagePath)) {
      return res.status(404).json({ 
        message: 'Storage directory not found',
        path: storagePath 
      });
    }

    // Đọc danh sách files và thư mục
    const items = fs.readdirSync(storagePath);
    
    // Lấy thông tin chi tiết về mỗi item
    const details = items.map(item => {
      const fullPath = path.join(storagePath, item);
      const stats = fs.statSync(fullPath);
      
      return {
        name: item,
        path: fullPath,
        isDirectory: stats.isDirectory(),
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    });

    return res.status(200).json({
      basePath: storagePath,
      items: details
    });

  } catch (error) {
    console.error('Storage path error:', error);
    return res.status(500).json({ 
      message: 'Error getting storage path',
      error: error.message 
    });
  }
} 