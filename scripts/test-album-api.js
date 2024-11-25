// scripts/test-album-api.js
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
require('dotenv').config({
  path: path.resolve(process.cwd(), '.env.local')
});

async function testAlbumAPI() {
  let connection;
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: 'photo_albums',
      waitForConnections: true,
      connectionLimit: 1
    });

    connection = await pool.getConnection();
    console.log('✅ Connected to database');

    const folder_id = 'F534925664';
    
    // 1. Kiểm tra physical folder
    const username = 'admin4'; // từ kết quả album trước
    const folderPath = path.join(process.cwd(), 'storage/dataclient', `user_${username}`, 'data', folder_id);
    console.log('\nChecking folder:', folderPath);
    
    if (fs.existsSync(folderPath)) {
      const files = fs.readdirSync(folderPath);
      console.log('Files in folder:', files);
    } else {
      console.log('Folder does not exist');
    }

    // 2. Kiểm tra records trong database
    const [images] = await connection.query(`
      SELECT i.*, f.folder_id
      FROM images i
      JOIN folders f ON i.folder_id = f.folder_id
      WHERE f.folder_id = ?
    `, [folder_id]);

    console.log('\nImages in database:', JSON.stringify(images, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error);
  } finally {
    if (connection) {
      await connection.release();
      console.log('\n✅ Connection released');
    }
    process.exit(0);
  }
}

testAlbumAPI();
