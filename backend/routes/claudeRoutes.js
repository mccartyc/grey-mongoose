const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const CryptoJS = require('crypto-js');

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Middleware for HIPAA compliance logging
const auditLogger = (req, res, next) => {
  const auditRecord = {
    timestamp: new Date(),
    action: 'transcription_request',
    userId: req.user.id, // Assuming you have authentication middleware
    accessType: 'create',
    resourceType: 'audio_transcription'
  };
  // Log to your HIPAA-compliant audit system
  auditLog.create(auditRecord);
  next();
};

router.post('/transcribe', auditLogger, async (req, res) => {
  try {
    // Decrypt the incoming audio data
    const decryptedAudio = CryptoJS.AES.decrypt(
      req.body.audio,
      process.env.ENCRYPTION_KEY
    ).toString(CryptoJS.enc.Utf8);

    // Call Claude API for transcription
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Please transcribe the following audio content accurately and completely: ${decryptedAudio}`
      }]
    });

    // Encrypt the transcription before sending
    const encryptedTranscription = CryptoJS.AES.encrypt(
      response.content[0].text,
      process.env.ENCRYPTION_KEY
    ).toString();

    res.json({ text: encryptedTranscription });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

module.exports = router;