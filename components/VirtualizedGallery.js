import React from 'react';
import { ImageList, ImageListItem, styled, IconButton, Tooltip } from '@mui/material';
import { FiHeart } from "react-icons/fi";

const StyledImageListItem = styled(ImageListItem)({
  cursor: 'pointer',
  overflow: 'hidden',
  borderRadius: 1,
  position: 'relative',
  '&:hover': {
    opacity: 0.9,
    transition: 'transform 0.1s ease-in-out'
  }
});

const HeartButton = styled(IconButton)({
  position: 'absolute',
  top: 8,
  right: 8,
  zIndex: 2,
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  padding: '8px',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.4)'
  }
});

const StyledImageList = styled(ImageList)({
  width: '100%',
  margin: 0,
  padding: '5px',
  gap: 5,
});

const VirtualizedGallery = ({ 
  photos, 
  onImageClick, 
  processPhotoUrl, 
  handleImageError,
  liked,
  interactions,
  onLikeClick 
}) => {
  const [visiblePhotos, setVisiblePhotos] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const containerRef = React.useRef(null);
  const BATCH_SIZE = 20;
  const throttleRef = React.useRef(false);

  // Load thêm ảnh khi scroll
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (throttleRef.current) return;
      
      throttleRef.current = true;
      requestAnimationFrame(() => {
        const { scrollTop, clientHeight, scrollHeight } = container;
        if (scrollHeight - scrollTop - clientHeight < 300) {
          const nextPage = page + 1;
          const start = nextPage * BATCH_SIZE;
          const newBatch = photos.slice(start, start + BATCH_SIZE);
          
          if (newBatch.length > 0) {
            setVisiblePhotos(prev => [...prev, ...newBatch]);
            setPage(nextPage);
          }
        }
        throttleRef.current = false;
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [page, photos]);

  // Load batch đầu tiên
  React.useEffect(() => {
    setVisiblePhotos(photos.slice(0, BATCH_SIZE));
    setPage(0);
  }, [photos]);

  const getColumns = () => {
    const width = window.innerWidth;
    if (width < 768) return 2;
    if (width < 1200) return 3;
    return 5;
  };

  const isLiked = (photoId) => liked.includes(photoId) || interactions[photoId]?.heart;

  return (
    <div ref={containerRef} 
      style={{ 
        height: 'auto',
        width: '100vw',
        overflow: 'visible',
        margin: '10px -24px 0',
        padding: '0 5px',
      }}
    >
      <StyledImageList 
        cols={getColumns()} 
        gap={5}
        sx={{
          maxWidth: 'none',
          width: '100%',
        }}
      >
        {visiblePhotos.map((photo, index) => {
          return (
            <StyledImageListItem 
              key={photo.id || index}
              onClick={() => onImageClick(photo)}
            >
              <img
                src={processPhotoUrl(photo)}
                alt={photo.name || 'Photo'}
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => handleImageError(e, processPhotoUrl(photo))}
              />
              <Tooltip title="Ảnh yêu thích">
                <HeartButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onLikeClick(photo.id);
                  }}
                  sx={{
                    color: isLiked(photo.id) ? '#ff1744' : '#fff'
                  }}
                >
                  <FiHeart />
                </HeartButton>
              </Tooltip>
            </StyledImageListItem>
          );
        })}
      </StyledImageList>
    </div>
  );
};

export default React.memo(VirtualizedGallery);
