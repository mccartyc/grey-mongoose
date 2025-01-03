import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles

const CreateSessionPage = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Set today's date as default
  const [length, setLength] = useState('');
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClients = async () => {
      const tenantId = "ed2c3dad-153b-46e7-b480-c70b867d8aa9"; // Adjust as necessary
      const userId = "4e0bf9c5-cc78-4028-89e5-02d6003f4cdc"; // Adjust as necessary

      try {
        const response = await axios.get(`http://localhost:5001/api/clients?tenantId=${tenantId}&userId=${userId}`);
        setClients(response.data);
        setFilteredClients(response.data); // Initialize filtered clients
      } catch (error) {
        console.error('Error fetching clients:', error);
        setMessage('Failed to load clients.');
      }
    };

    fetchClients();
  }, []);

  const handleClientSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setFilteredClients(clients.filter(client => 
      client.firstName.toLowerCase().includes(value) || 
      client.lastName.toLowerCase().includes(value)
    ));
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();

    if (!selectedClientId || !date || !length || !type) {
      setMessage('All fields are required.');
      return;
    }

    const tenantId = "ed2c3dad-153b-46e7-b480-c70b867d8aa9"; // Adjust as necessary
    const userId = "4e0bf9c5-cc78-4028-89e5-02d6003f4cdc"; // Adjust as necessary

    try {
      const response = await axios.post('http://localhost:5001/api/sessions', {
        tenantId,
        clientId: selectedClientId,
        userId,
        date,
        length,
        type,
        notes, // The notes will now be in rich text format
      });

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
          <label className="client-label">
            <span>Select Client:</span>
            <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} required>
              <option value="">Select a client</option>
              {filteredClients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.firstName} {client.lastName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Date:</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label>
            <span>Length:</span>
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
          <label>
            <span>Type:</span>
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
        <div className="form-row">
          <label>Record:</label>
        </div>
        <div className="form-row">
          <button type="button" className="btn primary-btn">Start Transcript</button>
          <button type="button" className="btn primary-btn">Stop Transcript</button>
        </div>
        <label>
          <span>Notes:</span>
        </label>
        <div className="form-row">
          <ReactQuill 
            className="react-quill" 
            value={notes} 
            onChange={setNotes} 
            placeholder="Type notes..." />
        </div>
        <div className="button-container">
          <button type="button" onClick={() => navigate('/sessions')} className="btn close-btn">Cancel</button>
          <button type="submit" className="btn primary-btn">Submit</button>
        </div>
      </form>
    </div>
  );
};

export default CreateSessionPage;