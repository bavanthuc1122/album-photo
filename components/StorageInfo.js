import { useState, useEffect } from 'react';

export default function StorageInfo() {
  const [storageInfo, setStorageInfo] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/storage-path')
      .then(res => res.json())
      .then(data => {
        setStorageInfo(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!storageInfo) return <div>No storage info available</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Storage Information</h2>
      <div className="mb-4">
        <strong>Base Path:</strong> {storageInfo.basePath}
      </div>
      
      <h3 className="text-lg font-semibold mb-2">Items:</h3>
      <div className="grid gap-4">
        {storageInfo.items.map((item, index) => (
          <div key={index} className="border p-3 rounded">
            <div><strong>Name:</strong> {item.name}</div>
            <div><strong>Path:</strong> {item.path}</div>
            <div><strong>Type:</strong> {item.isDirectory ? 'Directory' : 'File'}</div>
            <div><strong>Size:</strong> {formatBytes(item.size)}</div>
            <div><strong>Modified:</strong> {new Date(item.modified).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
} 