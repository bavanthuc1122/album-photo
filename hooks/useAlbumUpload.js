const useAlbumUpload = () => {
    const [uploadState, setUploadState] = useState({
      uploading: false,
      progress: 0,
      error: null,
      uploadedCount: 0
    });
  
    const uploadToAlbum = async (files, links, albumId) => {
      try {
        setUploadState(prev => ({ ...prev, uploading: true, error: null }));
        
        // Prepare uploads
        const fileUploads = files.map(file => uploadFile(file, albumId));
        const linkUploads = links.filter(Boolean).map(link => uploadLink(link, albumId));
        
        const total = fileUploads.length + linkUploads.length;
        let completed = 0;
  
        // Progress handler
        const updateProgress = () => {
          completed++;
          setUploadState(prev => ({
            ...prev,
            progress: (completed / total) * 100,
            uploadedCount: completed
          }));
        };
  
        // Upload with progress
        await Promise.all([
          ...fileUploads.map(p => p.then(updateProgress)),
          ...linkUploads.map(p => p.then(updateProgress))
        ]);
  
        return true;
      } catch (error) {
        setUploadState(prev => ({ ...prev, error: error.message }));
        return false;
      } finally {
        setUploadState(prev => ({ ...prev, uploading: false }));
      }
    };
  
    const stopUpload = () => {
      // Implement upload cancellation logic
      setUploadState({
        uploading: false,
        progress: 0,
        error: null,
        uploadedCount: 0
      });
    };
  
    return {
      ...uploadState,
      uploadToAlbum,
      stopUpload
    };
  };