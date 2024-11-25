// components/Header.js
import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Dialog
} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
// Import icons cho level
import DiamondIcon from '@mui/icons-material/Diamond';          // VIP
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';  // Premium
import StarsIcon from '@mui/icons-material/Stars';             // Basic
import NewAlbumDialog from './NewAlbumDialog';
import UploadDialog from './UploadDialog';
import { FiMenu } from 'react-icons/fi';
import FileUploader from './FileUploader';

const getLevelInfo = (level) => {
  switch(level) {
    case 3:
      return {
        label: 'VIP',
        icon: <DiamondIcon sx={{ color: '#FFD700' }} />,  // Gold
        color: '#FFD700'
      };
    case 2:
      return {
        label: 'Premium',
        icon: <AutoAwesomeIcon sx={{ color: '#C0C0C0' }} />,  // Silver
        color: '#C0C0C0'
      };
    default:
      return {
        label: 'Basic',
        icon: <StarsIcon sx={{ color: '#CD7F32' }} />,  // Bronze
        color: '#CD7F32'
      };
  }
};

export default function Header({ onToggleMobileMenu }) {
  const [user, setUser] = useState({});
  const [openNewAlbum, setOpenNewAlbum] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  
  useEffect(() => {
    // Chỉ chạy ở client-side
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);

  const levelInfo = getLevelInfo(user.level);

  // Thêm các handlers cho Profile Menu
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    handleProfileClose();
  };

  const handleOpenUploadDialog = () => {
    setIsUploadDialogOpen(true);
  };

  const handleCloseUploadDialog = () => {
    setIsUploadDialogOpen(false);
  };

  return (
    <AppBar 
      position="fixed"  // Thay đổi từ static thành fixed
      sx={{ 
        backgroundColor: 'white',  // Nền trắng
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        zIndex: 1200  // Đảm bảo header luôn ở trên cùng
      }}
    >
      <Toolbar>
        <IconButton 
          onClick={onToggleMobileMenu}
          sx={{ 
            mr: 2,
            display: { xs: 'block', sm: 'none' },
            color: '#333'  // Màu icon đen
          }}
        >
          <FiMenu />
        </IconButton>

        <Typography 
          variant="h6" 
          sx={{ 
            mr: 3,
            marginLeft: { xs: 0, sm: '240px' },
            color: '#333'  // Chữ màu đen
          }}
        >
          Photo Album
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: { xs: 1, sm: 2 }
        }}>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={handleOpenUploadDialog}
            sx={{ 
              backgroundColor: '#ffffff',
              color: '#000000',
              '&:hover': {
                backgroundColor: '#f5f5f5'
              }
            }}
          >
            Upload
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenNewAlbum(true)}  // Mở dialog new album
          >
            New Album
          </Button>
          <IconButton onClick={handleProfileClick}>
            <Avatar sx={{ bgcolor: '#1976d2' }}>
              {user.username?.[0]?.toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={profileMenuAnchor}
            open={Boolean(profileMenuAnchor)}
            onClose={handleProfileClose}
          >
            <MenuItem onClick={handleLogout}>Đăng xuất</MenuItem>
          </Menu>
        </Box>
      </Toolbar>

      <NewAlbumDialog 
        open={openNewAlbum}
        onClose={() => setOpenNewAlbum(false)}
      />

      <UploadDialog
        open={openUpload}
        onClose={() => setOpenUpload(false)}
      />

      <Dialog
        open={isUploadDialogOpen}
        onClose={handleCloseUploadDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
            m: 2,
            borderRadius: 2,
            overflow: 'hidden'
          }
        }}
      >
        <FileUploader onClose={handleCloseUploadDialog} />
      </Dialog>
    </AppBar>
  );
}