// controllers/intakeFormController.js
const express = require('express');
const router = express.Router();
const IntakeForm = require('../models/IntakeForm'); // Adjust the path as necessary
const { protect } = require('../middleware/authMiddleware'); // Ensure protection

// POST: Create a new intake form entry
router.post('/', protect, async (req, res) => {
  const intakeData = { ...req.body }; // Get the intake form details from the request body

  try {
    const newIntake = new IntakeForm(intakeData);
    await newIntake.save();
    res.status(201).json(newIntake); // Return the newly created intake form entry
  } catch (error) {
    console.error('Error creating intake form:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;