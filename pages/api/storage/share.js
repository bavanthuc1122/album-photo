import { getSession } from 'next-auth/react';
import { prisma } from '../../../lib/prisma'; // Giả sử bạn dùng Prisma

export default async function handler(req, res) {
  if (!['POST', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { path, isPublic } = req.body;
    const username = session.user.username;

    if (req.method === 'POST') {
      // Tạo share link
      const shareLink = await prisma.shares.create({
        data: {
          username,
          path,
          isPublic,
          shareId: generateShareId(), // Hàm tạo ID ngẫu nhiên
          expiresAt: req.body.expiresAt // Tùy chọn
        }
      });

      return res.json({ 
        success: true, 
        shareLink: `/shared/${shareLink.shareId}` 
      });
    }

    if (req.method === 'DELETE') {
      // Hủy chia sẻ
      await prisma.shares.delete({
        where: {
          username_path: {
            username,
            path
          }
        }
      });

      return res.json({ success: true });
    }
  } catch (error) {
    console.error('Share error:', error);
    return res.status(500).json({ error: 'Error processing share request' });
  }
} 