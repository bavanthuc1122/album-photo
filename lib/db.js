import mysql from 'mysql2/promise';

// Pool cũ cho cusomerthuc (giữ nguyên)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,  // cusomerthuc
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Pool mới cho photo_albums
const photoPool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'photo_albums',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
const testConnection = async () => {
  try {
    // Test cusomerthuc
    const connection = await pool.getConnection();
    console.log('✅ Cusomerthuc DB connected!');
    const [tables] = await connection.query('SHOW TABLES LIKE "dulieu_luuanh"');
    console.log('✅ Table dulieu_luuanh:', tables.length > 0 ? 'exists' : 'not found');
    connection.release();

    // Test photo_albums
    const photoConnection = await photoPool.getConnection();
    console.log('✅ Photo_albums DB connected!');
    const [photoTables] = await photoConnection.query('SHOW TABLES');
    console.log('✅ Photo tables:', photoTables.map(t => Object.values(t)[0]));
    photoConnection.release();

  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
};

testConnection();

export default pool;  // Cho đăng ký/đăng nhập
export { photoPool };  // Cho quản lý ảnh 