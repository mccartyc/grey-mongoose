const User = require("../models/Users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

/**
 * Registers a new user.
 */
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password, tenantId } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, msg: "User already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new User({
      email,
      password: hashedPassword,
      tenantId,
    });

    await newUser.save();

    // Generate JWT
    const payload = {
      user: {
        id: newUser._id,
        tenantId: newUser.tenantId,
        role: newUser.role,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.TOKEN_EXPIRATION || "1h",
    });

    res.status(201).json({ message: 'User registered successfully', token });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

/**
 * Logs in an existing user.
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log("Login request received:", { email });

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.error("Login failed: User not found");
      return res.status(400).json({ success: false, msg: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.error("Login failed: Incorrect password for user:", email);
      return res.status(400).json({ success: false, msg: "Invalid credentials" });
    }

    // Generate JWT
    const payload = {
      user: {
        id: user._id,
        tenantId: user.tenantId,
        role: user.role,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.TOKEN_EXPIRATION || "15m",
    });
    console.log("Login successful for user:", email);

    // Generate Refresh Token
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '1d',
    });


    // Save the refresh token to the database
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({ accessToken, refreshToken, user });
  } catch (error) {
    console.error("Server error during login:", err);
    res.status(500).json({ msg: 'Server error' });
  }
};
