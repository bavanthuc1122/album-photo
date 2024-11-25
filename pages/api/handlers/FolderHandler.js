// pages/api/handlers/FolderHandler.js
import fs from 'fs';
import path from 'path';

class FolderHandler {
  constructor(basePath) {
    this.basePath = basePath;
  }

  async createUserFolders(username) {
    try {
      const userFolderPath = path.join(this.basePath, `user_${username}`);
      const dataFolderPath = path.join(userFolderPath, 'data');
      const trashFolderPath = path.join(userFolderPath, 'trash');

      // Tạo các thư mục
      await fs.promises.mkdir(userFolderPath, { recursive: true });
      await fs.promises.mkdir(dataFolderPath);
      await fs.promises.mkdir(trashFolderPath);

      return {
        success: true,
        paths: {
          user: userFolderPath,
          data: dataFolderPath,
          trash: trashFolderPath
        }
      };
    } catch (error) {
      // Log error
      this._logError(username, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  _logError(username, error) {
    const logPath = path.join(process.cwd(), 'storage/logs/folder_errors.log');
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - Error creating folders for ${username}: ${error.message}\n`;
    
    fs.appendFileSync(logPath, logMessage);
  }
}

export default FolderHandler;