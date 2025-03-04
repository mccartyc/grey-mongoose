import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccessRoute, hasPermission } from '../utils/permissions';

const ProtectedRoute = ({ children, requiredPermissions = [], requiredRole = null }) => {
  const { user, loading, userInfo } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }
  
  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check if user has the required role
  if (requiredRole && userInfo?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check if user has all required permissions
  if (requiredPermissions.length > 0) {
    const hasAllRequired = requiredPermissions.every(permission => 
      hasPermission(userInfo, permission)
    );
    
    if (!hasAllRequired) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check if user can access the current route
  if (!canAccessRoute(userInfo, location.pathname)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;