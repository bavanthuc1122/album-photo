from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
from pathlib import Path
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
load_dotenv('.env.local')

app = Flask(__name__)
CORS(app)

LOCAL_STORAGE_PATH = Path(__file__).parent.parent.parent / 'storage/dataclient'

# Test route
@app.route('/test', methods=['GET'])
def test():
    return jsonify({
        'status': 'ok',
        'routes': [str(rule) for rule in app.url_map.iter_rules()],
        'storage_path': str(LOCAL_STORAGE_PATH)
    })

@app.route('/api/download', methods=['POST'])
def download_photos():
    print("\n=== New Download Request ===")
    
    try:
        # Log raw request
        print(f"Request Method: {request.method}")
        print(f"Content-Type: {request.headers.get('Content-Type')}")
        print(f"Raw Data: {request.get_data()}")
        
        # Parse JSON
        data = request.get_json(force=True)
        print(f"Parsed Data: {data}")
        
        # Get parameters
        username = data.get('username')
        album_path = data.get('albumPath') 
        photo_name = data.get('photoName')
        
        print(f"Username: {username}")
        print(f"Album Path: {album_path}")
        print(f"Photo Name: {photo_name}")
        
        # Build file path
        file_path = LOCAL_STORAGE_PATH / f'user_{username}/goc/{album_path}/{photo_name}'
        print(f"Looking for file at: {file_path}")
        
        if not file_path.exists():
            print(f"File not found: {file_path}")
            return jsonify({'error': 'File not found'}), 404
            
        print(f"File exists, sending: {file_path}")
        return send_file(str(file_path))
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Add root route
@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'status': 'ok',
        'message': 'Download API is running',
        'storage_path': str(LOCAL_STORAGE_PATH)
    })

if __name__ == '__main__':
    print(f"""
    Starting Download API Server
    ==========================
    Port: 5003
    Storage Path: {LOCAL_STORAGE_PATH}
    Debug Mode: True
    """)
    
    app.run(host='0.0.0.0', port=5003, debug=True)
