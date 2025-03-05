const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/validation');
const rateLimit = require('express-rate-limit');
const mongoose = require("mongoose");
const Client = require("../models/Clients");
const Session = require("../models/Sessions");
const Transcript = require("../models/Transcripts");

// Rate limiting for sensitive operations
const createClientLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50 // limit each IP to 50 client creations per window
});

// Ensure all routes require authentication
router.use(authenticateToken);

// Validation middleware for client data
const validateClientData = (req, res, next) => {
  const { firstName, lastName, birthday, email } = req.body;
  
  if (!firstName || !lastName || !birthday) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Validate date of birth format and reasonableness
  const dob = new Date(birthday);
  const now = new Date();
  if (isNaN(dob.getTime()) || dob > now) {
    return res.status(400).json({ error: 'Invalid date of birth' });
  }

  next();
};

// Audit logging middleware
const auditClientAction = (action) => (req, res, next) => {
  const log = {
    timestamp: new Date(),
    userId: req.user.userId,
    tenantId: req.user.tenantId,
    action,
    clientId: req.params.id || 'new_client',
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  };
  
  // Log to secure audit system
  console.log('Client Action Audit:', JSON.stringify(log));
  next();
};

// POST: Create a new client
router.post("/", 
  createClientLimiter,
  validateClientData,
  auditClientAction('CREATE_CLIENT'),
  async (req, res) => {
  const {
    tenantId,
    userId,
    firstName,
    lastName,
    streetAddress,
    birthday,
    gender,
    city,
    state,
    zipcode,
    email,
    phone,
  } = req.body;

  console.log("Request to create client:", {
    tenantId,
    userId,
    firstName,
    lastName,
    streetAddress,
    birthday,
    gender,
    city,
    state,
    zipcode,
    email,
    phone,
  });

  // Check if all required fields are provided
  if (!userId || !firstName || !lastName || !email || !phone || !tenantId) {
    console.error("Validation error: Missing required fields");
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Create the new client
    const newClient = new Client({
      tenantId,
      userId,
      firstName,
      lastName,
      streetAddress,
      birthday,
      gender,
      city,
      state,
      zipcode,
      email,
      phone,
    });

    await newClient.save();
    console.log("Client created successfully:", newClient);
    res.status(201).json(newClient);
  } catch (error) {
    console.error("Error creating client:", error);
    res.status(500).json({ 
      error: 'Failed to create client',
      requestId: req.requestId
    });
  }
});

// Deactivate client and associated sessions
router.put('/:clientId/deactivate',
  validateObjectId,
  auditClientAction('DEACTIVATE_CLIENT'),
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { clientId } = req.params;
      const { tenantId } = req.body;

      if (!clientId) {
        await session.abortTransaction();
        return res.status(400).json({ 
          error: 'ClientId is required',
          details: { providedClientId: clientId }
        });
      }

      if (!tenantId) {
        await session.abortTransaction();
        return res.status(400).json({ 
          error: 'TenantId is required',
          details: { providedTenantId: tenantId }
        });
      }

      console.log('Deactivation request:', {
        clientId,
        tenantId,
        body: req.body,
        params: req.params
      });

      // Convert string IDs to ObjectIds
      const clientObjectId = new mongoose.Types.ObjectId(clientId);
      const tenantObjectId = new mongoose.Types.ObjectId(tenantId);

      // First verify the client exists
      const client = await Client.findOne({ 
        _id: clientObjectId,
        tenantId: tenantObjectId,
        isActive: true 
      }).session(session);

      console.log('Client lookup result:', {
        clientFound: !!client,
        searchCriteria: {
          _id: clientObjectId.toString(),
          tenantId: tenantObjectId.toString(),
          isActive: true
        }
      });

      if (!client) {
        await session.abortTransaction();
        return res.status(404).json({ 
          error: 'Client not found or already deactivated',
          details: {
            clientId: clientId,
            tenantId: tenantId,
            searchCriteria: {
              _id: clientObjectId.toString(),
              tenantId: tenantObjectId.toString(),
              isActive: true
            }
          }
        });
      }

      // Update the client
      client.isActive = false;
      client.deactivatedAt = new Date();
      client.deactivatedBy = req.user.userId;
      client.deactivationReason = req.body.reason || 'Manual deactivation';
      await client.save({ session });

      console.log('Client updated:', {
        clientId: client._id.toString(),
        isActive: client.isActive,
        deactivatedAt: client.deactivatedAt
      });

      // Deactivate all associated sessions
      const sessionUpdateResult = await Session.updateMany(
        { 
          clientId: clientObjectId,
          tenantId: tenantObjectId,
          isActive: true
        },
        { 
          isActive: false,
          deactivatedAt: new Date(),
          deactivatedBy: req.user.userId,
          deactivationReason: 'Client deactivated'
        },
        { session }
      );

      console.log('Updated sessions:', sessionUpdateResult);

      // Deactivate all associated transcripts
      const transcriptUpdateResult = await Transcript.updateMany(
        {
          clientId: clientObjectId,
          tenantId: tenantObjectId,
          isActive: true
        },
        {
          isActive: false,
          deactivatedAt: new Date(),
          deactivatedBy: req.user.userId,
          deactivationReason: 'Client deactivated'
        },
        { session }
      );

      console.log('Updated transcripts:', transcriptUpdateResult);

      await session.commitTransaction();
      console.log('Transaction committed successfully');

      res.json({ 
        message: 'Client and associated data deactivated successfully',
        deactivatedAt: client.deactivatedAt,
        sessionCount: sessionUpdateResult.modifiedCount,
        transcriptCount: transcriptUpdateResult.modifiedCount
      });
    } catch (error) {
      await session.abortTransaction();
      console.error('Error deactivating client:', error);
      res.status(500).json({ 
        error: 'Failed to deactivate client and associated data',
        details: error.message,
        requestId: req.requestId
      });
    } finally {
      session.endSession();
    }
  }
);

// Delete client and associated sessions
router.delete('/:clientId',
  validateObjectId,
  auditClientAction('DELETE_CLIENT'),
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Soft delete client
      const client = await Client.findOneAndUpdate(
        { _id: req.params.clientId, isActive: true },
        { 
          isActive: false,
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.user.userId,
          deletionReason: req.body.reason || 'Manual deletion'
        },
        { new: true, session }
      );

      if (!client) {
        await session.abortTransaction();
        return res.status(404).json({ error: 'Client not found or already deleted' });
      }

      // Soft delete all associated sessions
      await Session.updateMany(
        { 
          clientId: req.params.clientId,
          isActive: true,
          isDeleted: false
        },
        { 
          isActive: false,
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.user.userId,
          deletionReason: 'Client deleted'
        },
        { session }
      );

      // Soft delete all associated transcripts
      await Transcript.updateMany(
        {
          clientId: req.params.clientId,
          isActive: true,
          isDeleted: false
        },
        {
          isActive: false,
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.user.userId,
          deletionReason: 'Client deleted'
        },
        { session }
      );

      await session.commitTransaction();

      // Log the cascading deletion
      console.log('Audit:', {
        action: 'DELETE_CLIENT_CASCADE',
        clientId: client._id,
        userId: req.user.userId,
        timestamp: new Date(),
        details: 'Client and all associated sessions and transcripts deleted'
      });

      res.json({ 
        message: 'Client and associated data deleted successfully',
        deletedAt: client.deletedAt
      });
    } catch (error) {
      await session.abortTransaction();
      console.error('Error deleting client:', error);
      res.status(500).json({ 
        error: 'Failed to delete client and associated data',
        requestId: req.requestId
      });
    } finally {
      session.endSession();
    }
  }
);

// GET: Get all clients for a specific tenant
router.get("/", 
  auditClientAction('VIEW_ALL_CLIENTS'),
  async (req, res) => {
  const { tenantId, userId } = req.query;

  if (!tenantId || !userId) {
    console.error("Validation error: Tenant ID and User ID are required");
    return res.status(400).json({ error: "Tenant ID and User ID are required" });
  }

  try {
    // Filter clients by tenantId and isActive field
    console.log("Get Client Route - Tenant ID:", tenantId);
    console.log("Get Client Route - User ID:", userId);
    const clients = await Client.find({ tenantId: tenantId, userId: userId, isActive: true });
    console.log("Active clients fetched successfully:", clients);
    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ 
      error: 'Failed to fetch clients',
      requestId: req.requestId
    });
  }
});

// NEW: GET: Fetch a specific client by tenantId, userId, and clientId
router.get("/:clientId", 
  auditClientAction('VIEW_CLIENT'),
  async (req, res) => {
  const { clientId } = req.params;
  const { tenantId, userId } = req.query;

  if (!tenantId || !userId || !clientId) {
    console.error("Validation error: Tenant ID, User ID, and Client ID are required");
    return res.status(400).json({ error: "Tenant ID, User ID, and Client ID are required" });
  }

  try {
    console.log("Fetching client with ID:", clientId);
    console.log("Tenant ID:", tenantId);
    console.log("User ID:", userId);

    const client = await Client.findOne({
      _id: clientId,
      tenantId: tenantId,
      userId: userId,
      isActive: true,
    });

    if (!client) {
      console.log(`Client with ID ${clientId} not found`);
      return res.status(404).json({ error: "Client not found" });
    }

    console.log("Client fetched successfully:", client);
    res.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    res.status(500).json({ 
      error: 'Failed to fetch client',
      requestId: req.requestId
    });
  }
});

// NEW: PUT: Update a specific client
router.put("/:clientId", 
  validateObjectId,
  validateClientData,
  auditClientAction('UPDATE_CLIENT'),
  async (req, res) => {
  const { clientId } = req.params;
  const {
    tenantId,
    userId,
    firstName,
    lastName,
    streetAddress,
    birthday,
    gender,
    city,
    state,
    zipcode,
    email,
    phone,
  } = req.body;

  if (!tenantId || !userId || !clientId) {
    console.error("Validation error: Tenant ID, User ID, and Client ID are required");
    return res.status(400).json({ error: "Tenant ID, User ID, and Client ID are required" });
  }

  try {
    console.log("Updating client with ID:", clientId);
    console.log("Tenant ID:", tenantId);
    console.log("User ID:", userId);

    const updatedClient = await Client.findOneAndUpdate(
      {
        _id: clientId,
        tenantId: tenantId,
        isActive: true,
      },
      {
        firstName,
        lastName,
        streetAddress,
        birthday,
        gender,
        city,
        state,
        zipcode,
        email,
        phone,
        updatedAt: new Date(),
        updatedBy: req.user.userId
      },
      { new: true }
    );

    if (!updatedClient) {
      console.log(`Client with ID ${clientId} not found or not active`);
      return res.status(404).json({ error: "Client not found or not active" });
    }

    console.log("Client updated successfully:", updatedClient);
    res.json(updatedClient);
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({ 
      error: 'Failed to update client',
      requestId: req.requestId
    });
  }
});

module.exports = router;
