import { styled } from "@mui/system";
import { Card, Dialog, TextField, Button, IconButton, Skeleton, CardMedia, DialogTitle } from "@mui/material";

export const StyledCard = styled(Card)({
  borderRadius: 0,
  boxShadow: "none",
  width: '100%',
  margin: 0,
  padding: 0,
  height: 'auto',
  overflow: 'visible'
});

export const StyledImage = styled("img")({
  width: "100%",
  height: "100%",
  objectFit: "cover",
  borderRadius: 8,
  transition: "transform 0.3s ease-in-out",
  "&:hover": {
    transform: "scale(1.05)"
  }
});

export const StyledDialog = styled(Dialog)({
  '& .MuiPaper-root': {
    borderRadius: '12px',
    padding: '8px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    maxWidth: '400px',
    width: '90%'
  }
});

export const StyledTextField = styled(TextField)({
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

export const StyledButton = styled(Button)({
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

export const StyledSkeleton = styled(Skeleton)({
  borderRadius: 8,
  transform: 'none',
});

export const LightboxDialog = styled(Dialog)({
  '& .MuiDialog-paper': {
    backgroundColor: 'transparent',
    boxShadow: 'none',
    margin: 0,
    maxWidth: 'none',
    width: '100%',
    height: '100%'
  }
});

export const CloseButton = styled(IconButton)({
  position: 'absolute',
  right: 16,
  top: 16,
  color: '#fff',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.7)'
  }
});

// Thêm các styles cho layout
export const ImageWrapper = styled('div')({
  width: '100%',
  height: '200px',
  overflow: 'hidden',
  cursor: 'pointer'
});

export const ActionButtons = styled('div')({
  display: 'flex',
  gap: '8px',
  alignItems: 'center'
});

export const LightboxContainer = styled('div')({
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
});

export const StyledDialogTitle = styled(DialogTitle)`
  // styles here
`;