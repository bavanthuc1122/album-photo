import { styled } from '@mui/material/styles';
import { Box } from "@mui/material";

export const StyledMainContent = styled(Box)(({ theme, sidebarOpen }) => ({
  marginLeft: sidebarOpen ? 240 : 64,
  marginTop: 64,
  transition: "margin-left 0.3s",
  padding: theme.spacing(3),
  width: 'calc(100% - 240px)',
  minHeight: 'calc(100vh - 64px)',
  [theme.breakpoints.down("sm")]: {
    marginLeft: 0,
    width: '100%',
    padding: theme.spacing(2)
  }
})); 

export const StyledHeader = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  right: 0,
  left: 240,
  height: 64,
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 3),
  zIndex: 1000,
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
  transition: 'left 0.3s',
  [theme.breakpoints.down("sm")]: {
    left: 0
  }
})); 