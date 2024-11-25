import requests
import json
from pathlib import Path
import concurrent.futures

def test_single_file():
    """Test download 1 file bình thường"""
    data = {
        'username': 'test_user',
        'albumPath': 'F463105502/001',
        'photoName': 'test0.jpg'
    }
    response = requests.post('http://localhost:5003/api/download', json=data)
    print(f"\n1. Single File Test: {'✅ OK' if response.status_code == 200 else '❌ Failed'}")
    return response.status_code == 200

def test_multiple_files():
    """Test download nhiều file cùng lúc"""
    files = [
        ('F463105502/001', 'test0.jpg'),
        ('F463105502/001', 'test1.jpg'),
        ('F216553120/001', 'test0.jpg')
    ]
    
    success = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        futures = []
        for album, photo in files:
            data = {
                'username': 'test_user',
                'albumPath': album,
                'photoName': photo
            }
            futures.append(executor.submit(
                requests.post, 
                'http://localhost:5003/api/download',
                json=data
            ))
            
        for future in concurrent.futures.as_completed(futures):
            if future.result().status_code == 200:
                success += 1
                
    print(f"\n2. Multiple Files Test: {'✅ OK' if success == len(files) else '❌ Failed'} ({success}/{len(files)})")
    return success == len(files)

def test_nonexistent_file():
    """Test file không tồn tại"""
    data = {
        'username': 'test_user',
        'albumPath': 'F463105502/001',
        'photoName': 'nonexistent.jpg'
    }
    response = requests.post('http://localhost:5003/api/download', json=data)
    print(f"\n3. Nonexistent File Test: {'✅ OK' if response.status_code == 404 else '❌ Failed'}")
    return response.status_code == 404

def test_special_chars():
    """Test tên file có ký tự đặc biệt"""
    data = {
        'username': 'test_user',
        'albumPath': 'F463105502/001',
        'photoName': 'test#1 (2).jpg'  # Tên file có ký tự đặc biệt
    }
    response = requests.post('http://localhost:5003/api/download', json=data)
    print(f"\n4. Special Chars Test: {'✅ OK' if response.status_code in [200, 404] else '❌ Failed'}")
    return response.status_code in [200, 404]

def run_all_tests():
    print("\n=== Running Download Test Suite ===")
    
    results = {
        'Single File': test_single_file(),
        'Multiple Files': test_multiple_files(),
        'Nonexistent File': test_nonexistent_file(),
        'Special Chars': test_special_chars()
    }
    
    print("\n=== Test Summary ===")
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    
    for test, result in results.items():
        print(f"{test}: {'✅ Passed' if result else '❌ Failed'}")
        
    print(f"\nTotal: {passed}/{total} tests passed")
    
if __name__ == "__main__":
    run_all_tests()