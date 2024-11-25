import shutil
from pathlib import Path

def cleanup():
    print("\n=== Cleaning Up Test Files ===")
    
    # 1. Remove test images
    test_images = Path('tests/test_images')
    if test_images.exists():
        shutil.rmtree(test_images)
        print("✅ Removed test images")
    
    # 2. Remove downloads
    downloads = Path('tests/downloads')
    if downloads.exists():
        shutil.rmtree(downloads)
        print("✅ Removed downloads")
    
    # 3. Remove user data
    user_data = Path('storage/dataclient/user_test_user')
    if user_data.exists():
        shutil.rmtree(user_data)
        print("✅ Removed user data")
    
    print("\n✨ Cleanup completed!")

if __name__ == "__main__":
    cleanup() #python tests/cleanup.py
