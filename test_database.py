from lib.database import execute_query
import random
import string

def test_database():
    print("\n=== Test Database ===")
    
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
    print("\n=== Testing Create Album ===")
    try:
        # Test tạo album mới
        album_data = {
            'name': 'Test Album',
            'username': 'test_user'
        }
        
        # 1. Insert album
        album_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=9))
        result = execute_query(
            "INSERT INTO albums (id, title, username) VALUES (%s, %s, %s)",
            (album_id, album_data['name'], album_data['username']),
            db_name='photo_albums'
        )
        print("✅ Create album:", "OK" if result else "Failed")

        # 2. Insert folder
        folder_id = 'F' + ''.join(random.choices(string.digits, k=9))
        result = execute_query(
            "INSERT INTO folders (folder_id, album_id, sub_folder) VALUES (%s, %s, '001')",
            (folder_id, album_id),
            db_name='photo_albums'
        )
        print("✅ Create folder:", "OK" if result else "Failed")

        # 3. Verify data
        album = execute_query(
            "SELECT * FROM albums WHERE id = %s",
            (album_id,),
            db_name='photo_albums'
        )
        print("📋 Created album:", album[0] if album else "Not found")

    except Exception as e:
        print("❌ Create album error:", str(e))

if __name__ == "__main__":
    test_database()
    test_create_album()