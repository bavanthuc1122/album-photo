import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { styled } from '@mui/system';
import { BsThreeDotsVertical } from "react-icons/bs";

const StyledCard = styled(Box)({
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

const AlbumCard = ({ album, onMenuClick, onAlbumClick }) => {
  console.log('Album data in card:', album);
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <StyledCard>
      <ImageWrapper onClick={() => onAlbumClick(album)}>
        <StyledImage
          src={album.coverUrl ? getImageUrl(album.coverUrl) : CONFIG.STORAGE.DEFAULT_COVER}
          alt={album.name}
          loading="lazy"
          onError={(e) => {
            console.log('Image load error for album:', album.name);
            console.log('Attempted URL:', e.target.src);
            console.log('Album data:', album);
            e.target.src = CONFIG.STORAGE.DEFAULT_COVER;
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
          flexDirection: 'column',
          gap: 0.5,
          color: 'text.secondary', 
          mt: 1,
          alignItems: 'center'
        }}>
          <Typography variant="body2">
            {album.photoCount} ảnh
          </Typography>
          {album.createdAt && (
            <Typography 
              variant="body2" 
              sx={{ fontSize: '0.8rem', color: '#666' }}
            >
              Ngày tạo: {album.createdAt}
            </Typography>
          )}
        </Box>
      </Box>

      <IconButton
        onClick={(e) => onMenuClick(e, album)}
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
    </StyledCard>
  );
};

export default AlbumCard;