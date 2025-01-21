const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();
const mongoose = require("mongoose");
const Session = require("../models/Sessions"); // Adjust the path as necessary
// const { protect } = require("../middleware/authMiddleware"); // If you have an auth middleware

// POST: Create a new session
router.post("/", protect, async (req, res) => {
  const {
    tenantId,
    clientId,
    userId,
    date,
    length,
    type,
    notes,
  } = req.body;

  console.log("Request to create session:", {
    tenantId,
    clientId,
    userId,
    date,
    length,
    type,
    notes,
  });

  // Check if all required fields are provided
  if (!tenantId || !clientId || !userId || !date || !length || !type) {
    console.error("Validation error: Missing required fields");
    return res.status(400).json({ error: "Missing required fields" });
  }

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
    });

    await newSession.save();
    console.log("Session created successfully:", newSession);
    res.status(201).json(newSession);
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ error: "Server error" });
  }
});


// GET: Retrieve sessions for a specific tenantId and userId with optional sorting
router.get("/", protect, async (req, res) => {
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

    const sessions = await Session.find(query).sort(sortOptions); // Include sort on query
    console.log("Retrieved sessions:", sessions);
    res.status(200).json(sessions);
  } catch (error) {
    console.error("Error retrieving sessions:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// New GET: Retrieve session details for a specific client with optional sorting
router.get("/client/:clientId", protect, async (req, res) => {
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
    res.status(500).json({ error: "Server error" });
  }
});

// PUT: Edit an existing session
router.put("/:sessionId", protect, async (req, res) => {
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
    res.status(200).json(updatedSession);
  } catch (error) {
    console.error("Error updating session:", error);
    res.status(500).json({ error: "Failed to update session" });
  }
});

// PATCH: Archive a session (set isActive to false)
router.patch("/:sessionId/archive", protect, async (req, res) => {
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
    res.status(500).json({ error: "Failed to archive session" });
  }
});

module.exports = router;