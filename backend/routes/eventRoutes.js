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

// GET all events for the logged-in user with optional date filtering
router.get('/',
  auditEventAction('VIEW_EVENTS'),
  async (req, res) => {
    try {
      const { tenantId, userId, startDate, endDate, sortBy = 'start', order = 'asc' } = req.query;
      
      // Build query
      const query = { userId: req.user.userId };
      
      // Add date range filtering if provided
      if (startDate || endDate) {
        query.start = {};
        if (startDate) query.start.$gte = new Date(startDate);
        if (endDate) query.start.$lte = new Date(endDate);
      }
      
      // Determine sort options
      const sortOptions = {};
      sortOptions[sortBy] = order === 'desc' ? -1 : 1;
      
      console.log('Query:', query);
      
      // Fetch events without population first
      let events = await Event.find(query).sort(sortOptions);
      console.log('Raw events:', events.map(e => ({ 
        id: e._id, 
        title: e.title, 
        clientId: e.clientId
      })));
      
      // If there are client sessions, populate client names
      const clientEvents = events.filter(event => event.clientId && event.category === 'Client Session');
      
      if (clientEvents.length > 0) {
        // Get all client IDs - ensure they're properly converted to ObjectId if needed
        const clientIds = clientEvents.map(event => {
          // Convert string IDs to ObjectId if needed
          const clientId = event.clientId.toString();
          return mongoose.Types.ObjectId.isValid(clientId) ? 
            new mongoose.Types.ObjectId(clientId) : clientId;
        });
        
        console.log('Client IDs to look up:', clientIds);
        
        // Fetch client information
        const Client = require('../models/Clients');
        const clients = await Client.find({ _id: { $in: clientIds } });
        
        console.log('Found clients:', clients.map(c => ({ 
          id: c._id, 
          name: `${c.firstName} ${c.lastName}` 
        })));
        
        // Create a map of client IDs to names
        const clientMap = {};
        clients.forEach(client => {
          clientMap[client._id.toString()] = `${client.firstName} ${client.lastName}`;
        });
        
        // Add client names to events
        events = events.map(event => {
          const eventObj = event.toObject();
          const eventClientId = event.clientId.toString();
          
          if (event.clientId && clientMap[eventClientId]) {
            eventObj.clientName = clientMap[eventClientId];
            console.log(`Added client name to event ${event._id}: ${eventObj.clientName}`);
          } else if (event.clientId) {
            // Try to fetch this specific client directly
            console.log(`No client found in batch for ID ${eventClientId}, will try direct lookup`);
            
            // We'll add a placeholder for now
            eventObj.clientName = `Client ID: ${eventClientId.substring(0, 8)}...`;
            
            // Set up an async lookup that will happen after this response
            (async () => {
              try {
                const singleClient = await Client.findById(eventClientId);
                if (singleClient) {
                  console.log(`Found client by direct lookup: ${singleClient.firstName} ${singleClient.lastName}`);
                } else {
                  console.log(`Still no client found for ID ${eventClientId}`);
                }
              } catch (err) {
                console.error(`Error in direct client lookup: ${err.message}`);
              }
            })();
          }
          return eventObj;
        });
      }
      
      res.json(events);
    } catch (err) {
      console.error('Error fetching events:', err);
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
router.get('/client/:clientId', 
  validateObjectId,
  auditEventAction('VIEW_CLIENT_EVENTS'),
  async (req, res) => {
  const { clientId } = req.params;
  const { tenantId, userId, sortBy = 'start', order = 'asc' } = req.query;

  try {
    // Validate required parameters
    if (!clientId || !tenantId) {
      return res.status(400).json({ error: 'Client ID and Tenant ID are required' });
    }
    
    console.log(`Fetching events for client: ${clientId}`);

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

    console.log(`Looking for events with clientId: ${clientId}, tenantId: ${tenantId}`);

    
    // Check all events in the system to find matches by string comparison
    const allEvents = await Event.find({});
    console.log(`Total events in system: ${allEvents.length}`);
    
    // Check for string equality and object ID equality
    const matchingEvents = allEvents.filter(event => {
      // Convert to string for comparison if needed
      const eventClientId = event.clientId ? event.clientId.toString() : null;
      const matches = eventClientId === clientId;
      if (matches) {
        console.log(`Found matching event: ${event._id}, clientId: ${eventClientId}`);
      }
      return matches;
    });
    
    console.log(`Found ${matchingEvents.length} matching events by string comparison for client ${clientId}`);
    
    // Use the matching events directly
    const events = matchingEvents.filter(event => {
      // Need to convert dates to comparable format
      const eventDate = new Date(event.start);
      const matches = eventDate >= currentDate && event.category === 'Client Session';
      console.log(`Event ${event._id} date comparison: ${eventDate} >= ${currentDate} = ${eventDate >= currentDate}`);
      return matches;
    });
    
    console.log('Current date for comparison:', currentDate);
    console.log('Filtered events by date:', events.map(e => ({
      id: e._id,
      start: e.start,
      date: new Date(e.start),
      comparison: new Date(e.start) >= currentDate
    })));
    
    // Sort the filtered events
    events.sort((a, b) => {
      if (sortBy === 'start') {
        return order === 'desc' ? new Date(b.start) - new Date(a.start) : new Date(a.start) - new Date(b.start);
      }
      return 0;
    });
    
    // Log the raw events found
    console.log(`Found ${events.length} events:`, events.map(e => ({
      id: e._id,
      title: e.title,
      start: e.start,
      category: e.category
    })));
    
    // Get client information directly
    const Client = require('../models/Clients');
    try {
      const client = await Client.findById(clientId);
      if (client) {
        const clientName = `${client.firstName} ${client.lastName}`;
        console.log(`Found client: ${clientName}`);
        
        // Add client name to all events
        const formattedEvents = events.map(event => {
          const eventObj = event.toObject();
          eventObj.clientName = clientName;
          eventObj.date = event.start; // Add date field for consistency with sessions
          return eventObj;
        });
                
        console.log(`Returning ${formattedEvents.length} events for client ${clientName}`);
        res.status(200).json(formattedEvents);
      } else {
        console.log(`Client not found for ID: ${clientId}`);
        res.status(200).json(events);
      }
    } catch (error) {
      console.error(`Error fetching client: ${error.message}`);
      res.status(200).json(events);
    }
  } catch (error) {
    console.error('Error fetching client events:', error);
    res.status(500).json({ 
      error: 'Failed to fetch client events', 
      details: error.message 
    });
  }
});

module.exports = router;
