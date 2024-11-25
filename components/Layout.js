import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Box } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import { UploadProgress } from './UploadProgress';
import { useRouter } from 'next/router';

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Kiểm tra auth khi component mount
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      router.push('/login');
    }
  }, []);

  const handleMobileToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMobileClose = () => {
    setMobileOpen(false);
  };

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <Header onToggleMobileMenu={handleMobileToggle} />
          <Box sx={{ flexGrow: 1 }} />
          <UploadProgress />
        </Toolbar>
      </AppBar>
      <Sidebar 
        isMobileOpen={mobileOpen} 
        onMobileClose={handleMobileClose}
      />
      <Box 
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          border: '1px solid blue'
        }}
      >
        {children}
      </Box>
    </>
  );
}