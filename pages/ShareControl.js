import { useState } from 'react';

export default function ShareControl({ path, initialIsPublic = false }) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [shareLink, setShareLink] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleShare = async () => {
    try {
      setLoading(true);
      const method = isPublic ? 'DELETE' : 'POST';
      
      const res = await fetch('/api/storage/share', {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path,
          isPublic: !isPublic
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setIsPublic(!isPublic);
        setShareLink(data.shareLink || '');
      }
    } catch (error) {
      console.error('Share toggle error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        onClick={toggleShare}
        disabled={loading}
        className={`px-4 py-2 rounded ${
          isPublic ? 'bg-red-500' : 'bg-blue-500'
        } text-white`}
      >
        {loading ? 'Processing...' : isPublic ? 'Stop Sharing' : 'Share'}
      </button>

      {isPublic && shareLink && (
        <div className="mt-2">
          <input
            type="text"
            value={`${window.location.origin}${shareLink}`}
            readOnly
            className="border p-2 w-full"
          />
          <button
            onClick={() => navigator.clipboard.writeText(shareLink)}
            className="mt-1 text-sm text-blue-500"
          >
            Copy Link
          </button>
        </div>
      )}
    </div>
  );
}