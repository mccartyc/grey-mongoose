import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import { FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles


const SessionPage = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false); // State to control modal visibility
  const [currentSessionNotes, setCurrentSessionNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false); // State to control editing mode
  const navigate = useNavigate();


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

  
  const handleViewNotes = (session) => {
    setCurrentSessionNotes(session.notes); // Set the notes for the selected session
    setSelectedSessionId(session.sessionId); // Set selected session ID
    setIsEditing(false); // Set to not editing initially
    setShowModal(true); // Show the modal
  };

  const handleEditNotes = () => {
    setIsEditing(true);
  };

  const handleSaveNotes = async () => {
    try {
      // Archive original notes, you would typically want to do this in your backend
      const originalNotes = { content: sessions.find(s => s.sessionId === selectedSessionId).notes, archived: true };
      // Here you might want to save the original notes in your backend if required
      await axios.post(`http://localhost:5001/api/notes/archive`, originalNotes); // Example endpoint for archiving notes

      // Save updated notes
      const updatedNotes = { notes: currentSessionNotes, sessionId: selectedSessionId };
      await axios.put(`http://localhost:5001/api/sessions/${selectedSessionId}`, updatedNotes); // Update session with new notes

      // Refresh session data
      const tenantId = "ed2c3dad-153b-46e7-b480-c70b867d8aa9"; // Your tenant ID
      const userId = "4e0bf9c5-cc78-4028-89e5-02d6003f4cdc"; // Your user ID
      const response = await axios.get(`http://localhost:5001/api/sessions?tenantId=${tenantId}&userId=${userId}`);
      setSessions(response.data);
      setShowModal(false); // Close modal after saving
    } catch (error) {
      console.error('Error saving notes:', error);
      setMessage('Failed to save notes.');
    }
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
              <th>Client Name</th>
              <th>Type</th>
              <th>Length</th>
              <th>Detail</th>
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
                <td><button onClick={() => handleViewNotes(session)}>View Notes</button></td>
              </tr>
            ))}
          </tbody>
        </table>

        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Session Notes</h2>
                <button onClick={() => setShowModal(false)}>X</button>
              </div>
              <div className="modal-body">
                {isEditing ? (
                  <ReactQuill
                    value={currentSessionNotes}
                    onChange={setCurrentSessionNotes}
                  />
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: currentSessionNotes }} />
                )}
              </div>
              <div className="modal-footer">
                {isEditing ? (
                  <button onClick={handleSaveNotes}>Save Changes</button>
                ) : (
                  <button onClick={handleEditNotes}>Edit</button>
                )}
                <button onClick={() => window.print()}>Print</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionPage;