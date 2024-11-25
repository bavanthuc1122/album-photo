import pool from '../../lib/db';
import { sendPasswordResetEmail } from '../../lib/mailer';

// Hàm tạo mật khẩu ngẫu nhiên
function generatePassword() {
  const length = process.env.PASSWORD_LENGTH || 10;
  const charset = process.env.PASSWORD_CHARSET || "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  return password;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    console.log('Received reset password request for email:', email);

    // Kiểm tra email tồn tại
    const [user] = await pool.query(
      'SELECT * FROM dulieu_luuanh WHERE email = ?',
      [email]
    );
    console.log('Found user:', user);

    if (user.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Email không tồn tại trong hệ thống'
      });
    }

    // Tạo mật khẩu mới
    const newPassword = generatePassword();
    console.log('Generated new password:', newPassword);

    // Cập nhật mật khẩu trong database
    await pool.query(
      'UPDATE dulieu_luuanh SET password = ? WHERE email = ?',
      [newPassword, email]
    );
    console.log('Password updated in database');

    // Gửi email
    const emailSent = await sendPasswordResetEmail(email, newPassword);
    console.log('Email sent status:', emailSent);

    if (emailSent) {
      res.status(200).json({
        success: true,
        message: 'Mật khẩu mới đã được gửi đến email của bạn'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Không thể gửi email. Vui lòng thử lại sau'
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra'
    });
  }
}