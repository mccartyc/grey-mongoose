import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  // console.log('ProtectedRoute user state:', user);

  if (loading) {
    // Spinner while loading
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
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