import React, { useState } from 'react';
import { Box } from '@mui/material';
import PhotoGrid from '../components/Maincontentgrid';

export default function Albums() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Box sx={{ width: '100%', minHeight: '100vh' }}>
      <PhotoGrid searchQuery={searchQuery} sidebarOpen={sidebarOpen} />
    </Box>
  );
}