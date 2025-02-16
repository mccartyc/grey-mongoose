const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateSession } = require('../middleware/validation');
const { startTranscription, stopTranscription } = require('../controllers/transcriptController');

// Ensure all routes require authentication
router.use(authenticateToken);

// Validate request body
const validateTranscriptionRequest = (req, res, next) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }
  next();
};

// Add audit logging for transcription actions
const auditTranscriptionAction = (req, res, next) => {
  const log = {
    timestamp: new Date(),
    userId: req.user.userId,
    tenantId: req.user.tenantId,
    action: req.path.includes('start') ? 'START_TRANSCRIPTION' : 'STOP_TRANSCRIPTION',
    sessionId: req.body.sessionId,
    ipAddress: req.ip,
  };
  
  // Log to secure audit system
  console.log('Transcription Audit:', JSON.stringify(log));
  next();
};

// Start transcription
router.post('/start',
  validateTranscriptionRequest,
  validateSession,
  auditTranscriptionAction,
  async (req, res) => {
    try {
      const result = await startTranscription(req.body.sessionId, req.user);
      res.json(result);
    } catch (error) {
      console.error('Transcription start error:', error);
      res.status(500).json({ 
        error: 'Failed to start transcription',
        requestId: req.requestId
      });
    }
  }
);

// Stop transcription
router.post('/stop',
  validateTranscriptionRequest,
  validateSession,
  auditTranscriptionAction,
  async (req, res) => {
    try {
      const result = await stopTranscription(req.body.sessionId, req.user);
      res.json(result);
    } catch (error) {
      console.error('Transcription stop error:', error);
      res.status(500).json({ 
        error: 'Failed to stop transcription',
        requestId: req.requestId
      });
    }
  }
);

// Get transcription status
router.get('/:sessionId/status',
  validateSession,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const status = await getTranscriptionStatus(sessionId, req.user);
      res.json(status);
    } catch (error) {
      console.error('Transcription status error:', error);
      res.status(500).json({ 
        error: 'Failed to get transcription status',
        requestId: req.requestId
      });
    }
  }
);

module.exports = router;
