// backend/routes/events.js
const express = require('express');
const router = express.Router();
const mongoose = require("mongoose");
const { protect } = require("../middleware/authMiddleware");
const Event = require('../models/Events');


// GET all events for the logged-in user
router.get('/', protect, async (req, res) => {

  console.log('Incoming event get request:' ,  req.user.userId);

  try {
    const events = await Event.find({ userId: req.user.userId });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new event
router.post('/', protect, async (req, res) => {
  const { title, description, category, start, end, allDay, clientId, userId, tenantId } = req.body;

  console.log("Incoming event request:", req.body); // Debug log

  if (!title || !start || !end || allDay === undefined) {
    console.error("Missing required fields:", { title, start, end, allDay });
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const event = new Event({
      tenantId,
      userId,
      clientId: category === "Client Session" ? clientId : null,
      title,
      description,
      category,
      start,
      end,
      allDay
    });

    await event.save();
    console.log("Event saved:", event);
    res.status(201).json(event);
  } catch (err) {
    console.error("Error saving event:", err.message);
    res.status(400).json({ message: err.message });
  }
});

// PUT to update an existing event
router.put('/:id', protect, async (req, res) => {

  console.log('Request to update event:', req.body);

  try {
    const event = await Event.findById(req.params.id);

    if (!event) return res.status(404).json({ message: 'Event not found' });

    Object.assign(event, req.body, { updatedAt: Date.now() });
    await event.save();

    res.json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE an event
router.delete('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) return res.status(404).json({ message: 'Event not found' });

    await event.remove();
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
