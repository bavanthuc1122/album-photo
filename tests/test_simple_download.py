import requests
import json
from pathlib import Path

def check_directory():
    base_path = Path('storage/dataclient/user_test_user')
    print("\n=== Checking Directory Structure ===")
    
    if not base_path.exists():
        print(f"❌ Base path not found: {base_path}")
        return False
        
    # Check goc folder
    goc_files = list(base_path.glob('goc/**/*.jpg'))
    print(f"\nFound {len(goc_files)} files in goc folder:")
    for f in goc_files:
        print(f"- {f}")
        
    # Check data folder
    data_files = list(base_path.glob('data/**/*.jpg'))
    print(f"\nFound {len(data_files)} files in data folder:")
    for f in data_files:
        print(f"- {f}")
        
    return len(goc_files) > 0

def test_download():
    try:
        # Check directory first
        if not check_directory():
            print("❌ No files found to download!")
            return
            
        # Get first jpg file path
        base_path = Path('storage/dataclient/user_test_user')
        jpg_files = list(base_path.glob('goc/**/*.jpg'))
        if not jpg_files:
            print("❌ No jpg files found!")
            return
            
        # Get relative path components
        file_path = jpg_files[0]
        rel_path = file_path.relative_to(base_path / 'goc')
        folder_path = str(rel_path.parent).replace('\\', '/')
        photo_name = rel_path.name
        
        # Test data
        data = {
            'username': 'test_user',
            'albumPath': folder_path,
            'photoName': photo_name
        }
        
        print("\n=== Testing Download ===")
        print(f"Request data: {json.dumps(data, indent=2)}")
        print(f"File should exist at: {file_path}")
        
        # Send request
        response = requests.post(
            'http://localhost:5003/api/download',
            json=data,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Response Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            downloads_dir = Path('tests/downloads')
            downloads_dir.mkdir(exist_ok=True)
            
            with open(downloads_dir / photo_name, 'wb') as f:
                f.write(response.content)
            print(f"\n✅ Successfully downloaded: {photo_name}")
        else:
            print(f"\n❌ Download failed:")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"\n❌ An error occurred: {e}")

if __name__ == "__main__":
    test_download()
