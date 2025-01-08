import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add a loading state
  const navigate = useNavigate();

  const login = (userData) => {
    console.log('Login function called with:', userData);    
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('accessToken', userData.token);
    console.log('Navigating to /dashboard');
    navigate('/dashboard'); // Navigate to a protected page
    // console.log(user)
  };

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    setUser(null);
  }, []); // No dependencies since it doesn't rely on external variables
  

  const validateToken = useCallback(async () => {
    const accessToken = localStorage.getItem('accessToken');
  
    if (!accessToken) {
      setLoading(false);
      return;
    }
  
    try {
      const { data } = await axios.get('http://localhost:5001/api/auth/validate', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
  
      if (data.accessToken) {
        // If a new token is provided, update localStorage
        localStorage.setItem('accessToken', data.accessToken);
      }
  
      setUser(data.user);
    } catch (error) {
      console.warn('Token validation failed:', error.response?.data || error.message);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {/* {children} */}
      {!loading && children} {/* Wait until token validation is complete */}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
