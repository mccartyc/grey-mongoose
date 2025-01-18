import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles
import { useAuth } from '../context/AuthContext'; // Import AuthContext

const CreateSessionPage = () => {
  const { id } = useParams(); // Get client ID from the URL (if available)
  const [filteredClients, setFilteredClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Set today's date as default
  const [length, setLength] = useState('');
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const { user } = useAuth(); // Access the current user from AuthContext

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

        // If `id` is available, auto-select the client
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
          notes, // The notes will now be in rich text format
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(`Session created successfully for client ID: ${response.data.clientId}`);
      navigate('/sessions'); // Redirect to the sessions page
    } catch (error) {
      console.error('Error creating session:', error);
      setMessage(error.response?.data?.error || 'Failed to create session');
    }
  };

  return (
    <div className="create-session-page">
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
              disabled={!!id} // Disable if `id` is available
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
        <label className="new-session-label">
          Notes:
        </label>
        <div className="form-row">
          <ReactQuill
            className="react-quill"
            value={notes}
            onChange={setNotes}
            placeholder="Type notes..."
          />
        </div>
        <div className="button-container">
          <button type="button" 
            onClick={() => {
              if (id) {
                navigate(`/clients/${id}/overview`); // Navigate to client overview if `id` is present
              } else {
                navigate('/sessions'); // Navigate to sessions if `id` is not present
              }
            }} 
            className="btn close-btn">
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
