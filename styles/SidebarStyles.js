import { styled } from '@mui/material/styles';
import { Box, TextField } from '@mui/material';

export const StyledSidebar = styled('div')(({ theme }) => ({
  backgroundColor: '#fff',
  height: 'calc(100vh - 64px)',
  position: 'fixed',
  left: 0,
  top: 64,
  zIndex: 1100,
  borderRight: '1px solid rgba(0,0,0,0.12)',

  '& .MuiButton-root': {
    color: '#333',
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.04)'
    }
  },

  '& .MuiTypography-root': {
    color: '#333'
  }
}));

export const SearchBar = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    borderRadius: 8,
    '&:hover fieldset': {
      borderColor: '#000',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#000',
    },
  },
});