const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const router = express.Router();
const mongoose = require("mongoose");
const Session = require("../models/Sessions"); // Adjust the path as necessary
const rateLimit = require('express-rate-limit');

// Rate limiting for session operations
const sessionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 session operations per window
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
  if (!Number.isInteger(length) || length <= 0 || length > 480) {
    return res.status(400).json({ error: 'Invalid session duration' });
  }

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
    res.status(201).json({
      _id: newSession._id,
      date: newSession.date,
      type: newSession.type
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

    const sessions = await Session.find(query).sort(sortOptions); // Apply sorting on query

    if (sessions.length === 0) {
      console.log("No sessions found for this client.");
      return res.status(404).json({ error: "No sessions found" });
    }

    console.log("Retrieved client sessions:", sessions);
    res.status(200).json(sessions);
  } catch (error) {
    console.error("Error retrieving client sessions:", error);
    res.status(500).json({ 
      error: 'Failed to fetch client sessions',
      requestId: req.requestId
    });
  }
});

// PUT: Edit an existing session
router.put("/:sessionId", auditSessionAction('UPDATE_SESSION'), async (req, res) => {
  const { sessionId } = req.params;
  const { date, timeMet, notes } = req.body;

  console.log("Request to update session:", { sessionId, date, length, type, notes });

  try {
    const updatedSession = await Session.findByIdAndUpdate(
      sessionId,
      { date, timeMet, notes },
      { new: true } // Return the updated session
    );

    if (!updatedSession) {
      console.log(`Session with ID ${sessionId} not found`);
      return res.status(404).json({ error: "Session not found" });
    }

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
      requestId: req.requestId
    });
  }
});

// PATCH: Archive a session (set isActive to false)
router.patch("/:sessionId/archive", auditSessionAction('ARCHIVE_SESSION'), async (req, res) => {
  const { sessionId } = req.params;

  console.log("Request to archive session with ID:", sessionId);

  try {
    const archivedSession = await Session.findByIdAndUpdate(
      sessionId,
      { isActive: false },
      { new: true } // Return the updated session
    );

    if (!archivedSession) {
      console.log(`Session with ID ${sessionId} not found`);
      return res.status(404).json({ error: "Session not found" });
    }

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

module.exports = router;