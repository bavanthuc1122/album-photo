import path from 'path';
import fs from 'fs';
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shareId } = req.query;

    // Kiểm tra share link
    const share = await prisma.shares.findUnique({
      where: { shareId }
    });

    if (!share || !share.isPublic) {
      return res.status(404).json({ error: 'Share not found' });
    }

    // Kiểm tra hết hạn
    if (share.expiresAt && new Date() > share.expiresAt) {
      return res.status(410).json({ error: 'Share has expired' });
    }

    // Lấy đường dẫn file/folder
    const filePath = path.join(
      process.cwd(), 
      'storage', 
      `user_${share.username}`, 
      share.path
    );

    // Kiểm tra tồn tại
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Nếu là folder, trả về danh sách files
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      const files = fs.readdirSync(filePath)
        .map(file => {
          const fileStats = fs.statSync(path.join(filePath, file));
          return {
            name: file,
            size: fileStats.size,
            modified: fileStats.mtime,
            isDirectory: fileStats.isDirectory()
          };
        });

      return res.json({ 
        type: 'directory',
        path: share.path,
        files 
      });
    }

    // Nếu là file, trả về file
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader(
      'Content-Disposition', 
      `attachment; filename=${path.basename(filePath)}`
    );
    return fs.createReadStream(filePath).pipe(res);

  } catch (error) {
    console.error('Shared access error:', error);
    return res.status(500).json({ error: 'Error accessing shared item' });
  }
}