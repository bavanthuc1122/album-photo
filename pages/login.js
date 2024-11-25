import { Box, Container, Toolbar, Typography } from "@mui/material";
import { StyledAppBar, ContentBox, AuthButton, NavLink, PageContainer } from '../styles/AuthLayout';
import LoginForm from '../components/LoginForm';
import BackgroundMedia from '../components/BackgroundMedia';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
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

      <ContentBox>
        <LoginForm />
      </ContentBox>
    </PageContainer>
  );
}