import { pool } from '../../../lib/db';
import { generateRandomString } from '../../../lib/utils';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { path, isPublic, folderId } = req.body;
    const shareId = generateRandomString(10);
    
    try {
      // Get folder info first
      const [folder] = await pool.query(
        'SELECT * FROM folders WHERE folder_id = ?',
        [folderId]
      );

      // Create share record
      await pool.query(
        `INSERT INTO shares (shareId, username, path, isPublic, folder_id) 
         VALUES (?, ?, ?, ?, ?)`,
        [shareId, req.user.username, path, isPublic, folderId]
      );

      return res.json({ success: true, shareId });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  // ... handle other methods
} 