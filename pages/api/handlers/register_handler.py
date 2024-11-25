# Đặt tại: /pages/api/handlers/register_handler.py

from ..config import Config
import os
from datetime import datetime

class RegisterHandler:
    def __init__(self):
        self.storage_path = Config.BASE_STORAGE_PATH
        
    def create_user_folders(self, username):
        """Tạo folders khi user register thành công"""
        try:
            # Path: storage/dataclient/user_username
            user_folder = os.path.join(self.storage_path, f'user_{username}')
            
            # Tạo folders
            os.makedirs(os.path.join(user_folder, 'data'), exist_ok=True)
            os.makedirs(os.path.join(user_folder, 'trash'), exist_ok=True)
            
            return True
            
        except Exception as e:
            self._log_error(username, str(e))
            return False
            
    def _log_error(self, username, error):
        # Log vào: storage/logs/register_errors.log
        log_path = 'storage/logs/register_errors.log'
        os.makedirs(os.path.dirname(log_path), exist_ok=True)
        
        with open(log_path, 'a') as f:
            timestamp = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
            f.write(f'{timestamp} - Error creating folders for {username}: {error}\n')
