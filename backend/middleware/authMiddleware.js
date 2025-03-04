// File: backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/Users'); 

const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header must start with Bearer' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is active
    const user = await User.findOne({ 
      _id: decoded.userId,
      isActive: true 
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to check if user has required role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized for this action' });
    }
    
    next();
  };
};

// Middleware to check if user can create users with specific roles
const authorizeUserCreation = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const userRole = req.user.role;
  const requestedRole = req.body.role;

  // Internal users can create any role
  if (userRole === 'Internal') {
    return next();
  }

  // Admin users can only create Admin and User roles
  if (userRole === 'Admin' && (requestedRole === 'Admin' || requestedRole === 'User')) {
    return next();
  }

  // User role can't create other users
  return res.status(403).json({ message: 'Not authorized to create users with this role' });
};

// Middleware to check if user can manage tenants (only Internal users)
const authorizeTenantManagement = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (req.user.role !== 'Internal') {
    return res.status(403).json({ message: 'Not authorized to manage tenants' });
  }

  next();
};

module.exports = { 
  authenticateToken, 
  authorize,
  authorizeUserCreation,
  authorizeTenantManagement
};
