const mongoose = require('mongoose');

// Validate MongoDB ObjectId
const validateObjectId = (req, res, next) => {
  // Check all possible ID parameters
  const id = req.params.id || req.params.clientId || req.params.userId || req.params.tenantId || req.body.id;
  
  if (!id) {
    console.log('No ID found in request:', {
      params: req.params,
      bodyId: req.body.id
    });
    return res.status(400).json({ 
      error: 'ID is required',
      details: {
        params: req.params,
        bodyId: req.body.id
      }
    });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.log('Invalid ID format:', id);
    return res.status(400).json({ 
      error: 'Invalid ID format',
      details: { providedId: id }
    });
  }
  
  next();
};

// Validate session data
const validateSession = (req, res, next) => {
  const sessionId = req.params.sessionId || req.body.sessionId;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    return res.status(400).json({ error: 'Invalid session ID format' });
  }

  next();
};

// Sanitize request data
const sanitizeData = (req, res, next) => {
  if (req.body) {
    // Remove any HTML tags from string inputs
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key]
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .trim();
      }
    });
  }
  next();
};

// Validate date format
const validateDate = (date) => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
};

// Validate email format
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number format
const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
};

module.exports = {
  validateObjectId,
  validateSession,
  sanitizeData,
  validateDate,
  validateEmail,
  validatePhone
};
