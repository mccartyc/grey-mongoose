const express = require("express");
const User = require("../models/Users");
const protect = require("../middleware/auth");

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  const { name, email, password, tenantId } = req.body;

  try {
    const user = await User.create({ name, email, password, tenant: tenantId });
    const token = user.generateToken();
    res.status(201).json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).populate("tenant");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = user.generateToken();
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
