// components/UploadDialog.js
import React, { useState, useCallback } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, IconButton, Box, Typography,
  LinearProgress, Fade, Slide, Snackbar, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';

// Constants
const STYLES = {
  title: {
    fontSize: '20px',
    fontWeight: 500,
    color: '#1a1a1a'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 500,
    color: '#333',
    marginTop: '16px'
  },
  input: {
    '& .MuiInputBase-input': {
      padding: '8px 12px',
      fontSize: '14px'
    }
  },
  button: {
    height: '36px',
    fontSize: '14px',
    padding: '0 16px',
    minWidth: '120px',
    backgroundColor: '#fff',
    color: '#000',
    border: '1px solid #000',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    '&:hover': {
      backgroundColor: '#f5f5f5',
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
    }
  },
  smallButton: {
    height: '20px',
    fontSize: '12px',
    padding: '0 8px',
    minWidth: '80px',
    backgroundColor: '#fff',
    color: '#000',
    border: '1px solid #000',
    borderRadius: '4px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    '&:hover': {
      backgroundColor: '#f5f5f5',
      boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
    }
  },
  fileCounter: {
    fontSize: '14px',
    color: '#666',
    marginTop: '8px',
    marginBottom: '12px'
  },
  warning: {
    color: '#d32f2f',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '16px',
    animation: 'bounce 0.5s ease-in-out',
    '@keyframes bounce': {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-5px)' }
    }
  },
  progress: {
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#4caf50'
    },
    height: 8,
    borderRadius: 4
  }
};

const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.raw'];
const MAX_RETRIES = 2;

export default function UploadDialog({ open, onClose, albumId }) {
  // States
  const [links, setLinks] = useState(['']);
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmStop, setShowConfirmStop] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info',
    canUndo: false
  });
  const [newAlbumName, setNewAlbumName] = useState('');

  /**
   * Convert cloud storage link to direct download link
   */
  const convertCloudLink = async (link) => {
    try {
      if (link.includes('drive.google.com')) {
        // Convert Google Drive link
        const fileId = link.match(/[-\w]{25,}/);
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
      
      if (link.includes('dropbox.com')) {
        // Convert Dropbox link
        return link.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
      }

      return link;
    } catch (error) {
      throw new Error('Link không hợp lệ');
    }
  };

  /**
   * Validate file type and cloud links
   */
  const validateUpload = async (files, links) => {
    // Validate files
    const invalidFiles = files.filter(file => {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      return !SUPPORTED_FORMATS.includes(ext);
    });

    if (invalidFiles.length > 0) {
      throw new Error('Một số file không đúng định dạng');
    }

    // Validate links
    for (const link of links) {
      if (link) {
        try {
          new URL(link);
        } catch {
          throw new Error('Link không hợp lệ');
        }
      }
    }
  };

  /**
   * Upload files with retry mechanism
   */
  const uploadWithRetry = async (file, retryCount = 0) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('albumId', albumId);
      
      // Lấy user từ localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const response = await fetch(getApiUrl(`/api/albums/upload?username=${user.username}`), {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      return await response.json();
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        return uploadWithRetry(file, retryCount + 1);
      }
      throw error;
    }
  };

  /**
   * Main upload handler
   */
  const handleUpload = async () => {
    if (!albumId && !newAlbumName) {
      setError('Vui lòng vào album cụ thể hoặc nhập tên album mới để upload');
      return;
    }

    try {
      setUploading(true);
      setError('');
      
      // Validate
      await validateUpload(files, links);

      // Create new album if name is provided
      let targetAlbumId = albumId;
      if (newAlbumName) {
        const response = await fetch(getApiUrl(`/api/upload_album?username=${user.username}`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: newAlbumName })
        });

        if (!response.ok) throw new Error('Không thể tạo album mới');
        const data = await response.json();
        targetAlbumId = data.id;
      }

      // Convert cloud links
      const directLinks = await Promise.all(
        links.filter(Boolean).map(convertCloudLink)
      );

      // Prepare uploads
      const fileUploads = files.map(file => uploadWithRetry(file));
      const linkUploads = directLinks.map(link => 
        fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ link, albumId })
        })
      );

      // Upload all
      const total = fileUploads.length + linkUploads.length;
      let completed = 0;

      // Progress updater
      const updateProgress = () => {
        if (uploading) {
          setProgress((completed / total) * 100);
        }
      };

      // Start progress updates
      const progressInterval = setInterval(updateProgress, 100);

      // Upload with Promise.all
      await Promise.all([...fileUploads, ...linkUploads]);

      clearInterval(progressInterval);
      setProgress(100);
      
      // Show success notification
      setNotification({
        open: true,
        message: 'Upload thành công',
        severity: 'success',
        canUndo: false
      });

      // Close dialog after success
      onClose();

    } catch (error) {
      setError(error.message || 'Upload thất bại');
    } finally {
      setUploading(false);
    }
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = (event) => {
    const newFiles = Array.from(event.target.files);
    setFiles([...files, ...newFiles]);
    setError('');
  };

  /**
   * Handle link changes
   */
  const handleLinkChange = (index, value) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
    setError('');
  };

  /**
   * Handle add/remove links
   */
  const handleAddLink = () => setLinks([...links, '']);
  const handleRemoveLink = (index) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!uploading) {
      setFiles([]);
      setLinks(['']);
      setProgress(0);
      setError('');
    }
    onClose();
  };

  /**
   * Handle stop upload
   */
  const handleStop = () => {
    setShowConfirmStop(true);
  };

  /**
   * Handle confirm stop
   */
  const handleConfirmStop = () => {
    setUploading(false);
    setShowConfirmStop(false);
    setNotification({
      open: true,
      message: 'Đã dừng upload',
      severity: 'info',
      canUndo: true
    });
  };

  /**
   * Handle undo stop
   */
  const handleUndo = () => {
    setUploading(true);
    setNotification({ ...notification, open: false });
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={STYLES.title}>
          Tải lên
        </DialogTitle>

        <DialogContent>
          {/* Links Section */}
          <Typography sx={STYLES.sectionTitle}>
            Tải lên bằng liên kết (Tùy chọn)
          </Typography>
          
          {links.map((link, index) => (
            <Fade in={true} key={index}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  sx={STYLES.input}
                  value={link}
                  onChange={(e) => handleLinkChange(index, e.target.value)}
                  placeholder="Nhập liên kết hình ảnh tại đây..."
                  error={Boolean(error && link)}
                  helperText={link && error}
                />
                <IconButton 
                  onClick={() => index === links.length - 1 ? 
                    handleAddLink() : handleRemoveLink(index)}
                >
                  {index === links.length - 1 ? <AddIcon /> : <CloseIcon />}
                </IconButton>
              </Box>
            </Fade>
          ))}
          
        {/* New Album Input - Adjusted to match link input style */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <TextField
            fullWidth
            sx={STYLES.input}
            value={newAlbumName}
            onChange={(e) => setNewAlbumName(e.target.value)}
            placeholder="Nhập tên album"
          />
        </Box>

          {/* Files Section */}
          <Typography sx={STYLES.sectionTitle}>
            Tải lên tệp
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              component="label"
              sx={STYLES.smallButton}
            >
              Chọn tệp
              <input 
                type="file" 
                hidden 
                multiple 
                accept="image/*" 
                onChange={handleFileSelect} 
              />
            </Button>

            <Button
              variant="outlined"
              component="label"
              sx={STYLES.smallButton}
            >
              Chọn thư mục
              <input 
                type="file" 
                hidden 
                multiple 
                directory="" 
                webkitdirectory="" 
                onChange={handleFileSelect} 
              />
            </Button>
          </Box>

          {files.length > 0 && (
            <Typography sx={STYLES.fileCounter}>
              Đã chọn: {files.length} ảnh
            </Typography>
          )}

          {/* Error Message */}
          {error && (
            <Box sx={STYLES.warning}>
              <WarningIcon />
              <Typography>{error}</Typography>
            </Box>
          )}

          {/* Progress Bar */}
          {uploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={STYLES.progress}
              />
              <Typography sx={{ mt: 1, textAlign: 'center' }}>
                {Math.round(progress)}%
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={uploading ? handleStop : handleClose}
            sx={STYLES.button}
          >
            {uploading ? 'Stop' : 'Cancel'}
          </Button>
          <Button
            onClick={handleUpload}
            disabled={(!files.length && !links.some(Boolean)) || uploading}
            sx={STYLES.button}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Stop Dialog */}
      <Dialog open={showConfirmStop} onClose={() => setShowConfirmStop(false)}>
        <DialogTitle>Xác nhận dừng</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc muốn dừng quá trình upload?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmStop(false)}>
            Không
          </Button>
          <Button onClick={handleConfirmStop} color="error">
            Dừng l���i
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={2000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Slide}
        TransitionProps={{ direction: "down" }}
        onClose={() => setNotification({...notification, open: false})}
        action={
          <>
            {notification.canUndo && (
              <Button 
                color="secondary" 
                size="small"
                onClick={handleUndo}
              >
                UNDO
              </Button>
            )}
            <IconButton
              size="small"
              color="inherit"
              onClick={() => setNotification({...notification, open: false})}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </>
        }
      >
        <Alert severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}