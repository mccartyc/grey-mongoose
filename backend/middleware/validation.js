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

// Validate client data
const validateClientData = (req, res, next) => {
  try {
    console.log(`[${req.requestId}] Validating client data`);
    const { email, phone, birthday } = req.body;

    // Skip validation for encrypted fields
    if (email && typeof email === 'string' && !email.includes(':')) {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.error(`[${req.requestId}] Invalid email format:`, email);
        return res.status(400).json({ error: "Invalid email format" });
      }
      console.log(`[${req.requestId}] Email validation passed`);
    } else {
      console.log(`[${req.requestId}] Skipping email validation for encrypted or missing email`);
    }

    // Phone validation - skip if encrypted
    if (phone && typeof phone === 'string' && !phone.includes(':')) {
      // Remove non-digit characters for validation
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        console.error(`[${req.requestId}] Invalid phone number length:`, cleanPhone.length);
        return res.status(400).json({ error: "Invalid phone number" });
      }
      console.log(`[${req.requestId}] Phone validation passed`);
    } else {
      console.log(`[${req.requestId}] Skipping phone validation for encrypted or missing phone`);
    }

    // Birthday validation - skip if encrypted or not provided
    if (birthday && typeof birthday === 'string' && !birthday.includes(':')) {
      try {
        console.log(`[${req.requestId}] Validating birthday:`, birthday, "Type:", typeof birthday);
        
        // Check if it's already in ISO format (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
          console.log(`[${req.requestId}] Birthday is in ISO format`);
          const date = new Date(birthday);
          if (isNaN(date.getTime())) {
            console.error(`[${req.requestId}] Invalid ISO date:`, birthday);
            return res.status(400).json({ error: "Invalid birthday format" });
          }
          
          // Check if date is in the future
          if (date > new Date()) {
            console.error(`[${req.requestId}] Birthday is in the future:`, birthday);
            return res.status(400).json({ error: "Birthday cannot be in the future" });
          }
        } else {
          // Try to parse as a date
          const date = new Date(birthday);
          if (isNaN(date.getTime())) {
            console.error(`[${req.requestId}] Invalid date format:`, birthday);
            return res.status(400).json({ error: "Invalid birthday format" });
          }
          
          // Check if date is in the future
          if (date > new Date()) {
            console.error(`[${req.requestId}] Birthday is in the future:`, birthday);
            return res.status(400).json({ error: "Birthday cannot be in the future" });
          }
          
          console.log(`[${req.requestId}] Birthday parsed as:`, date.toISOString().split('T')[0]);
        }
        
        console.log(`[${req.requestId}] Birthday validation passed`);
      } catch (error) {
        console.error(`[${req.requestId}] Error validating birthday:`, error);
        return res.status(400).json({ error: "Invalid birthday format" });
      }
    } else {
      console.log(`[${req.requestId}] Skipping birthday validation for encrypted or missing birthday`);
    }

    console.log(`[${req.requestId}] Client data validation successful`);
    next();
  } catch (error) {
    console.error(`[${req.requestId}] Error in validation middleware:`, error.message);
    console.error(`[${req.requestId}] Error stack:`, error.stack);
    res.status(500).json({ 
      error: "Validation error", 
      details: error.message,
      requestId: req.requestId
    });
  }
};

module.exports = {
  validateObjectId,
  validateSession,
  sanitizeData,
  validateDate,
  validateEmail,
  validatePhone,
  validateClientData
};
