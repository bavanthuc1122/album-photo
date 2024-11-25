// components/NewAlbumDialog.js
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button 
} from '@mui/material';
import CONFIG, { getApiUrl } from '../lib/config';

export default function NewAlbumDialog({ open, onClose }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;

    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const response = await fetch(getApiUrl(CONFIG.API.ENDPOINTS.ALBUMS + `?username=${user.username}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: name.trim() })
      });

      if (!response.ok) throw new Error('Failed to create album');

      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Failed to create album:', error);
      alert('Failed to create album');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Create New Album</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Album Name"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!name.trim() || loading}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}