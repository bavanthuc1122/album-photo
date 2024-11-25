import React, { useState } from 'react';
import { Box, Typography, Button, IconButton, LinearProgress, InputAdornment, Drawer, Divider } from "@mui/material";
import { FiHome, FiFolder, FiTrash2, FiSearch, FiX, FiMenu } from "react-icons/fi";
import { StyledSidebar, SearchBar } from '../styles/SidebarStyles';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/router';

const Sidebar = ({ isMobileOpen, onMobileClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <>
      {/* Desktop Sidebar */}
      <StyledSidebar 
        variant="permanent"
        sx={{ 
          display: { xs: 'none', sm: 'block' },
          width: 240
        }}
      >
        <SidebarContent />
      </StyledSidebar>

      {/* Mobile Menu */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={isMobileOpen}
        onClose={onMobileClose}
        ModalProps={{ 
          keepMounted: true,
          onClick: onMobileClose
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            width: '30%',
            maxWidth: '300px',
            bgcolor: 'white',
            transition: 'transform 0.3s ease-in-out'
          },
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          p: 2,
          borderBottom: '1px solid rgba(0,0,0,0.12)'
        }}>
          <Typography variant="h6">Menu</Typography>
          <IconButton 
            onClick={onMobileClose}
            sx={{ ml: 'auto' }}
          >
            <FiX />
          </IconButton>
        </Box>
        <SidebarContent />
      </Drawer>
    </>
  );
};

// Tách nội dung sidebar thành component riêng
const SidebarContent = () => {
  const router = useRouter();

  const handleNavigation = (path) => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      router.push('/login');
    } else {
      router.push(path);
    }
  };

  return (
    <>
      <Box sx={{ p: 2 }}>
        <SearchBar
          fullWidth
          placeholder="Search photos"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FiSearch />
              </InputAdornment>
            )
          }}
        />
      </Box>

      <Divider />
      
      <Box sx={{ p: 2 }}>
        <Button 
          startIcon={<FiHome />} 
          fullWidth 
          sx={{ 
            mb: 2, 
            justifyContent: "flex-start",
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'scale(1.05)',
              backgroundColor: 'rgba(0,0,0,0.04)'
            }
          }}
        >
          Home
        </Button>
        <Button startIcon={<FiFolder />} fullWidth sx={{ mb: 2, justifyContent: "flex-start" }}>
          Hộp thư
        </Button>
        <Button startIcon={<FiFolder />} fullWidth onClick={() => handleNavigation('/albums')} sx={{ mb: 2, justifyContent: "flex-start" }}>
          Albums
        </Button>
        <Button 
          startIcon={<FiTrash2 />} 
          fullWidth 
          onClick={() => handleNavigation('/trash')}
          sx={{ mb: 2, justifyContent: "flex-start" }}
        >
          Trash
        </Button>
      </Box>

      <Divider />

      <Box sx={{ p: 2, mt: "auto" }}>
        <LinearProgress variant="determinate" value={70} sx={{ mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Storage: 5GB / 8GB
        </Typography>
      </Box>
    </>
  );
};

export default Sidebar;