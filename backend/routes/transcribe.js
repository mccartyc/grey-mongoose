const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { transcribeAudio } = require('../controllers/transcribeController');

// Route for transcribing audio
router.post('/', authenticateToken, transcribeAudio);

module.exports = router;
