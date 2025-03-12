import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUserData, clearAuthData } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        
        if (!token) {
          console.error('No token received');
          throw new Error('No token received');
        }

        // Decode and validate the token
        const decodedToken = jwtDecode(token);
        const { userId, tenantId, role, email, firstname, lastname } = decodedToken;

        if (!userId || !tenantId || !role) {
          console.error('Invalid token data:', { userId, tenantId, role });
          throw new Error('Invalid token data');
        }

        // Store token in localStorage
        localStorage.setItem('accessToken', token);

        // Create auth data object with all user info
        const authData = {
          token,
          decodedToken,
          userId,
          tenantId,
          role
        };

        // Create user info object
        const userInfo = {
          email,
          firstname,
          lastname,
          role,
          tenantId
        };

        // Set auth state with user info
        setUserData(authData, userInfo);

        // Redirect to dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('Auth callback error:', error);
        clearAuthData(); // Clear any partial auth state
        navigate('/login?error=' + encodeURIComponent(error.message || 'auth_failed'));
      }
    };

    handleCallback();
  }, [location, navigate, setUserData, clearAuthData]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600 text-center">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
