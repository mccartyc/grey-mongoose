const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const IntakeForm = require('../models/IntakeForm');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/validation');

// Ensure all routes require authentication
router.use(authenticateToken);

// Validation middleware for intake form data
const validateIntakeFormData = (req, res, next) => {
  const { clientId, referralInfo, presentingConcerns, consent } = req.body;
  
  if (!clientId) {
    return res.status(400).json({ error: 'Client ID is required' });
  }

  if (!referralInfo || !referralInfo.source) {
    return res.status(400).json({ error: 'Referral source is required' });
  }

  if (!presentingConcerns || !presentingConcerns.concerns) {
    return res.status(400).json({ error: 'Presenting concerns are required' });
  }

  if (consent !== true) {
    return res.status(400).json({ error: 'Consent is required' });
  }

  next();
};

// POST: Create a new intake form
router.post('/', validateIntakeFormData, async (req, res) => {
  try {
    const { id } = req.body; // This is the client ID from the frontend
    const clientId = id; // Rename for clarity
    
    // Add user and tenant IDs from the authenticated user
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    // Check if client ID is valid
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID format' });
    }

    // Create intake form data object
    const intakeFormData = {
      ...req.body,
      clientId: mongoose.Types.ObjectId(clientId),
      userId,
      tenantId
    };

    // Remove the 'id' field as we've already extracted it
    delete intakeFormData.id;

    // Create and save the new intake form
    const newIntakeForm = new IntakeForm(intakeFormData);
    await newIntakeForm.save();

    res.status(201).json({
      success: true,
      message: 'Intake form submitted successfully',
      data: newIntakeForm
    });
  } catch (error) {
    console.error('Error creating intake form:', error);
    res.status(500).json({ 
      error: 'Failed to create intake form',
      details: error.message 
    });
  }
});

// GET: Retrieve an intake form by client ID
router.get('/client/:clientId', validateObjectId, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { tenantId } = req.user;

    const intakeForm = await IntakeForm.findOne({ 
      clientId: mongoose.Types.ObjectId(clientId),
      tenantId
    });

    if (!intakeForm) {
      return res.status(404).json({ error: 'Intake form not found for this client' });
    }

    res.status(200).json(intakeForm);
  } catch (error) {
    console.error('Error retrieving intake form:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;