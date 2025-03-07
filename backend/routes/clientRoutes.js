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
  max: 200 // increased from 50 to 200 requests per window
});

// Ensure all routes require authentication
router.use(authenticateToken);

// Validation middleware for client data
const validateClientData = (req, res, next) => {
  const { firstName, lastName, email, phone } = req.body;
  
  // Check required fields
  if (!firstName || !lastName) {
    return res.status(400).json({ error: 'First name and last name are required' });
  }

  // Validate email format if provided and not already encrypted
  if (email && !email.includes(':')) {
    // Only validate if it's not already in encrypted format (encrypted data contains ':')
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).toLowerCase())) {
      console.log('Invalid email format:', email);
      return res.status(400).json({ error: 'Invalid email format' });
    }
  }

  // Validate phone format if provided and not already encrypted
  if (phone && !phone.includes(':')) {
    // Only validate if it's not already in encrypted format
    const digitsOnly = String(phone).replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      return res.status(400).json({ error: 'Phone number must have at least 10 digits' });
    }
  }

  // Validate date of birth format and reasonableness if provided
  if (req.body.birthday && !String(req.body.birthday).includes(':')) {
    // Only validate if it's not already in encrypted format
    const dob = new Date(req.body.birthday);
    const now = new Date();
    if (isNaN(dob.getTime()) || dob > now) {
      return res.status(400).json({ error: 'Invalid date of birth' });
    }
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

  console.log(`[${req.requestId}] Request to create client with data:`, {
    tenantId,
    userId,
    firstName,
    lastName,
    // Don't log sensitive information
    hasEmail: !!email,
    hasPhone: !!phone,
    hasBirthday: !!birthday,
    birthdayType: birthday ? typeof birthday : 'undefined',
    birthdayValue: birthday ? birthday : 'undefined',
    hasAddress: !!streetAddress
  });

  // Check if all required fields are provided
  if (!userId || !firstName || !lastName || !email || !phone || !tenantId) {
    console.error(`[${req.requestId}] Validation error: Missing required fields`);
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Format phone number if not already encrypted (remove any non-digit characters)
    let formattedPhone = phone;
    if (!String(phone).includes(':')) {
      formattedPhone = String(phone).replace(/\D/g, '');
      console.log(`[${req.requestId}] Formatted phone:`, { 
        before: phone.length, 
        after: formattedPhone.length 
      });
    }
    
    // Format email if not already encrypted
    let formattedEmail = email;
    if (!String(email).includes(':')) {
      formattedEmail = String(email).trim();
      console.log(`[${req.requestId}] Formatted email: Trimmed whitespace`);
    }
    
    // Format birthday if provided and not already encrypted
    let formattedBirthday = birthday;
    if (birthday && !String(birthday).includes(':')) {
      try {
        // Ensure birthday is a valid date
        console.log(`[${req.requestId}] Processing birthday:`, birthday, "Type:", typeof birthday);
        const birthdayDate = new Date(birthday);
        console.log(`[${req.requestId}] Parsed birthday date:`, birthdayDate, "isValid:", !isNaN(birthdayDate.getTime()));
        
        if (!isNaN(birthdayDate.getTime())) {
          // Store as ISO string without time component
          formattedBirthday = birthdayDate.toISOString().split('T')[0];
          console.log(`[${req.requestId}] Formatted birthday:`, formattedBirthday);
        } else {
          console.error(`[${req.requestId}] Invalid birthday format:`, birthday);
          return res.status(400).json({ error: "Invalid birthday format" });
        }
      } catch (error) {
        console.error(`[${req.requestId}] Error parsing birthday:`, error);
        return res.status(400).json({ error: "Invalid birthday format" });
      }
    } else if (birthday && String(birthday).includes(':')) {
      console.log(`[${req.requestId}] Birthday is already encrypted, using as is`);
      // Already encrypted, use as is
      formattedBirthday = birthday;
    }
    
    // Create the new client
    const newClient = new Client({
      tenantId,
      userId,
      firstName,
      lastName,
      streetAddress,
      birthday: formattedBirthday,
      gender,
      city,
      state,
      zipcode,
      email: formattedEmail,
      phone: formattedPhone,
    });

    console.log(`[${req.requestId}] Attempting to save client with birthday:`, formattedBirthday);
    
    try {
      await newClient.save();
      console.log(`[${req.requestId}] Client created successfully with ID:`, newClient._id);
      
      // Return the client with decrypted contact info
      try {
        const clientWithDecryptedInfo = await Client.findById(newClient._id);
        if (!clientWithDecryptedInfo) {
          console.error(`[${req.requestId}] Failed to retrieve created client with ID:`, newClient._id);
          throw new Error('Failed to retrieve created client');
        }
        
        console.log(`[${req.requestId}] Successfully retrieved client with ID:`, clientWithDecryptedInfo._id);
        res.status(201).json(clientWithDecryptedInfo);
      } catch (retrieveError) {
        console.error(`[${req.requestId}] Error retrieving created client:`, retrieveError);
        throw new Error(`Failed to retrieve created client: ${retrieveError.message}`);
      }
    } catch (saveError) {
      console.error(`[${req.requestId}] Error saving client:`, saveError.message);
      console.error(`[${req.requestId}] Error stack:`, saveError.stack);
      throw new Error(`Failed to save client: ${saveError.message}`);
    }
  } catch (error) {
    console.error(`[${req.requestId}] Error creating client:`, error.message);
    console.error(`[${req.requestId}] Error stack:`, error.stack);
    res.status(500).json({ 
      error: 'Failed to create client',
      details: error.message,
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
    
    // Decrypt contact information for each client
    const decryptedClients = clients.map(client => client.decryptContactInfo());
    
    res.json(decryptedClients);
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
      isActive: true
    });

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    console.log("Client fetched successfully:", client);
    
    // Decrypt contact information
    const decryptedClient = client.decryptContactInfo();
    
    res.json(decryptedClient);
  } catch (error) {
    console.error("Error fetching client:", error);
    res.status(500).json({ 
      error: "Failed to fetch client",
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
    
    // Decrypt contact information
    const decryptedClient = updatedClient.decryptContactInfo();
    
    res.json(decryptedClient);
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({ 
      error: 'Failed to update client',
      requestId: req.requestId
    });
  }
});

module.exports = router;
