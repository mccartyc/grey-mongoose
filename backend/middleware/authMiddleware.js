// File: backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/Users'); // Make sure this path is correct
const { promisify } = require('util');

const verifyToken = promisify(jwt.verify);

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    // console.log("Incoming headers:", req.headers);
    console.error("Authorization header missing or malformed:", authHeader, token);
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = await verifyToken(token, process.env.JWT_SECRET);
    // console.log("Token decoded successfully:", decoded);
    req.user = decoded; // Attach user data to the request object
    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    if (error.name === 'TokenExpiredError') {
      // If the token is expired, call the refresh token function
      return handleTokenRefresh(req, res, next);
    }
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const handleTokenRefresh = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken; // Assuming the refresh token is stored in cookies

  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Generate new tokens
    const { accessToken } = generateTokens(user); // Define generateTokens function to create new tokens

    // Update the request object with the new access token
    req.user = { ...req.user, newAccessToken: accessToken }; // Attach the new token to the request object
    return res.status(200).json({ message: 'Token refreshed successfully', accessToken });
  } catch (error) {
    console.error("Error refreshing token:", error.message);
    return res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
};

const generateTokens = (user) => {
  // Generate new access token
  const accessToken = jwt.sign(
    { id: user._id, tenantId: user.tenantId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION }
  );

  return { accessToken };
};


module.exports = { protect };
