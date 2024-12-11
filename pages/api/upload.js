import { join } from 'path';
import fs from 'fs';
import formidable from 'formidable';
import { authMiddleware } from '../../middleware/auth';
import sharp from 'sharp';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: false
  }
};

const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || 'public/dataclient';

const handler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }

    const username = req.query.username;
    let paths;
    let albumId;
    let folderId;

    const tmpDir = join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const form = formidable({
      multiples: true,
      keepExtensions: true,
      uploadDir: tmpDir,
      maxFileSize: 1000 * 1024 * 1024,
      maxTotalFileSize: 2 * 1024 * 1024 * 1024
    });

    const [fields, files] = await form.parse(req);
    const uploadedFiles = files.photos || [];

    console.log('All fields:', fields);

    let albumName;
    if (fields.albumId && fields.albumId[0]) {
      albumName = fields.albumId[0].trim();
    } else if (fields.albumName && fields.albumName[0]) {
      albumName = fields.albumName[0].trim();
    } else {
      console.error('Invalid form data:', {
        hasAlbumId: !!fields.albumId,
        albumIdValue: fields.albumId ? fields.albumId[0] : null,
        hasAlbumName: !!fields.albumName,
        albumNameValue: fields.albumName ? fields.albumName[0] : null
      });
      throw new Error('Vui lòng chọn album hoặc tạo album mới');
    }

    console.log('Processing album:', albumName);
    
    let folderInfo = await getFolderInfoByName(albumName, username);
    
    if (!folderInfo && fields.albumName) {
      console.log('Creating new album:', albumName);
      
      albumId = generateAlbumId();
      folderId = 'F' + generateFolderId();
      
      await createNewAlbum(albumName, username, albumId, folderId);
      
      folderInfo = {
        album_id: albumId,
        folder_id: folderId
      };
    } else if (!folderInfo) {
      throw new Error(`Không tìm thấy thông tin album ${albumName}`);
    }

    console.log('Folder info:', folderInfo);
    
    albumId = folderInfo.album_id;
    folderId = folderInfo.folder_id;

    paths = {
      preview: join(process.cwd(), LOCAL_STORAGE_PATH, `user_${username}`, 'data', albumName),
      original: join(process.cwd(), LOCAL_STORAGE_PATH, `user_${username}`, 'goc', folderId, '001')
    };

    Object.values(paths).forEach(path => {
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
      }
    });

    const albumExists = fs.existsSync(paths.preview);
    let duplicates = [];
    if (albumExists) {
      const existingFiles = fs.readdirSync(paths.preview);
      duplicates = uploadedFiles
        .map(file => file.originalFilename)
        .filter(fileName => existingFiles.includes(fileName));

      if (duplicates.length > 0 && !fields.overwrite) {
        return res.status(409).json({
          error: 'Duplicate files found',
          duplicates: duplicates
        });
      }
    }

    const savedFiles = [];
    for (const file of uploadedFiles) {
      const result = await processFile(file, paths);
      savedFiles.push(result);
      await saveFileInfoToDatabase(folderId, file.originalFilename);
    }

    return res.status(200).json({
      success: true,
      savedFiles,
      albumId,
      folderId
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: error.message });
  }
};

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:5002';

async function getFolderInfoByName(albumName, username) {
  try {
    const response = await fetch(`${PYTHON_API_URL}/api/albums/folder-by-name`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        albumName,
        username
      })
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to get folder information');
    }

    return await response.json();
  } catch (error) {
    if (error.message === 'Album not found') {
      return null;
    }
    console.error('Error getting folder info:', error);
    throw error;
  }
}

async function processFile(file, paths) {
  const originalFilename = file.originalFilename;
  
  const originalPath = join(paths.original, originalFilename);
  await fs.promises.copyFile(file.filepath, originalPath);

  const previewPath = join(paths.preview, originalFilename);
  
  const metadata = await sharp(file.filepath).metadata();
  
  let width = metadata.width;
  let height = metadata.height;
  
  if (width > 2000 || height > 2000) {
    const ratio = Math.min(1920 / width, 1920 / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  let quality = 90;
  let outputBuffer;
  
  do {
    outputBuffer = await sharp(file.filepath)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ 
        quality: quality,
        force: false
      })
      .toBuffer();
    
    if (outputBuffer.length > 700 * 1024) {
      quality -= 2;
      quality = Math.max(quality, 80);
    }
  } while (outputBuffer.length > 700 * 1024 && quality > 90);

  await fs.promises.writeFile(previewPath, outputBuffer);

  console.log({
    filename: originalFilename,
    originalSize: fs.statSync(file.filepath).size,
    newSize: outputBuffer.length,
    quality: quality,
    dimensions: `${width}x${height}`
  });

  return {
    filename: originalFilename,
    originalPath,
    previewPath
  };
}

async function saveFileInfoToDatabase(folderId, filename) {
  try {
    const response = await fetch(`${PYTHON_API_URL}/api/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        folderId,
        filename
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save file info to database');
    }
  } catch (error) {
    console.error('Error saving file info:', error);
    throw error;
  }
}

function generateAlbumId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array(9).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function generateFolderId() {
  return Array(9).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
}

async function createNewAlbum(albumName, username, albumId, folderId) {
  try {
    const response = await fetch(`${PYTHON_API_URL}/api/albums`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: albumName,
        username: username,
        albumId: albumId,
        folderId: folderId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create new album');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating album:', error);
    throw error;
  }
}

export default authMiddleware(handler);