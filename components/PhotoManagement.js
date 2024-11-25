import React, { useState, useEffect } from 'react';
import { Box, useMediaQuery } from "@mui/material";
import Sidebar from './Sidebar';
import MainContentGrid from '../styles/Maincontentgrid';
import { StyledMainContent } from '../styles/AppStyles';
import { StyledHeader } from '../styles/AppStyles';

const PhotoManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useMediaQuery("(max-width:600px)");

  return (
    <>
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      
      <StyledHeader>
        {/* Header content */}
      </StyledHeader>

      <StyledMainContent sidebarOpen={sidebarOpen}>
        <MainContentGrid />
      </StyledMainContent>
    </>
  );
};

export default PhotoManagement; 