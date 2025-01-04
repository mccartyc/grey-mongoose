// File: backend/routes/authRoutes.js
const express = require('express');
const { login, refreshToken, logout } = require('../controllers/authController');

const router = express.Router();

router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
// router.post('/register', register);


module.exports = router;
