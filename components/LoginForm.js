import React, { useState, useEffect } from "react";
import { Box, Button, Container, Typography, styled, TextField, Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, Checkbox } from "@mui/material";
import { FcGoogle } from "react-icons/fc";
import { useRouter } from "next/router";
import { keyframes } from '@emotion/react';

const commonButtonStyle = {
  color: '#000000',
  backgroundColor: '#FFFFFF',
  borderRadius: '10px',
  border: '1px solid rgba(0,0,0,0.15)',
  padding: '8px 24px',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: '#F5F5F5',
    transform: 'translateY(-2px)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  }
};

const StyledButton = styled(Button)(({ theme }) => ({
  ...commonButtonStyle,
  width: '100%',
  marginBottom: '16px'
}));

const GoogleButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#FFFFFF",
  color: "#000000",
  borderRadius: "5px",
  padding: "12px 24px",
  border: "1px solid #E0E0E0",
  transition: "all 0.3s ease",
  width: "100%",
  "&:hover": {
    backgroundColor: "#F5F5F5",
    transform: "translateY(-2px)",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
  }
}));

const StyledTextField = styled(TextField)({
  marginBottom: "16px",
  width: "100%"
});

// Thêm keyframes animation cho fade-in và slide-up
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Thêm styled component cho thông báo
const SuccessMessage = styled(Typography)`
  animation: ${fadeInUp} 0.3s ease-out;
  padding: 8px 16px;
  border-radius: 4px;
  background-color: rgba(46, 125, 50, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: '✓';
    font-weight: bold;
  }
`;

const LoginForm = ({ onClose, isDialog = false }) => {
  const router = useRouter();
  const [isRegisterOpen, setRegisterOpen] = useState(false);
  const [isForgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // Thêm states cho captcha
  const [captchaNumbers, setCaptchaNumbers] = useState({ num1: 0, num2: 0 });
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaError, setCaptchaError] = useState("");

  // Thêm useEffect để tạo captcha khi mở form
  useEffect(() => {
    if (isRegisterOpen) {
      generateCaptcha();
    }
  }, [isRegisterOpen]);

  useEffect(() => {
    console.log('ForgotPassword Dialog state:', isForgotPasswordOpen);
  }, [isForgotPasswordOpen]);

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("Login attempt with:", { username, password });

    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      setSuccessMessage("");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSuccessMessage("");

      const isEmail = username.includes('@');
      const loginData = {
        [isEmail ? 'email' : 'username']: username,
        password: password
      };

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (data.success) {
        // Lưu vào cả localStorage và cookies
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        
        // Thêm cookies
        document.cookie = `token=${data.token}; path=/`;
        document.cookie = `user=${JSON.stringify(data.user)}; path=/`;
        
        setSuccessMessage('Đăng nhập thành công');
        
        if (onClose) onClose();
        
        setTimeout(() => {
          window.location.href = '/albums';
        }, 1000);
      } else {
        setError(data.message || 'Đăng nhập thất bại');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Đã có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    // Reset các state liên quan
    setError("");
    setSuccessMessage("");
    
    // Validate input
    if (!username || !email || !password) {
      setCaptchaError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setCaptchaError("Email không hợp lệ");
      return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Đăng ký thành công');
        // Reset form
        setUsername('');
        setEmail('');
        setPassword('');
        
        // Tắt thông báo sau 2s
        setTimeout(() => {
          setSuccessMessage('');
        }, 2000);

        // Đóng dialog sau khi tắt thông báo
        setTimeout(() => {
          setRegisterOpen(false);
        }, 2100);
      } else {
        setCaptchaError(data.message);
        generateCaptcha();
      }
    } catch (error) {
      console.error('Register error:', error);
      setCaptchaError('Đã có lỗi xảy ra');
      generateCaptcha();
    }
  };

  const handleGoogleLogin = () => {
    console.log("Google login clicked");
  };

  const handleForgotPassword = () => {
    setForgotPasswordOpen(true);
  };

  const handlePasswordReset = async () => {
    try {
      if (!email) {
        setError('Vui lòng nhập email');
        return;
      }

      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log('Password reset response:', data);

      if (data.success) {
        setSuccessMessage('Mật khẩu mới đã được gửi đến email của bạn');
        setForgotPasswordOpen(false);
        setEmail('');
        
        setTimeout(() => {
          setSuccessMessage('');
        }, 2000);
      } else {
        setError(data.message || 'Không thể gửi email');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError('Đã có lỗi xảy ra');
    }
  };

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10);
    const num2 = Math.floor(Math.random() * 10);
    setCaptchaNumbers({ num1, num2 });
    setCaptchaAnswer("");
  };

  // Điều chỉnh JSX return
  const formContent = (
    <>
      <Typography
        variant="h5"
        component="h1"
        gutterBottom
        sx={{ marginBottom: "24px", fontWeight: "bold" }}
      >
        Đăng nhập
      </Typography>

      <StyledTextField
        label="Email hoặc Username"
        placeholder="Nhập email hoặc tên đăng nhập"
        variant="outlined"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      <StyledTextField
        label="Password"
        type="password"
        variant="outlined"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && (
        <Typography color="error" sx={{ mt: 0, mb: 2, fontSize: '0.875rem' }}>
          {error}
        </Typography>
      )}

      {successMessage && (
        <SuccessMessage sx={{ mt: 0, mb: 2, fontSize: '0.875rem', color: '#2e7d32' }}>
          {successMessage}
        </SuccessMessage>
      )}

      <StyledButton
        variant="outlined"
        onClick={handleLogin}
        disabled={isLoading}
        aria-label="Login button"
      >
        {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
      </StyledButton>

      <GoogleButton
        startIcon={<FcGoogle size={20} />}
        onClick={handleGoogleLogin}
        aria-label="Google login button"
      >
        Đăng nhập với Google
      </GoogleButton>

      <Box sx={{ 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        my: 2 
      }}>
        <Box sx={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }} />
        <Typography variant="body2" color="text.secondary">
          hoặc
        </Typography>
        <Box sx={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }} />
      </Box>

      <Typography 
        variant="body2" 
        align="center"
        sx={{ mb: 2 }}
      >
        Chưa có tài khoản?{' '}
        <Button
          onClick={() => setRegisterOpen(true)}
          sx={{ 
            textTransform: 'none',
            fontWeight: 'bold',
            p: 1,
            minWidth: 'auto',
            verticalAlign: 'baseline',
            color: '#000000',
            borderRadius: '10px',
            '&:hover': {
              backgroundColor: '#F5F5F5'
            }
          }}
        >
          Đăng ký ngay
        </Button>
      </Typography>

      <Button
        onClick={() => setForgotPasswordOpen(true)}
        sx={{ 
          fontSize: '0.875rem',
          textTransform: 'none',
          color: '#000000',
          p: 1,
          borderRadius: '10px',
          '&:hover': {
            backgroundColor: '#F5F5F5'
          }
        }}
      >
        Quên mật khẩu?
      </Button>
    </>
  );

  // Nếu được gọi từ Dialog, vẫn cần render cả dialogs
  if (isDialog) {
    return (
      <>
        {formContent}
        
        {/* Register Dialog */}
        <Dialog open={isRegisterOpen} onClose={() => setRegisterOpen(false)}>
          <DialogTitle>Đăng ký</DialogTitle>
          <DialogContent>
            <StyledTextField
              label="Username"
              variant="outlined"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <StyledTextField
              label="Email"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <StyledTextField
              label="Password"
              type="password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            
            {/* Thêm thông báo thành công cho form đăng ký */}
            {successMessage && (
              <Typography 
                sx={{ 
                  mt: 2,
                  mb: 1,
                  fontSize: '0.875rem',
                  color: '#2e7d32',
                  textAlign: 'center'
                }}
              >
                {successMessage}
              </Typography>
            )}
            
            {/* Phần captcha */}
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              border: '1px solid #e0e0e0', 
              borderRadius: 1,
              backgroundColor: '#f5f5f5'
            }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Xác thực bảo mật
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography>
                  {captchaNumbers.num1} + {captchaNumbers.num2} = ?
                </Typography>
                <Button 
                  size="small" 
                  onClick={generateCaptcha}
                  sx={{ minWidth: 'auto', p: 0.5 }}
                >
                  🔄
                </Button>
              </Box>
              <StyledTextField
                size="small"
                placeholder="Nhập kết quả"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                error={!!captchaError}
                helperText={captchaError}
                sx={{ mb: 0 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setRegisterOpen(false)}
              sx={commonButtonStyle}
            >
              Hủy
            </Button>
            <Button 
              onClick={() => {
                const correctAnswer = captchaNumbers.num1 + captchaNumbers.num2;
                if (parseInt(captchaAnswer) === correctAnswer) {
                  handleRegister();
                  setCaptchaError("");
                } else {
                  setCaptchaError("Kết quả không đúng");
                  generateCaptcha();
                }
              }} 
              sx={commonButtonStyle}
            >
              Đăng ký
            </Button>
          </DialogActions>
        </Dialog>

        {/* Forgot Password Dialog */}
        <Dialog open={isForgotPasswordOpen} onClose={() => setForgotPasswordOpen(false)}>
          <DialogTitle sx={{ fontFamily: 'inherit' }}>
            Quên mật khẩu
          </DialogTitle>
          <DialogContent>
            <StyledTextField
              label="Email"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setForgotPasswordOpen(false)}
              sx={commonButtonStyle}
            >
              Hủy
            </Button>
            <Button 
              onClick={handlePasswordReset} 
              sx={commonButtonStyle}
            >
              Lấy lại mật khẩu
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  // Nếu được gọi trực tiếp (trang login), thêm wrapper
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "32px",
          backgroundColor: "#FFFFFF",
          borderRadius: "10px",
          boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
          margin: "32px auto"
        }}
      >
        {formContent}
      </Box>
    </Container>
  );
};

export default LoginForm;