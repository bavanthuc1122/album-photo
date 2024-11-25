import React, { useCallback, useMemo } from 'react';
import { CellMeasurer, CellMeasurerCache, Masonry, AutoSizer } from 'react-virtualized';
import { ImageListItem, styled } from '@mui/material';
import 'react-virtualized/styles.css';

const StyledImageListItem = styled(ImageListItem)({
  cursor: 'pointer',
  overflow: 'hidden',
  borderRadius: 1,
  marginBottom: '2px',
  '&:hover': {
    transform: 'scale(1.05)',
    transition: 'transform 0.3s ease-in-out'
  }
});

const VirtualizedGallery = ({ photos, onImageClick, processPhotoUrl, handleImageError }) => {
  // Cache để lưu kích thước các cell
  const cache = useMemo(() => new CellMeasurerCache({
    defaultHeight: 300,
    defaultWidth: 300,
    fixedWidth: true
  }), []);

  // Tính toán số cột dựa trên viewport
  const getColumnCount = useCallback((width) => {
    if (width >= 1200) return 5;
    if (width >= 768) return 4;
    return 3;
  }, []);

  // Tạo cell positioner
  const createCellPositioner = useCallback(({ width }) => {
    const columnCount = getColumnCount(width);
    const columnWidth = width / columnCount;
    
    return ({
      cellMeasurerCache: cache,
      columnCount,
      columnWidth,
      spacer: 2
    });
  }, [cache, getColumnCount]);

  // Render một cell trong Masonry
  const cellRenderer = useCallback(({ index, key, parent, style }) => {
    const photo = photos[index];
    if (!photo) return null;

    return (
      <CellMeasurer
        cache={cache}
        index={index}
        key={key}
        parent={parent}
      >
        {({ registerChild }) => (
          <div ref={registerChild} style={style}>
            <StyledImageListItem onClick={() => onImageClick(photo)}>
              <img
                src={processPhotoUrl(photo)}
                alt={photo.name || 'Photo'}
                loading="lazy"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block'
                }}
                onLoad={() => cache.clear(index, 0)}
                onError={(e) => handleImageError(e, processPhotoUrl(photo))}
              />
            </StyledImageListItem>
          </div>
        )}
      </CellMeasurer>
    );
  }, [photos, onImageClick, processPhotoUrl, handleImageError, cache]);

  return (
    <div style={{ height: 'calc(100vh - 300px)', width: '100%' }}>
      <AutoSizer>
        {({ width, height }) => (
          <Masonry
            cellCount={photos.length}
            cellMeasurerCache={cache}
            cellPositioner={createCellPositioner({ width })}
            cellRenderer={cellRenderer}
            height={height}
            width={width}
            overscanByPixels={200}
          />
        )}
      </AutoSizer>
    </div>
  );
};

export default React.memo(VirtualizedGallery);
