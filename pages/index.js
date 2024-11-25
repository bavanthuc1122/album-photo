import { useState } from 'react';
import { Box, Container, Dialog, Toolbar, Typography } from "@mui/material";
import { StyledAppBar, NavLink, PageContainer } from '../styles/AuthLayout';
import { colors, typography } from '../styles/theme';
import LoginForm from '../components/LoginForm';
import BackgroundMedia from '../components/BackgroundMedia';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const [openDialog, setOpenDialog] = useState(false);
  
  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const backgroundSrc = '/imgbgr/background.mp4';

  return (
    <PageContainer>
      <BackgroundMedia src={backgroundSrc} />
      
      <StyledAppBar position="fixed">
        <Container maxWidth="lg">
          <Toolbar sx={{ 
            justifyContent: "flex-end",
            minHeight: "40px",
            padding: "8px 24px"
          }}>
            <Box sx={{ 
              marginLeft: "auto",
              marginRight: "-32px",
              display: "flex",
              alignItems: "center",
              gap: 1
            }}>
              <NavLink onClick={() => router.push('/')}>Trang chủ</NavLink>
              <NavLink onClick={() => router.push('/albums')}>Tạo thư viện</NavLink>
              <NavLink>Bảng giá</NavLink>
              <NavLink>Hướng dẫn</NavLink>
            </Box>
          </Toolbar>
        </Container>
      </StyledAppBar>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          gap: 3,
          padding: '0 20px'
        }}
      >
        <Typography 
          variant="h1" 
          component="h1"
          sx={{
            ...typography.h1,
            color: colors.text.primary,
            marginBottom: 2,
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          Lưu Giữ Khoảnh Khắc
        </Typography>

        <Typography 
          variant="h2" 
          component="h2"
          sx={{
            ...typography.body1,
            color: colors.text.secondary,
            maxWidth: '800px',
            lineHeight: 1.6,
            marginBottom: 4,
            textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
          }}
        >
          Khám phá không gian lưu trữ ảnh an toàn và chuyên nghiệp. 
          Chúng tôi cung cấp giải pháp bảo quản những khoảnh khắc quý giá của bạn 
          với chất lượng cao nhất và khả năng truy cập mọi lúc mọi nơi.
        </Typography>

        <Box
          component="button"
          onClick={handleOpenDialog}
          sx={{
            padding: '12px 32px',
            borderRadius: '30px',
            backgroundColor: colors.background.primary,
            border: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontSize: typography.body1.fontSize,
            fontWeight: '500',
            color: colors.text.dark,
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              backgroundColor: colors.secondary
            }
          }}
        >
          Đăng nhập
        </Box>
      </Box>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "32px",
            backgroundColor: "#FFFFFF",
            borderRadius: "10px",
          }}
        >
          <LoginForm onClose={handleCloseDialog} isDialog={true} />
        </Box>
      </Dialog>
    </PageContainer>
  );
}