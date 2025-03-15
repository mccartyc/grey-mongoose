const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const router = express.Router();
const mongoose = require("mongoose");
const Session = require("../models/Sessions"); // Adjust the path as necessary
const rateLimit = require('express-rate-limit');
const CryptoJS = require('crypto-js');

// Utility functions for encryption/decryption
const decryptText = (encryptedText) => {
  if (!encryptedText) return '';
  
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    console.error('Encryption key not found in environment variables');
    return 'Error: Encryption key not configured';
  }
  
  try {
    // Check if the text contains a colon which would indicate the special format
    if (encryptedText.includes(':')) {
      const [ciphertext, iv] = encryptedText.split(':');
      
      // Validate that both parts exist and look like hex
      if (!ciphertext || !iv || !/^[0-9a-f]+$/i.test(ciphertext) || !/^[0-9a-f]+$/i.test(iv)) {
        console.warn('Invalid encrypted format, returning original text');
        return encryptedText;
      }
      
      try {
        // Create key and IV word arrays
        const keyWordArray = CryptoJS.enc.Hex.parse(key.substring(0, 32));
        const ivWordArray = CryptoJS.enc.Hex.parse(iv);
        
        // Decrypt with the parsed key and IV
        const decrypted = CryptoJS.AES.decrypt(
          { ciphertext: CryptoJS.enc.Hex.parse(ciphertext) },
          keyWordArray,
          { 
            iv: ivWordArray,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
          }
        );
        
        // Try to convert to UTF-8 string
        try {
          const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
          if (decryptedText && decryptedText.length > 0) {
            return decryptedText;
          }
        } catch (utf8Error) {
          console.error('Error converting decrypted data to UTF-8:', utf8Error.message);
          // Continue to try other methods
        }
      } catch (decryptError) {
        console.error('Error during decryption with IV:', decryptError.message);
        // Continue to try other methods
      }
    }
    
    // Try standard decryption as fallback
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (decryptedText && decryptedText.length > 0) {
        return decryptedText;
      }
    } catch (standardError) {
      console.error('Error with standard decryption:', standardError.message);
      // Return original if all decryption attempts fail
      return encryptedText;
    }
    
    return encryptedText;
  } catch (error) {
    console.error('Error during decryption:', error.message);
    return encryptedText;
  }
};

const encryptText = (text) => {
  if (!text) return '';
  
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    console.error('Encryption key not found in environment variables');
    throw new Error('Encryption key not configured');
  }
  
  try {
    // Create key word array
    const keyWordArray = CryptoJS.enc.Hex.parse(key.substring(0, 32));
    
    // Use fixed IV if available, otherwise generate random
    let iv;
    if (process.env.ENCRYPTION_IV) {
      iv = CryptoJS.enc.Hex.parse(process.env.ENCRYPTION_IV);
    } else {
      iv = CryptoJS.lib.WordArray.random(16);
    }
    
    // Encrypt the text
    const encrypted = CryptoJS.AES.encrypt(text, keyWordArray, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    // Format as ciphertext:iv
    return encrypted.ciphertext.toString(CryptoJS.enc.Hex) + ':' + iv.toString(CryptoJS.enc.Hex);
  } catch (error) {
    console.error('Error during encryption:', error.message);
    // Return original text if encryption fails
    return text;
  }
};

// Rate limiting for session operations
const sessionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500 // increased from 100 to 500 requests per window
});

// Ensure all routes require authentication
router.use(authenticateToken);

// Validate session creation data
const validateSessionData = (req, res, next) => {
  const {
    tenantId,
    clientId,
    userId,
    date,
    length,
    type,
    notes,
    transcript
  } = req.body;

  if (!tenantId || !clientId || !userId || !date || !length || !type) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  // Validate date
  const sessionDate = new Date(date);
  const now = new Date();
  if (isNaN(sessionDate.getTime()) || sessionDate > now) {
    return res.status(400).json({ error: 'Invalid session date' });
  }

  // Validate duration (in minutes)
  const sessionLength = parseInt(length, 10);
  if (isNaN(sessionLength) || sessionLength <= 0 || sessionLength > 480) {
    return res.status(400).json({ error: 'Session duration must be between 1 and 480 minutes' });
  }
  // Convert length to number for storage
  req.body.length = sessionLength;

  // We don't need to decrypt notes or transcript here as they're already encrypted
  // from the frontend and we'll store them encrypted in the database

  next();
};

// Audit logging middleware
const auditSessionAction = (action) => (req, res, next) => {
  const log = {
    timestamp: new Date(),
    userId: req.user.userId,
    tenantId: req.user.tenantId,
    action,
    sessionId: req.params.id || 'new_session',
    clientId: req.body.clientId || req.query.clientId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  };
  
  // Log to secure audit system
  console.log('Session Action Audit:', JSON.stringify(log));
  next();
};

// POST: Create a new session
router.post("/", sessionLimiter, validateSessionData, auditSessionAction('CREATE_SESSION'), async (req, res) => {
  const {
    tenantId,
    clientId,
    userId,
    date,
    length,
    type,
    notes,
    transcript
  } = req.body;

  console.log("Request to create session:", {
    tenantId,
    clientId,
    userId,
    date,
    length,
    type
  });

  try {
    // Create the new session
    const newSession = new Session({
      tenantId,
      clientId,
      userId,
      date,
      length,
      type,
      notes,
      transcript,
    });

    await newSession.save();
    console.log("Session created successfully:", newSession);
    
    // Only send back non-sensitive data
    res.status(201).json({
      _id: newSession._id,
      date: newSession.date,
      type: newSession.type,
      length: newSession.length
    });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ 
      error: 'Failed to create session',
      requestId: req.requestId
    });
  }
});

// GET: Retrieve sessions for a specific tenantId and userId with optional sorting
router.get("/", auditSessionAction('VIEW_SESSIONS'), async (req, res) => {
  const { tenantId, userId, sortBy, order } = req.query; // Destructure sortBy and order from req.query

  console.log("Request to get sessions:", { tenantId, userId, sortBy, order });

  if (!tenantId || !userId) {
    console.error("Validation error: Missing tenantId or userId");
    return res.status(400).json({ error: "Missing tenantId or userId" });
  }

  try {
    // Base query for sessions
    const query = { tenantId, userId, isActive: true }; 
    
    // Determine sorting
    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = order === 'desc' ? -1 : 1; // Sort by the specified field and order
    }

    const sessions = await Session.find(query)
      .populate("clientId", "firstName lastName")
      .sort(sortOptions); // Include sort on query
    console.log("Retrieved sessions:", sessions);
    res.status(200).json(sessions);
  } catch (error) {
    console.error("Error retrieving sessions:", error);
    res.status(500).json({ 
      error: 'Failed to fetch sessions',
      requestId: req.requestId
    });
  }
});



// New GET: Retrieve session details for a specific client with optional sorting
router.get("/client/:clientId", auditSessionAction('VIEW_CLIENT_SESSIONS'), async (req, res) => {
  const { tenantId, userId, sortBy, order } = req.query; // Destructure sortBy and order from req.query
  const { clientId } = req.params;

  console.log("Request to get session details for client:", { tenantId, userId, clientId, sortBy, order });

  if (!tenantId || !userId || !clientId) {
    console.error("Validation error: Missing tenantId, userId, or clientId");
    return res.status(400).json({ error: "Missing tenantId, userId, or clientId" });
  }

  try {
    // Base query for sessions
    const query = { tenantId, userId, clientId, isActive: true };

    // Determine sorting
    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = order === 'desc' ? -1 : 1; // Sort by the specified field and order
    }

    const sessions = await Session.find(query).sort(sortOptions);
    
    // Convert sessions to plain objects but don't encrypt/decrypt
    // The frontend will handle decryption
    const processedSessions = sessions.map(session => {
      const data = session.toObject();
      return data;
    });

    if (processedSessions.length === 0) {
      console.log("No sessions found for this client.");
      return res.status(404).json({ error: "No sessions found" });
    }

    console.log("Retrieved client sessions:", processedSessions);
    res.status(200).json(processedSessions);
  } catch (error) {
    console.error("Error retrieving client sessions:", error);
    res.status(500).json({ 
      error: 'Failed to fetch client sessions',
      requestId: req.requestId
    });
  }
});

// PUT: Edit an existing session
router.put("/detail/:sessionId", auditSessionAction('UPDATE_SESSION'), async (req, res) => {
  const { sessionId } = req.params;
  const { notes, tenantId, userId } = req.body;

  console.log("Request to update session:", { sessionId, notes: notes ? "Present" : "Not present" });

  try {
    // Validate required data
    if (!sessionId || !tenantId || !userId) {
      return res.status(400).json({ 
        error: 'Required fields missing',
        details: 'Session ID, tenant ID, and user ID are required'
      });
    }

    // Create update data object with only the fields that are provided
    const updateData = {};
    
    // Handle notes specially to ensure they're properly encrypted
    if (notes) {
      // Check if notes are already encrypted (contains a colon)
      if (notes.includes(':')) {
        // Try to decrypt to validate format
        try {
          const decrypted = decryptText(notes);
          // If decryption succeeds, store as is
          updateData.notes = notes;
        } catch (decryptError) {
          // If decryption fails, try to encrypt
          console.warn('Received notes appear to be in encrypted format but could not be decrypted. Re-encrypting.');
          updateData.notes = encryptText(notes);
        }
      } else {
        // Not in encrypted format, encrypt it
        updateData.notes = encryptText(notes);
      }
    }

    console.log(`Looking for session with sessionId: ${sessionId}`);
    const existingSession = await Session.findOne({ sessionId: sessionId });
    
    if (!existingSession) {
      console.log(`Session with sessionId ${sessionId} not found`);
      return res.status(404).json({ error: "Session not found" });
    }
    
    // Check if the session belongs to the user's tenant
    if (existingSession.tenantId.toString() !== tenantId) {
      console.log(`Session with sessionId ${sessionId} does not belong to tenant ${tenantId}`);
      return res.status(403).json({ error: "Not authorized to update this session" });
    }

    const updatedSession = await Session.findByIdAndUpdate(
      existingSession._id,
      updateData,
      { new: true } // Return the updated session
    );

    console.log("Session updated successfully:", updatedSession);
    res.status(200).json({
      _id: updatedSession._id,
      date: updatedSession.date,
      type: updatedSession.type,
      updatedAt: updatedSession.updatedAt
    });
  } catch (error) {
    console.error("Error updating session:", error);
    res.status(500).json({ 
      error: 'Failed to update session',
      details: error.message
    });
  }
});

// PATCH: Archive a session (set isActive to false)
router.patch("/detail/:sessionId/archive", auditSessionAction('ARCHIVE_SESSION'), async (req, res) => {
  const { sessionId } = req.params;

  console.log("Request to archive session with ID:", sessionId);

  try {
    console.log(`Looking for session with sessionId: ${sessionId}`);
    const existingSession = await Session.findOne({ sessionId: sessionId });
    
    if (!existingSession) {
      console.log(`Session with sessionId ${sessionId} not found`);
      return res.status(404).json({ error: "Session not found" });
    }

    const archivedSession = await Session.findByIdAndUpdate(
      existingSession._id,
      { isActive: false },
      { new: true } // Return the updated session
    );

    console.log("Session archived successfully:", archivedSession);
    res.status(200).json(archivedSession);
  } catch (error) {
    console.error("Error archiving session:", error);
    res.status(500).json({ 
      error: 'Failed to archive session',
      requestId: req.requestId
    });
  }
});

// GET: Retrieve a single session by sessionId
router.get("/detail/:sessionId", auditSessionAction('VIEW_SESSION'), async (req, res) => {
  const { sessionId } = req.params;
  const { tenantId, userId } = req.query;

  console.log(`Request to get session with sessionId: ${sessionId}`);

  if (!sessionId || !tenantId || !userId) {
    console.error("Validation error: Missing sessionId, tenantId, or userId");
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    // Find the session by sessionId (UUID) not MongoDB _id
    console.log(`Looking for session with sessionId: ${sessionId}`);
    const session = await Session.findOne({ sessionId: sessionId });

    if (!session) {
      console.log(`Session with sessionId ${sessionId} not found`);
      return res.status(404).json({ error: "Session not found" });
    }

    // Check if the session belongs to the user's tenant
    if (session.tenantId.toString() !== tenantId) {
      console.log(`Session with sessionId ${sessionId} does not belong to tenant ${tenantId}`);
      return res.status(403).json({ error: "Not authorized to view this session" });
    }

    console.log("Session found:", session);
    res.status(200).json(session);
  } catch (error) {
    console.error("Error retrieving session:", error);
    res.status(500).json({ 
      error: 'Failed to fetch session',
      requestId: req.requestId
    });
  }
});

module.exports = router;