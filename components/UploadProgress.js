import React from 'react';
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  LinearProgress,
  Button
} from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import { useUpload } from '../contexts/UploadContext';

export const UploadProgress = () => {
  const { uploads, showProgress, setShowProgress } = useUpload();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const activeUploads = Object.values(uploads || {}).filter(u => u.status === 'uploading');
  const totalUploads = activeUploads.length;

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setShowProgress(true);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setShowProgress(false);
  };

  const handleCancel = (albumId) => {
    // Implement cancel logic here
    console.log('Cancelling upload for album:', albumId);
  };

  if (totalUploads === 0) return null;

  return (
    <>
      <IconButton onClick={handleClick}>
        <Badge badgeContent={totalUploads} color="primary">
          <UploadIcon />
        </Badge>
      </IconButton>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, width: 300 }}>
          {Object.entries(uploads || {}).map(([albumId, upload]) => (
            <Box key={albumId} sx={{ mb: 2 }}>
              <Typography variant="subtitle2">
                {upload.albumName}
                <Typography component="span" color="textSecondary">
                  ({upload.completed}/{upload.total} files)
                </Typography>
              </Typography>
              
              <LinearProgress 
                variant="determinate" 
                value={upload.progress} 
                sx={{ my: 1 }}
              />
              
              {upload.status === 'uploading' && (
                <Button 
                  size="small" 
                  color="error"
                  onClick={() => handleCancel(albumId)}
                >
                  Cancel
                </Button>
              )}
            </Box>
          ))}
        </Box>
      </Popover>
    </>
  );
}