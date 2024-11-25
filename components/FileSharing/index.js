import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Rate Limiting Configuration
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100 // số request tối đa
};

// Component chính
export default function FileSharing({ path }) {
  const { data: session } = useSession();
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Lấy thông tin chia sẻ
  useEffect(() => {
    if (session && path) {
      fetchShareInfo();
    }
  }, [session, path]);

  const fetchShareInfo = async () => {
    try {
      const res = await fetch(`/api/shares?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      setShareData(data);
    } catch (err) {
      setError('Error fetching share info');
    }
  };

  // Toggle chia sẻ
  const toggleShare = async () => {
    if (!session) return;

    setLoading(true);
    try {
      const res = await fetch('/api/shares', {
        method: shareData?.isPublic ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });

      const data = await res.json();
      if (data.success) {
        setShareData(data.shareData);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error updating share status');
    } finally {
      setLoading(false);
    }
  };

  // Copy link
  const copyShareLink = () => {
    if (shareData?.shareId) {
      const link = `${window.location.origin}/shared/${shareData.shareId}`;
      navigator.clipboard.writeText(link);
    }
  };

  if (!session) return null;

  return (
    <div className="border p-4 rounded-lg">
      <h3 className="font-bold mb-2">Sharing Controls</h3>
      
      {error && (
        <div className="text-red-500 mb-2">{error}</div>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={toggleShare}
          disabled={loading}
          className={`px-4 py-2 rounded ${
            shareData?.isPublic ? 'bg-red-500' : 'bg-blue-500'
          } text-white`}
        >
          {loading ? 'Processing...' : shareData?.isPublic ? 'Stop Sharing' : 'Share'}
        </button>

        {shareData?.isPublic && (
          <div className="flex-1">
            <input
              type="text"
              value={`${window.location.origin}/shared/${shareData.shareId}`}
              readOnly
              className="border p-2 w-full rounded"
            />
            <div className="text-sm text-gray-500 mt-1">
              Views: {shareData.views || 0}
            </div>
          </div>
        )}

        {shareData?.isPublic && (
          <button
            onClick={copyShareLink}
            className="text-blue-500"
          >
            Copy Link
          </button>
        )}
      </div>
    </div>
  );
}

// API Handler - pages/api/shares.js
export async function apiHandler(req, res) {
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { method } = req;
  const username = session.user.username;

  // Rate Limiting Check
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const rateLimitKey = `rateLimit:${clientIp}`;
  
  // Implement rate limiting using Redis or similar
  const requestCount = await incrementRateLimit(rateLimitKey);
  if (requestCount > RATE_LIMIT.max) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    switch (method) {
      case 'GET':
        // Get share info
        const share = await prisma.share.findUnique({
          where: {
            username_path: {
              username,
              path: req.query.path
            }
          }
        });
        return res.json(share);

      case 'POST':
        // Create share
        const newShare = await prisma.share.create({
          data: {
            username,
            path: req.body.path,
            shareId: generateShareId(),
            isPublic: true
          }
        });
        return res.json({ success: true, shareData: newShare });

      case 'DELETE':
        // Delete share
        await prisma.share.delete({
          where: {
            username_path: {
              username,
              path: req.body.path
            }
          }
        });
        return res.json({ success: true });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Share API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper Functions
function generateShareId() {
  return Math.random().toString(36).substr(2, 9);
}

async function incrementRateLimit(key) {
  // Implement using Redis or similar
  // Return current request count
  return 1;
} 