import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles
import { useAuth } from '../context/AuthContext'; // Import AuthContext

const ITEMS_PER_PAGE = 10;

const SessionPage = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuth(); // Access the current user from AuthContext

  useEffect(() => {
    const fetchSessions = async () => {
      const { tenantId, userId, token } = user;

      try {
        const response = await axios.get(
          `http://localhost:5001/api/sessions?tenantId=${tenantId}&userId=${userId}&sortBy=date&order=desc`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const formattedSessions = response.data.map((session) => ({
          ...session,
          clientName: session.clientId
            ? `${session.clientId.firstName} ${session.clientId.lastName}`
            : "Unknown",
        }));

        setSessions(formattedSessions);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setMessage('Failed to load sessions.');
      }
    };

    fetchSessions();
  }, [user]);

  const filteredSessions = sessions.filter((session) => {
    const clientName = session.clientId
      ? `${session.clientId.firstName} ${session.clientId.lastName}`.toLowerCase()
      : "";

    return (
      clientName.includes(searchTerm.toLowerCase()) || 
      session.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredSessions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentSessions = filteredSessions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prevPage) => prevPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prevPage) => prevPage - 1);
  };

  const handleViewNotes = (session) => {
    setSelectedSession(session);
    setIsPanelOpen(true);
    setIsEditing(false);
  };

  const handleEditNotes = () => {
    setIsEditing(true);
  };

  const handleSaveNotes = async () => {
    try {
      const updatedNotes = { notes: selectedSession.notes, sessionId: selectedSession.sessionId };

      await axios.put(
        `http://localhost:5001/api/sessions/${selectedSession.sessionId}`,
        updatedNotes
      );

      const response = await axios.get(
        `http://localhost:5001/api/sessions?tenantId=${user.tenantId}&userId=${user._id}`
      );
      setSessions(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving notes:', error);
      setMessage('Failed to save notes.');
    }
  };

  return (
    <div className="session-page">
      <div className="sessions-section">
        <div className="content-container">
          <div className="header-container">
            <button onClick={() => navigate('/sessions/newsession')} className="btn create-btn">
              New Session
            </button>
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
              {currentSessions.map((session) => (
                <tr key={session.sessionId}>
                  <td>{session.date.split('T')[0]}</td>
                  <td>{session.clientName}</td>
                  <td>{session.type}</td>
                  <td>{session.length}</td>
                  <td>
                    <button onClick={() => handleViewNotes(session)}>View Notes</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button onClick={handlePrevPage} disabled={currentPage === 1}>
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button onClick={handleNextPage} disabled={currentPage === totalPages}>
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Notes Side Panel */}
      {isPanelOpen && selectedSession && (
        <div className="sessions-side-panel">
          <div className="sessions-panel-header">
            <h2>Session Notes</h2>
            <button onClick={() => setIsPanelOpen(false)}>X</button>
          </div>
          <div className="sessions-panel-body">
            {isEditing ? (
              <ReactQuill
                value={selectedSession.notes}
                onChange={(value) =>
                  setSelectedSession((prev) => ({ ...prev, notes: value }))
                }
              />
            ) : (
              <div dangerouslySetInnerHTML={{ __html: selectedSession.notes }} />
            )}
          </div>
          <div className="sessions-panel-footer">
            {isEditing ? (
              <button onClick={handleSaveNotes}>Save Changes</button>
            ) : (
              <button onClick={handleEditNotes}>Edit</button>
            )}
            <button onClick={() => navigate(`/sessions/${selectedSession.sessionId}`)}>
              Full View
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionPage;
