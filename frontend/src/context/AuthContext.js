import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Add this to prevent unnecessary re-renders when setting user data
  const setUserData = useCallback((authData, userInfoData) => {
    setUser(authData);
    if (userInfoData) {
      setUserInfo(userInfoData);
    }
  }, []);

  const clearAuthData = useCallback(() => {
    localStorage.removeItem('accessToken');
    setUser(null);
    setUserInfo(null);
  }, []);

  const isTokenValid = useCallback((token) => {
    if (!token) return false;
    try {
      const decoded = jwtDecode(token);
      const isValid = decoded.exp * 1000 > Date.now();
      if (!isValid) {
        clearAuthData();
      }
      return isValid;
    } catch (error) {
      console.error('Invalid token:', error.message);
      clearAuthData();
      return false;
    }
  }, [clearAuthData]);

  const fetchUserInfo = useCallback(async (token, tenantId, userId) => {
    if (!token || !tenantId || !userId) return null;
    
    try {
      const response = await api.get(
        `/users/user?tenantId=${tenantId}&_id=${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching user info:', error);
      if (error.response?.status === 401) {
        clearAuthData();
        navigate('/login');
      }
      return null;
    }
  }, [clearAuthData, navigate]);

  const loadUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token || !isTokenValid(token)) {
        clearAuthData();
        setLoading(false);
        return;
      }

      const decodedToken = jwtDecode(token);
      const userData = {
        token,
        decodedToken,
        userId: decodedToken.userId,
        tenantId: decodedToken.tenantId,
      };

      const userInfoData = await fetchUserInfo(
        token,
        userData.tenantId,
        userData.userId
      );

      if (userInfoData) {
        setUserData(userData, userInfoData);
      } else {
        clearAuthData();
      }
    } catch (error) {
      console.error('Error loading user:', error);
      clearAuthData();
    } finally {
      setLoading(false);
    }
  }, [clearAuthData, fetchUserInfo, isTokenValid, setUserData]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async ({ email, password, mfaCode }) => {
    try {
      const response = await api.post('/auth/login', { email, password, mfaCode });
      
      // Check if MFA is required
      if (response.data.requireMFA) {
        return response.data;
      }
      
      const { token, user: userData } = response.data;
      if (!token) {
        throw new Error('No token received from server');
      }

      const decodedToken = jwtDecode(token);
      const authData = {
        token,
        decodedToken,
        userId: decodedToken.userId,
        tenantId: decodedToken.tenantId,
      };

      localStorage.setItem('accessToken', token);

      const userInfoData = await fetchUserInfo(
        token,
        decodedToken.tenantId,
        decodedToken.userId
      );

      if (userInfoData) {
        setUserData(authData, userInfoData);
        navigate('/dashboard');
      } else {
        throw new Error('Failed to fetch user info');
      }
    } catch (error) {
      console.error('Login error:', error);
      clearAuthData();
      
      if (error.response?.status === 429) {
        throw new Error('Too many login attempts. Please wait a few minutes and try again.');
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else {
        throw new Error('Failed to login. Please try again.');
      }
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await api.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
      navigate('/login');
    }
  };

  const value = {
    user,
    userInfo,
    loading,
    login,
    logout,
    clearAuthData,
    setUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
};

export default AuthContext;
