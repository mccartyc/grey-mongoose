// File: backend/controllers/authControllers.js
const jwt = require('jsonwebtoken');
const User = require('../models/Users');
const bcrypt = require('bcrypt');

// Generate Tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, tenantId: user.tenantId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRATION }
  );

  return { accessToken, refreshToken };
};

// Login User
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // const { accessToken, refreshToken } = generateTokens(user);
    // Generate tokens
    const accessToken = jwt.sign({ userId: user._id, tenantId: user.tenantId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION});
    const refreshToken = jwt.sign({ userId: user._id, tenantId: user.tenantId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRATION });

    // Save refresh token in DB
    user.refreshToken = refreshToken;
    await user.save();

    // Send tokens
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) return res.status(401).json({ message: 'No refresh token provided' });

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Update refresh token in DB
    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ accessToken });
  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired token', error: error.message });
  }
};

// Logout User
exports.logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  try {
    const user = await User.findOneAndUpdate(
      { refreshToken },
      { refreshToken: null }
    );

    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
