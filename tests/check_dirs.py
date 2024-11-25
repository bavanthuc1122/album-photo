from pathlib import Path
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
load_dotenv('.env.local')

def check_directories():
    base_path = Path(os.getenv('LOCAL_STORAGE_PATH', 'storage/dataclient'))
    test_user = 'test_user'
    folder_id = 'F532721663'  # Folder ID mới nhất
    
    paths = {
        'base': base_path,
        'user': base_path / f'user_{test_user}',
        'data': base_path / f'user_{test_user}/data',
        'goc': base_path / f'user_{test_user}/goc',
        'goc_folder': base_path / f'user_{test_user}/goc/{folder_id}',
        'goc_folder_001': base_path / f'user_{test_user}/goc/{folder_id}/001',
    }
    
    print("\nChecking Directory Structure:")
    for name, path in paths.items():
        exists = path.exists()
        print(f"\n{name}: {path}")
        print(f"  Exists: {exists}")
        if exists:
            files = list(path.glob('*'))
            print(f"  Contents: {files}")
            
            # Nếu là thư mục 001, kiểm tra chi tiết file
            if name == 'goc_folder_001' and exists:
                print("\nChecking image files:")
                for file in files:
                    print(f"  - {file.name}")
                    print(f"    Size: {file.stat().st_size} bytes")
                    print(f"    Is file: {file.is_file()}")
                    print(f"    Readable: {os.access(file, os.R_OK)}")

if __name__ == "__main__":
    check_directories()
