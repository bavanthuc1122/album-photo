// lib/storage.js
import path from 'path';

class StorageManager {
  constructor(basePath = process.env.LOCAL_STORAGE_PATH) {
    this.basePath = basePath;
  }

  getUserPath(username) {
    return path.join(this.basePath, `user_${username}`);
  }

  getUserDataPath(username) {
    return path.join(this.getUserPath(username), 'data');
  }

  getUserTrashPath(username) {
    return path.join(this.getUserPath(username), 'trash');
  }

  // Hàm di chuyển file từ data sang trash
  moveToTrash(username, filePath) {
    const dataPath = this.getUserDataPath(username);
    const trashPath = this.getUserTrashPath(username);
    // Logic move file
  }

  // Hàm khôi phục file từ trash về data
  restoreFromTrash(username, filePath) {
    const dataPath = this.getUserDataPath(username);
    const trashPath = this.getUserTrashPath(username);
    // Logic restore file
  }
}

export default new StorageManager();