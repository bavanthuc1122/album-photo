import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Container, Grid, Typography, IconButton, Menu, MenuItem,
  Card, CardContent, Snackbar, Alert, Tooltip
} from "@mui/material";
import { FiHeart, FiDownload, FiSend, FiX } from "react-icons/fi";
import { useRouter } from 'next/router';
import CONFIG from '../lib/config';
import { handleDownloadAlbum, downloadLikedPhotos } from './CloneAlbumClient';
import AlbumLightbox from './AlbumLightbox';
import AlbumComments from './AlbumComments';
import AlbumGallery from './AlbumGallery';
import {
  StyledCard,
  StyledImage,
  StyledDialog,
  StyledTextField,
  StyledButton,
  StyledSkeleton,
  LightboxDialog,
  CloseButton,
  ImageWrapper,
  ActionButtons,
  LightboxContainer
} from './albumclient.styles';

const AlbumClient = () => {
  const router = useRouter();
  const { slug } = router.query;

  // Basic states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  const [metadata, setMetadata] = useState(null);
  const [liked, setLiked] = useState([]);
  const [showLiked, setShowLiked] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [openLightbox, setOpenLightbox] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [comment, setComment] = useState("");

  // Menu handlers
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  // Derived state
  const [albumName, randomString] = useMemo(() => {
    if (!slug) return ['', ''];
    const parts = slug.split('-');
    const random = parts.pop();
    const name = parts.join('-');
    return [name, random];
  }, [slug]);

  // Fetch metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch(`${CONFIG.API_URL}/api/albums/${randomString}/metadata`);
        const data = await response.json();
        console.log('Fetched metadata:', data);
        setMetadata(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching metadata:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (randomString) {
      fetchMetadata();
    }
  }, [randomString]);

  // Like handlers
  const handleLike = (imageId) => {
    setLiked(prev => {
      if (prev.includes(imageId)) {
        return prev.filter(id => id !== imageId);
      }
      return [...prev, imageId];
    });
  };

  // Comment handlers
  const handleCommentSubmit = async () => {
    try {
      // API call to submit comment
      setCommentDialogOpen(false);
      setComment("");
      setStatus("Bình luận đã được gửi");
    } catch (error) {
      setStatus("Lỗi khi gửi bình luận: " + error.message);
    }
  };

  return (
    <Container maxWidth="lg">
      <StyledCard>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={8}>
            <CardContent>
              <Typography variant="h3" component="h1" gutterBottom>
                {decodeURIComponent(albumName) || 'Album'}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <Tooltip title="Ảnh yêu thích">
                  <IconButton
                    onClick={() => setShowLiked(!showLiked)}
                    sx={{
                      color: showLiked ? '#ff1744' : 'default',
                      '&:hover': { color: '#ff1744' }
                    }}
                  >
                    <FiHeart />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Tải xuống">
                  <IconButton onClick={handleMenuOpen}>
                    <FiDownload />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Gửi tin nhắn">
                  <IconButton onClick={() => setCommentDialogOpen(true)}>
                    <FiSend />
                  </IconButton>
                </Tooltip>
              </Box>
            </CardContent>
          </Grid>
        </Grid>

        <AlbumGallery 
          metadata={metadata}
          liked={liked}
          onLike={handleLike}
          onImageSelect={setSelectedImage}
          setOpenLightbox={setOpenLightbox}
          showLiked={showLiked}
        />
      </StyledCard>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleDownloadAlbum(metadata, setStatus);
          handleMenuClose();
        }}>
          Download Album
        </MenuItem>
        <MenuItem onClick={() => {
          downloadLikedPhotos(metadata, liked, setStatus);
          handleMenuClose();
        }}>
          Download Liked Photos
        </MenuItem>
      </Menu>

      <AlbumLightbox 
        open={openLightbox}
        onClose={() => setOpenLightbox(false)}
        selectedImage={selectedImage}
      />

      <AlbumComments
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        comment={comment}
        setComment={setComment}
        onSubmit={handleCommentSubmit}
      />

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