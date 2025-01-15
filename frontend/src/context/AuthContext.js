import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Correct import
import axios from 'axios';

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null); // User token & details
  const [userInfo, setUserInfo] = useState(null); // User profile info
  const [loading, setLoading] = useState(true); // Tracks loading state
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

  const fetchUserInfo = async (token, tenantId, userId) => {
    try {
      const response = await axios.get(
        `http://localhost:5001/api/users/user?tenantId=${tenantId}&userId=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data; // Return fetched user info
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('accessToken');
      console.log('Token loaded from localStorage:', token);

      if (token && isTokenValid(token)) {
        try {
          const decodedToken = jwtDecode(token);
          const userData = {
            token,
            decodedToken,
            userId: decodedToken.userId,
            tenantId: decodedToken.tenantId,
          };
          console.log('Decoded token:', decodedToken);
          setUser(userData);

          // Fetch user info and wait for it to complete
          const userInfoData = await fetchUserInfo(
            token,
            userData.tenantId,
            userData.userId
          );
          setUserInfo(userInfoData); // Cache user info in state
          console.log('User Info fetched and set:', userInfoData);
        } catch (error) {
          console.error('Error decoding token or fetching user info:', error);
          localStorage.removeItem('accessToken'); // Clean up invalid token
        }
      } else {
        // If no valid token is found, clear localStorage
        console.log('No valid token found, clearing accessToken');
        localStorage.removeItem('accessToken');
      }

      // Set loading to false after all checks and fetches
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = (userData) => {
    console.log('Login function called with:', userData);
    setUser(userData);
    localStorage.setItem('accessToken', userData.token); // Store accessToken
    console.log('Navigating to /dashboard');
    navigate('/dashboard'); // Navigate to a protected page
  };

  const logout = () => {
    console.log('User logged out');
    setUser(null);
    setUserInfo(null);
    localStorage.removeItem('accessToken'); // Remove token
    navigate('/login'); // Navigate to login page
  };

  return (
    <AuthContext.Provider value={{ user, userInfo, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
