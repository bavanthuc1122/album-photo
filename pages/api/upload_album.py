import sys
from pathlib import Path
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from flask_caching import Cache
from PIL import Image
import io
import requests
import uuid
from datetime import datetime
import os
from pathlib import Path
import tempfile
import zipfile
from dotenv import load_dotenv
import urllib3
import ssl
import random
import string
import json
import re
from werkzeug.utils import secure_filename
from concurrent.futures import ThreadPoolExecutor
import unicodedata
from lib.database import execute_query
from pathlib import Path
import traceback

# Load config from environment variables
load_dotenv()
load_dotenv('.env.local')
root_path = Path(__file__).parent.parent.parent
sys.path.append(str(root_path))


# Đảm bảo giá trị mặc định khớp với config.js
LOCAL_STORAGE_PATH = Path(os.getenv('LOCAL_STORAGE_PATH', 'storage/dataclient')).absolute()
print(f"Initialized LOCAL_STORAGE_PATH: {LOCAL_STORAGE_PATH}")
API_PORT = int(os.getenv('API_PORT', 5002))
print(f"Starting server on port: {API_PORT}")

# Initialize Flask app with config
app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5002",
            "http://127.0.0.1:5002"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Ensure storage directory exists
LOCAL_STORAGE_PATH.mkdir(parents=True, exist_ok=True)

# Cache configuration
cache_config = {
    'CACHE_TYPE': 'simple',
    'CACHE_DEFAULT_TIMEOUT': 300
}
app.config.from_mapping(cache_config)
cache = Cache(app)

# Disable SSL warnings
urllib3.disable_warnings()
ssl._create_default_https_context = ssl._create_unverified_context

# Cấu hình giới hạn upload
MAX_SINGLE_FILE_SIZE = 100 * 1024 * 1024    # 100MB cho mỗi file
MAX_TOTAL_SIZE = 5 * 1024 * 1024 * 1024     # 5GB tổng dung lượng
MAX_FILES_PER_UPLOAD = 5000                  # 5000 files

app.config.update(
    MAX_CONTENT_LENGTH=MAX_TOTAL_SIZE,
    MAX_SINGLE_FILE_SIZE=MAX_SINGLE_FILE_SIZE,
    MAX_FILES_PER_UPLOAD=MAX_FILES_PER_UPLOAD
)

icon_folder = Path('storage/icon_folder')
icon_folder.mkdir(parents=True, exist_ok=True)

def get_google_drive_file_id(url):
    """Extract file ID from Google Drive URL"""
    patterns = [
        r"https://drive\.google\.com/file/d/([\w-]+)",  # Direct link
        r"https://drive\.google\.com/open\?id=([\w-]+)", # Open link
        r"https://drive\.google\.com/uc\?id=([\w-]+)",   # Download link
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def download_from_google_drive(file_id):
    """Download file from Google Drive"""
    try:
        # URL để download từ Google Drive
        url = f"https://drive.google.com/uc?id={file_id}&export=download"
        
        session = requests.Session()
        response = session.get(url, stream=True)
        
        # Xử lý confirm page nếu file lớn
        for key, value in response.cookies.items():
            if key.startswith('download_warning'):
                url = f"{url}&confirm={value}"
                response = session.get(url, stream=True)
                break
                
        return response.content
    except Exception as e:
        print(f"Error downloading from Google Drive: {str(e)}")
        raise

def download_image_from_url(url):
    """Download image from URL with support for Google Drive"""
    try:
        # Check if it's a Google Drive link
        file_id = get_google_drive_file_id(url)
        if file_id:
            print(f"Downloading from Google Drive, file ID: {file_id}")
            content = download_from_google_drive(file_id)
        else:
            # Regular URL download
            response = requests.get(url, stream=True)
            response.raise_for_status()
            content = response.content

        # Validate image content
        image = Image.open(io.BytesIO(content))
        
        # Convert to RGB if needed
        if image.mode in ('RGBA', 'LA'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            background.paste(image, mask=image.split()[-1])
            image = background
        elif image.mode != 'RGB':
            image = image.convert('RGB')
            
        # Save to bytes
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='JPEG', quality=85)
        return img_byte_arr.getvalue()

    except Exception as e:
        print(f"Error downloading image from {url}: {str(e)}")
        raise

def upload_image_to_local(file_name, image, folder_path):
    """
    Upload ảnh vào thư mục local.
    """
    folder_path = Path(folder_path)
    folder_path.mkdir(parents=True, exist_ok=True)
    file_path = folder_path / file_name
    image.save(file_path, format='JPEG')
    return str(file_path)

@app.route('/')
def home():
    return 'Welcome to the Photo Album API!'

def normalize_vietnamese_path(text):
    """
    Chuẩn hóa chuỗi tiếng Việt:
    - Giữ nguyên dấu tiếng Việt
    - Thay thế các ký tự đặc biệt bằng dấu gạch dưới
    - Xử lý khoảng trắng
    """
    # Giữ nguyên dấu tiếng Việt, chỉ xử lý ký tự đặc biệt
    text = re.sub(r'[^\w\s\dÀ-ỹ]', '_', text)
    # Thay thế khoảng trắng bằng dấu gạch dưới
    text = re.sub(r'\s+', '_', text.strip())
    return text

def normalize_filename(filename):
    """Chuẩn hóa tên file và path, bỏ dấu tiếng Việt và thay khoảng trắng bằng dấu gạch dưới"""
    # Chuyển về Unicode NFC
    filename = unicodedata.normalize('NFC', filename)
    
    # Bảng chuyển đổi dấu tiếng Việt
    vietnamese_map = {
        'á': 'a', 'à': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
        'ă': 'a', 'ắ': 'a', 'ằ': 'a', 'ẳ': 'a', '': 'a', 'ặ': 'a',
        'â': 'a', 'ấ': 'a', 'ầ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
        'đ': 'd',
        'é': 'e', 'è': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
        'ê': 'e', 'ế': 'e', 'ề': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
        'í': 'i', 'ì': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
        'ó': 'o', 'ò': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
        'ô': 'o', 'ố': 'o', 'ồ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
        'ơ': 'o', 'ớ': 'o', 'ờ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
        'ú': 'u', 'ù': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
        'ư': 'u', 'ứ': 'u', 'ừ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
        'ý': 'y', 'ỳ': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y'
    }
    
    # Tách path thành các phần
    parts = filename.split('/')
    
    normalized_parts = []
    for part in parts:
        # Chỉ chuẩn hóa phần tên album (phần đầu tiên)
        if part == parts[0]:
            # Chuyển đổi ký tự có dấu thành không dấu
            result = ''
            for char in part.lower():
                result += vietnamese_map.get(char, char)
            # Thay thế khoảng trắng bằng dấu gạch dưới
            result = result.replace(' ', '_')
            normalized_parts.append(result)
        else:
            # Giữ nguyên các phần khác (năm/tháng/ngày)
            normalized_parts.append(part)
    
    # Nối lại các phần bằng dấu /
    return '/'.join(normalized_parts)

@app.route('/api/albums', methods=['POST'])
def create_album():
    try:
        data = request.get_json()
        
        # Insert vào bảng albums
        result = execute_query("""
            INSERT INTO albums (id, title, username, created_at)
            VALUES (%s, %s, %s, NOW())
        """, (data['albumId'], data['title'], data['username']))
        
        # Insert vào bảng folders
        result = execute_query("""
            INSERT INTO folders (folder_id, album_id)
            VALUES (%s, %s)
        """, (data['folderId'], data['albumId']))
        
        return jsonify({'success': True})
        
    except Exception as e:
        print(f"Error creating album: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/images/<path:filename>')
def serve_album_image(filename):
    try:
        # Chuẩn hóa đường dẫn
        safe_path = filename.replace('/', os.sep)
        image_path = LOCAL_STORAGE_PATH / safe_path
        
        print(f"Serving image from: {image_path}")
        
        if not image_path.exists():
            print(f"Image not found: {image_path}")
            return jsonify({'error': 'Image not found'}), 404
            
        # Sử dụng đường dẫn tuyệt đối
        directory = str(image_path.parent.absolute())
        filename = image_path.name
        
        print(f"Directory: {directory}")
        print(f"Filename: {filename}")
        
        response = send_from_directory(directory, filename)
        response.headers['Cache-Control'] = 'no-cache'
        return response
        
    except Exception as e:
        print(f"Error serving image: {str(e)}")
        return jsonify({'error': str(e)}), 404

@app.route('/api/albums', methods=['GET'])
def get_albums():
    try:
        username = request.args.get('username')
        if not username:
            return jsonify({'error': 'Missing username'}), 400

        user_data_path = LOCAL_STORAGE_PATH / f'user_{username}/data'
        
        if not user_data_path.exists():
            return jsonify([])

        albums = []
        for album_path in user_data_path.iterdir():
            if album_path.is_dir():
                # Tạo random string cho mỗi album
                current_time = datetime.now()
                alpha = ''.join(random.choices(string.ascii_uppercase, k=3))
                number = ''.join(random.choices(string.digits, k=3))
                random_string = f"{current_time.strftime('%y%m')}_{alpha}_{number}"
                
                albums.append({
                    'id': album_path.name,
                    'name': album_path.name,
                    'randomString': random_string,  # Thm vào response
                    'photoCount': len(list(album_path.glob('*.jpg'))),
                    'coverUrl': f"user_{username}/data/{album_path.name}/cover.jpg"
                })

        return jsonify(albums)

    except Exception as e:
        print(f"Error getting albums: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/albums/<album_id>', methods=['PUT'])
def update_album(album_id):
    try:
        data = request.get_json()
        new_name = data.get('name')
        username = request.args.get('username')
        
        print(f"Updating album: {album_id} with new name: {new_name} for user: {username}")
        
        if not new_name or not username:
            return jsonify({'error': 'Missing data'}), 400
            
        # Lấy đường dẫn
        user_data_path = LOCAL_STORAGE_PATH / f'user_{username}' / 'data'
        old_album_path = user_data_path / album_id
        new_album_path = user_data_path / new_name.strip()
        
        print(f"Old album path: {old_album_path}")
        print(f"New album path: {new_album_path}")
        
        # Kiểm tra album cũ tồn tại
        if not old_album_path.exists():
            return jsonify({'error': 'Album không tồn tại'}), 404
            
        # Kiểm tra xem tên mới đã tồn tại chưa
        if new_album_path.exists() and old_album_path != new_album_path:
            return jsonify({'error': 'Tên album đã tồn tại'}), 409

        try:
            # Đọc metadata cũ để lấy randomString
            metadata_path = old_album_path / 'metadata.json'
            with open(metadata_path, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
                old_random_string = metadata.get('randomString')
        except Exception as e:
            print(f"Error reading metadata: {str(e)}")
            return jsonify({'error': 'Không thể đọc metadata'}), 500

        try:
            # Đổi tên thư mục
            old_album_path.rename(new_album_path)
            
            # Cập nhật metadata với tên mới nhưng giữ nguyên randomString
            metadata.update({
                'name': new_name,
                'albumId': new_name,
                'randomString': old_random_string
            })
            
            # Lưu metadata vào vị trí mới
            with open(new_album_path / 'metadata.json', 'w', encoding='utf-8') as f:
                json.dump(metadata, f, ensure_ascii=False)
                
            return jsonify({
                'success': True,
                'newName': new_name,
                'randomString': old_random_string
            }), 200
                
        except Exception as e:
            print(f"Error during rename: {str(e)}")
            # Nếu có lỗi, cố gắng khôi phục lại tên c
            if new_album_path.exists():
                try:
                    new_album_path.rename(old_album_path)
                except:
                    pass
            return jsonify({'error': 'Không thể đổi tên album'}), 500

    except Exception as e:
        print(f"Error updating album: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/albums/<album_id>', methods=['DELETE'])
def delete_album(album_id):
    try:
        album_path = LOCAL_STORAGE_PATH / album_id

        if not album_path.exists():
            return jsonify({'error': 'Album not found'}), 404

        for file_path in album_path.glob('*'):
            file_path.unlink()
        album_path.rmdir()

        return jsonify({
            'success': True,
            'message': 'Album deleted successfully',
            'albumId': album_id
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/albums/<album_id>/download', methods=['GET'])
def download_album(album_id):
    try:
        username = request.args.get('username')
        if not username or not album_id:
            return jsonify({'error': 'Missing parameters'}), 400
            
        original_path = LOCAL_STORAGE_PATH / f'user_{username}/goc'
        
        files = []
        for year in original_path.glob('*'):
            for month in year.glob('*'):
                for day in month.glob('*'):
                    album_path = day / album_id
                    if album_path.exists():
                        files.extend(album_path.glob('*.*'))
                        
        if not files:
            return jsonify({'error': 'No files found'}), 404
            
        def generate():
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
                total_files = len(files)
                for i, file_path in enumerate(files, 1):
                    zf.write(file_path, file_path.name)
                    yield f"data: {{'progress': {i/total_files*100}}}\n\n"
                    
            zip_buffer.seek(0)
            return send_file(
                zip_buffer,
                mimetype='application/zip',
                as_attachment=True,
                download_name=f'album_{album_id}.zip'
            )
            
        return Response(generate(), mimetype='text/event-stream')
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/albums/<album_id>/photos', methods=['GET'])
def get_album_photos(album_id):
    try:
        username = request.args.get('username')
        print(f"\n=== Debug get_album_photos ===")
        print(f"1. album_id: {album_id}")
        print(f"2. username: {username}")

        if not username:
            return jsonify({'error': 'Missing username'}), 400

        # Đường dẫn đy đủ tới album
        user_album_path = LOCAL_STORAGE_PATH / f'user_{username}/data/{album_id}'
        print(f"3. Full album path: {user_album_path}")
        print(f"4. Path exists: {user_album_path.exists()}")
        
        if not user_album_path.exists():
            return jsonify({'error': f'Album not found: {user_album_path}'}), 404

        # List tất cả files trong thư mục
        all_files = list(user_album_path.glob('*.*'))
        print(f"5. All files found: {[f.name for f in all_files]}")

        photos = []
        for file in all_files:
            if file.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif']:
                photo_url = f'/dataclient/user_{username}/data/{album_id}/{file.name}'
                photo_data = {
                    'id': str(file.stem),
                    'name': file.name,
                    'url': photo_url
                }
                photos.append(photo_data)
                print(f"6. Added photo: {photo_data}")

        print(f"7. Total photos found: {len(photos)}")
        return jsonify({
            'success': True,
            'photos': photos
        })

    except Exception as e:
        print(f"[ERROR] get_album_photos failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload', methods=['POST'])
def upload_files():
    try:
        print("Starting upload process...")
        # Xác thực user
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Unauthorized'}), 401
        
        username = request.args.get('username')
        if not username:
            return jsonify({'error': 'Missing username'}), 400

        # Xử lý tạo album mới
        if 'albumName' in request.form:
            album_name = request.form.get('albumName')
            
            # Tạo album ID và folder ID
            album_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=9))
            folder_id = 'F' + ''.join(random.choices(string.digits, k=9))
            
            # Lưu vào database
            execute_query("""
                INSERT INTO albums (id, title, username, created_at, updated_at)
                VALUES (%s, %s, %s, NOW(), NOW())
            """, (album_id, album_name, username))
            
            execute_query("""
                INSERT INTO folders (folder_id, album_id, sub_folder, created_at, updated_at)
                VALUES (%s, %s, '001', NOW(), NOW())
            """, (folder_id, album_id))

            # Tạo paths cho upload
            paths = {
                'preview': LOCAL_STORAGE_PATH / f'user_{username}/data/{album_id}',
                'original': LOCAL_STORAGE_PATH / f'user_{username}/goc/{folder_id}/001',
                'folder_id': folder_id
            }

        else:
            # Xử lý upload vào album có sẵn
            album_id = request.form.get('albumId')
            result = execute_query("SELECT folder_id FROM folders WHERE album_id = %s", (album_id,))
            folder_id = result[0]['folder_id']
            
            paths = {
                'preview': LOCAL_STORAGE_PATH / f'user_{username}/data/{album_id}',
                'original': LOCAL_STORAGE_PATH / f'user_{username}/goc/{folder_id}/001',
                'folder_id': folder_id
            }

        # Đảm bảo thư mục tồn tại
        for path in paths.values():
            if isinstance(path, Path):
                path.mkdir(parents=True, exist_ok=True)

        # Xử lý files
        files = request.files.getlist('files')
        results = []
        for file in files:
            if file.filename:
                success = process_image(file, paths)
                results.append(success)

        return jsonify({
            'success': True,
            'total': len(files),
            'processed': sum(results)
        })

    except Exception as e:
        print(f"Upload error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route('/api/albums/<album_id>/trash', methods=['POST'])
def move_to_trash(album_id):
    try:
        username = request.args.get('username')
        if not username:
            return jsonify({'error': 'Missing username'}), 400

        print(f"\n=== Debug move_to_trash ===")
        print(f"1. album_id: {album_id}")
        print(f"2. username: {username}")

        # Kiểm tra và tạo thư mục trash
        album_path = LOCAL_STORAGE_PATH / f'user_{username}' / 'data' / album_id
        trash_path = LOCAL_STORAGE_PATH / f'user_{username}' / 'trash' / album_id
        
        print(f"3. album_path: {album_path}")
        print(f"4. trash_path: {trash_path}")
        print(f"5. album exists: {album_path.exists()}")

        if not album_path.exists():
            return jsonify({'error': f'Album not found: {album_id}'}), 404

        # Đảm bảo thư mục trash tồn tại
        trash_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            # Di chuyển album vào thùng rác
            shutil.move(str(album_path), str(trash_path))
        except Exception as move_error:
            print(f"6. Move error: {str(move_error)}")
            return jsonify({'error': f'Failed to move album: {str(move_error)}'}), 500

        return jsonify({
            'success': True, 
            'message': 'Album moved to trash',
            'albumId': album_id
        }), 200

    except Exception as e:
        print(f"[DEBUG] Error moving to trash: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/albums/<album_id>/restore', methods=['POST'])
def restore_from_trash(album_id):
    try:
        username = request.args.get('username')
        if not username:
            return jsonify({'error': 'Missing username'}), 400

        # Sửa lại đường dẫn
        trash_path = LOCAL_STORAGE_PATH / f'user_{username}' / 'trash' / album_id
        restore_path = LOCAL_STORAGE_PATH / f'user_{username}' / 'data' / album_id

        if not trash_path.exists():
            return jsonify({'error': 'Album not found in trash'}), 404

        # Khôi phục album t thùng rác
        restore_path.parent.mkdir(parents=True, exist_ok=True)
        trash_path.rename(restore_path)

        return jsonify({'success': True, 'message': 'Album restored'}), 200

    except Exception as e:
        print(f"[DEBUG] Error restoring from trash: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/albums/<album_id>/delete', methods=['DELETE'])
def delete_permanently(album_id):
    try:
        username = request.args.get('username')
        if not username:
            return jsonify({'error': 'Missing username'}), 400

        print(f"\n=== Debug delete_permanently ===")
        print(f"1. album_id: {album_id}")
        print(f"2. username: {username}")

        trash_path = LOCAL_STORAGE_PATH / f'user_{username}' / 'trash' / album_id
        print(f"3. trash_path: {trash_path}")
        print(f"4. trash_path exists: {trash_path.exists()}")

        if not trash_path.exists():
            return jsonify({'error': 'Album not found in trash'}), 404

        try:
            # Sử dụng shutil.rmtree thay vì xóa từng file
            shutil.rmtree(str(trash_path), ignore_errors=True)
            print(f"6. Successfully deleted directory: {trash_path}")

            return jsonify({
                'success': True, 
                'message': 'Album deleted permanently',
                'albumId': album_id
            }), 200

        except Exception as delete_error:
            print(f"7. Delete error: {str(delete_error)}")
            # Thử phơng án backup nếu rmtree thất bại
            try:
                # Đổi tên thư mục trước khi xóa
                temp_path = trash_path.parent / f"{album_id}_to_delete"
                trash_path.rename(temp_path)
                shutil.rmtree(str(temp_path), ignore_errors=True)
                print(f"8. Deleted using backup method")
                return jsonify({
                    'success': True,
                    'message': 'Album deleted permanently (backup method)',
                    'albumId': album_id
                }), 200
            except Exception as backup_error:
                print(f"9. Backup delete failed: {str(backup_error)}")
                return jsonify({
                    'error': f'Failed to delete album: {str(backup_error)}'
                }), 500

    except Exception as e:
        print(f"[DEBUG] Error deleting permanently: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/albums/trash', methods=['GET'])
def get_trash_albums():
    try:
        username = request.args.get('username')
        print(f"\n[DEBUG] Getting trash albums for username: {username}")

        # Sửa lại đường dẫn đúng
        user_trash_path = LOCAL_STORAGE_PATH / f'user_{username}' / 'trash'  # Bỏ cái /data đi
        print(f"[DEBUG] Full trash path: {user_trash_path}")
        print(f"[DEBUG] Path exists: {user_trash_path.exists()}")

        if not user_trash_path.exists():
            print("[DEBUG] Creating trash directory")
            user_trash_path.mkdir(parents=True, exist_ok=True)
            return jsonify([]), 200

        # List all contents
        all_items = list(user_trash_path.glob('*'))
        print(f"[DEBUG] All items in trash: {[p.name for p in all_items]}")
        
        # List only directories
        dirs = [p for p in all_items if p.is_dir()]
        print(f"[DEBUG] Directories in trash: {[p.name for p in dirs]}")

        # Process each directory
        trash_albums = []
        for album_path in dirs:
            try:
                print(f"\n[DEBUG] Processing album: {album_path.name}")
                
                # Count all image types
                photos = []
                for ext in ['*.jpg', '*.jpeg', '*.png']:
                    photos.extend(list(album_path.glob(ext)))
                
                # Get cover image if exists
                cover_url = None
                if photos:
                    cover_url = f'/images/user_{username}/trash/{album_path.name}/{photos[0].name}'

                album_data = {
                    'id': album_path.name,
                    'name': album_path.name,
                    'photoCount': len(photos),
                    'coverUrl': cover_url
                }
                trash_albums.append(album_data)
                print(f"[DEBUG] Added album data: {album_data}")
            except Exception as e:
                print(f"[DEBUG] Error processing album {album_path}: {str(e)}")
                continue

        print(f"\n[DEBUG] Final response data: {trash_albums}")
        return jsonify(trash_albums), 200

    except Exception as e:
        print(f"[DEBUG] Error in get_trash_albums: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/debug/album/<album_id>')
def debug_album(album_id):
    username = request.args.get('username', 'admin4')
    album_path = LOCAL_STORAGE_PATH / f'user_{username}' / 'data' / album_id
    return {
        'album_path': str(album_path),
        'exists': album_path.exists(),
        'files': [str(p) for p in album_path.glob('*') if p.is_file()]
    }

@app.route('/debug/static')
def debug_static():
    try:
        test_image = "user_admin4/data/A/B.jpg"
        image_path = LOCAL_STORAGE_PATH / test_image
        
        return {
            'LOCAL_STORAGE_PATH': str(LOCAL_STORAGE_PATH),
            'test_image_path': str(image_path),
            'exists': image_path.exists(),
            'is_file': image_path.is_file() if image_path.exists() else False,
            'parent_exists': image_path.parent.exists(),
            'parent_is_dir': image_path.parent.is_dir() if image_path.parent.exists() else False,
            'files_in_folder': [str(f) for f in image_path.parent.glob('*')] if image_path.parent.exists() else []
        }
    except Exception as e:
        return {'error': str(e)}

@app.route('/api/albums/upload-links', methods=['POST'])
def upload_multiple_links():
    try:
        data = request.get_json()
        links = data.get('links', [])
        album_id = data.get('albumId')
        username = request.args.get('username')

        if not links or not album_id or not username:
            return jsonify({'error': 'Missing required data'}), 400

        successful_uploads = 0
        failed_uploads = []

        album_path = LOCAL_STORAGE_PATH / f'user_{username}' / 'data' / album_id
        album_path.mkdir(parents=True, exist_ok=True)

        for link in links:
            try:
                print(f"Processing link: {link}")
                # Download và lưu ảnh từ link
                image_data = download_image_from_url(link.strip())
                
                # Tạo unique filename
                file_name = f"{uuid.uuid4()}.jpg"
                file_path = album_path / file_name
                
                # Lưu file
                with open(file_path, 'wb') as f:
                    f.write(image_data)
                    
                successful_uploads += 1
                print(f"Successfully uploaded: {file_name}")
                
            except Exception as e:
                print(f"Failed to upload from link {link}: {str(e)}")
                failed_uploads.append({
                    'link': link,
                    'error': str(e)
                })

        return jsonify({
            'message': 'Upload completed',
            'successful': successful_uploads,
            'failed': len(failed_uploads),
            'failedLinks': failed_uploads
        }), 200

    except Exception as e:
        print(f"Error in upload_multiple_links: {str(e)}")
        return jsonify({'error': str(e)}), 500

def update_album_cover(album_path, new_cover_url):
    """Cập nht ảnh bìa trong metadata của album"""
    try:
        metadata_path = album_path / 'metadata.json'
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        metadata['coverUrl'] = new_cover_url
        
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False)
            
        return True
    except Exception as e:
        print(f"Đệt, li cập nhật nh bìa: {str(e)}")
        return False

def create_directory_structure(username, album_id, folder_id, sub_folder='001'):
    """Create directory structure for new album"""
    paths = {
        'preview': LOCAL_STORAGE_PATH / f'user_{username}/data/{album_id}',
        'original': LOCAL_STORAGE_PATH / f'user_{username}/goc/{folder_id}/{sub_folder}',
        'trash': LOCAL_STORAGE_PATH / f'user_{username}/trash',
        'folder_id': folder_id,
        'album_id': album_id
    }
    
    for path in paths.values():
        if isinstance(path, Path):
            path.mkdir(parents=True, exist_ok=True)
    
    return paths

def process_image(file, paths, max_size_kb=700):
    try:
        print(f"Processing image: {file.filename}")
        start_time = time.time()

        # 1. Lưu file gốc
        original_filename = secure_filename(file.filename)
        original_path = paths['original'] / original_filename
        file.save(str(original_path))

        # 2. Tạo preview với Pillow
        img = Image.open(file)
        output = io.BytesIO()
        
        # Optimize cho preview
        if img.size[0] > 1920 or img.size[1] > 1080:
            img.thumbnail((1920, 1080), Image.Resampling.LANCZOS)
        
        quality = 85
        while True:
            img.save(output, format='JPEG', quality=quality, optimize=True)
            if len(output.getvalue()) <= max_size_kb * 1024 or quality <= 5:
                break
            quality -= 5
            output.seek(0)
            output.truncate()

        # 3. Lưu preview
        preview_path = paths['preview'] / original_filename
        with open(preview_path, 'wb') as f:
            f.write(output.getvalue())

        # 4. Update database
        execute_query("""
            INSERT INTO images (folder_id, file_name, uploaded_at)
            VALUES (%s, %s, NOW())
        """, (paths['folder_id'], original_filename))

        print(f"Image processed in {time.time() - start_time:.2f}s: {file.filename}")
        return True

    except Exception as e:
        print(f"Error processing {file.filename}: {e}")
        return False

@app.route('/icon_folder/<path:filename>')
def serve_icon(filename):
    try:
        icon_path = Path('storage/icon_folder')  # Đảm bảo thư mục này tồn tại
        return send_from_directory(str(icon_path), filename)
    except Exception as e:
        print(f"Error serving icon: {str(e)}")
        return jsonify({'error': str(e)}), 404

@app.route('/api/albums/trash/delete-all', methods=['DELETE'])
def delete_all_trash():
    try:
        username = request.args.get('username')
        if not username:
            return jsonify({'error': 'Missing username'}), 400

        trash_path = LOCAL_STORAGE_PATH / f'user_{username}' / 'trash'
        
        if not trash_path.exists():
            return jsonify({'message': 'Trash is empty'}), 200

        # Xóa toàn bộ nội dung trong thư mục trash
        shutil.rmtree(str(trash_path), ignore_errors=True)
        trash_path.mkdir(exist_ok=True)  # Tạo lại thư mục trash rng

        return jsonify({
            'success': True,
            'message': 'All albums deleted permanently'
        }), 200

    except Exception as e:
        print(f"[DEBUG] Error deleting all trash: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Thêm route để serve static files
@app.route('/dataclient/<path:filename>')
def serve_dataclient(filename):
    try:
        print(f"\n=== Debug serve_dataclient ===")
        print(f"1. Requested filename: {filename}")
        print(f"2. LOCAL_STORAGE_PATH: {LOCAL_STORAGE_PATH}")
        
        full_path = LOCAL_STORAGE_PATH / filename
        print(f"3. Full file path: {full_path}")
        print(f"4. File exists: {full_path.exists()}")

        if not full_path.exists():
            return jsonify({'error': 'File not found'}), 404

        return send_from_directory(
            str(LOCAL_STORAGE_PATH),
            filename,
            mimetype='image/jpeg'
        )
    except Exception as e:
        print(f"[ERROR] serve_dataclient failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Thêm route để serve preview images
@app.route('/api/albums/<album_id>/preview/<path:filename>')
def serve_preview(album_id, filename):
    try:
        username = request.args.get('username')
        if not username:
            return jsonify({'error': 'Missing username'}), 400
            
        preview_path = LOCAL_STORAGE_PATH / f'user_{username}/data/{album_id}'
        return send_from_directory(str(preview_path), filename)
    except Exception as e:
        print(f"Error serving preview: {str(e)}")
        return jsonify({'error': str(e)}), 404

@app.route('/api/albums/<album_id>/metadata', methods=['GET'])
def get_album_metadata(album_id):
    try:
        username = request.args.get('username')
        if not username:
            return jsonify({'error': 'Missing username'}), 400

        # Lấy thông tin album từ database
        query = """
            SELECT a.*, f.folder_id, f.sub_folder
            FROM albums a
            JOIN folders f ON a.id = f.album_id
            WHERE a.id = %s AND a.username = %s
        """
        albums = execute_query(query, (album_id, username))
        
        if not albums:
            return jsonify({'error': 'Album not found'}), 404

        album = albums[0]

        # Lấy danh sách ảnh từ database
        query = """
            SELECT file_name, uploaded_at
            FROM images
            WHERE folder_id = %s
            ORDER BY uploaded_at DESC
        """
        images = execute_query(query, (album['folder_id'],)) or []

        # Format dates properly
        created_at = album['created_at'].strftime("%Y-%m-%d %H:%M:%S") if album['created_at'] else None
        updated_at = album['updated_at'].strftime("%Y-%m-%d %H:%M:%S") if album['updated_at'] else None

        metadata = {
            "id": album_id,
            "title": album['title'],
            "created_at": created_at,
            "updated_at": updated_at,
            "folder_id": album['folder_id'],
            "total_images": len(images),
            "images": [{
                "name": img['file_name'],
                "uploaded_at": img['uploaded_at'].strftime("%Y-%m-%d %H:%M:%S") if img['uploaded_at'] else None
            } for img in images]
        }

        return jsonify(metadata)

    except Exception as e:
        print(f"Error getting metadata: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/update-metadata', methods=['POST'])
def update_all_metadata():
    try:
        username = request.args.get('username')
        if not username:
            return jsonify({'error': 'Missing username'}), 400

        goc_path = LOCAL_STORAGE_PATH / f'user_{username}/goc'
        updated = []
        skipped = []
        errors = []

        for album_dir in goc_path.glob('*'):
            if not album_dir.is_dir():
                continue

            try:
                for year_dir in album_dir.glob('*'):
                    if not year_dir.is_dir():
                        continue
                    for month_dir in year_dir.glob('*'):
                        if not month_dir.is_dir():
                            continue
                        for day_dir in month_dir.glob('*'):
                            if not day_dir.is_dir():
                                continue

                            metadata_path = day_dir / 'metadata.json'
                            if metadata_path.exists():
                                skipped.append({
                                    'album': album_dir.name,
                                    'path': str(day_dir)
                                })
                                continue

                            album_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=9))

                            # Chuẩn hóa path ngay khi tìm ảnh
                            images = []
                            for img_file in day_dir.glob('*'):
                                if img_file.is_file() and img_file.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif']:
                                    images.append({
                                        "name": normalize_filename(img_file.name),  # Chuẩn hóa tên file
                                        "uploaded_at": datetime.fromtimestamp(img_file.stat().st_mtime).strftime("%Y-%m-%d %H:%M:%S")
                                    })

                            # Chuẩn hóa path trong metadata
                            normalized_path = normalize_filename(f"{album_dir.name}/{year_dir.name}/{month_dir.name}/{day_dir.name}")
                            
                            metadata = {
                                "id": album_id,
                                "title": album_dir.name,  # Giữ nguyên tên hiển thị
                                "created_at": datetime.fromtimestamp(day_dir.stat().st_mtime).strftime("%Y-%m-%d %H:%M:%S"),
                                "path": normalized_path,  # Path đã được chuẩn hóa
                                "total_images": len(images),
                                "images": images
                            }

                            print(f"Creating new metadata in: {metadata_path}")
                            with open(metadata_path, 'w', encoding='utf-8') as f:
                                json.dump(metadata, f, ensure_ascii=False, indent=2)

                            data_path = LOCAL_STORAGE_PATH / f'user_{username}/data/{album_id}'
                            data_path.mkdir(parents=True, exist_ok=True)

                            updated.append({
                                'album': album_dir.name,
                                'path': normalized_path,
                                'id': album_id,
                                'images': len(images)
                            })

            except Exception as e:
                errors.append(f"Error updating {album_dir.name}: {str(e)}")
                print(f"Error in album {album_dir.name}: {str(e)}")

        print(f"Created metadata for {len(updated)} new directories")
        print(f"Skipped {len(skipped)} existing directories")
        
        return jsonify({
            'success': True,
            'updated': updated,
            'skipped': skipped,
            'errors': errors
        })

    except Exception as e:
        print(f"Error updating metadata: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/albums/<album_id>/metadata', methods=['PUT'])
def update_metadata(album_id):
    try:
        data = request.get_json()
        username = request.args.get('username')
        
        if not username:
            return jsonify({'error': 'Missing username'}), 400

        # Cập nhật thông tin album trong database
        query = """
            UPDATE albums 
            SET title = %s, updated_at = NOW()
            WHERE id = %s AND username = %s
        """
        result = execute_query(query, (data.get('title'), album_id, username))
        
        if not result:
            return jsonify({'error': 'Album not found or update failed'}), 404

        return jsonify({'success': True})

    except Exception as e:
        print(f"Error updating metadata: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/albums/<album_id>/folder', methods=['GET'])
def get_folder_info(album_id):
    try:
        print(f"Getting folder info for album: {album_id}")
        print(f"Request headers: {dict(request.headers)}")
        
        # Lấy folder_id từ database
        result = execute_query(
            "SELECT folder_id FROM folders WHERE album_id = %s", 
            (album_id,)
        )
        
        print(f"Database result: {result}")
        
        if not result:
            print(f"No folder found for album: {album_id}")
            return jsonify({'error': 'Album not found'}), 404
            
        response_data = {
            'folder_id': result[0]['folder_id']
        }
        print(f"Sending response: {response_data}")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error getting folder info: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/files', methods=['POST'])
def save_file_info():
    try:
        data = request.get_json()
        folder_id = data.get('folderId')
        filename = data.get('filename')

        execute_query("""
            INSERT INTO files (folder_id, file_name, uploaded_at)
            VALUES (%s, %s, NOW())
        """, (folder_id, filename))

        return jsonify({'success': True})

    except Exception as e:
        print(f"Error saving file info: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/albums/folder-by-name', methods=['POST'])
def get_folder_info_by_name():
    try:
        data = request.get_json()
        album_name = data.get('albumName')
        username = data.get('username')
        
        # Query để lấy folder_id từ tên album
        result = execute_query("""
            SELECT f.folder_id, a.id as album_id
            FROM folders f
            JOIN albums a ON f.album_id = a.id
            WHERE a.title = %s AND a.username = %s
        """, (album_name, username))
        
        if not result:
            return jsonify({'error': 'Album not found'}), 404
            
        return jsonify({
            'folder_id': result[0]['folder_id'],
            'album_id': result[0]['album_id']
        })
        
    except Exception as e:
        print(f"Error getting folder info: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    import logging
    logging.basicConfig(level=logging.DEBUG)
    
    print("Starting Photo Album API...")
    try:
        print(f"Server will run on: http://0.0.0.0:{API_PORT}")
        app.run(
            host='0.0.0.0',
            port=API_PORT,
            debug=True
        )
    except Exception as e:
        print(f"Error starting server: {e}")
        import traceback
        print(traceback.format_exc())

