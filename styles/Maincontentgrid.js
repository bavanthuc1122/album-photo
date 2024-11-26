import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Grid, IconButton, Menu, MenuItem, Box, Typography, CircularProgress, Button, FormControlLabel, Switch, TextField } from "@mui/material";
import { styled } from '@mui/system';
import { BsThreeDotsVertical } from "react-icons/bs";
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import CONFIG, { getApiUrl, getImageUrl, getAlbumCoverUrl } from '../lib/config';
import { ContentCopy as ContentCopyIcon } from '@mui/icons-material';
import { useRouter } from 'next/router';
import DiamondIcon from '@mui/icons-material/Diamond';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import StarsIcon from '@mui/icons-material/Stars';
import { generateRandomString, generateAlbumUrl } from '../lib/utils';
import { UploadProgress } from '../components/UploadProgress';


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
  cursor: 'pointer'
});

const StyledImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover'
});

const StyledDialog = styled(Dialog)({
  '& .MuiPaper-root': {
    borderRadius: '12px',
    padding: '8px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
  }
});

const StyledDialogTitle = styled(DialogTitle)({
  textAlign: 'center',
  fontSize: '1.5rem',
  fontWeight: 600,
  color: '#333',
  padding: '16px 24px'
});

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    '&:hover fieldset': {
      borderColor: '#000',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#000',
    }
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#000'
  }
});

const StyledButton = styled(Button)({
  textTransform: 'none',
  padding: '8px 24px',
  borderRadius: '8px',
  fontSize: '1rem',
  fontWeight: 500,
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  '&:hover': {
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
  }
});

const getLevelInfo = (level) => {
  switch(level) {
    case 3:
      return {
        label: 'VIP',
        icon: <DiamondIcon sx={{ color: '#FFD700' }} />,
        color: '#FFD700'
      };
    case 2:
      return {
        label: 'Premium',
        icon: <AutoAwesomeIcon sx={{ color: '#C0C0C0' }} />,
        color: '#C0C0C0'
      };
    default:
      return {
        label: 'Basic',
        icon: <StarsIcon sx={{ color: '#CD7F32' }} />,
        color: '#CD7F32'
      };
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

const PhotoGrid = ({ searchQuery, sidebarOpen }) => {
  const router = useRouter();
  const [albums, setAlbums] = useState([]);
  const [filteredAlbums, setFilteredAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [openRenameDialog, setOpenRenameDialog] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [user, setUser] = useState(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [albumRandomStrings, setAlbumRandomStrings] = useState({});
  const [sharePassword, setSharePassword] = useState('');
  const [isPublicShare, setIsPublicShare] = useState(true);

  useEffect(() => {
    const path = router.asPath;
    if (path && path.includes('-')) {
      const randomString = path.split('-').pop();
      setCurrentRandomString(randomString);
    }
  }, [router.asPath]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredAlbums(albums);
    } else {
      const filtered = albums.filter(album => 
        album.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAlbums(filtered);
    }
  }, [searchQuery, albums]);

  useEffect(() => {
    const handleAlbumsUpdate = () => {
      fetchAlbums(); // Gọi lại API để lấy danh sách albums mới
    };

    window.addEventListener('albumsUpdated', handleAlbumsUpdate);
    return () => {
      window.removeEventListener('albumsUpdated', handleAlbumsUpdate);
    };
  }, []);

  useEffect(() => {
    console.log('Albums data:', albums);
  }, [albums]);

  const fetchAlbums = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      console.log('Fetching albums for:', user.username);
      const response = await fetch(
        `${CONFIG.API_URL}/api/albums?username=${user.username}`
      );
      const data = await response.json();
      console.log('Albums response:', data);
      
      if (response.ok) {
        setAlbums(data);
        console.log('Albums state:', data);
        
        if (data.length > 0) {
          console.log('First album cover URL:', data[0].coverUrl);
        }
      }
    } catch (error) {
      console.error('Error fetching albums:', error);
    }
  };

  useEffect(() => {
    if (user?.username) {
      fetchAlbums();
    }
  }, [user]);

  const handleMenuClick = (event, album) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedAlbum(album);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAlbum(null);
  };

  const handleDownload = async () => {
    if (!selectedAlbum) return;
    
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const response = await fetch(
        getApiUrl(`${CONFIG.API.ENDPOINTS.ALBUMS}/${selectedAlbum.id}/download?username=${user.username}`),
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedAlbum.name}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      handleMenuClose();
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading album. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!selectedAlbum) return;
    
    if (window.confirm(`Bạn có chắc chắn muốn xóa thư mục "${selectedAlbum.name}"?`)) {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const token = localStorage.getItem('token');
        
        const response = await fetch(
          getApiUrl(`/api/albums/${selectedAlbum.id}/trash?username=${user.username}`), 
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to move to trash');
        }
        
        await fetchAlbums();
        handleMenuClose();
      } catch (error) {
        console.error('Delete error details:', error);
        alert(error.message || 'Error moving album to trash. Please try again.');
      }
    }
    handleMenuClose(); 
  };

  const formatSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/đ/g, 'd')
      .replace(/[áàảãạâấầẫậăắằẳẵặ]/g, 'a')
      .replace(/[éèẻẽẹêếềểệ]/g, 'e')
      .replace(/[íỉĩị]/g, 'i')
      .replace(/[óòỏõọôốồổỗộơớờởỡợ]/g, 'o')
      .replace(/[úùủũụưứừửự]/g, 'u')
      .replace(/[ýỳỷỹỵ]/g, 'y')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const getAlbumRandomString = useCallback((albumName) => {
    if (albumRandomStrings[albumName]) {
      return albumRandomStrings[albumName];
    }

    const now = new Date();
    const yearMonth = now.getFullYear().toString().slice(-2) + 
                     (now.getMonth() + 1).toString().padStart(2, '0');
    const newRandomString = `${yearMonth}_${generateRandomString(3)}_${generateRandomString(3, true)}`;
    
    setAlbumRandomStrings(prev => ({
      ...prev,
      [albumName]: newRandomString
    }));

    return newRandomString;
  }, [albumRandomStrings]);

  const handleAlbumClick = useCallback((album) => {
    try {
      const randomString = getAlbumRandomString(album.name);

      console.log('Album navigation:', {
        albumName: album.name,
        randomString,
        existingStrings: albumRandomStrings
      });

      const newUrl = `/albums/${encodeURIComponent(album.name)}-${randomString}`;
      router.push(newUrl);

    } catch (error) {
      console.error('Error in handleAlbumClick:', error);
    }
  }, [getAlbumRandomString, router]);

  const handleRenameClick = () => {
    setNewAlbumName(selectedAlbum?.name || '');
    setOpenRenameDialog(true);
  };

  const handleRenameClose = () => {
    setOpenRenameDialog(false);
    setNewAlbumName('');
    handleMenuClose();
  };

  const handleRenameSubmit = async () => {
    if (!selectedAlbum || !newAlbumName.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const originalId = selectedAlbum.originalId || selectedAlbum.id;
      
      console.log('Renaming album:', {
        albumId: originalId,
        newName: newAlbumName,
        username: user.username
      });

      const response = await fetch(
        getApiUrl(`${CONFIG.API.ENDPOINTS.ALBUMS}/${originalId}?username=${user.username}`), 
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            name: newAlbumName.trim(),
            username: user.username,
            originalId: originalId
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Rename failed');
      }

      await fetchAlbums();
      handleRenameClose();
    } catch (error) {
      console.error('Rename error details:', error);
      alert(error.message || 'Error renaming album. Please try again.');
    }
  };

  const handleShare = async (album) => {
    if (!album) return;
    
    try {
      const response = await fetch('/api/shares', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          albumId: album.id,
          username: JSON.parse(localStorage.getItem('user')).username,
          isPublic: isPublicShare,
          password: !isPublicShare ? sharePassword : null
        })
      });

      const data = await response.json();
      if (data.success) {
        setShareUrl(`${window.location.origin}${data.shareUrl}`);
        setShareDialogOpen(true);
      }
    } catch (error) {
      console.error('Share error:', error);
      alert('Error creating share link');
    }
    handleMenuClose();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('Đã sao chép link!');
  };

  const handleProfileMenu = (event) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const updateAlbumCover = (albumId, newCoverUrl) => {
    setAlbums(prevAlbums => 
      prevAlbums.map(album => 
        album.id === albumId 
          ? { ...album, coverUrl: newCoverUrl }
          : album
      )
    );
  };

  useEffect(() => {
    const handleUploadSuccess = (event) => {
      const { albumId, coverUrl } = event.detail;
      if (albumId && coverUrl) {
        updateAlbumCover(albumId, coverUrl);
      }
    };

    window.addEventListener('uploadSuccess', handleUploadSuccess);
    return () => window.removeEventListener('uploadSuccess', handleUploadSuccess);
  }, []);

  useEffect(() => {
    const loadAlbumRandomStrings = async () => {
      try {
        const savedStrings = localStorage.getItem('albumRandomStrings');
        if (savedStrings) {
          setAlbumRandomStrings(JSON.parse(savedStrings));
        }
      } catch (error) {
        console.error('Error loading album random strings:', error);
      }
    };

    loadAlbumRandomStrings();
  }, []);

  useEffect(() => {
    if (Object.keys(albumRandomStrings).length > 0) {
      localStorage.setItem('albumRandomStrings', JSON.stringify(albumRandomStrings));
    }
  }, [albumRandomStrings]);

  const getCoverUrl = (album) => {
    return `${CONFIG.API_URL}${album.coverUrl}`;
  };

  const getImageUrl = (coverUrl) => {
    if (!coverUrl) return DEFAULT_COVER;
    return `${CONFIG.API_URL}${coverUrl}`;
  };

  useEffect(() => {
    console.log("Albums state after update:", albums);
  }, [albums]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Error: {error}</Typography>
        <Button variant="contained" onClick={fetchAlbums} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  console.log('Album data:', albums[0]);

  return (
    <Box sx={{ 
      flexGrow: 1, 
      p: { 
        xs: 1,  // Giảm padding ở mobile xuống 8px
        sm: 3    // Giữ nguyên padding ở desktop
      },
      marginTop: '54px',
      marginLeft: { 
        xs: 0,
        sm: sidebarOpen ? '240px' : 0 
      },
      width: {
        xs: '100%',
        sm: sidebarOpen ? 'calc(100% - 240px)' : '100%'
      }
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end',
        position: 'sticky',
        top: '64px', // Adjust based on your header height
        zIndex: 1000,
        padding: '8px'
      }}>
        <UploadProgress />
      </Box>

      <Grid 
        container 
        spacing={{ 
          xs: 1,  // Giảm spacing giữa các items ở mobile xuống 8px
          sm: 2    // Giữ nguyên spacing ở desktop
        }}
      >
        {console.log('Rendering albums:', filteredAlbums)}
        {filteredAlbums.map((album) => (
          <Grid 
            item 
            xs={6}     // Mobile: 2 columns
            sm={4}     // Tablet: 3 columns
            md={2.4}   // Desktop: 5 columns
            key={album.id}
          >
            {console.log("Single album data:", album)}
            <AlbumCard>
              <ImageWrapper onClick={() => handleAlbumClick(album)}>
                <StyledImage
                  src={getImageUrl(album.coverUrl)}
                  alt={album.name}
                  onError={(e) => {
                    console.log('Image load error for:', album.name);
                    e.target.src = DEFAULT_COVER;
                  }}
                />
              </ImageWrapper>

              <Box sx={{ p: 2 }}>
                <Typography 
                  variant="h6" 
                  noWrap 
                  sx={{ textAlign: 'center' }}
                >
                  {album.name}
                </Typography>
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: 'column',  // Hiển thị theo chiều dọc
                  alignItems: 'flex-end',   // Căn phải
                  gap: 0.5,                 // Khoảng cách giữa photos và date                 // Khoảng cách giữa photos và date
                  color: 'text.secondary', 
                  mt: 1                     // Giữ nguyên khoảng cách với tên album
                }}>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#666' }}>
                    {album.photoCount} ảnh
                  </Typography>
                  {album.createdAt && (
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.8rem', color: '#666' }}
                    >
                      Ngày tạo: {formatDate(album.createdAt)}
                    </Typography>
                  )}
                </Box>
              </Box>

              <IconButton
                onClick={(e) => handleMenuClick(e, album)}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.9)'
                  }
                }}
              >
                <BsThreeDotsVertical />
              </IconButton>
            </AlbumCard>
          </Grid>
        ))}
      </Grid>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleRenameClick}>Rename</MenuItem>
        <MenuItem onClick={handleDownload}>Download</MenuItem>
        <MenuItem onClick={() => handleShare(selectedAlbum)}>Share</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>

      <StyledDialog 
        open={openRenameDialog} 
        onClose={handleRenameClose}
        maxWidth="xs"
        fullWidth
      >
        <StyledDialogTitle>
          Đổi tên album
        </StyledDialogTitle>
        <DialogContent sx={{ px: 3, pb: 3 }}>
          <StyledTextField
            autoFocus
            margin="dense"
            label="Nhập tên cần đổi"
            type="text"
            fullWidth
            value={newAlbumName}
            onChange={(e) => setNewAlbumName(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <StyledButton 
            onClick={handleRenameClose}
            sx={{ 
              backgroundColor: '#fff',
              color: '#000',
              '&:hover': {
                backgroundColor: '#f5f5f5'
              }
            }}
          >
            Hủy
          </StyledButton>
          <StyledButton 
            onClick={handleRenameSubmit}
            sx={{ 
              backgroundColor: '#fff',
              color: '#000',
              '&:hover': {
                backgroundColor: '#f5f5f5'
              }
            }}
          >
            Lưu
          </StyledButton>
        </DialogActions>
      </StyledDialog>

      <StyledDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <StyledDialogTitle>
          Chia sẻ album
        </StyledDialogTitle>
        <DialogContent sx={{ px: 3, pb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isPublicShare}
                onChange={(e) => setIsPublicShare(e.target.checked)}
              />
            }
            label="Chia sẻ công khai"
            sx={{ mb: 2 }}
          />

          {!isPublicShare && (
            <TextField
              fullWidth
              type="password"
              label="Mật khẩu truy cập"
              value={sharePassword}
              onChange={(e) => setSharePassword(e.target.value)}
              sx={{ mb: 2 }}
            />
          )}

          <TextField
            fullWidth
            value={shareUrl}
            variant="outlined"
            InputProps={{
              readOnly: true,
              endAdornment: (
                <IconButton onClick={handleCopyLink}>
                  <ContentCopyIcon />
                </IconButton>
              ),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <StyledButton
            onClick={() => setShareDialogOpen(false)}
            sx={{ 
              backgroundColor: '#fff',
              color: '#000',
              '&:hover': {
                backgroundColor: '#f5f5f5'
              }
            }}
          >
            Đóng
          </StyledButton>
        </DialogActions>
      </StyledDialog>

      <Menu
        anchorEl={profileAnchorEl}
        open={Boolean(profileAnchorEl)}
        onClose={handleProfileClose}
      >
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>
    </Box>
  );
};

export default PhotoGrid;