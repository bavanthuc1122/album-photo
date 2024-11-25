import React, { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import {
  Box,
  Grid,
  TextField,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Container,
  Checkbox,
  Button,
  Stack,
  Dialog,
  IconButton,
  LinearProgress,
  Input,
  Snackbar,
  Alert,
  CircularProgress
} from "@mui/material";
import { styled } from "@mui/system";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import AlbumSelector from './AlbumSelector';
import { useUpload } from '../contexts/UploadContext';
import CONFIG from '../lib/config';  // Import config

// Giữ nguyên các styled components
const StyledCard = styled(Card)(() => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  backgroundColor: "#ffffff",
  border: "1px solid #e0e0e0",
  borderRadius: "8px"
}));

const ActionButton = styled(Button)(() => ({
  borderRadius: "20px",
  padding: "6px 20px",
  textTransform: "none",
  border: "1px solid #e0e0e0"
}));

// Thêm styled component cho selected album chip
const SelectedAlbumChip = styled(Box)({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 12px',
  backgroundColor: '#f5f5f5',
  borderRadius: '16px',
  margin: '4px',
  gap: '8px'
});

// Thêm DuplicateDialog component
const DuplicateDialog = ({ files, isLoading, onConfirm, onCancel }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);

  return (
    <Dialog open={true} onClose={onCancel} maxWidth="sm" fullWidth>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Phát hiện file trùng lặp
        </Typography>

        {isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3 }}>
            <CircularProgress size={24} />
            <Typography>Đang kiểm tra file trùng lặp...</Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {files.length} file đã tồn tại trong album này. Bạn có muốn ghi đè không?
            </Typography>

            <Box sx={{ 
              maxHeight: 300, 
              overflow: 'auto',
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              mb: 3 
            }}>
              {files.map(file => (
                <Box 
                  key={file}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1,
                    borderBottom: '1px solid #f0f0f0',
                    '&:last-child': { borderBottom: 'none' }
                  }}
                >
                  <Checkbox
                    checked={selectedFiles.includes(file)}
                    onChange={() => {
                      setSelectedFiles(prev => 
                        prev.includes(file)
                          ? prev.filter(f => f !== file)
                          : [...prev, file]
                      );
                    }}
                  />
                  <Typography variant="body2">{file}</Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button onClick={onCancel}>
                Hủy bỏ
              </Button>
              <Button 
                variant="contained"
                onClick={() => onConfirm(selectedFiles)}
                disabled={selectedFiles.length === 0}
                color="warning"
              >
                Ghi đè ({selectedFiles.length}) file
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Dialog>
  );
};

const FileUploader = ({ onClose = () => {} }) => {
  // States
  const [links, setLinks] = useState([""]);
  const [albumName, setAlbumName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedAlbums, setSelectedAlbums] = useState([]);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [failedUploads, setFailedUploads] = useState([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [completedFiles, setCompletedFiles] = useState(0);
  const [isCancelled, setIsCancelled] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success"
  });
  const [isAlbumSelectorOpen, setIsAlbumSelectorOpen] = useState(false);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [uploadStartTime, setUploadStartTime] = useState(null);
  const [totalBytesUploaded, setTotalBytesUploaded] = useState(0);
  const [isDuplicateChecking, setIsDuplicateChecking] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateFiles, setDuplicateFiles] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [validLinks, setValidLinks] = useState([]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup khi component unmount
      if (isUploading) {
        handleCancel();
      }
    };
  }, []);

  const handleCancel = () => {
    if (isUploading) {
      // ... existing cancel logic ...
    }
    onClose(); // Đóng dialog khi cancel
  };

  // Sửa lại hàm kiểm tra điều kiện upload
  const canStartUpload = () => {
    // Kiểm tra có dữ liệu để upload
    const hasFiles = selectedFiles.length > 0;
    const hasValidLinks = validLinks.length > 0;
    
    // Kiểm tra có nơi lưu trữ
    const hasAlbumSelected = selectedAlbums.length > 0;
    const hasNewAlbumName = newAlbumName.trim() !== '';
    
    // Cho phép upload khi:
    // (Có files HOẶC có links hợp lệ) VÀ (Đã chọn album HOẶC đã tạo album mới)
    return (hasFiles || hasValidLinks) && (hasAlbumSelected || hasNewAlbumName);
  };

  // Sửa lại hàm xử lý upload
  const handleUpload = async () => {
    if (isProcessing) return;
    
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));

      if (!token || !user) {
        throw new Error('Vui lòng đăng nhập lại');
      }

      setIsProcessing(true);
      setIsDuplicateChecking(true);

      const formData = new FormData();
      
      // Thêm files nếu có
      selectedFiles.forEach(file => {
        formData.append('photos', file);
      });

      // Thêm links nếu có
      validLinks.forEach(link => {
        formData.append('links', link);
      });

      // Thêm thông tin album
      if (selectedAlbums.length > 0) {
        formData.append('albumId', selectedAlbums[0].id);
      } else {
        formData.append('albumName', newAlbumName.trim());
      }

      // Tiếp tục xử lý upload như cũ
      const response = await fetch(`/api/upload?username=${user.username}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      // Handle duplicate files
      if (response.status === 409) {
        setDuplicateFiles(data.duplicates);
        setShowDuplicateDialog(true);
        setIsDuplicateChecking(false);
        setIsProcessing(false);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setNotification({
        open: true,
        message: 'Upload thành công',
        severity: 'success'
      });

      // Reset form sau khi upload thành công
      setSelectedFiles([]);
      setLinks([""]);
      setValidLinks([]);
      setNewAlbumName('');
      setSelectedAlbums([]);
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Upload error:', error);
      setNotification({
        open: true,
        message: error.message || 'Upload failed',
        severity: 'error'
      });
    } finally {
      setIsProcessing(false);
      setIsDuplicateChecking(false);
    }
  };

  // Handle overwrite confirmation
  const handleOverwrite = async (selectedFiles) => {
    setShowDuplicateDialog(false);
    
    try {
      setIsProcessing(true);
      setIsUploading(true);

      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('photos', file);
      });

      // Add album info and overwrite flag
      if (selectedAlbums.length > 0) {
        formData.append('albumId', selectedAlbums[0].id);
      } else {
        formData.append('albumName', newAlbumName.trim());
      }
      formData.append('overwrite', 'true');

      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));

      const response = await fetch(`/api/upload?username=${user.username}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setNotification({
        open: true,
        message: 'Upload thành công',
        severity: 'success'
      });

      // Reset form
      setSelectedFiles([]);
      setNewAlbumName('');
      setSelectedAlbums([]);
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Upload error:', error);
      setNotification({
        open: true,
        message: error.message || 'Upload failed',
        severity: 'error'
      });
    } finally {
      setIsProcessing(false);
      setIsUploading(false);
    }
  };

  const handleAddLink = () => {
    if (links.length < 15) {
      setLinks([...links, ""]);
    }
  };

  const handleRemoveLink = (index) => {
    const newLinks = links.filter((_, i) => i !== index);
    setLinks(newLinks);
  };

  const MAX_SINGLE_FILE_SIZE = 1000 * 1024 * 1024; // 1000MB
  const MAX_TOTAL_SIZE = 1024 * 1024 * 1024; // 1GB
  const MAX_FILES = 5000;                            // 5000 files

  const formatFileSize = (bytes) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
    }
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    }
    return `${(bytes / 1024).toFixed(1)}KB`;
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    
    let currentTotalSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);
    
    const validFiles = files.filter(file => {
      if (file.size > MAX_SINGLE_FILE_SIZE) {
        setNotification({
          open: true,
          message: `File ${file.name} vượt quá 1GB`,
          severity: 'error'
        });
        return false;
      }
      
      if (currentTotalSize + file.size > MAX_TOTAL_SIZE) {
        setNotification({
          open: true,
          message: `Tổng dung lượng files vượt quá ${formatFileSize(MAX_TOTAL_SIZE)}`,
          severity: 'error'
        });
        return false;
      }
      
      currentTotalSize += file.size;
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleLinkChange = (index, value) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
    
    // Validate và cập nhật validLinks
    const validatedLinks = newLinks.filter(link => link && link.trim().length > 0);
    setValidLinks(validatedLinks);
  };

  const handleOpenAlbumSelector = () => {
    setIsAlbumSelectorOpen(true);
  };

  const handleCloseAlbumSelector = () => {
    setIsAlbumSelectorOpen(false);
  };

  const handleAlbumSelect = (albums) => {
    setSelectedAlbums(albums);
    setNewAlbumName(''); // Clear new album name khi chọn album có sẵn
    setIsAlbumSelectorOpen(false);
  };

  const handleNewAlbumNameChange = (e) => {
    setNewAlbumName(e.target.value);
    setSelectedAlbums([]); // Clear selected albums khi nhập tên album mới
  };

  const calculateAverageSpeed = (bytesUploaded) => {
    if (!uploadStartTime) return 0;
    const duration = (Date.now() - uploadStartTime) / 1000; // seconds
    const speedMBps = (bytesUploaded / (1024 * 1024)) / duration; // MB/s
    return speedMBps;
  };

  // Thêm hàm checkDuplicateFiles và xử lý upload
  const checkDuplicateFiles = async (files, albumId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Chỉ lấy các file có định dạng hợp lệ
      const validFiles = files.filter(file => {
        const extension = file.name.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'raw'].includes(extension);
      });

      // Lấy tên của các file hợp lệ
      const fileNames = validFiles.map(file => file.name);

      console.log("Checking duplicates for files:", fileNames);

      const response = await fetch(`/api/check-duplicates?username=${user.username}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          albumId,
          fileNames
        })
      });

      if (!response.ok) {
        throw new Error('Lỗi kiểm tra file trùng lặp');
      }

      const data = await response.json();
      console.log("Server response:", data);
      
      return data.duplicates || [];

    } catch (error) {
      console.error('Error checking duplicates:', error);
      throw error;
    }
  };

  // Thêm hàm xử lý upload
  const proceedWithUpload = async (albumId, overwriteFiles = []) => {
    try {
      setIsUploading(true);
      setUploadStartTime(Date.now());
      
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('photos', file);
      });
      
      formData.append('albumId', albumId);
      overwriteFiles.forEach(fileName => {
        formData.append('overwrite', fileName);
      });

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch(`/api/upload?username=${user.username}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      setNotification({
        open: true,
        message: `Upload thành công ${result.successful} files`,
        severity: 'success'
      });

      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      setNotification({
        open: true,
        message: error.message || 'Lỗi khi upload files',
        severity: 'error'
      });
    } finally {
      setIsUploading(false);
    }
  };

  // 1. Thêm useEffect để kiểm tra auth khi component mount
  useEffect(() => {
    const checkAuth = () => {
      const user = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (!user || !token) {
        setNotification({
          open: true,
          message: 'Vui lòng đăng nhập lại',
          severity: 'error'
        });
        // Redirect to login page
        window.location.href = '/login';
      }
    };
    
    checkAuth();
  }, []);

  // 2. Thêm hàm refresh token nếu cần
  const refreshToken = async () => {
    try {
      const response = await fetch('/api/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: localStorage.getItem('refreshToken')
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        return data.token;
      }
      throw new Error('Failed to refresh token');
    } catch (error) {
      console.error('Error refreshing token:', error);
      // Redirect to login
      window.location.href = '/login';
    }
  };

  return (
    <Box 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <Box 
        sx={{ 
          p: 3,
          flex: 1,
          overflow: 'auto'
        }}
      >
        {/* Progress Bar */}
        {isUploading && (
          <Box sx={{ width: '100%', mb: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={uploadProgress}
              sx={{
                height: 10,
                borderRadius: 5,
                bgcolor: "#f5f5f5",
                "& .MuiLinearProgress-bar": {
                  bgcolor: "#4caf50"
                }
              }}
            />
            <Typography variant="body2" sx={{ mt: 1, textAlign: "center" }}>
              {`${completedFiles}/${totalFiles} files (${Math.round(uploadProgress)}%)`}
            </Typography>
          </Box>
        )}

        {/* Links Input */}
        <Box sx={{ mb: 3 }}>
          {links.map((link, index) => (
            <Box key={index} sx={{ display: "flex", mb: 2, alignItems: "center" }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Dán link từ Google Drive, Dropbox, hoặc OneDrive"
                value={link}
                onChange={(e) => handleLinkChange(index, e.target.value)}
                disabled={isUploading}
                sx={{ mr: 1 }}
              />
              {index === links.length - 1 && links.length < 15 && (
                <IconButton 
                  onClick={handleAddLink}
                  disabled={isUploading}
                  sx={{ color: "#000000" }}
                >
                  <IoMdAdd />
                </IconButton>
              )}
              {links.length > 1 && (
                <IconButton
                  onClick={() => handleRemoveLink(index)}
                  disabled={isUploading}
                  sx={{ color: "#000000" }}
                >
                  <IoMdClose />
                </IconButton>
              )}
            </Box>
          ))}
        </Box>

        {/* Album Selection */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Nhập tên Album mới"
              value={newAlbumName}
              onChange={handleNewAlbumNameChange}
              disabled={isUploading || selectedAlbums.length > 0}
              sx={{ mr: 1 }}
            />
            <Button
              variant="outlined"
              onClick={() => setIsAlbumSelectorOpen(true)}
              disabled={isUploading || newAlbumName.trim().length > 0}
              sx={{ borderColor: "#000000", color: "#000000" }}
            >
              Chọn Album
            </Button>
          </Box>

          {/* Selected Albums Display */}
          {selectedAlbums.length > 0 && (
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: 1,
              mt: 2 
            }}>
              {selectedAlbums.map(album => (
                <SelectedAlbumChip key={album.id}>
                  <Typography variant="body2">
                    {album.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedAlbums([]);
                    }}
                  >
                    <IoMdClose size={16} />
                  </IconButton>
                </SelectedAlbumChip>
              ))}
            </Box>
          )}

          {/* File Selection Button - Chỉ giữ lại nút upload file */}
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.raw"
              onChange={handleFileSelect}
              style={{ display: "none" }}
              id="file-input"
              disabled={isUploading}
            />
            <label htmlFor="file-input">
              <Button
                variant="outlined"
                component="span"
                disabled={isUploading}
                sx={{ borderColor: "#000000", color: "#000000" }}
              >
                Tải lên tệp
              </Button>
            </label>
          </Box>

          {/* Selected Files Count */}
          {selectedFiles.length > 0 && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              {selectedFiles.length} file đã chọn
            </Typography>
          )}
        </Box>
      </Box>

      {/* Action Buttons - Fixed at bottom */}
      <Box 
        sx={{ 
          p: 2,
          borderTop: '1px solid #e0e0e0',
          bgcolor: '#ffffff',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2
        }}
      >
        <ActionButton
          variant="outlined"
          onClick={handleCancel}
        >
          {isUploading ? "Dừng Upload" : "Hủy bỏ"}
        </ActionButton>
        <ActionButton
          variant="contained"
          onClick={handleUpload}
          disabled={!canStartUpload() || isProcessing}
          sx={{
            bgcolor: isUploading ? "#4caf50" : "#000000",
            color: "#ffffff",
            "&:hover": {
              bgcolor: isUploading ? "#45a049" : "#333333"
            }
          }}
        >
          {isProcessing ? "Đang xử lý..." : isUploading ? "Đang upload..." : "Bắt đầu"}
        </ActionButton>
      </Box>

      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Album Selector Dialog */}
      <Dialog
        open={isAlbumSelectorOpen}
        onClose={handleCloseAlbumSelector}
        maxWidth="md"
        fullWidth
      >
        <AlbumSelector onSelect={handleAlbumSelect} />
      </Dialog>

      {/* Duplicate Dialog */}
      {showDuplicateDialog && (
        <DuplicateDialog
          files={duplicateFiles}
          isLoading={isDuplicateChecking}
          onConfirm={handleOverwrite}
          onCancel={() => setShowDuplicateDialog(false)}
        />
      )}
    </Box>
  );
};

FileUploader.propTypes = {
  onClose: PropTypes.func
};

export default FileUploader;