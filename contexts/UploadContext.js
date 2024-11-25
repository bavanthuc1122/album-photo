import React, { createContext, useContext, useState } from 'react';

const UploadContext = createContext();

export const UploadProvider = ({ children }) => {
  const [uploads, setUploads] = useState({});
  const [showProgress, setShowProgress] = useState(false);

  const addUpload = (albumId, uploadData) => {
    setUploads(prev => ({
      ...prev,
      [albumId]: uploadData
    }));
  };

  const updateUpload = (albumId, data) => {
    setUploads(prev => ({
      ...prev,
      [albumId]: {
        ...prev[albumId],
        ...data
      }
    }));
  };

  const removeUpload = (albumId) => {
    setUploads(prev => {
      const newUploads = { ...prev };
      delete newUploads[albumId];
      return newUploads;
    });
  };

  return (
    <UploadContext.Provider value={{
      uploads,
      showProgress,
      setShowProgress,
      addUpload,
      updateUpload,
      removeUpload
    }}>
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
};