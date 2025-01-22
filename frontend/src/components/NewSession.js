import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles
import { useAuth } from '../context/AuthContext'; // Import AuthContext

const CreateSessionPage = () => {
  const { id } = useParams();
  const [filteredClients, setFilteredClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [length, setLength] = useState('');
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptionInProgress, setTranscriptionInProgress] = useState(false);
  // const [transcriptionLog, setTranscriptionLog] = useState([]); // Log for start/stop times
  const [hasTranscriptionStarted, setHasTranscriptionStarted] = useState(false); // To track if transcription started in this session
  const navigate = useNavigate();
  const { user } = useAuth();
  const recognition = React.useRef(null);

  // useEffect(() => {
  //   if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  //     const SpeechRecognition =
  //       window.webkitSpeechRecognition || window.SpeechRecognition;
  //     recognition.current = new SpeechRecognition();
  //     recognition.current.continuous = true;
  //     recognition.current.interimResults = true;
  //     recognition.current.lang = 'en-US';

  //     let lastResultIndex = 0;

  //     recognition.current.onresult = (event) => {
  //       let interimText = '';
  //       for (let i = lastResultIndex; i < event.results.length; i++) {
  //         const transcript = event.results[i][0].transcript;
  //         if (event.results[i].isFinal) {
  //           setFinalTranscript((prev) => `${prev} ${transcript}`.trim());
  //           lastResultIndex = i + 1;
  //         } else {
  //           interimText += transcript;
  //         }
  //       }
  //       setInterimTranscript(interimText);
  //     };

  //     recognition.current.onerror = (event) => {
  //       console.error('Speech recognition error:', event.error);
  //     };
  //   } else {
  //     alert('Speech recognition is not supported in this browser.');
  //   }
  // }, []);

  const handleStartStopTranscription = () => {
    if (isRecording) {
      recognition.current?.stop();
      setIsRecording(false);
      setTranscriptionInProgress(false);
  
      // Log the stop event directly into the transcript
      setFinalTranscript((prev) => `${prev}\n[Transcript stopped at ${new Date().toLocaleString()}]\n`);
    } else {
      const confirmStart = window.confirm(
        'Do you want to start recording your notes?'
      );
      if (confirmStart) {
        // Reinitialize the SpeechRecognition instance
        const SpeechRecognition =
          window.webkitSpeechRecognition || window.SpeechRecognition;
        recognition.current = new SpeechRecognition();
        recognition.current.continuous = true;
        recognition.current.interimResults = true;
        recognition.current.lang = 'en-US';
  
        // Reset the last processed result index
        let lastResultIndex = 0;
  
        recognition.current.onresult = (event) => {
          let interimText = '';
          for (let i = lastResultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              // Append finalized transcript to finalTranscript state
              setFinalTranscript((prev) => `${prev} ${transcript}`.trim());
              lastResultIndex = i + 1; // Update to skip processed results
            } else {
              setHasTranscriptionStarted(true);
              interimText += transcript; // Append interim results
            }
          }
  
          // Update interim transcript state for live UI updates
          setInterimTranscript(interimText);
        };
  
        recognition.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
        };
  
        setIsRecording(true);
        setTranscriptionInProgress(true);
  
        // Log the start event directly into the transcript
        setFinalTranscript((prev) => `${prev}\n[Transcript started at ${new Date().toLocaleString()}]\n`);
  
        recognition.current.start();
      }
    }
  };
  
  // Clean up the recognition instance when the component unmounts
  useEffect(() => {
    return () => {
      recognition.current?.abort();
    };
  }, []);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition =
        window.webkitSpeechRecognition || window.SpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.lang = 'en-US';
  
      // Track last processed result
      let lastResultIndex = 0;
  
      recognition.current.onresult = (event) => {
        let interimText = '';
        for (let i = lastResultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            // Append finalized transcript to finalTranscript state
            setFinalTranscript((prev) => `${prev}${transcript}.`.trim());
            lastResultIndex = i + 1; // Update to skip processed results
          } else {
            setHasTranscriptionStarted(true);
            interimText += transcript; // Append interim results
          }
        }
  
        // Update interim transcript state for live UI updates
        setInterimTranscript(interimText);
      };
  
      recognition.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };
    } else {
      alert('Speech recognition is not supported in this browser.');
    }
  }, []);

  const handleCreateSession = async (e) => {
    e.preventDefault();

    if (!selectedClientId || !date || !length || !type) {
      setMessage('All fields are required.');
      return;
    }

    const { tenantId, userId, token } = user;

    try {
      const response = await axios.post(
        'http://localhost:5001/api/sessions',
        {
          tenantId: tenantId,
          clientId: selectedClientId,
          userId: userId,
          date,
          length,
          type,
          notes,
          transcription: finalTranscript, // Submit the finalized transcript
          // transcriptionLog, // Include transcription log
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
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

  useEffect(() => {
    const fetchClients = async () => {
      const { tenantId, userId, token } = user;

      try {
        const response = await axios.get(
          `http://localhost:5001/api/clients?tenantId=${tenantId}&userId=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
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

  return (
    <div className="sessions-section">
      <h3>New Session</h3>
      {message && <p className="error-message">{message}</p>}
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
                <option key={client.clientId} value={client.clientId}>
                  {client.firstName} {client.lastName}
                </option>
              ))}
            </select>
          </label>
          <label className="new-session-label">
            <span className="new-session-span">Date:</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label className="new-session-label">
            <span className="new-session-span">Length:</span>
            <select value={length} onChange={(e) => setLength(e.target.value)} required>
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
          <label className="new-session-label">
            <span className="new-session-span">Type:</span>
            <select value={type} onChange={(e) => setType(e.target.value)} required>
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
        <div>
          <button
            type="button"
            className={isRecording ? 'btn close-btn' : 'btn secondary-btn'}
            onClick={handleStartStopTranscription}
          >
            {isRecording ? 'Stop Transcript' : 'Start Transcript'}
          </button>
          {transcriptionInProgress && (
            <span className="recording-indicator">Recording in progress...</span>
          )}
        </div>
        {transcriptionInProgress && (finalTranscript || interimTranscript) && (
        <label className="new-session-label">Transcription (Live):</label>
          )}
          {hasTranscriptionStarted && (finalTranscript || interimTranscript) && (
            <div id="transcription-box" className="transcription-box">
              {finalTranscript}
              {interimTranscript && <span style={{ color: 'gray' }}>{interimTranscript}</span>}
            </div>
          )}
        <label className="new-session-label">Notes:</label>
        <div className="form-row">
          <ReactQuill
            className="react-quill"
            value={notes}
            onChange={setNotes}
            placeholder="Type notes..."
          />
        </div>
        <div className="button-container">
          <button
            type="button"
            onClick={() => {
              if (id) {
                navigate(`/clients/${id}/overview`);
              } else {
                navigate('/sessions');
              }
            }}
            className="btn close-btn"
          >
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
