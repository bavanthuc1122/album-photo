import React, { useState, useEffect } from 'react';
import { Grid, Box, Typography, CircularProgress, Button } from '@mui/material';
import { styled } from '@mui/system';
import { getApiUrl, getImageUrl } from '../lib/config';
import CONFIG from '../lib/config';
import DeleteIcon from '@mui/icons-material/Delete';
import { Snackbar, Alert } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

const { DEFAULT_COVER } = CONFIG.STORAGE;

const AlbumCard = styled(Box)({
  backgroundColor: 'white',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
  height: '100%',
  position: 'relative',
  '&:hover': {
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
  }
});

const ImageWrapper = styled(Box)({
  width: '100%',
  height: '200px',
  overflow: 'hidden',
  position: 'relative',
  borderRadius: '8px 8px 0 0'
});

const StyledImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  transition: 'transform 0.3s ease'
});

const StyledButton = styled(Button)({
  textTransform: 'none',
  borderRadius: '4px',
  fontSize: '0.875rem',
  padding: '4px 12px',
  minWidth: 'auto',
  flex: 1
});

const DeleteAllButton = styled(Button)({
  textTransform: 'none',
  borderRadius: '8px',
  fontSize: '0.875rem',
  padding: '8px 16px',
  backgroundColor: '#ff4444',
  color: 'white',
  '&:hover': {
    backgroundColor: '#cc0000'
  }
});

const TrashCounter = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '4px 12px',
  borderRadius: '16px',
  backgroundColor: '#f5f5f5',
  color: '#666'
});

const AnimatedGrid = motion(Grid);

const MainContentTrash = ({ sidebarOpen }) => {
  const [trashAlbums, setTrashAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' // 'success' | 'error'
  });

  useEffect(() => {
    fetchTrashAlbums();
  }, []);

  const fetchTrashAlbums = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('[DEBUG] User data:', user);
      console.log('[DEBUG] Username:', user.username);

      const apiUrl = getApiUrl(`/api/albums/trash?username=${user.username}`);
      console.log('[DEBUG] API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json'
        }
      });
      console.log('[DEBUG] Response:', response);
      console.log('[DEBUG] Response status:', response.status);
      console.log('[DEBUG] Response headers:', response.headers);

      const text = await response.text();
      console.log('[DEBUG] Raw response text:', text);

      if (!text) {
        console.log('[DEBUG] Empty response');
        setTrashAlbums([]);
        return;
      }

      try {
        const data = JSON.parse(text);
        console.log('[DEBUG] Parsed data:', data);

        if (Array.isArray(data)) {
          setTrashAlbums(data);
          console.log('[DEBUG] Set trash albums:', data.length, 'items');
        } else {
          console.error('[DEBUG] Invalid data format:', data);
          setError('Invalid data format received');
        }
      } catch (parseError) {
        console.error('[DEBUG] JSON parse error:', parseError);
        setError('Invalid JSON response');
      }

    } catch (error) {
      console.error('[DEBUG] Fetch error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (albumId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch(
        getApiUrl(`/api/albums/${albumId}/restore?username=${user.username}`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to restore album');
      fetchTrashAlbums();
    } catch (error) {
      console.error('Restore error:', error);
      alert(error.message);
    }
  };

  const handleDeletePermanently = async (albumId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn album này?')) {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const token = localStorage.getItem('token');
        
        const response = await fetch(
          getApiUrl(`/api/albums/${albumId}/delete?username=${user.username}`),
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to delete album permanently');
        }
        
        console.log('Delete success:', data);
        fetchTrashAlbums();
      } catch (error) {
        console.error('Delete error details:', error);
        alert(error.message || 'Error deleting album');
      }
    }
  };

  const handleDeleteAll = async () => {
    if (trashAlbums.length === 0) {
      alert('Thùng rác trống');
      return;
    }

    if (window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn tất cả album trong thùng rác?')) {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const token = localStorage.getItem('token');
        
        const response = await fetch(
          getApiUrl(`/api/albums/trash/delete-all?username=${user.username}`),
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to delete all albums');
        }
        
        console.log('Delete all success:', data);
        fetchTrashAlbums();
      } catch (error) {
        console.error('Delete all error:', error);
        alert(error.message || 'Error deleting all albums');
      }
    }
  };

  const showNotification = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
      <CircularProgress />
    </Box>
  );
  
  if (error) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
      <Typography color="error">{error}</Typography>
    </Box>
  );

  return (
    <Box
      sx={{ 
        flexGrow: 1,
        p: { 
          xs: 1,
          sm: 3    
        },
        mt: '64px',
        ml: { 
          xs: 0,
          sm: '240px'
        },
        width: {
          xs: '100%',
          sm: 'calc(100% - 240px)'
        },
        transition: 'all 0.3s ease',
        backgroundColor: '#fff'
      }}
    >
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 500, color: '#1a1a1a' }}>
            Thùng rác
          </Typography>
          <TrashCounter>
            <DeleteIcon sx={{ fontSize: 18 }} />
            {trashAlbums.length} album
          </TrashCounter>
        </Box>

        {trashAlbums.length > 0 && (
          <DeleteAllButton
            variant="contained"
            onClick={handleDeleteAll}
            startIcon={<DeleteIcon />}
          >
            Xóa toàn bộ
          </DeleteAllButton>
        )}
      </Box>

      <AnimatePresence>
        <Grid container spacing={{ xs: 1, sm: 2 }}>
          {trashAlbums.map((album) => (
            <AnimatedGrid
              item
              xs={6}
              sm={4}
              md={2.4}
              key={album.id}
              component={motion.div}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <AlbumCard>
                <ImageWrapper>
                  <StyledImage
                    src={album.coverUrl ? getImageUrl(album.coverUrl) : DEFAULT_COVER}
                    alt={album.name}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = DEFAULT_COVER;
                      console.log('Image error for album:', album.name);
                    }}
                    sx={{
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%'
                    }}
                  />
                </ImageWrapper>
                
                <Box sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1
                }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{
                      fontWeight: 500,
                      color: '#1a1a1a',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {album.name}
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    sx={{
                      color: '#666',
                      mb: 1
                    }}
                  >
                    {album.photoCount || 0} ảnh
                  </Typography>

                  <Box sx={{
                    display: 'flex',
                    gap: 1,
                    mt: 'auto'
                  }}>
                    <StyledButton 
                      variant="outlined"
                      size="small"
                      onClick={() => handleRestore(album.id)}
                    >
                      Khôi phục
                    </StyledButton>
                    <StyledButton 
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleDeletePermanently(album.id)}
                    >
                      Xóa vĩnh viễn
                    </StyledButton>
                  </Box>
                </Box>
              </AlbumCard>
            </AnimatedGrid>
          ))}
        </Grid>
      </AnimatePresence>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MainContentTrash;