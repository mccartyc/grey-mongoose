import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  // console.log('ProtectedRoute user state:', user);

  if (loading) {
    // Show a loading spinner or skeleton while checking authentication
    return <div>Loading...</div>;
    
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  console.log('ProtectedRoute user state:', user);

  // if (!loading) {
    return children;
  // }
};

export default ProtectedRoute;