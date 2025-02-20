const Anthropic = require('@anthropic-ai/sdk');

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// Convert base64 audio to text using Anthropic's Claude
const transcribeAudio = async (req, res) => {
    try {
        console.log('Received transcription request');
        const { audioData, tenantId, sessionId, isPartial } = req.body;

        if (!audioData || !tenantId || !sessionId) {
            console.error('Missing required fields:', { 
                hasAudio: !!audioData, 
                hasTenantId: !!tenantId, 
                hasSessionId: !!sessionId 
            });
            return res.status(400).json({ 
                error: 'Missing required fields' 
            });
        }

        // Validate base64 audio data
        if (!/^[A-Za-z0-9+/=]+$/.test(audioData)) {
            console.error('Invalid base64 audio data');
            return res.status(400).json({
                error: 'Invalid audio data format'
            });
        }

        // Create a message for Claude explaining the task
        const message = {
            model: 'claude-3-opus-20240229',
            max_tokens: 1000,
            messages: [{
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: isPartial ?
                            'Please transcribe this audio segment from an ongoing therapy session. Focus on capturing the conversation accurately. No need for timestamps or speaker labels for this segment.' :
                            'Please transcribe the following therapy session audio. Focus on capturing the conversation accurately, including both the therapist and client speech. Format it in a clear, readable way with speaker labels if possible.'
                    },
                    {
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: 'audio/webm',
                            data: audioData
                        }
                    }
                ]
            }]
        };

        // Get transcription from Claude
        const response = await anthropic.messages.create(message);
        
        // Extract the transcription from Claude's response
        const transcription = response.content[0].text;

        // Log success (without sensitive data)
        console.log(`Successfully transcribed ${isPartial ? 'partial' : 'complete'} audio for session ${sessionId}`);

        // Return transcription
        res.json({ 
            transcript: transcription
        });

    } catch (error) {
        console.error('Transcription error:', error.message);
        res.status(500).json({ 
            error: 'Failed to transcribe audio'
        });
    }
};

module.exports = {
    transcribeAudio
};
