import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  console.log('Login request body:', req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, username, password } = req.body;
    console.log('Parsed credentials:', { email, username, password });
    
    const query = email 
      ? 'SELECT * FROM dulieu_luuanh WHERE email = ? AND password = ?'
      : 'SELECT * FROM dulieu_luuanh WHERE username = ? AND password = ?';
    
    const params = email ? [email, password] : [username, password];
    console.log('Query params:', params);
    
    const [rows] = await pool.query(query, params);
    console.log('Query result:', rows);

    if (rows.length > 0) {
      const userData = {
        username: rows[0].username,
        email: rows[0].email,
        level: rows[0].level
      };
      console.log('Login successful:', userData);
      
      const token = jwt.sign(
        { 
          id: rows[0].id,
          username: rows[0].username 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        user: userData,
        token: token
      });
    } else {
      console.log('Login failed: no matching user');
      res.status(401).json({
        success: false,
        message: 'Email/Username hoặc mật khẩu không đúng'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra'
    });
  }
}