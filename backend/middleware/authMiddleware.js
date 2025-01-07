// File: backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    // console.log("Incoming headers:", req.headers);
    console.error("Authorization header missing or malformed:", authHeader, token);
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("JWT Secret:", process.env.JWT_SECRET);
    // console.log("Incoming token:", token);
    console.log("Token decoded successfully:", decoded);
    req.user = decoded; // Attach user data to the request object
    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };
