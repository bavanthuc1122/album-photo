

from dotenv import load_dotenv
import os

load_dotenv()

class Config:
    # Đường dẫn gốc để tạo folder user
    BASE_STORAGE_PATH = os.getenv('LOCAL_STORAGE_PATH', 'storage/dataclient')
    
    # Database config 
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '1122')
    DB_NAME = os.getenv('DB_NAME', 'cusomerthuc')
