import pool from '../../lib/db';

export default async function handler(req, res) {
  try {
    const connection = await pool.getConnection();
    
    // Test basic connection
    const [testConnection] = await connection.query('SELECT 1');
    
    // Test table data
    const [users] = await connection.query('SELECT * FROM dulieu_luuanh');
    
    connection.release();
    
    res.status(200).json({ 
      success: true, 
      message: 'Database connected successfully',
      connection_test: testConnection,
      table_data: users
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database operation failed',
      error: error.message 
    });
  }
}