// routes/debug.js
const express = require('express');
const User = require('../models/Users'); // Adjust path as needed
const { protect } = require("../middleware/authMiddleware");


const router = express.Router();

router.post('/test-password', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    res.status(200).json({ message: 'Password match successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Endpoint to check if a user exists
router.get('/check-user', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const user = await User.findByEmail(email);
    
    if (user) {
      return res.json({ exists: true, userId: user._id });
    } else {
      return res.json({ exists: false });
    }
  } catch (error) {
    console.error('Error checking user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
