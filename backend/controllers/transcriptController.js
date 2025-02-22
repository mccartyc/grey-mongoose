const Session = require('../models/Sessions');
const Transcript = require('../models/Transcripts');

// Start transcription for a session
const startTranscription = async (req, res) => {
  try {
    const { sessionId } = req.body;

    // Find the session
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if transcription is already in progress
    if (session.transcriptionStatus === 'active') {
      return res.status(400).json({ error: 'Transcription already in progress' });
    }

    // Update session status
    session.transcriptionStatus = 'active';
    await session.save();

    // Create initial transcript
    const transcript = new Transcript({
      sessionId,
      clientId: session.clientId,
      content: '',
      summary: '',
      tags: []
    });
    await transcript.save();

    // Log the action
    console.log('Transcription started:', {
      sessionId,
      clientId: session.clientId,
      userId: req.user.userId,
      timestamp: new Date()
    });

    res.json({ message: 'Transcription started', transcriptId: transcript._id });
  } catch (error) {
    console.error('Error starting transcription:', error);
    res.status(500).json({ error: 'Error starting transcription' });
  }
};

// Stop transcription for a session
const stopTranscription = async (req, res) => {
  try {
    const { sessionId } = req.body;

    // Find the session
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if transcription is active
    if (session.transcriptionStatus !== 'active') {
      return res.status(400).json({ error: 'No active transcription found' });
    }

    // Update session status
    session.transcriptionStatus = 'completed';
    await session.save();

    // Find and update transcript
    const transcript = await Transcript.findOne({ sessionId }).sort({ createdAt: -1 });
    if (transcript) {
      transcript.status = 'completed';
      await transcript.save();
    }

    // Log the action
    console.log('Transcription stopped:', {
      sessionId,
      clientId: session.clientId,
      userId: req.user.userId,
      timestamp: new Date()
    });

    res.json({ message: 'Transcription stopped' });
  } catch (error) {
    console.error('Error stopping transcription:', error);
    res.status(500).json({ error: 'Error stopping transcription' });
  }
};

module.exports = {
  startTranscription,
  stopTranscription
};
