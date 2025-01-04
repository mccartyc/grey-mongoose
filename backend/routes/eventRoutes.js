// backend/routes/events.js
const express = require('express');
const router = express.Router();
const mongoose = require("mongoose");
const { protect } = require("../middleware/authMiddleware");
const Event = require('../models/Event');



// GET all events for the logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const events = await Event.find({ userId: req.user.id });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new event
router.post('/', protect, async (req, res) => {
  const { title, description, category, start, end, allDay } = req.body;

  try {
    const event = new Event({
      userId: req.user.id,
      title,
      description,
      category,
      start,
      end,
      allDay
    });

    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT to update an existing event
router.put('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

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
    if (event.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    await event.remove();
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
