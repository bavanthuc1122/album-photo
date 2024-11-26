<<<<<<< HEAD
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
=======
import { join } from 'path';
import { createReadStream, statSync, accessSync, constants } from 'fs';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const pathSegments = Array.isArray(req.query.path) 
      ? req.query.path 
      : [req.query.path];

    console.log('Requested path:', pathSegments);

    if (!pathSegments || pathSegments.length === 0) {
      return res.status(400).json({ message: 'Invalid path' });
    }

    const filePath = join(process.cwd(), 'storage', ...pathSegments);
    console.log('Full file path:', filePath);

    try {
      accessSync(filePath, constants.R_OK);
    } catch (err) {
      console.error('File access error:', err);
      return res.status(404).json({ message: 'File not found or not accessible' });
    }

    const stat = statSync(filePath);

    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Type', 'image/jpeg');

    const readStream = createReadStream(filePath);
    readStream.pipe(res);

  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ message: 'Error serving file' });
>>>>>>> d9dc322e7dd5c6f75b65786234d2ae7f64044279
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}; 