import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

const BackgroundContainer = styled(Box)({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: -1,
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.2)',
  }
});

const BackgroundVideo = styled('video')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

const BackgroundImage = styled(Box)({
  width: '100%',
  height: '100%',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
});

const BackgroundMedia = ({ src }) => {
  const isVideo = src.endsWith('.mp4');

  return (
    <BackgroundContainer>
      {isVideo ? (
        <BackgroundVideo autoPlay muted loop playsInline>
          <source src={src} type="video/mp4" />
        </BackgroundVideo>
      ) : (
        <BackgroundImage sx={{ backgroundImage: `url(${src})` }} />
      )}
    </BackgroundContainer>
  );
};

export default BackgroundMedia;