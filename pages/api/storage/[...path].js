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
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}; 