const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { authenticateToken, authorizeUserCreation } = require("../middleware/authMiddleware");
const User = require("../models/Users");
const bcrypt = require("bcryptjs");
const rateLimit = require('express-rate-limit');
const { validateObjectId, sanitizeData } = require('../middleware/validation');

// Rate limiting for user operations
const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500 // limit each IP to 500 user operations per window
});

// Ensure all routes require authentication
router.use(authenticateToken);
router.use(sanitizeData);

// Validate user update data
const validateUserUpdate = (req, res, next) => {
  const { email, firstName, lastName, phoneNumber } = req.body;

  if (email && !validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (phoneNumber && !validatePhone(phoneNumber)) {
    return res.status(400).json({ error: 'Invalid phone number format' });
  }

  next();
};

// Audit logging middleware
const auditUserAction = (action) => (req, res, next) => {
  const log = {
    timestamp: new Date(),
    userId: req.user?.userId,
    tenantId: req.user?.tenantId,
    action,
    targetUserId: req.params.id || req.user.userId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  };
  
  console.log('User Action Audit:', JSON.stringify(log));
  next();
};

// POST: Create a new user
router.post("/", 
  userLimiter, 
  authorizeUserCreation, // Check if user has permission to create users with the specified role
  auditUserAction('CREATE_USER'),
  async (req, res) => {
    const { email, password, firstname, lastname, role, tenantId } = req.body;
    
    try {
      // Validate required fields
      if (!email || !password || !firstname || !lastname || !role || !tenantId) {
        return res.status(400).json({ error: "All fields are required" });
      }
      
      // Check if email is already in use
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email is already in use" });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create the new user
      const newUser = new User({
        firstname,
        lastname,
        email,
        password: hashedPassword,
        role,
        tenantId,
        isActive: true
      });

      await newUser.save();
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Server error" });
    }
});

// Get all users for a specific tenant
router.get("/", async (req, res) => {
  const { tenantId } = req.query;

  try {
    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required" });
    }

    // Validate tenantId format
    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({ error: "Invalid tenant ID format" });
    }

    // Filter users by tenantId and isActive field
    const users = await User.find({ 
      tenantId: tenantId, 
      isActive: true 
    }).select('-password');

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get a single user for a specific tenant and user combination
router.get("/user", async (req, res) => {
  const { tenantId, _id } = req.query;

  try {
    // Validate required parameters
    if (!tenantId || !_id) {
      return res.status(400).json({ error: "Tenant ID and User ID are required" });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(tenantId) || !mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    // Find the user by tenantId and userId
    const user = await User.findOne({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      _id: new mongoose.Types.ObjectId(_id),
      isActive: true
    }).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Deactivate user
router.put('/:userId/deactivate', auditUserAction('DEACTIVATE_USER'), async (req, res) => {
  const { userId } = req.params;
  
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const updateData = { 
      isActive: false, 
      deactivatedAt: new Date() 
    };

    const user = await User.findOneAndUpdate(
      { _id: mongoose.Types.ObjectId(userId) },
      updateData,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error Deactivating User:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

// Update user profile information
router.put('/:userId/profile', 
  validateUserUpdate, 
  auditUserAction('UPDATE_PROFILE'),
  async (req, res) => {
    const { userId } = req.params;
    const { email, firstname, lastname, phoneNumber } = req.body;
    
    try {
      // Validate userId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if email is already in use by another user
      if (email && email !== user.email) {
        const emailExists = await User.findByEmail(email);
        if (emailExists) {
          return res.status(400).json({ error: 'Email is already in use by another user' });
        }
      }

      // Update user information
      const updateData = {};
      if (firstname) updateData.firstname = firstname;
      if (lastname) updateData.lastname = lastname;
      if (email) updateData.email = email;
      if (phoneNumber) updateData.phoneNumber = phoneNumber;
      
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true }
      ).select('-password');
      
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Failed to update profile", details: error.message });
    }
});

// Change user password
router.put('/:userId/password',
  auditUserAction('CHANGE_PASSWORD'),
  async (req, res) => {
    const { userId } = req.params;
    const { currentPassword, newPassword, tenantId } = req.body;
    
    try {
      // Validate required parameters
      if (!userId || !tenantId || !currentPassword || !newPassword) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(tenantId)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      // Find the user
      const user = await User.findOne({
        _id: userId,
        tenantId: tenantId,
        isActive: true
      });
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      
      // Validate new password
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      user.password = hashedPassword;
      user.passwordChangedAt = new Date();
      await user.save();
      
      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Failed to change password", details: error.message });
    }
});

module.exports = router;
