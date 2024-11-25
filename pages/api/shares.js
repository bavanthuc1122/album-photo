import pool from '@/lib/db';

export default async function handler(req, res) {
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { method } = req;
  const username = session.user.username;

  try {
    const conn = await pool.getConnection();

    switch (method) {
      case 'GET':
        // Lấy thông tin share
        const [shares] = await conn.query(
          'SELECT * FROM shares WHERE username = ? AND path = ?',
          [username, req.query.path]
        );
        conn.release();
        return res.json(shares[0] || null);

      case 'POST':
        // Tạo share mới
        const shareId = generateShareId();
        const [result] = await conn.query(
          `INSERT INTO shares (shareId, username, path, isPublic) 
           VALUES (?, ?, ?, true)
           ON DUPLICATE KEY UPDATE 
           shareId = VALUES(shareId),
           isPublic = VALUES(isPublic)`,
          [shareId, username, req.body.path]
        );
        
        // Lấy data share mới tạo
        const [newShare] = await conn.query(
          'SELECT * FROM shares WHERE id = ?',
          [result.insertId]
        );
        
        conn.release();
        return res.json({ 
          success: true, 
          shareData: newShare[0] 
        });

      case 'DELETE':
        // Xóa share
        await conn.query(
          'DELETE FROM shares WHERE username = ? AND path = ?',
          [username, req.body.path]
        );
        conn.release();
        return res.json({ success: true });

      default:
        conn.release();
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Share API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper function
function generateShareId() {
  return Math.random().toString(36).substr(2, 9);
} 