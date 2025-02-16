import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSession } from '../../hooks/useSession';
import ClientSelector from './ClientSelector';
import SessionDetails from './SessionDetails';
import TranscriptSection from './TranscriptSection';
import NotesEditor from './NotesEditor';
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
  const [length, setLength] = useState('');
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptBoxContent, setTranscriptBoxContent] = useState('');
  const [transcriptText, setTranscriptText] = useState('');

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
      setIsTranscribing(true);
      setTranscriptBoxContent('Transcription started...\n');
      await startTranscript();
      setMessage('Transcription started successfully');
    } catch (error) {
      setMessage('Failed to start transcription');
      setIsTranscribing(false);
    }
  };

  const handleStopTranscript = async () => {
    if (!isTranscribing) return;
    
    try {
      const response = await stopTranscript();
      if (response.transcript) {
        setTranscriptBoxContent(prev => prev + response.transcript);
        setTranscriptText(response.transcript);
        setMessage('Transcription completed successfully');
      }
    } catch (error) {
      setMessage('Failed to stop transcription');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();

    if (!selectedClientId || !date || !length || !type) {
      setMessage('All fields are required.');
      return;
    }

    try {
      await createSession({
        clientId: selectedClientId,
        date,
        length,
        type,
        notes,
        transcript: transcriptText,
      });

      setMessage('Session created successfully');
      navigate('/sessions');
    } catch (error) {
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
