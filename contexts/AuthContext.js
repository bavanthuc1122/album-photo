export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Load user từ localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // Decode token để lấy username
      const decoded = jwt_decode(token);
      setUser(decoded);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}; 