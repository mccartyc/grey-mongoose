const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/Users"); // Ensure this path is correct
const bcrypt = require("bcryptjs");

// POST: Create a new user
router.post("/", async (req, res) => {
  const { firstname, lastname, email, password, role, tenantId } = req.body;

  console.log("Request to create user:", { firstname, lastname, email, password, role, tenantId });

  // Check if all required fields are provided
  if (!firstname || !lastname || !email || !password || !tenantId) {
    console.error("Validation error: All fields are required");
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error("Validation error: Email already exists");
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const newUser = new User({
      firstname,
      lastname,
      email,
      password: hashedPassword,
      role,
      tenantId,
    });

    await newUser.save();
    console.log("User created successfully:", newUser);
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Server error" });
  }
});


/*deactivate user*/
router.put('/:userId/deactivate', async (req, res) => {
  const { userId } = req.params;
  try {
    const updateData = { isActive: false, deactivatedAt: new Date() };
    console.log('Update Data:', updateData); // Log the update data

    const user = await User.findOneAndUpdate(
      { userId },
      updateData,
      { new: true }
    );

    if (!user) {
      console.log(`User with ID ${userId} not found`); // Log if tenant not found
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Deactivated User:', user); // Log the deactivated tenant
    res.status(200).json(user);
  } catch (error) {
    console.error('Error Deactivating Tenant:', error);
    res.status(400).json({ error: 'Failed to deactivate user' });
  }
});


// Get all users for a specific tenant
router.get("/", async (req, res) => {
  const { tenantId } = req.query;

  if (!tenantId) {
    console.error("Validation error: Tenant ID is required");
    return res.status(400).json({ error: "Tenant ID is required" });
  }

  try {
    // Filter users by tenantId and isActive field
    console.log("User Tenant Filter:", tenantId);
    const users = await User.find({ tenantId: tenantId, isActive: true });
    console.log("Active users fetched successfully:", users);
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Server error" });
  }

});

module.exports = router;
