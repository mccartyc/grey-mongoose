const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Session = require("../models/Sessions"); // Adjust the path as necessary
// const { protect } = require("../middleware/authMiddleware"); // If you have an auth middleware

// POST: Create a new session
router.post("/", async (req, res) => {
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


// GET: Retrieve sessions for a specific tenantId and userId
router.get("/", async (req, res) => {
  const { tenantId, userId } = req.query;

  console.log("Request to get sessions:", { tenantId, userId });

  if (!tenantId || !userId) {
    console.error("Validation error: Missing tenantId or userId");
    return res.status(400).json({ error: "Missing tenantId or userId" });
  }

  try {
    const sessions = await Session.find({ tenantId, userId, isActive: true }); // Including isActive filter if needed
    console.log("Retrieved sessions:", sessions);
    res.status(200).json(sessions);
  } catch (error) {
    console.error("Error retrieving sessions:", error);
    res.status(500).json({ error: "Server error" });
  }
});


// PUT: Edit an existing session
router.put("/:sessionId", async (req, res) => {
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
router.patch("/:sessionId/archive", async (req, res) => {
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