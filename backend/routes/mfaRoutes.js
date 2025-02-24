const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  enableMFA,
  disableMFA,
  generateMFACode,
  verifyMFACode,
  getMFASettings,
} = require('../controllers/mfaController');

// Routes requiring authentication
router.get('/settings', authenticateToken, getMFASettings);
router.post('/enable', authenticateToken, enableMFA);
router.post('/disable', authenticateToken, disableMFA);

// Routes for MFA verification during login
router.post('/generate', generateMFACode);
router.post('/verify', verifyMFACode);

module.exports = router;
