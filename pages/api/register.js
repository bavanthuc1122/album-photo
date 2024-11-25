import pool from '../../lib/db';
import fs from 'fs';
import path from 'path';
import FolderHandler from './handlers/FolderHandler';

// Thêm hàm kiểm tra username
function isValidUsername(username) {
  // Regex chỉ cho phép chữ và số
  const usernameRegex = /^[a-zA-Z0-9]+$/;
  return usernameRegex.test(username);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { username, email, password } = req.body;
    console.log('Received registration data:', { username, email });

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin'
      });
    }

    // Kiểm tra định dạng username
    if (!isValidUsername(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username chỉ được chứa chữ cái và số'
      });
    }

    // Check existing username
    console.log('Checking existing username...');
    const [existingUsername] = await pool.query(
      'SELECT * FROM dulieu_luuanh WHERE username = ?',
      [username]
    );

    if (existingUsername.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tên đăng nhập đã tồn tại'
      });
    }

    // Check existing email
    console.log('Checking existing email...');
    const [existingEmail] = await pool.query(
      'SELECT * FROM dulieu_luuanh WHERE email = ?',
      [email]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // Get current timestamp
    const time_created = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // Log SQL query và giá trị
    console.log('Inserting new user with query:', 
      'INSERT INTO dulieu_luuanh (username, email, password, level, time_created, status) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, '***', 1, time_created, 'active']
    );

    // Insert new user with level default = 1
    await pool.query(
      'INSERT INTO dulieu_luuanh (username, email, password, level, time_created, status) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, password, 1, time_created, 'active']
    );

    console.log('User registered successfully');

    // Tạo folder bằng FolderHandler
    const folderHandler = new FolderHandler(process.env.LOCAL_STORAGE_PATH);
    const folderResult = await folderHandler.createUserFolders(username);

    if (!folderResult.success) {
      // Rollback nếu tạo folder fail
      await pool.query('DELETE FROM dulieu_luuanh WHERE username = ?', [username]);
      throw new Error(`Failed to create folders: ${folderResult.error}`);
    }

    console.log('Created folders for user:', username);

    res.status(200).json({
      success: true,
      message: 'Đăng ký thành công'
    });

  } catch (error) {
    // Log chi tiết lỗi
    console.error('Register error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage
    });

    res.status(500).json({
      success: false,
      message: `Đã có lỗi xảy ra: ${error.message}`
    });
  }
} 