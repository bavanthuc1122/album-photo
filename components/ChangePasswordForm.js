import React, { useState } from 'react';
import { Box, Button, TextField, Typography, styled } from '@mui/material';

const StyledTextField = styled(TextField)({
  marginBottom: '16px',
  width: '100%'
});

const ChangePasswordForm = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới không khớp');
      return;
    }

    try {
      const token = localStorage.getItem('token'); // Lấy token đã lưu khi đăng nhập
      
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Đổi mật khẩu thành công');
        setError('');
        // Reset form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Tắt thông báo sau 2s
        setTimeout(() => {
          setSuccessMessage('');
        }, 2000);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Đã có lỗi xảy ra');
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        maxWidth: 400,
        mx: 'auto',
        p: 3,
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: 1
      }}
    >
      <Typography variant="h6" gutterBottom>
        Đổi mật khẩu
      </Typography>

      <StyledTextField
        label="Mật khẩu hiện tại"
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
      />

      <StyledTextField
        label="Mật khẩu mới"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />

      <StyledTextField
        label="Xác nhận mật khẩu mới"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {successMessage && (
        <Typography color="primary" sx={{ mb: 2 }}>
          {successMessage}
        </Typography>
      )}

      <Button
        type="submit"
        variant="contained"
        fullWidth
      >
        Đổi mật khẩu
      </Button>
    </Box>
  );
};

export default ChangePasswordForm;