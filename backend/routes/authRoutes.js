// File: backend/routes/authRoutes.js
const express = require('express');
const { login, refreshToken, logout } = require('../controllers/authController');
const { protect } = require("../middleware/authMiddleware");


const router = express.Router();

router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
// router.post('/validate', validateToken);

// Add a route for token validation
router.get('/validate', protect, (req, res) => {
    res.status(200).json({ message: 'Token is valid', user: req.user });
  });

// router.post('/register', register);


module.exports = router;
