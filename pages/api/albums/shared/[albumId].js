import { photoPool as db } from '../../../../lib/db';

// Thêm hàm chuẩn hóa title
function normalizeTitle(text) {
  const vietnamese = {
    'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a', 'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
    'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
    'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
    'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o', 'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
    'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u', 'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
    'đ': 'd'
  };

  return text
    .toLowerCase()
    .split('')
    .map(char => vietnamese[char] || char)
    .join('')
    .replace(/[^\w-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default async function handler(req, res) {
  console.log('\n=== API Request Info ===');
  console.log('Host:', req.headers.host);
  console.log('Origin:', req.headers.origin);
  console.log('Referer:', req.headers.referer);
  console.log('Method:', req.method);
  console.log('Query:', req.query);

  try {
    const { albumId } = req.query;
    if (!albumId) {
      throw new Error('albumId is required');
    }

    const folder_id = albumId;
    console.log('\nProcessing request for folder_id:', folder_id);

    // Thêm CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 1. Lấy thông tin album
    const [albumResults] = await db.query(`
      SELECT a.*, f.folder_id, f.sub_folder 
      FROM albums a
      JOIN folders f ON a.id = f.album_id
      WHERE f.folder_id = ?
    `, [folder_id]);

    console.log('2. Album query results:', JSON.stringify(albumResults, null, 2));

    if (!albumResults || albumResults.length === 0) {
      console.log('Album not found');
      return res.status(404).json({ error: 'Album not found' });
    }

    const albumResult = albumResults[0];
    console.log('3. Selected album:', JSON.stringify(albumResult, null, 2));

    // 2. Lấy danh sách ảnh - Sửa lại query
    const [images] = await db.query(`
      SELECT i.*
      FROM images i
      WHERE i.folder_id = ?
      ORDER BY i.uploaded_at DESC
    `, [folder_id]);

    console.log('4. Images query results:', {
      count: images.length,
      sample: images.slice(0, 2)  // Log 2 ảnh đầu tiên
    });

    // 3. Format response với normalized title
    const response = {
      album: {
        id: albumResult.id,
        title: albumResult.title,
        normalizedTitle: normalizeTitle(albumResult.title), // Thêm trường này
        folder_id: albumResult.folder_id,
        sub_folder: albumResult.sub_folder,
        created_at: albumResult.created_at,
        username: albumResult.username
      },
      photos: images.map(image => {
        // Sử dụng normalized title cho URL
        const url = `/dataclient/user_${albumResult.username}/data/${normalizeTitle(albumResult.title)}/${image.file_name}`;
        return {
          id: image.id,
          name: image.file_name,
          url: url,
          uploaded_at: image.uploaded_at
        };
      })
    };

    console.log('5. Response structure:', {
      albumId: response.album.id,
      title: response.album.title,
      normalizedTitle: response.album.normalizedTitle,
      photoCount: response.photos.length,
      sampleUrl: response.photos[0]?.url
    });

    return res.status(200).json(response);

  } catch (error) {
    console.error('\n=== API Error ===');
    console.error('Type:', error.constructor.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    return res.status(500).json({ 
      error: error.message,
      type: error.constructor.name,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}