from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
from pathlib import Path
import zipfile
import io
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
load_dotenv('.env.local')

app = Flask(__name__)

# Configure CORS
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5002",
            "http://localhost:5003"
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

LOCAL_STORAGE_PATH = Path(os.getenv('LOCAL_STORAGE_PATH', 'storage/dataclient')).absolute()

@app.route('/api/download', methods=['POST'])
def download_photos():
    try:
        # Debug request
        print("\n=== Incoming Request ===")
        print(f"Method: {request.method}")
        print(f"Headers: {dict(request.headers)}")
        print(f"Raw Data: {request.get_data().decode()}")
        
        # Parse JSON data
        try:
            data = request.get_json(force=True)
            print("\nParsed JSON data:", json.dumps(data, indent=2))
        except Exception as e:
            print(f"Error parsing JSON: {str(e)}")
            return jsonify({
                'error': f'Invalid JSON data: {str(e)}',
                'raw_data': request.get_data().decode()
            }), 400
            
        # Get and validate fields
        username = data.get('username')
        album_path = data.get('albumPath')
        liked_photos = data.get('likedPhotos', [])
        
        validation = {
            'username': bool(username),
            'albumPath': bool(album_path),
            'likedPhotos': bool(liked_photos and isinstance(liked_photos, list) and len(liked_photos) > 0)
        }
        
        print("\nField validation:")
        print(f"username ({type(username)}): {username}")
        print(f"albumPath ({type(album_path)}): {album_path}")
        print(f"likedPhotos ({type(liked_photos)}): {liked_photos}")
        print(f"Validation results: {validation}")
        
        if not all(validation.values()):
            failed = [k for k, v in validation.items() if not v]
            return jsonify({
                'error': 'Missing required parameters',
                'failed_validation': failed,
                'validation': validation,
                'received': {
                    'username': username,
                    'albumPath': album_path,
                    'likedPhotos': liked_photos
                }
            }), 400

        # Build full path
        base_path = LOCAL_STORAGE_PATH / f'user_{username}/goc/{album_path}'
        print(f"\nLooking in path: {base_path}")
        print(f"Path exists: {base_path.exists()}")
        
        if not base_path.exists():
            error = {
                'error': f'Directory not found: {base_path}',
                'details': {
                    'LOCAL_STORAGE_PATH': str(LOCAL_STORAGE_PATH),
                    'full_path': str(base_path)
                }
            }
            print("\nDirectory error:", error)
            return jsonify(error), 404

        # Find original files
        original_files = []
        for photo_name in liked_photos:
            photo_path = base_path / photo_name
            print(f"\nChecking file: {photo_path}")
            print(f"File exists: {photo_path.exists()}")
            if photo_path.exists():
                original_files.append(photo_path)
                print(f"Found file: {photo_path}")
            else:
                print(f"File not found: {photo_path}")

        if not original_files:
            error = {
                'error': 'No files found',
                'searched_paths': [str(base_path / name) for name in liked_photos]
            }
            print("\nNo files found:", error)
            return jsonify(error), 404

        # Send single file
        if len(original_files) == 1:
            file_path = str(original_files[0])
            print(f"\nSending single file: {file_path}")
            return send_file(
                file_path,
                as_attachment=True,
                download_name=original_files[0].name,
                mimetype='image/jpeg'
            )

        # Create zip for multiple files
        memory_file = io.BytesIO()
        with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
            for file_path in original_files:
                zf.write(str(file_path), file_path.name)
                print(f"Added to zip: {file_path}")

        memory_file.seek(0)
        return send_file(
            memory_file,
            mimetype='application/zip',
            as_attachment=True,
            download_name=f'{album_path}_liked_photos.zip'
        )

    except Exception as e:
        print(f"\nError downloading photos: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

if __name__ == '__main__':
    print(f"""
    Starting Download API Server
    ==========================
    Port: 5003
    Storage Path: {LOCAL_STORAGE_PATH}
    Debug Mode: True
    """)
    
    app.run(host='0.0.0.0', port=5003, debug=True)
