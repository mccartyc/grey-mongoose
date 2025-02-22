// backend/routes/events.js
const express = require('express');
const router = express.Router();
const mongoose = require("mongoose");
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateObjectId, validateDate, sanitizeData } = require('../middleware/validation');
const rateLimit = require('express-rate-limit');
const Event = require('../models/Events');

// Rate limiting for event operations
const eventLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 event operations per window
});

// Ensure all routes require authentication
router.use(authenticateToken);
router.use(sanitizeData);

// Validate event data
const validateEventData = (req, res, next) => {
  const { title, start, end, clientId, category } = req.body;

  if (!title || !start || !end || !clientId || !category) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  // Validate dates
  if (!validateDate(start) || !validateDate(end)) {
    return res.status(400).json({ error: 'Invalid date format' });
  }

  // Ensure end date is after start date
  if (new Date(end) <= new Date(start)) {
    return res.status(400).json({ error: 'End date must be after start date' });
  }

  next();
};

// Audit logging middleware
const auditEventAction = (action) => (req, res, next) => {
  const log = {
    timestamp: new Date(),
    userId: req.user.userId,
    tenantId: req.user.tenantId,
    action,
    eventId: req.params.id || 'new_event',
    clientId: req.body.clientId || req.query.clientId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  };
  
  // Log to secure audit system
  console.log('Event Action Audit:', JSON.stringify(log));
  next();
};

// GET all events for the logged-in user
router.get('/',
  auditEventAction('VIEW_EVENTS'),
  async (req, res) => {
    try {
      const events = await Event.find({ userId: req.user.userId });
      res.json(events);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// POST a new event
router.post('/',
  eventLimiter,
  validateEventData,
  auditEventAction('CREATE_EVENT'),
  async (req, res) => {
    const { title, description, category, start, end, allDay, clientId, userId, tenantId } = req.body;

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
      res.status(201).json(event);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

// PUT to update an existing event
router.put('/:id',
  validateObjectId,
  validateEventData,
  auditEventAction('UPDATE_EVENT'),
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) return res.status(404).json({ message: 'Event not found' });

      Object.assign(event, req.body, { updatedAt: Date.now() });
      await event.save();

      res.json(event);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

// DELETE an event
router.delete('/:id',
  validateObjectId,
  auditEventAction('DELETE_EVENT'),
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) return res.status(404).json({ message: 'Event not found' });

      await event.remove();
      res.json({ message: 'Event deleted' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);


// Get future events for a specific client
router.get('/client/:clientId', authenticateToken, async (req, res) => {
  const { clientId } = req.params;
  const { tenantId, userId, sortBy = 'start', order = 'asc' } = req.query;

  try {
    // Validate required parameters
    if (!clientId || !tenantId) {
      return res.status(400).json({ error: 'Client ID and Tenant ID are required' });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(clientId) || !mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Get current date at start of day
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Create sort object
    const sortObject = {};
    sortObject[sortBy] = order === 'desc' ? -1 : 1;

    // Find future events for the client
    const events = await Event.find({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      clientId: new mongoose.Types.ObjectId(clientId),
      start: { $gte: currentDate },
      isActive: true
    })
    .sort(sortObject)
    .populate('clientId', 'firstname lastname email') // Populate client details
    .populate('userId', 'firstname lastname') // Populate user (therapist) details
    .select('-__v');

    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching client events:', error);
    res.status(500).json({ 
      error: 'Failed to fetch client events', 
      details: error.message 
    });
  }
});

module.exports = router;
