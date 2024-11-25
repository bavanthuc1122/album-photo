import pool from '../../lib/db';
import { authMiddleware } from '../../middleware/auth';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // Lấy từ token đã decode

    // Kiểm tra mật khẩu hiện tại
    const [user] = await pool.query(
      'SELECT * FROM dulieu_luuanh WHERE id = ? AND password = ?',
      [userId, currentPassword]
    );

    if (user.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng'
      });
    }

    // Cập nhật mật khẩu mới
    await pool.query(
      'UPDATE dulieu_luuanh SET password = ? WHERE id = ?',
      [newPassword, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra'
    });
  }
}

export default authMiddleware(handler);