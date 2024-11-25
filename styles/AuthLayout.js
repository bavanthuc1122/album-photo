import { styled } from '@mui/material/styles';
import { AppBar, Button, Typography, Dialog } from "@mui/material";

// Export các styled components để tái sử dụng
export const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: "transparent",
  boxShadow: "none",
  padding: "0",
  top: 0
}));

export const ContentBox = styled("div")({
  textAlign: "center",
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "100%",
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "0 20px"
});

export const AuthButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#333",
  color: "#fff",
  padding: "10px 20px",
  borderRadius: "4px",
  "&:hover": {
    backgroundColor: "#555"
  }
}));

export const NavLink = styled(Typography)(({ theme }) => ({
  marginLeft: theme.spacing(4),
  textDecoration: "none",
  color: "#fff",
  cursor: "pointer",
  "&:hover": {
    textDecoration: "underline"
  }
}));

export const PageContainer = styled("div")({
  minHeight: '100vh',
  position: 'relative',
  zIndex: 0
});