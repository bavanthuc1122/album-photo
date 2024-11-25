import React, { useState } from "react";
import { ThemeProvider, createTheme, Box } from "@mui/material";
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useRouter } from 'next/router';
import '../styles/globals.css'
import Layout from '../components/Layout';
import { UploadProvider } from '../contexts/UploadContext';

// Định nghĩa theme
const theme = createTheme();

function MyApp({ Component, pageProps, router }) {
  // Chỉ áp dụng Layout cho trang albums
  if (router.pathname === '/albums') {
    return (
      <UploadProvider>
        <ThemeProvider theme={theme}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </ThemeProvider>
      </UploadProvider>
    );
  }

  // Các trang khác không dùng Layout
  return <ThemeProvider theme={theme}>
    <UploadProvider>
      <Component {...pageProps} />
    </UploadProvider>
  </ThemeProvider>;
}

export default MyApp;