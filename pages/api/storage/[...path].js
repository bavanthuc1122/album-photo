import { createReadStream, statSync } from 'fs';
import { join } from 'path';

export default async function handler(req, res) {
  try {
    const { path } = req.query;
    
    // Validate path
    if (!path || !Array.isArray(path)) {
      throw new Error('Invalid path');
    }

    const filePath = join(process.cwd(), 'storage', 'dataclient', ...path);
    
    // Check if file exists
    try {
      const stats = statSync(filePath);
      if (!stats.isFile()) {
        throw new Error('Not a file');
      }
    } catch (error) {
      console.error('File not found:', filePath);
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate headers
    const ext = path[path.length - 1].split('.').pop().toLowerCase();
    const contentType = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif'
    }[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000');

    // Stream the file
    const stream = createReadStream(filePath);
    
    stream.on('error', (error) => {
      console.error('Stream error:', error);
      res.status(500).end();
    });

    stream.pipe(res);

  } catch (error) {
    console.error('API route error:', error);
    res.status(500).json({ error: error.message });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}; 