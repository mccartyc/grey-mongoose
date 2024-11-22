const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/Users"); // Ensure this path is correct
const bcrypt = require("bcryptjs");

// POST: Create a new user
router.post("/", async (req, res) => {
  const { name, email, password, role, tenantId } = req.body;

  console.log("Request to create user:", { name, email, password, role, tenantId });

  // Check if all required fields are provided
  if (!name || !email || !password || !tenantId) {
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
      name,
      email,
      password: hashedPassword,
      role,
      tenant: new mongoose.Types.ObjectId(tenantId), // Use new with ObjectId
    });

    await newUser.save();
    console.log("User created successfully:", newUser);
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET: Get all users for a specific tenant
router.get("/", async (req, res) => {
  const { tenantId } = req.query;

  if (!tenantId) {
    console.error("Validation error: Tenant ID is required");
    return res.status(400).json({ error: "Tenant ID is required" });
  }

  try {
    const users = await User.find({ tenant: tenantId });
    console.log("Users fetched successfully:", users);
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
