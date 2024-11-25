import requests
import json
from pathlib import Path
import os
from dotenv import load_dotenv

# Load env
load_dotenv()
load_dotenv('.env.local')

def test_download():
    # 1. Lấy thông tin album và ảnh từ API
    print("\n=== Getting Album Info ===")
    album_response = requests.get(
        'http://localhost:5002/api/albums',
        params={'username': 'test_user'}
    )
    albums = album_response.json()
    
    if not albums:
        print("No albums found!")
        return
        
    album = albums[0]  # Lấy album đầu tiên
    album_id = album['id']
    
    # 2. Lấy metadata của album
    print("\n=== Getting Album Metadata ===")
    metadata_response = requests.get(
        f'http://localhost:5002/api/albums/{album_id}/metadata',
        params={'username': 'test_user'}
    )
    metadata = metadata_response.json()
    
    if 'folder_id' not in metadata:
        print("No folder_id in metadata!")
        return
        
    folder_id = metadata['folder_id']
    sub_folder = '001'  # Thường là '001'
    
    # 3. Lấy danh sách ảnh
    print("\n=== Getting Photos ===")
    photos_response = requests.get(
        f'http://localhost:5002/api/albums/{album_id}/photos',
        params={'username': 'test_user'}
    )
    photos = photos_response.json().get('photos', [])
    
    if not photos:
        print("No photos found!")
        return
        
    # 4. Test download ảnh đầu tiên
    photo = photos[0]
    print(f"\n=== Testing Download: {photo['name']} ===")
    
    download_data = {
        'username': 'test_user',
        'albumPath': f'{folder_id}/{sub_folder}',
        'photoName': photo['name']
    }
    
    print(f"""
    Download Request:
    URL: http://localhost:5003/api/download
    Data: {json.dumps(download_data, indent=2)}
    """)
    
    response = requests.post(
        'http://localhost:5003/api/download',
        json=download_data,
        headers={'Content-Type': 'application/json'}
    )
    
    print(f"Response Status: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        # Save downloaded file
        downloads_dir = Path('tests/downloads')
        downloads_dir.mkdir(exist_ok=True)
        
        with open(downloads_dir / photo['name'], 'wb') as f:
            f.write(response.content)
        print(f"\n✅ Successfully downloaded: {photo['name']}")
    else:
        print(f"\n❌ Download failed:")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")

if __name__ == "__main__":
    test_download()