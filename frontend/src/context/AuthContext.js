import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // New loading state
  const navigate = useNavigate();

  const isTokenValid = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 > Date.now(); // Check expiration
    } catch (error) {
      console.error('Invalid token:', error.message);
      return false;
    }
  };

  useEffect(() => { 
    const token = localStorage.getItem('accessToken'); 
    console.log('Token loaded from localStorage:', token);
    if (token && isTokenValid(token)) { 
      try {
        const decodedToken = jwtDecode(token); 
        const userData = {
          token,
          decodedToken, 
          userId: decodedToken.userId, 
          tenantId: decodedToken.tenantId 
        }; 
        console.log('Decoded token:', decodedToken); 
        setUser(userData); 
        console.log('User state set in AuthContext:', userData); 
      } catch (error) {
        console.error('Error decoding token:', error); 
        localStorage.removeItem('accessToken');
      }
      setLoading(false); // Set loading to false after token check
    }
  }, []);

  const login = (userData) => {
    console.log('Login function called with:', userData);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    console.log('Navigating to /dashboard');
    navigate('/dashboard'); // Navigate to a protected page
    // console.log(user)
  };

  const logout = () => {
    console.log('User logged out');
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    navigate('/login');
  };


  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
