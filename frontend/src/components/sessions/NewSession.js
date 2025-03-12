import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSession } from '../../hooks/useSession';
import ClientSelector from './ClientSelector';
import SessionDetails from './SessionDetails';
import TranscriptSection from './TranscriptSection';
import NotesEditor from './NotesEditor';
import CryptoJS from 'crypto-js';
import { encryptText, decryptText } from '../../utils/encryption';
import '../../styles/Transcript.css';
import '../../styles/formLayout.css';
import '../../styles/sectionStyles.css';
import { createApiInstance } from '../../utils/apiConfig';

const NewSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createSession, startTranscript, stopTranscript, isLoading, error } = useSession();

  // State
  const [filteredClients, setFilteredClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [length, setLength] = useState('60');  // Default to 60 minutes
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptBoxContent, setTranscriptBoxContent] = useState('');
  const [transcriptText, setTranscriptText] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axios.get(
          `/api/clients?tenantId=${user.tenantId}&userId=${user.userId}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        setFilteredClients(response.data);

        if (id) {
          setSelectedClientId(id);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
        setMessage('Failed to load clients.');
      }
    };

    fetchClients();
  }, [user, id]);

  const handleStartTranscript = async () => {
    try {
      const now = new Date();
      setStartTime(now);
      setIsTranscribing(true);
      setTranscriptBoxContent(`Session started at ${now.toLocaleTimeString()}: `);
      
      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Configure recognition settings
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      // Store recognition instance for later cleanup
      window.recognition = recognition;
      
      // Handle results
      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          let transcript = event.results[i][0].transcript;
          
          // Capitalize first letter if it's the start of a sentence
          if (i === 0 || transcript.match(/^[a-z]/) && event.results[i-1]?.isFinal) {
            transcript = transcript.charAt(0).toUpperCase() + transcript.slice(1);
          }
          
          // Add punctuation if it's a final result and doesn't end with punctuation
          if (event.results[i].isFinal) {
            if (!transcript.match(/[.!?]$/)) {
              transcript += '.';
            }
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update transcript with final results
        if (finalTranscript) {
          setTranscriptBoxContent(prev => {
            // Remove extra spaces and format properly
            const formattedTranscript = finalTranscript.replace(/\s+/g, ' ').trim();
            return prev + (prev && !prev.endsWith(' ') ? ' ' : '') + formattedTranscript;
          });
          setTranscriptText(prev => {
            const formattedTranscript = finalTranscript.replace(/\s+/g, ' ').trim();
            return prev + (prev && !prev.endsWith(' ') ? ' ' : '') + formattedTranscript;
          });
        }
      };
      
      // Handle errors
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setMessage(`Transcription error: ${event.error}`);
      };
      
      // Start recognition
      recognition.start();
      
      // Store session info
      window.sessionStorage.setItem('recognition', JSON.stringify({ 
        active: true,
        startTime: now.toISOString()
      }));
      
      setMessage('Transcription started successfully');
    } catch (error) {
      console.error('Transcription start error:', error);
      setMessage('Failed to start transcription. Please check microphone permissions.');
      setIsTranscribing(false);
      setStartTime(null);
    }
  };

  const handleStopTranscript = async () => {
    if (!isTranscribing) return;
    
    try {
      const now = new Date();
      setEndTime(now);
      
      // Stop speech recognition if it exists
      if (window.recognition) {
        window.recognition.stop();
        window.recognition = null;
      }
      
      // Clean up
      window.sessionStorage.removeItem('recognition');
      setIsTranscribing(false);
      
      // Append end time to transcript
      setTranscriptBoxContent(prev => 
        `${prev} (Session ended at ${now.toLocaleTimeString()})`);
      
      setMessage('Transcription completed');
      
    } catch (error) {
      console.error('Transcription stop error:', error);
      setMessage('Failed to stop transcription');
      setIsTranscribing(false);
      setEndTime(null);
    }
  };

  const handleAudioTranscription = async (audioBlob) => {
    try {
      // Convert audio blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];
        
        // Encrypt audio data before transmission using the utility function
        const encryptedAudio = encryptText(base64Audio);
        
        // Send to backend for Anthropic processing
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/transcribe`,
          { 
            audioData: encryptedAudio,
            tenantId: user.tenantId,
            sessionId: id || 'new'
          },
          
        );
        
        if (response.data.transcript) {
          // Use the decryptText utility function
          const decryptedTranscript = decryptText(response.data.transcript);
          
          setTranscriptBoxContent(prev => prev + decryptedTranscript);
          setTranscriptText(decryptedTranscript);
          setMessage('Transcription completed successfully');
        }
      };
    } catch (error) {
      console.error('Audio transcription error:', error);
      setMessage('Failed to process transcription');
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();

    if (!selectedClientId || !date || !length || !type) {
      setMessage('All fields are required.');
      return;
    }

    // Validate length
    const sessionLength = parseInt(length, 10);
    if (isNaN(sessionLength) || sessionLength < 1 || sessionLength > 480) {
      setMessage('Session length must be between 1 and 480 minutes.');
      return;
    }

    try {
      // Format the date to ensure it's a valid ISO string
      const formattedDate = new Date(date).toISOString();
      
      // Ensure transcript text is a string and encrypt it
      const formattedTranscript = transcriptText || '';
      const encryptedTranscript = encryptText(formattedTranscript);
      
      // Encrypt notes if they exist
      const encryptedNotes = notes ? encryptText(notes) : '';
      
      await createSession({
        clientId: selectedClientId,
        date: formattedDate,
        length: sessionLength.toString(),
        type,
        notes: encryptedNotes,
        transcript: encryptedTranscript,
        transcriptStartTime: startTime?.toISOString() || null,
        transcriptEndTime: endTime?.toISOString() || null,
      });

      setMessage('Session created successfully');
      navigate('/sessions');
    } catch (error) {
      console.error('Session creation error:', error.response?.data);
      setMessage(error.response?.data?.error || 'Failed to create session');
    }
  };

  return (
    <div className="sessions-section">
      <h3 className="section-title">New Session</h3>
      {message && <p className={`message ${error ? 'error' : 'success'}`}>{message}</p>}
      {isLoading && <div className="loading-spinner">Loading...</div>}
      
      <form className="form-group" onSubmit={handleCreateSession} autoComplete="off">
        <div className="form-row-group top-row">
          <div className="form-row-item date-selector">
            <label className="date-label new-session-label">
              Date:
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>
          </div>

          <div className="form-row-item client-selector">
            <ClientSelector
              selectedClientId={selectedClientId}
              filteredClients={filteredClients}
              onClientSelect={setSelectedClientId}
              disabled={!!id}
            />
          </div>

          <div className="form-row-item type-selector">
            <label className="type-label new-session-label">
              Type:
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                <option value="">Select Type</option>
                <option value="In Person">In Person</option>
                <option value="Phone">Phone</option>
                <option value="Virtual">Virtual</option>
                <option value="Text">Text</option>
                <option value="Email">Email</option>
                <option value="Other">Other</option>
              </select>
            </label>
          </div>

          <div className="form-row-item length-selector">
            <label className="length-label new-session-label">
              Length (minutes):
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                required
                min="1"
                max="480"
              />
            </label>
          </div>
        </div>

        <NotesEditor
          notes={notes}
          onNotesChange={setNotes}
        />

        <TranscriptSection
          isTranscribing={isTranscribing}
          transcriptBoxContent={transcriptBoxContent}
          onStartTranscript={handleStartTranscript}
          onStopTranscript={handleStopTranscript}
        />

        <div className="form-actions">
          <div className="button-container">
            <button
              type="button"
              className="btn secondary-btn"
              onClick={() => navigate('/sessions')}
            >
              Cancel
            </button>
            <button type="submit" className="btn primary-btn" disabled={isLoading}>
              Create Session
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewSession;
