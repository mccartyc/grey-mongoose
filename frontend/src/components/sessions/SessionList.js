import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import CryptoJS from 'crypto-js';

const ITEMS_PER_PAGE = 10;

const SessionList = ({ 
  sessions, 
  onSessionUpdate,
  clientId,
  user
}) => {
  const [selectedSession, setSelectedSession] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  const navigate = useNavigate();

  const decryptText = (encryptedText) => {
    if (!encryptedText) return '';
    try {
      return CryptoJS.AES.decrypt(
        encryptedText,
        process.env.REACT_APP_ENCRYPTION_KEY
      ).toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Error decrypting text:', error);
      return 'Error decrypting content';
    }
  };

  const handleViewNotes = (session) => {
    const decryptedSession = {
      ...session,
      notes: decryptText(session.notes),
      transcript: decryptText(session.transcript)
    };
    setSelectedSession(decryptedSession);
    setIsPanelOpen(true);
    setIsEditing(false);
  };

  const handleEditNotes = () => {
    setIsEditing(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedSession?.sessionId || !user?.token) {
      setMessage('Missing required data for saving notes');
      return;
    }

    try {
      // Encrypt notes before sending
      const encryptedNotes = CryptoJS.AES.encrypt(
        selectedSession.notes,
        process.env.REACT_APP_ENCRYPTION_KEY
      ).toString();

      const updatedNotes = {
        notes: encryptedNotes,
        sessionId: selectedSession.sessionId,
        tenantId: user.tenantId,
        userId: user.userId
      };

      await onSessionUpdate(selectedSession.sessionId, updatedNotes);
      setIsEditing(false);
      setMessage('Notes saved successfully');
    } catch (error) {
      console.error('Error saving notes:', error);
      setMessage(error.response?.data?.error || 'Failed to save notes');
    }
  };

  const filteredSessions = sessions.filter((session) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      session.type.toLowerCase().includes(searchTermLower) ||
      (session.notes || '').toLowerCase().includes(searchTermLower)
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

  return (
    <div className="sessions-section">
      <div className="content-container">
        <div className="header-container">
          <button 
            onClick={() => navigate(clientId ? `/clients/${clientId}/new-session` : '/sessions/newsession')} 
            className="btn create-btn"
          >
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
        {message && <p className={`message ${message.includes('success') ? 'success' : 'error'}`}>{message}</p>}

        <table className="session-table">
          <thead>
            <tr>
              <th>Date</th>
              {!clientId && <th>Client Name</th>}
              <th>Type</th>
              <th>Length</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {currentSessions.map((session) => (
              <tr key={session.sessionId}>
                <td>{new Date(session.date).toLocaleDateString()}</td>
                {!clientId && <td>{session.clientName}</td>}
                <td>{session.type}</td>
                <td>{session.length}</td>
                <td>
                  <button className="btn secondary-btn" onClick={() => handleViewNotes(session)}>View Notes</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <button 
            className="btn secondary-btn"
            onClick={handlePrevPage} 
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button 
            className="btn secondary-btn"
            onClick={handleNextPage} 
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {/* Notes Side Panel */}
      {isPanelOpen && selectedSession && (
        <div className="sessions-side-panel">
          <div className="sessions-panel-header">
            <h2>Session Details</h2>
            <button className="close-btn" onClick={() => setIsPanelOpen(false)}>×</button>
          </div>

          {/* Session Info */}
          <div className="session-info">
            <p><strong>Date:</strong> {new Date(selectedSession.date).toLocaleDateString()}</p>
            <p><strong>Type:</strong> {selectedSession.type}</p>
            <p><strong>Length:</strong> {selectedSession.length} minutes</p>
          </div>

          {/* Notes Section */}
          <div className="panel-section">
            <h3>Notes</h3>
            <div className="sessions-panel-body">
              {isEditing ? (
                <ReactQuill
                  value={selectedSession.notes}
                  onChange={(value) =>
                    setSelectedSession((prev) => ({ ...prev, notes: value }))
                  }
                />
              ) : (
                <div className="content-box" dangerouslySetInnerHTML={{ __html: selectedSession.notes || 'No notes available' }} />
              )}
            </div>
          </div>

          {/* Transcript Section */}
          <div className="panel-section">
            <h3>Transcript</h3>
            <div className="content-box transcript-box">
              {selectedSession.transcript || 'No transcript available'}
            </div>
          </div>

          <div className="sessions-panel-footer">
            {isEditing ? (
              <button className="btn primary-btn" onClick={handleSaveNotes}>Save Changes</button>
            ) : (
              <button className="btn secondary-btn" onClick={handleEditNotes}>Edit Notes</button>
            )}
            <button 
              className="btn primary-btn"
              onClick={() => navigate(`/sessions/${selectedSession.sessionId}`)}
            >
              Full View
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionList;
