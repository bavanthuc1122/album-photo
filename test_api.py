import requests
import json
from pathlib import Path
import time
import jwt
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
load_dotenv('.env.local')

BASE_URL = 'http://localhost:5002'
TEST_USERNAME = 'test_user'

def generate_test_token():
    secret = os.getenv('JWT_SECRET', 'abc123411')
    token = jwt.encode(
        {'username': TEST_USERNAME, 'exp': time.time() + 3600},
        secret,
        algorithm='HS256'
    )
    return token

def test_create_album():
    print("\n=== Test Create Album ===")
    try:
        url = f"{BASE_URL}/api/albums?username={TEST_USERNAME}"
        data = {
            "name": "Test Album 2024"
        }
        headers = {
            'Authorization': f'Bearer {generate_test_token()}'
        }
        response = requests.post(url, json=data, headers=headers)
        result = response.json()
        print("Response:", result)
        
        if 'error' in result:
            print("Error creating album:", result['error'])
            return None
            
        return result
        
    except Exception as e:
        print("Error:", str(e))
        return None

def test_upload_images(album_id):
    print("\n=== Test Upload Images ===")
    try:
        url = f"{BASE_URL}/api/upload?username={TEST_USERNAME}"
        
        # Tạo test images
        test_images_dir = Path('test_images')
        test_images_dir.mkdir(exist_ok=True)
        
        # Tạo 2 file test .jpg thay vì .txt
        for i in range(2):
            img_path = test_images_dir / f'test{i}.jpg'
            # Tạo một file jpg đơn giản
            from PIL import Image
            img = Image.new('RGB', (100, 100), color = 'red')
            img.save(img_path)
        
        # Upload files
        files = []
        for img_path in test_images_dir.glob('*.jpg'):
            files.append(
                ('files', (img_path.name, open(img_path, 'rb'), 'image/jpeg'))
            )
        
        data = {
            'albumId': album_id
        }
        
        headers = {
            'Authorization': f'Bearer {generate_test_token()}'
        }
        
        response = requests.post(url, files=files, data=data, headers=headers)
        result = response.json()
        print("Response:", result)
        
        # Cleanup
        for f in files:
            f[1][1].close()
            
        return result
        
    except Exception as e:
        print("Error:", str(e))
        return None

def test_get_metadata(album_id):
    print("\n=== Test Get Metadata ===")
    try:
        url = f"{BASE_URL}/api/albums/{album_id}/metadata?username={TEST_USERNAME}"
        headers = {
            'Authorization': f'Bearer {generate_test_token()}'
        }
        response = requests.get(url, headers=headers)
        result = response.json()
        print("Response:", result)
        return result
    except Exception as e:
        print("Error:", str(e))
        return None

if __name__ == "__main__":
    # Install required packages if not already installed
    try:
        import jwt
        from PIL import Image
    except ImportError:
        print("Installing required packages...")
        import subprocess
        subprocess.check_call(["pip", "install", "pyjwt", "pillow"])
        print("Packages installed successfully")
    
    # 1. Create album
    album = test_create_album()
    if not album:
        print("Failed to create album")
        exit(1)
        
    album_id = album.get('id')
    if not album_id:
        print("No album ID returned")
        exit(1)
    
    print(f"\nCreated album with ID: {album_id}")
    
    # Wait a bit
    time.sleep(1)
    
    # 2. Upload images
    upload_result = test_upload_images(album_id)
    if not upload_result:
        print("Failed to upload images")
        exit(1)
    
    # Wait a bit
    time.sleep(1)
    
    # 3. Get metadata
    metadata = test_get_metadata(album_id)
    if not metadata:
        print("Failed to get metadata")