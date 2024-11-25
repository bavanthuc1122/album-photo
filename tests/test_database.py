from lib.database import execute_query
import random
import string
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
load_dotenv('.env.local')

def test_database_connection():
    print("\n=== Test Database Connection ===")
    
    # Test cusomerthuc
    try:
        result = execute_query("SELECT 1", db_name='cusomerthuc')
        print("✅ Cusomerthuc connection:", "OK" if result else "Failed")
    except Exception as e:
        print("❌ Cusomerthuc error:", str(e))

    # Test photo_albums
    try:
        result = execute_query("SELECT 1", db_name='photo_albums')
        print("✅ Photo_albums connection:", "OK" if result else "Failed")
        
        # Test tables trong photo_albums
        tables = execute_query("SHOW TABLES", db_name='photo_albums')
        print("📋 Photo_albums tables:", [t['Tables_in_photo_albums'] for t in tables] if tables else "No tables")
    except Exception as e:
        print("❌ Photo_albums error:", str(e))

def test_create_album():
    print("\n=== Test Create Album ===")
    try:
        # 1. Create album
        album_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=9))
        query = """
            INSERT INTO albums (id, title, username, created_at, updated_at)
            VALUES (%s, %s, %s, NOW(), NOW())
        """
        result = execute_query(query, (album_id, "Test Album", "test_user"), db_name='photo_albums')
        print("✅ Create album:", "OK" if result else "Failed")

        # 2. Create folder
        folder_id = 'F' + ''.join(random.choices(string.digits, k=9))
        folder_path = f"user_test_user/goc/{folder_id}/001"
        query = """
            INSERT INTO folders (folder_id, album_id, sub_folder, path, created_at, updated_at)
            VALUES (%s, %s, '001', %s, NOW(), NOW())
        """
        result = execute_query(query, (folder_id, album_id, folder_path), db_name='photo_albums')
        print("✅ Create folder:", "OK" if result else "Failed")

        # 3. Verify data
        query = """
            SELECT a.*, f.folder_id, f.path
            FROM albums a
            JOIN folders f ON a.id = f.album_id
            WHERE a.id = %s
        """
        album = execute_query(query, (album_id,), db_name='photo_albums')
        print("📋 Created album:", album[0] if album else "Not found")

        return album_id, folder_id

    except Exception as e:
        print("❌ Create album error:", str(e))
        return None, None

if __name__ == "__main__":
    # 1. Test database connection
    test_database_connection()
    
    # 2. Test create album
    album_id, folder_id = test_create_album()
    
    if album_id and folder_id:
        print(f"\n✨ Success! Created album {album_id} with folder {folder_id}")
    else:
        print("\n❌ Test failed!")