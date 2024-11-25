// Utility functions for handling Base64 URL state
export const urlStateManager = {
    // Encode state thành base64 string
    encodeState: (state) => {
      try {
        return btoa(JSON.stringify(state));
      } catch (error) {
        console.error('Error encoding state:', error);
        return null;
      }
    },
  
    // Decode base64 string thành state object
    decodeState: (encodedState) => {
      try {
        return JSON.parse(atob(encodedState));
      } catch (error) {
        console.error('Error decoding state:', error);
        return null;
      }
    },
  
    // Update URL với state mới
    updateUrlWithState: (router, albumName, state) => {
      const encodedState = urlStateManager.encodeState(state);
      if (encodedState) {
        router.push(
          `/albums/${albumName}?state=${encodedState}`,
          undefined,
          { shallow: true }
        );
      }
    },
  
    // Lấy state từ URL
    getStateFromUrl: (router) => {
      const { state } = router.query;
      if (state) {
        return urlStateManager.decodeState(state);
      }
      return null;
    },
  
    // Tạo state object mới
    createNewState: (liked, metadata = {}) => {
      return {
        liked,
        albumId: metadata.id,
        timestamp: Date.now()
      };
    }
  };