import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import { FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const SessionPage = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false); // State for showing/hiding the form
  const navigate = useNavigate();

  // State variables for the form fields
  const [date, setDate] = useState('');
  const [length, setLength] = useState('');
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      const tenantId = "ed2c3dad-153b-46e7-b480-c70b867d8aa9"; // Adjust as necessary
      const userId = "4e0bf9c5-cc78-4028-89e5-02d6003f4cdc"; // Adjust as necessary

      console.log("Selected Tenant:", tenantId);
      console.log("Selected User:", userId);

      try {
        const response = await axios.get(`http://localhost:5001/api/sessions?tenantId=${tenantId}&userId=${userId}`);
        setSessions(response.data);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setMessage('Failed to load sessions.');
      }
    };

    fetchSessions();
  }, []);

  const handleSelectSession = (session) => {
    setSelectedSessionId(session.sessionId);
  };

  const filteredSessions = sessions.filter((session) =>
    session.clientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSession = async (e) => {
    e.preventDefault();

    const tenantId = "ed2c3dad-153b-46e7-b480-c70b867d8aa9"; // Adjust as necessary
    const userId = "4e0bf9c5-cc78-4028-89e5-02d6003f4cdc"; // Adjust as necessary

    try {
      const response = await axios.post('http://localhost:5001/api/sessions', {
        tenantId,
        clientId: selectedSessionId, // Use selected client ID from your logic
        userId,
        date,
        length,
        type,
        notes,
      });

      setMessage(`Session created successfully for ${response.data.clientId}`);
      setSessions((prev) => [...prev, response.data]);
      resetFormFields();
      setShowForm(false); // Close the form after creation
    } catch (error) {
      console.error('Error creating session:', error);
      setMessage(error.response?.data?.error || 'Failed to create session');
    }
  };

  const resetFormFields = () => {
    setDate('');
    setLength('');
    setType('');
    setNotes('');
  };

  return (
    <div className="session-page">
      <div className="content-container">
        <div className="header-container">
          <div>
            <button onClick={() => navigate('/sessions/newsession')} className="btn create-btn">New Session</button> {/* Navigate to CreateSessionPage */}
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {message && <p className="error-message">{message}</p>}

        <table className="session-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Client</th>
              <th>Type</th>
              <th>Length</th>
              <th className="action-column">Detail</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.map((session) => (
              <tr
                key={session.sessionId}
                className={selectedSessionId === session.sessionId ? 'selected' : ''}
                onClick={() => handleSelectSession(session)}
              >
                <td>{new Date(session.date).toLocaleDateString()}</td>
                <td>{session.clientId}</td>
                <td>{session.type}</td>
                <td>{session.length}</td>
                <td>{session.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SessionPage;