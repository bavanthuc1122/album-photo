import React, { useState, useCallback } from 'react';
import { ImageListItem, styled, IconButton } from '@mui/material';
import { FiHeart } from 'react-icons/fi';

const StyledImageListItem = styled(ImageListItem)(({ transformOrigin }) => ({
  cursor: 'pointer',
  overflow: 'hidden',
  borderRadius: 1,
  marginBottom: '2px',
  position: 'relative',

  '& img': {
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transformOrigin: transformOrigin,
    width: '100%',
    height: 'auto',
    display: 'block',
    
    '&:hover': {
      transform: 'scale(1.05)',
    }
  }
}));

const MemoizedImageListItem = React.memo(({ 
  photo, 
  onClick, 
  onLikeClick, 
  liked,
  interactions, 
  ...props 
}) => {
  const [transformOrigin, setTransformOrigin] = useState('center center');

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setTransformOrigin([x, y]);
  }, []);

  const isLiked = liked.includes(photo.id) || interactions[photo.id]?.heart;

  return (
    <StyledImageListItem transformOrigin={transformOrigin} onClick={() => onClick(photo)} onMouseMove={handleMouseMove}>
      <img
        src={photo.url}
        alt={photo.name}
        loading="lazy"
        style={{
          width: '100%',
          height: 'auto',
          display: 'block'
        }}
        {...props}
      />
      <IconButton
        onClick={() => onLikeClick(photo.id)}
        sx={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          color: isLiked ? '#ff1744' : 'white',
          backgroundColor: 'rgba(0,0,0,0.3)',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.5)'
          }
        }}
      >
        <FiHeart />
      </IconButton>
    </StyledImageListItem>
  );
});

export default MemoizedImageListItem;