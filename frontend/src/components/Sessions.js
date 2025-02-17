import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import { FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles
import { useAuth } from '../context/AuthContext'; // Import AuthContext

const ITEMS_PER_PAGE = 10; // Number of items per page

const SessionPage = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false); // State to control modal visibility
  const [currentSessionNotes, setCurrentSessionNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false); // State to control editing mode
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1); // Current page state


  const { user } = useAuth(); // Access the current user from AuthContext



  useEffect(() => {
    const fetchSessions = async () => {

      const { tenantId, userId, token } = user; // Get tenantId and userId from user context

      try {
        console.log("Get Sessions for Selected Tenant:", tenantId);
        console.log("Get Sessions for Selected User:", userId);
        const response = await axios.get(`http://localhost:5001/api/sessions?tenantId=${tenantId}&userId=${userId}&sortBy=date&order=desc`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // Format sessions with full client name
      const formattedSessions = response.data.map((session) => ({
        ...session,
        clientName: session.clientId
          ? `${session.clientId.firstName} ${session.clientId.lastName}`
          : "Unknown", // Handle missing client data
      }));

      // Ensure sorting by date (descending)
      const sortedSessions = formattedSessions.sort((a, b) => new Date(b.date) - new Date(a.date));

      setSessions(sortedSessions);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setMessage('Failed to load sessions.');
      }
    };

    fetchSessions();
  }, [user]);

  const handleSelectSession = (session) => {
    setSelectedSessionId(session.sessionId);
  };

  const filteredSessions = sessions.filter((session) => {
      const clientName = session.clientId
      ? `${session.clientId.firstName} ${session.clientId.lastName}`.toLowerCase()
      : ""; // Ensure it's a string

      return (
        clientName.includes(searchTerm.toLowerCase()) || 
        session.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      });

  // Pagination logic
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
  
      const response = await axios.get(`http://localhost:5001/api/sessions?tenantId=${user.tenantId}&userId=${user._id}`);
      setSessions(response.data);
      setShowModal(false); // Close modal after saving
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
              {currentSessions.map((session) => (
                <tr
                  key={session.sessionId}
                  className={selectedSessionId === session.sessionId ? 'selected' : ''}
                  onClick={() => handleSelectSession(session)}
                >
                  <td>{(() => {
                      const [year, month, day] = session.date.split('T')[0].split('-');
                      return `${month}/${day}/${year}`;
                    })()}</td>
                  <td>
                    {session.clientId
                    ? `${session.clientId.firstName} ${session.clientId.lastName}`
                    : "Unknown"}
                  </td>
                  <td>{session.type}</td>
                  <td>{session.length}</td>
                  <td><button onClick={() => handleViewNotes(session)}>View Notes</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination Controls */}
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
    </div>
  );
};

export default SessionPage;