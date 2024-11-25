import { join } from 'path';
import fs from 'fs';
import JSZip from 'jszip';

const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || 'storage/dataclient';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { id } = req.query;
      const albumPath = join(process.cwd(), LOCAL_STORAGE_PATH, id);

      if (!fs.existsSync(albumPath)) {
        return res.status(404).json({ error: 'Album not found' });
      }

      const zip = new JSZip();
      const photos = fs.readdirSync(albumPath)
        .filter(file => /\.(jpg|jpeg|png)$/i.test(file));

      photos.forEach(photo => {
        const content = fs.readFileSync(join(albumPath, photo));
        zip.file(photo, content);
      });

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename=album-${id}.zip`);
      res.send(zipBuffer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}