import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Container, Grid, Typography, IconButton, Menu, MenuItem,
  CardMedia, CardContent, DialogContent, DialogActions, Alert, Snackbar, Tooltip,
  CircularProgress
} from "@mui/material";
import { FiHeart, FiDownload, FiMoreVertical, FiSend, FiX, FiShare2, FiCopy, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useRouter } from 'next/router';
import CONFIG, { getAlbumCoverUrl, getPhotoUrl } from '../lib/config';
import JSZip from 'jszip';
import VirtualizedGallery from '../components/VirtualizedGallery';
import MemoizedImageListItem from '../components/MemoizedImageListItem';
import { getImageUrl } from '../lib/config';
import styled from 'styled-components';

// Import các styled components đã tách
import {
  StyledCard,
  StyledDialog,
  StyledTextField,
  StyledButton,
  LightboxDialog,
  CloseButton,
  StyledDialogTitle,
  ImageWrapper,
  ActionButtons,
  LightboxContainer
} from '../styles/albumclient.styles';

const NavigationButton = styled(IconButton)({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  color: '#fff',
  padding: '12px',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  zIndex: 3
});

const NavigationArea = styled('div')({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  height: '100px',
  width: '60px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0,
  transition: 'opacity 0.2s',
  '&:hover': {
    opacity: 1
  },
  zIndex: 2
});

const ImageCounter = styled(Typography)({
  position: 'absolute',
  bottom: 20,
  left: '50%',
  transform: 'translateX(-50%)',
  color: '#fff',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  padding: '4px 12px',
  borderRadius: 20,
  fontSize: '14px'
});

// Thêm hàm generateVisitorId để tránh xung đột với các hàm khác
const generateVisitorId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Đổi tên function để tránh conflict
const processImageUrl = (photo, username, albumName) => {
  if (!photo?.path) {
    console.log('Missing photo path');
    return CONFIG.STORAGE.DEFAULT_COVER;
  }

  if (!username || !albumName) {
    console.log('Missing username or album name:', { username, albumName });
    return CONFIG.STORAGE.DEFAULT_COVER;
  }

  try {
    const url = `${CONFIG.API_URL}/dataclient/user_${username}/data/${albumName}/${photo.path}`;
    console.log('Photo URL:', url);
    return url;
  } catch (error) {
    console.error('Error generating URL:', error);
    return CONFIG.STORAGE.DEFAULT_COVER;
  }
};

const AlbumClient = () => {
  const router = useRouter();
  const { slug } = router.query;

  // Thêm user state
  const [user, setUser] = useState(null);
  
  // State Management
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [openLightbox, setOpenLightbox] = useState(false);
  const [scale, setScale] = useState(1);
  const [anchorEl, setAnchorEl] = useState(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("");
  const [liked, setLiked] = useState([]);
  const [showLiked, setShowLiked] = useState(false);
  const [folders, setFolders] = useState([]);
  // const [currentPath, setCurrentPath] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [metadata, setMetadata] = useState(null);
  const [albumId, setAlbumId] = useState('');
  const [urlSlug, setUrlSlug] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(null);
  const [interactions, setInteractions] = useState({});
  const [visitorId, setVisitorId] = useState(null);
<<<<<<< HEAD
  const [user, setUser] = useState(null);
=======
  const [initialized, setInitialized] = useState(false);
>>>>>>> d9dc322e7dd5c6f75b65786234d2ae7f64044279

  // Derived State
  const [currentAlbumName, randomString] = useMemo(() => {
    if (!slug) return ['', ''];
    const parts = slug.split('-');
    const random = parts.pop();
    const name = parts.join('-');
    return [decodeURIComponent(name), random];
  }, [slug]);

  // currentPath sẽ là: data/albumName
  const currentPath = useMemo(() => {
    return currentAlbumName ? `data/${currentAlbumName}` : '';
  }, [currentAlbumName]);

  // API Calls
  const fetchPhotos = useCallback(async (path = '') => {
    if (!initialized || !user?.username || !currentAlbumName) {
      console.log('Skipping fetch, missing data:', { initialized, user, currentAlbumName });
      return;
    }

    try {
      setLoading(true);
      console.log('=== Starting photo fetch ===');

      // Tạo đường dẫn đúng
      const fullPath = path || `data/${currentAlbumName}`;
      
      console.log('Fetching photos:', {
        url: `${CONFIG.API_URL}/api/albums/${currentAlbumName}/photos`,
        username: user.username,
        path: fullPath
      });

      const response = await fetch(
        `${CONFIG.API_URL}/api/albums/${currentAlbumName}/photos?username=${user.username}&path=${fullPath}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch photos: ${response.status}`);
      }

      const data = await response.json();
      console.log('✓ Fetched data:', data);
      
      setPhotos(data.photos || []);
      setFolders(data.folders || []);
      setMetadata(data.metadata || null);
      console.log('=== Photo fetch complete ===');

    } catch (error) {
      console.error('❌ Error fetching photos:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [initialized, user, currentAlbumName]);

  // Event Handlers
  const handleImageClick = useCallback((photo) => {
    const index = photos.findIndex(p => p.id === photo.id);
    setCurrentImageIndex(index);
    setSelectedImage(photo);
    setOpenLightbox(true);
    setPosition({ x: 0, y: 0 });
    setScale(1);
  }, [photos]);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  
  const handleLike = async (photoId) => {
    try {
      if (!visitorId || !currentAlbumName) {
        console.error('Missing visitorId or albumName');
        return;
      }

      const newValue = !interactions[photoId]?.heart;
      
      // Update interactions state
      const newInteractions = {
        ...interactions,
        [photoId]: {
          ...interactions[photoId],
          heart: newValue
        }
      };
      
      setInteractions(newInteractions);
      syncLikedFromInteractions(newInteractions);
      
      localStorage.setItem(
        `interactions_${currentAlbumName}`,
        JSON.stringify(newInteractions)
      );

      // Save to server
      const response = await fetch('/api/albums/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId,
          albumId: currentAlbumName,
          visitorId,
          interactionType: 'heart',
          value: newValue
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save interaction');
      }

    } catch (error) {
      console.error('Error liking photo:', error);
    }
  };

  const handleDownloadAlbum = async () => {
    try {
      // Kiểm tra user login
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        throw new Error('Vui lòng đăng nhập');
      }

      // Kiểm tra metadata tồn tại
      if (!metadata) {
        // Thử fetch lại metadata nếu chưa có
        const response = await fetch(
          `${CONFIG.API_URL}/api/albums/${randomString}/metadata?username=${user.username}`
        );
        const data = await response.json();
        if (!data || !data.folder_id || !data.sub_folder) {
          throw new Error('Không tìm thấy thông tin album');
        }
        setMetadata(data);
      }

      const zip = new JSZip();
      setStatus("Đang chuẩn bị tải xuống...");

      // S dụng title từ metadata hoặc fallback
      const albumTitle = metadata?.title || "album";
      const folder = zip.folder(albumTitle);

      // Kiểm tra danh sách ảnh
      if (!metadata?.images || metadata.images.length === 0) {
        throw new Error('Album không có ảnh');
      }

      // Download từng ảnh và thêm vào ZIP
      for (const image of metadata.images) {
        const downloadUrl = `${CONFIG.DOWNLOAD_API_URL}/api/download`;
        const downloadResponse = await fetch(downloadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: user.username,
            albumPath: `${metadata.folder_id}/${metadata.sub_folder}`,
            photoName: image.name
          })
        });

        if (!downloadResponse.ok) {
          throw new Error(`Lỗi tải ảnh ${image.name}`);
        }

        const blob = await downloadResponse.blob();
        folder.file(image.name, blob);
      }

      // Generate và download ZIP
      setStatus("Đang nén file...");
      const content = await zip.generateAsync({type: "blob"});
      const url = window.URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${albumTitle}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatus("Tải xuống album thành công");
    } catch (error) {
      console.error('Download error:', error);
      setStatus("Lỗi khi tải xuống: " + error.message);
    }
  };

  const downloadLikedPhotos = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const zip = new JSZip();
      
      setStatus("Đang chuẩn bị tải xuống ảnh đã thích...");

      // Lọc ảnh đã like
      const likedImages = metadata.images.filter(img => liked.includes(img.id));
      
      if (likedImages.length === 0) {
        setStatus("Không có ảnh nào được thích");
        return;
      }

      // Tạo folder trong ZIP
      const folder = zip.folder("liked_photos");

      // Download từng nh đã like và thêm vào ZIP
      for (const image of likedImages) {
        const downloadUrl = `${CONFIG.DOWNLOAD_API_URL}/api/download`;
        const downloadResponse = await fetch(downloadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: user.username,
            albumPath: `${metadata.folder_id}/${metadata.sub_folder}`,
            photoName: image.name
          })
        });

        if (!downloadResponse.ok) {
          throw new Error(`Failed to download ${image.name}`);
        }

        const blob = await downloadResponse.blob();
        folder.file(image.name, blob);
      }

      // Generate và download ZIP
      setStatus("Đang nén file...");
      const content = await zip.generateAsync({type: "blob"});
      const url = window.URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = "liked_photos.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatus("Tải xuống ảnh đã thích thành công");
    } catch (error) {
      console.error('Download error:', error);
      setStatus("Lỗi khi tải xuống: " + error.message);
    }
  };

  const handleDownload = async (photoName) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Lấy folder_id và sub_folder từ database
      const response = await fetch(`${CONFIG.API_URL}/api/albums/${metadata.id}/metadata?username=${user.username}`);
      const albumData = await response.json();

      // Download từ thư mục goc
      const downloadUrl = `${CONFIG.DOWNLOAD_API_URL}/api/download`;
      const downloadResponse = await fetch(downloadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: user.username,
          albumPath: `${albumData.folder_id}/${albumData.sub_folder}`,
          photoName: photoName
        })
      });

      // Xử lý download file
      const blob = await downloadResponse.blob();
      // ... code lưu file ...

    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleCommentSubmit = () => {
    setCommentDialogOpen(false);
    setStatus(`Photo sent with comment: ${comment}`);
    setComment("");
  };

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Limit drag within viewport
      const maxX = (scale - 1) * window.innerWidth / 2;
      const maxY = (scale - 1) * window.innerHeight / 2;
      
      setPosition({
        x: Math.max(-maxX, Math.min(maxX, newX)),
        y: Math.max(-maxY, Math.min(maxY, newY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.01;
    setScale(prevScale => {
      const newScale = Math.max(1, Math.min(prevScale + delta, 4));
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  }, []);

  const handleCloseLightbox = () => {
    setOpenLightbox(false);
    setCurrentImageIndex(null);
    setSelectedImage(null);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleFolderClick = useCallback((folder) => {
    setCurrentPath(prevPath => {
      const newPath = prevPath ? `${prevPath}/${folder.name}` : folder.name;
      router.push(`/albums/${encodeURIComponent(newPath)}-${randomString}`, undefined, { shallow: true });
      fetchPhotos(newPath);
      return newPath;
    });
  }, [randomString]);

  // Thêm hàm xử lý lỗi ảnh
  const handleImageError = useCallback((event) => {
    console.error('Image failed to load:', event.target.src);
    event.target.src = CONFIG.STORAGE.DEFAULT_COVER; // Fallback image
  }, []);

  // Hàm tạo mã số cho ảnh yêu thích
  const handleGenerateCode = () => {
    try {
      // Lấy danh sách ảnh đã thích
      const likedImages = metadata?.images.filter(img => liked.includes(img.id)) || [];
      
      if (likedImages.length === 0) {
        setStatus("Chưa có ảnh yêu thích nào được chọn");
        return;
      }

      // Format ngày tháng
      const today = new Date();
      const dateStr = today.toLocaleDateString('vi-VN');

      // Tạo text output
      const codeText = `📸 Album: ${decodeURIComponent(currentAlbumName)}
❤️ Ảnh yêu thích: ${likedImages.length} ảnh
🔢 Mã số: ${likedImages.map(img => img.id).join(', ')}
📅 Ngày tạo: ${dateStr}`;

      setGeneratedCode(codeText);
      setShowCodeDialog(true);
    } catch (error) {
      console.error('Error generating code:', error);
      setStatus("Lỗi khi tạo mã số");
    }
  };

  // Hàm copy text
  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode)
      .then(() => {
        setStatus("Đã copy mã số");
      })
      .catch(() => {
        setStatus("Lỗi khi copy mã số");
      });
  };

  // Hàm chia sẻ
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Album ${currentAlbumName}`,
          text: generatedCode
        });
      } else {
        handleCopyCode();
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Thêm hàm navigate
  const handleNavigate = useCallback((direction) => {
    if (currentImageIndex === null) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : photos.length - 1;
    } else {
      newIndex = currentImageIndex < photos.length - 1 ? currentImageIndex + 1 : 0;
    }
    
    setCurrentImageIndex(newIndex);
    setSelectedImage(photos[newIndex]);
    setPosition({ x: 0, y: 0 });
    setScale(1);
  }, [currentImageIndex, photos]);

  // Thêm keyboard handler
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (openLightbox) {
        if (e.key === 'ArrowLeft') {
          handleNavigate('prev');
        } else if (e.key === 'ArrowRight') {
          handleNavigate('next');
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [openLightbox, handleNavigate]);

  // Load initial data một lần duy nhất
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        console.log('Initializing AlbumClient...');

        // 1. Load user
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(userInfo);
        console.log('User loaded:', userInfo);

        // 2. Load visitorId
        let visitor = localStorage.getItem('visitorId');
        if (!visitor) {
          visitor = generateVisitorId();
          localStorage.setItem('visitorId', visitor);
        }
        setVisitorId(visitor);
        console.log('VisitorId loaded:', visitor);

        setInitialized(true);
      } catch (error) {
        console.error('Initialization error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []); // Run once on mount

  // Fetch photos only after initialization and when albumName changes
  useEffect(() => {
    if (initialized && user?.username && currentAlbumName) {
      console.log('Fetching photos for:', {
        username: user.username,
        albumName: currentAlbumName,
        initialized
      });
      fetchPhotos();
    }
  }, [initialized, user, currentAlbumName, fetchPhotos]);

  // Test interactions only after initialization
  useEffect(() => {
    if (initialized && visitorId && currentAlbumName) {
      console.group('Testing Interactions');
      console.log('Visitor ID:', visitorId);
      console.log('Current Interactions:', interactions);
      console.log('Album Name:', currentAlbumName);
      console.groupEnd();
    }
  }, [initialized, visitorId, interactions, currentAlbumName]);

  // Early return if not initialized
  if (!initialized || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Sử dụng function thường thay vì useCallback
  const processPhotoUrl = (photo) => {
    return getPhotoUrl(photo, user?.username, currentAlbumName);
  };

  // Render với loading state
  if (loading) {
    return <CircularProgress />;
  }

  // Thêm useEffect để load user info
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userInfo);
  }, []);

  // Render Methods
  const filteredPhotos = showLiked ? photos.filter(photo => liked.includes(photo.id)) : photos;
// đã tách

  const renderContent = () => {
    // if (loading) {
    //   return <CircularProgress />;
    // }

    return (
      <VirtualizedGallery
        photos={filteredPhotos}
        onImageClick={handleImageClick}
        processPhotoUrl={(photo) => getPhotoUrl(albumId, user?.username)}
        handleImageError={(e) => {
          console.error('Error loading gallery image:', e);
          e.target.src = CONFIG.STORAGE.DEFAULT_COVER;
        }}
        liked={liked}
        interactions={interactions}
        onLikeClick={handleLike}
      />
    );
  };

<<<<<<< HEAD
  // Sửa lại hàm processPhotoUrl
  const processPhotoUrl = (photo) => {
    if (!user?.username) return CONFIG.STORAGE.DEFAULT_COVER;
    return `${CONFIG.API_URL}/static/dataclient/user_${user.username}/data/${currentPath}/${photo.name}`;
  };

  // 1. Đưa syncLikedFromInteractions ra khỏi useCallback
=======
  // Thêm hàm syncLikedFromInteractions
>>>>>>> d9dc322e7dd5c6f75b65786234d2ae7f64044279
  const syncLikedFromInteractions = (interactionsData) => {
    try {
      // Lọc ra các photo IDs có heart = true
      const likedPhotoIds = Object.entries(interactionsData)
        .filter(([_, interaction]) => interaction.heart)
        .map(([photoId]) => photoId);
      
      setLiked(likedPhotoIds);
      
      console.log('Synced liked photos:', likedPhotoIds);
    } catch (error) {
      console.error('Error syncing liked photos:', error);
    }
  };

  return (
    <Container 
      maxWidth={false}
      disableGutters
      sx={{
        py: 3,
        height: '100%',
        overflow: 'visible'
      }}
    >
      <StyledCard sx={{ 
        borderRadius: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Box sx={{ 
          display: "flex", 
          justifyContent: "flex-end",
          p: 2,
          borderBottom: '1px solid rgba(0,0,0,0.1)'
        }}>
          <IconButton
            aria-label="album options"
            onClick={handleMenuOpen}
          >
            <FiMoreVertical />
          </IconButton>
        </Box>

        <Grid 
          container 
          spacing={2} 
          sx={{ 
            p: 2,
            maxWidth: '2000px',
            margin: '0 auto'
          }}
        >
          <Grid item xs={12} sm={4} md={2}>
            <CardMedia
              component="img"
              height="145"
              image={user?.username ? processPhotoUrl(albumId, user.username) : CONFIG.STORAGE.DEFAULT_COVER}
              alt="Album Cover"
              sx={{ borderRadius: 2 }}
              onError={(e) => {
                console.error('Error loading image:', e);
                e.target.src = CONFIG.STORAGE.DEFAULT_COVER;
              }}
            />
          </Grid>
          <Grid item xs={12} sm={8}>
            <CardContent>
              <Typography variant="h3" component="h1" gutterBottom>
                {decodeURIComponent(currentAlbumName) || 'Album'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <IconButton
                    aria-label="Ảnh yêu thích"
                    onClick={() => setShowLiked(!showLiked)}
                    sx={{
                      color: showLiked ? '#ff1744' : 'default',
                      '&:hover': {
                        color: '#ff1744'
                      }
                    }}
                  >
                    <FiHeart />
                  </IconButton>
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      fontSize: '12px',
                      color: showLiked ? '#ff1744' : 'text.secondary',
                      mt: 0
                    }}
                  >
                    Ảnh yêu thích
                  </Typography>
                </Box>
                
                {showLiked && (
                  <>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <IconButton 
                        aria-label="Tải xuống" 
                        onClick={handleDownloadAlbum}
                        disabled={liked.length === 0}
                      >
                        <FiDownload />
                      </IconButton>
                      <Typography variant="h3" sx={{ fontSize: '12px', color: 'text.secondary', mt: 0 }}>
                        Tải xuống
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <IconButton 
                        aria-label="Tạo mã số" 
                        onClick={handleGenerateCode}
                        disabled={liked.length === 0}
                      >
                        <FiSend />
                      </IconButton>
                      <Typography variant="h3" sx={{ fontSize: '12px', color: 'text.secondary', mt: 0 }}>
                        Tạo mã số
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </CardContent>
          </Grid>
        </Grid>

        {renderContent()}
      </StyledCard>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDownloadAlbum}>Download Album</MenuItem>
      </Menu>

      <StyledDialog 
        open={commentDialogOpen} 
        onClose={() => setCommentDialogOpen(false)}
      >
        <StyledDialogTitle>Gửi ảnh</StyledDialogTitle>
        <DialogContent sx={{ px: 3, pb: 3 }}>
          <StyledTextField
            autoFocus
            margin="dense"
            label="Bình luận"
            fullWidth
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <StyledButton 
            onClick={() => setCommentDialogOpen(false)}
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
            onClick={handleCommentSubmit}
            sx={{ 
              backgroundColor: '#fff',
              color: '#000',
              '&:hover': {
                backgroundColor: '#f5f5f5'
              }
            }}
          >
            Xác nhận
          </StyledButton>
        </DialogActions>
      </StyledDialog>

      <LightboxDialog
        open={openLightbox}
        onClose={handleCloseLightbox}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleCloseLightbox();
          }
        }}
      >
        <CloseButton onClick={handleCloseLightbox}>
          <FiX size={24} />
        </CloseButton>
        
        {/* Navigation Areas */}
        <NavigationArea 
          style={{ left: 10 }}
          onClick={(e) => {
            e.stopPropagation();
            handleNavigate('prev');
          }}
        >
          <NavigationButton>
            <FiChevronLeft size={24} />
          </NavigationButton>
        </NavigationArea>
        
        <NavigationArea 
          style={{ right: 10 }}
          onClick={(e) => {
            e.stopPropagation();
            handleNavigate('next');
          }}
        >
          <NavigationButton>
            <FiChevronRight size={24} />
          </NavigationButton>
        </NavigationArea>

        {/* Main Image Container */}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            pointerEvents: 'none'
          }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {selectedImage && (
            <img
              src={processPhotoUrl(selectedImage)}
              alt={selectedImage.name}
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                objectFit: 'contain',
                transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                transformOrigin: 'center center',
                userSelect: 'none',
                pointerEvents: 'auto'
              }}
            />
          )}
        </Box>

        {/* Image Counter */}
        {currentImageIndex !== null && (
          <ImageCounter>
            {currentImageIndex + 1} / {photos.length}
          </ImageCounter>
        )}
      </LightboxDialog>

      <StyledDialog 
        open={showCodeDialog} 
        onClose={() => setShowCodeDialog(false)}
      >
        <StyledDialogTitle>Mã số ảnh yêu thích</StyledDialogTitle>
        <DialogContent sx={{ px: 3, pb: 3 }}>
          <Typography
            component="pre"
            sx={{ 
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              backgroundColor: '#f5f5f5',
              p: 2,
              borderRadius: 1,
              mb: 2
            }}
          >
            {generatedCode}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <StyledButton 
            onClick={handleShare}
            startIcon={<FiShare2 />}
            sx={{ 
              backgroundColor: '#fff',
              color: '#000',
              '&:hover': { backgroundColor: '#f5f5f5' }
            }}
          >
            Chia sẻ
          </StyledButton>
          <StyledButton 
            onClick={handleCopyCode}
            startIcon={<FiCopy />}
            sx={{ 
              backgroundColor: '#000',
              color: '#fff',
              '&:hover': { backgroundColor: '#333' }
            }}
          >
            Copy
          </StyledButton>
        </DialogActions>
      </StyledDialog>

      <Snackbar
        open={Boolean(status)}
        autoHideDuration={6000}
        onClose={() => setStatus("")}
      >
        <Alert onClose={() => setStatus("")} severity="success">
          {status}
        </Alert>
      </Snackbar>
    </Container>
  );
};





export default AlbumClient;