import { photoPool as db } from '../../../lib/db';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Content-Type', 'application/json');
  
  // Log request để debug
  console.log('Request:', {
    method: req.method,
    query: req.query,
    body: req.body
  });

  if (req.method === 'GET') {
    try {
      const { albumId, visitorId } = req.query;
      
      // Return empty object if missing params
      if (!albumId || !visitorId) {
        return res.status(200).json({ interactions: {} });
      }

      const [interactions] = await db.query(
        `SELECT photo_id, interaction_type, value 
         FROM photo_interactions 
         WHERE album_id = ? AND visitor_id = ?`,
        [albumId, visitorId]
      );

      const formattedInteractions = interactions.reduce((acc, item) => {
        if (!acc[item.photo_id]) {
          acc[item.photo_id] = {};
        }
        acc[item.photo_id][item.interaction_type] = Boolean(item.value);
        return acc;
      }, {});

      return res.status(200).json({ interactions: formattedInteractions });
    } catch (error) {
      console.error('GET Error:', error);
      return res.status(200).json({ interactions: {} });
    }
  } 
  
  else if (req.method === 'POST') {
    try {
      const { photoId, albumId, visitorId, interactionType, value } = req.body;
      
      if (!photoId || !albumId || !visitorId || !interactionType) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          missing: {
            photoId: !photoId,
            albumId: !albumId,
            visitorId: !visitorId,
            interactionType: !interactionType
          }
        });
      }

      await db.query(
        `DELETE FROM photo_interactions 
         WHERE photo_id = ? 
         AND album_id = ? 
         AND visitor_id = ? 
         AND interaction_type = ?`,
        [photoId, albumId, visitorId, interactionType]
      );

      if (value) {
        await db.query(
          `INSERT INTO photo_interactions 
           (photo_id, album_id, visitor_id, interaction_type, value)
           VALUES (?, ?, ?, ?, ?)`,
          [photoId, albumId, visitorId, interactionType, value]
        );
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error saving interaction:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}