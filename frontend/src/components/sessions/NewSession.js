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
import '../../styles/Transcript.css';

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
          `http://localhost:5001/api/clients?tenantId=${user.tenantId}&userId=${user.userId}`,
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
        
        // Encrypt audio data before transmission
        const encryptedAudio = CryptoJS.AES.encrypt(
          base64Audio,
          process.env.REACT_APP_ENCRYPTION_KEY
        ).toString();
        
        // Send to backend for Anthropic processing
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/transcribe`,
          { 
            audioData: encryptedAudio,
            tenantId: user.tenantId,
            sessionId: id || 'new'
          },
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.transcript) {
          const decryptedTranscript = CryptoJS.AES.decrypt(
            response.data.transcript,
            process.env.REACT_APP_ENCRYPTION_KEY
          ).toString(CryptoJS.enc.Utf8);
          
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
      const encryptedTranscript = CryptoJS.AES.encrypt(
        formattedTranscript,
        process.env.REACT_APP_ENCRYPTION_KEY
      ).toString();
      
      await createSession({
        clientId: selectedClientId,
        date: formattedDate,
        length: sessionLength.toString(),
        type,
        notes: notes || '',
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
      <h3>New Session</h3>
      {message && <p className={`message ${error ? 'error' : 'success'}`}>{message}</p>}
      {isLoading && <div className="loading-spinner">Loading...</div>}
      
      <form className="form-group" onSubmit={handleCreateSession} autoComplete="off">
        <ClientSelector
          selectedClientId={selectedClientId}
          filteredClients={filteredClients}
          onClientSelect={setSelectedClientId}
          disabled={!!id}
        />

        <SessionDetails
          date={date}
          length={length}
          type={type}
          onDateChange={setDate}
          onLengthChange={setLength}
          onTypeChange={setType}
        />

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
          <button type="submit" className="submit-button" disabled={isLoading}>
            Create Session
          </button>
          <button
            type="button"
            className="cancel-button"
            onClick={() => navigate('/sessions')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewSession;
