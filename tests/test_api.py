import requests
import json
from pathlib import Path
import time
import jwt
import os
from PIL import Image
from dotenv import load_dotenv
import sys

# Load environment variables
load_dotenv()
load_dotenv('.env.local')

BASE_URL = 'http://localhost:5002'
DOWNLOAD_URL = 'http://localhost:5003'
TEST_USERNAME = 'test_user'

def generate_test_token():
    secret = os.getenv('JWT_SECRET', 'abc123411')
    token = jwt.encode(
        {'username': TEST_USERNAME, 'exp': time.time() + 3600},
        secret,
        algorithm='HS256'
    )
    return token

def create_test_images():
    print("\n=== Creating Test Images ===")
    test_images_dir = Path('tests/test_images')
    test_images_dir.mkdir(parents=True, exist_ok=True)
    
    # Create 2 test images
    colors = ['red', 'blue']
    image_paths = []
    
    for i, color in enumerate(colors):
        img_path = test_images_dir / f'test{i}.jpg'
        img = Image.new('RGB', (100, 100), color=color)
        img.save(img_path)
        image_paths.append(img_path)
        print(f"✅ Created test image: {img_path}")
    
    return image_paths

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
            print("❌ Error creating album:", result['error'])
            return None
            
        print("✅ Album created successfully")
        return result
        
    except Exception as e:
        print("❌ Error:", str(e))
        return None

def test_upload_images(album_id, image_paths):
    print("\n=== Test Upload Images ===")
    try:
        url = f"{BASE_URL}/api/upload?username={TEST_USERNAME}"
        
        # Upload files
        files = []
        for img_path in image_paths:
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
        
        if 'error' in result:
            print("❌ Error uploading images:", result['error'])
            return False
            
        print("✅ Images uploaded successfully")
        return True
        
    except Exception as e:
        print("❌ Error:", str(e))
        return False

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
        
        if 'error' in result:
            print("❌ Error getting metadata:", result['error'])
            return None
            
        print("✅ Metadata retrieved successfully")
        return result
    except Exception as e:
        print("❌ Error:", str(e))
        return None

def test_download_image(album_id, metadata):
    print("\n=== Test Download Image ===")
    try:
        # Download first image
        image_name = metadata['images'][0]['name']
        url = f"{DOWNLOAD_URL}/api/download"
        
        data = {
            'username': TEST_USERNAME,
            'albumPath': f"{metadata['folder_id']}/001",
            'photoName': image_name
        }
        
        print(f"""
        Sending download request:
        URL: {url}
        Data: {json.dumps(data, indent=2)}
        """)
        
        response = requests.post(
            url,
            json=data,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            # Save downloaded file
            download_path = Path('tests/downloads')
            download_path.mkdir(exist_ok=True)
            
            with open(download_path / image_name, 'wb') as f:
                f.write(response.content)
            
            print(f"✅ Image downloaded successfully: {image_name}")
            return True
        else:
            print(f"Response JSON: {response.json()}")
            print(f"❌ Download failed: Status {response.status_code}")
            return False
            
    except Exception as e:
        print("❌ Error:", str(e))
        return False

def verify_directory_structure(album_id, folder_id):
    print("\n=== Verify Directory Structure ===")
    base_path = Path(os.getenv('LOCAL_STORAGE_PATH', 'storage/dataclient'))
    
    # Check preview directory
    preview_path = base_path / f'user_{TEST_USERNAME}/data/{album_id}'
    print(f"Preview path exists: {preview_path.exists()}")
    if preview_path.exists():
        print("Preview images:", [f.name for f in preview_path.glob('*.jpg')])
    
    # Check original directory
    original_path = base_path / f'user_{TEST_USERNAME}/goc/{folder_id}/001'
    print(f"Original path exists: {original_path.exists()}")
    if original_path.exists():
        print("Original images:", [f.name for f in original_path.glob('*.jpg')])

if __name__ == "__main__":
    # Create test images
    image_paths = create_test_images()
    
    # Create album
    album = test_create_album()
    if not album:
        print("❌ Test failed at album creation")
        sys.exit(1)
    
    album_id = album['id']
    folder_id = album['folder_id']
    print(f"\n📝 Created album: {album_id}, folder: {folder_id}")
    
    # Upload images
    if not test_upload_images(album_id, image_paths):
        print("❌ Test failed at image upload")
        sys.exit(1)
    
    # Get metadata
    metadata = test_get_metadata(album_id)
    if not metadata:
        print("❌ Test failed at getting metadata")
        sys.exit(1)
    
    # Test download
    if not test_download_image(album_id, metadata):
        print("❌ Test failed at image download")
        sys.exit(1)
    
    # Verify directory structure
    verify_directory_structure(album_id, folder_id)
    
    print("\n✨ All tests completed successfully!")
