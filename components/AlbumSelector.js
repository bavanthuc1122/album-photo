import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  TextField,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Checkbox,
  Button,
} from "@mui/material";

const AlbumSelector = ({ onSelect }) => {
  const [albums, setAlbums] = useState([]);
  const [selectedAlbums, setSelectedAlbums] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/albums', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch albums');
      
      const data = await response.json();
      setAlbums(data);
    } catch (error) {
      console.error('Error fetching albums:', error);
    }
  };

  const handleSelect = () => {
    const selectedAlbumData = albums.filter(album => 
      selectedAlbums.includes(album.id)
    );
    if (selectedAlbumData.length > 0) {
      onSelect(selectedAlbumData);
    }
  };

  return (
    <Box sx={{ p: 3, maxHeight: '70vh', overflow: 'auto' }}>
      <TextField
        fullWidth
        placeholder="Tìm kiếm album..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 3 }}
      />
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {albums
          .filter(album => 
            album.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 18) // Giới hạn 18 albums (3 hàng x 6 cột)
          .map(album => (
            <Grid item xs={2} key={album.id}>
              <Card 
                sx={{ 
                  position: 'relative',
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 3 }
                }}
                onClick={() => {
                  const newSelection = selectedAlbums.includes(album.id)
                    ? selectedAlbums.filter(id => id !== album.id)
                    : [...selectedAlbums, album.id];
                  setSelectedAlbums(newSelection);
                }}
              >
                <CardMedia
                  component="img"
                  height="100"
                  image={album.coverUrl || '/placeholder.jpg'}
                  alt={album.name}
                  sx={{ objectFit: 'cover' }}
                />
                <Checkbox
                  checked={selectedAlbums.includes(album.id)}
                  sx={{ 
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bgcolor: 'rgba(255,255,255,0.8)',
                    m: 0.5
                  }}
                />
                <CardContent sx={{ p: 1 }}>
                  <Typography variant="body2" noWrap>
                    {album.name}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button 
          onClick={() => onSelect([])}
          sx={{ color: '#000' }}
        >
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handleSelect}
          disabled={selectedAlbums.length === 0}
          sx={{ 
            bgcolor: '#000',
            '&:hover': { bgcolor: '#333' }
          }}
        >
          Xác nhận ({selectedAlbums.length})
        </Button>
      </Box>
    </Box>
  );
};

export default AlbumSelector;