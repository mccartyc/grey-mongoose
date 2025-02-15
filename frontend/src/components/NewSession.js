import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useAuth } from '../context/AuthContext';
import { useSecureTranscription } from './transcription/SecureTranscriptionService';
import { EncryptionService } from '../utils/encryption';

const CreateSessionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [filteredClients, setFilteredClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [length, setLength] = useState('');
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const encryptionService = new EncryptionService(process.env.REACT_APP_ENCRYPTION_KEY);

  const {
    transcriptionInProgress,
    interimTranscript,
    error: transcriptionError,
    handleStartStopTranscription
  } = useSecureTranscription({
    onTranscriptionUpdate: (transcript) => {
      console.log("Live transcript update: ", transcript);
      setLiveTranscript(transcript);
      const encryptedTranscript = encryptionService.encrypt(transcript);
      setFinalTranscript(encryptedTranscript);
    }
  });

  useEffect(() => {
    const fetchClients = async () => {
      const { tenantId, userId, token } = user;
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/clients`,
          {
            params: { tenantId, userId },
            headers: { Authorization: `Bearer ${token}` },
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

  useEffect(() => {
    if (transcriptionInProgress) {
      setLiveTranscript(interimTranscript);
    }
  }, [transcriptionInProgress, interimTranscript]);

  const handleStartStopRecording = () => {
    if (isRecording) {
      console.log("Stopping transcription...");
      setIsRecording(false);
      handleStartStopTranscription();

      // Stop the microphone
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          stream.getTracks().forEach(track => track.stop());
        })
        .catch(err => console.error("Error stopping microphone:", err));

    } else {
      console.log("Starting transcription...");
      setIsRecording(true);
      handleStartStopTranscription();
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!selectedClientId || !date || !length || !type) {
      setMessage('All fields are required.');
      return;
    }

    const { tenantId, userId, token } = user;
    try {
      const decryptedTranscript = finalTranscript ? 
        encryptionService.decrypt(finalTranscript) : '';

      const sessionData = {
        tenantId,
        clientId: selectedClientId,
        userId,
        date,
        length,
        type,
        notes,
        transcript: decryptedTranscript,
        transcriptionMetadata: {
          startTime: new Date().toISOString(),
          hasTranscription: !!finalTranscript,
          transcriptionStatus: 'completed'
        }
      };

      const encryptedSessionData = encryptionService.encrypt(sessionData);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/sessions`,
        { data: encryptedSessionData },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      setMessage(`Session created successfully for client ID: ${response.data.clientId}`);
      navigate('/sessions');
    } catch (error) {
      console.error('Error creating session:', error);
      setMessage(error.response?.data?.error || 'Failed to create session');
    }
  };

  return (
    <div className="sessions-section">
      <h3>New Session</h3>
      {message && <p className="error-message">{message}</p>}
      {transcriptionError && <p className="error-message">{transcriptionError}</p>}
      
      <form className="form-group" onSubmit={handleCreateSession} autoComplete="off">
        <div className="form-row">
          <label className="client-label new-session-label">
            <span className="new-session-span">Select Client</span>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              required
              disabled={!!id}
            >
              <option value="">Client</option>
              {filteredClients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.firstName} {client.lastName}
                </option>
              ))}
            </select>
          </label>

          <label className="new-session-label">
            <span className="new-session-span">Date:</span>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              required 
            />
          </label>

          <label className="new-session-label">
            <span className="new-session-span">Length:</span>
            <select 
              value={length} 
              onChange={(e) => setLength(e.target.value)} 
              required
            >
              <option value="">Select Length</option>
              <option value="00:15">00:15</option>
              <option value="00:30">00:30</option>
              <option value="00:45">00:45</option>
              <option value="01:00">01:00</option>
              <option value="01:15">01:15</option>
              <option value="01:30">01:30</option>
              <option value="01:45">01:45</option>
              <option value="02:00">02:00</option>
              <option value="02:00+">02:00+</option>
            </select>
          </label>
        </div>

        <div className="transcription-controls">
          <button
            type="button"
            className={isRecording ? 'btn close-btn' : 'btn secondary-btn'}
            onClick={handleStartStopRecording}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
          
          {isRecording && (
            <span className="recording-indicator">Recording in progress...</span>
          )}
        </div>

        <div className="transcription-section">
          <label className="new-session-label">Transcription:</label>
          <div id="transcription-box" className="transcription-box">
            {liveTranscript || 'No transcription yet'}
          </div>
        </div>

        <label className="new-session-label">Notes:</label>
        <div className="form-row">
          <ReactQuill className="react-quill" value={notes} onChange={setNotes} placeholder="Type notes..." />
        </div>

        <div className="button-container">
          <button type="button" onClick={() => navigate('/sessions')} className="btn close-btn">
            Cancel
          </button>
          <button type="submit" className="btn primary-btn">
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateSessionPage;
