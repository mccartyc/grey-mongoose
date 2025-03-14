import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { decryptText, encryptText } from '../../utils/encryption';
import DraggablePanel from './DraggablePanel';
import { useNotification } from '../../context/NotificationContext';
import { createApiInstance } from '../../utils/apiConfig';
import { FaExpand } from 'react-icons/fa';

const ITEMS_PER_PAGE = 10;

const SessionList = ({ 
  sessions = [], 
  onSessionUpdate,
  clientId,
  user
}) => {
  const [selectedSession, setSelectedSession] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [panelWidth, setPanelWidth] = useState(500); // Track panel width for persistence
  const apiInstance = createApiInstance(user.token);

  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const handleViewNotes = (session) => {
    // Try to decrypt the notes and transcript
    let notesContent = session.notes;
    let transcriptContent = session.transcript;
    
    if (notesContent) {
      try {
        const decrypted = decryptText(notesContent);
        notesContent = decrypted;
        console.log('Successfully decrypted notes');
      } catch (error) {
        console.error('Failed to decrypt notes:', error);
        notesContent = 'Unable to decrypt notes. Please contact support.';
      }
    }
    
    if (transcriptContent) {
      try {
        const decrypted = decryptText(transcriptContent);
        transcriptContent = decrypted;
        console.log('Successfully decrypted transcript');
      } catch (error) {
        console.error('Failed to decrypt transcript:', error);
        transcriptContent = 'Unable to decrypt transcript. Please contact support.';
      }
    }
    
    const sessionToDisplay = {
      ...session,
      notes: notesContent || 'No notes available for this session.',
      transcript: transcriptContent || 'No transcript available for this session.'
    };
    
    setSelectedSession(sessionToDisplay);
    setIsPanelOpen(true);
    setIsClosing(false);
    setIsEditing(false);
    
    // Scroll to the top of the page to ensure good visibility
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Add panel-open class to the content-area container and set margin immediately
    const contentArea = document.querySelector('.content-area');
    if (contentArea) {
      // Set the margin first, then add the class to ensure smooth transition
      contentArea.style.marginRight = `${panelWidth}px`;
      // Use requestAnimationFrame to ensure the style is applied before adding the class
      requestAnimationFrame(() => {
        contentArea.classList.add('panel-open');
      });
    }
    
    // Highlight the row of the selected session
    setTimeout(() => {
      const rows = document.querySelectorAll('.session-table tbody tr');
      rows.forEach(row => {
        if (row.dataset.sessionId === session.sessionId) {
          row.classList.add('selected-session');
        } else {
          row.classList.remove('selected-session');
        }
      });
    }, 100);
  };

  const handleEditNotes = () => {
    setIsEditing(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedSession?.sessionId || !user?.token) {
      showNotification('Missing required data for saving notes', 'error');
      return;
    }

    try {
      console.log('Attempting to save notes for session:', selectedSession.sessionId);
      const encryptedNotes = encryptText(selectedSession.notes);
      
      const updatedNotes = {
        notes: encryptedNotes,
        sessionId: selectedSession.sessionId,
        tenantId: user.tenantId,
        userId: user.userId
      };

      const response = await apiInstance.put(
        `/api/sessions/${selectedSession.sessionId}`,
        updatedNotes,
        {
          params: {
            tenantId: user.tenantId,
            userId: user.userId
          }
        }
      );
      
      if (response.status === 200) {
        console.log('Successfully saved notes for session:', selectedSession.sessionId);
        setIsEditing(false);
        showNotification('Notes saved successfully', 'success');
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      console.error('Session update failed:', {
        sessionId: selectedSession.sessionId,
        error: error.response?.data || error.message
      });
      showNotification(error.response?.data?.error || 'Failed to save notes', 'error');
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

  // Update the main content margin when panel width changes
  const updateMainContentMargin = (newWidth) => {
    setPanelWidth(newWidth);
    // Update the CSS variable for the panel width
    document.documentElement.style.setProperty('--panel-width', `${newWidth}px`);
    
    // Update the margin of the content-area
    const contentArea = document.querySelector('.content-area');
    if (contentArea && contentArea.classList.contains('panel-open')) {
      // Use requestAnimationFrame to ensure smooth updates
      requestAnimationFrame(() => {
        contentArea.style.marginRight = `${newWidth}px`;
      });
    }
  };

  return (
    <div className="sessions-section">
      <div className="content-container">
        <div className="header-container">
          <button 
            onClick={() => navigate(clientId ? `/clients/${clientId}/new-session` : '/sessions/newsession')} 
            className="btn primary-btn"
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

        <table className={`session-table ${clientId ? 'client-detail-session-table' : ''}`}>
          <thead>
            <tr>
              <th>Date</th>
              {!clientId && <th>Client Name</th>}
              <th>Type</th>
              <th>Length</th>
              <th>Session Id</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {currentSessions.length > 0 ? (
              currentSessions.map((session) => (
                <tr 
                  key={session.sessionId} 
                  data-session-id={session.sessionId} 
                  className={selectedSession?.sessionId === session.sessionId ? 'selected-session' : ''}
                  onClick={() => handleViewNotes(session)}
                  role="button"
                  aria-label={`View details for session on ${new Date(session.date).toLocaleDateString()} with ${session.clientName}`}
                  tabIndex="0"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleViewNotes(session);
                    }
                  }}
                >
                  <td title={new Date(session.date).toLocaleDateString()}>{new Date(session.date).toLocaleDateString()}</td>
                  {!clientId && <td title={session.clientName}>{session.clientName}</td>}
                  <td title={session.type}>{session.type}</td>
                  <td title={`${session.length} minutes`}>{session.length}</td>
                  <td title={session.sessionId}>{session.sessionId}</td>
                  <td className="action-cell">
                    <i className="fa fa-chevron-right view-icon"></i>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={clientId ? 5 : 6} className="no-sessions-message">
                  No sessions found for this client.
                </td>
              </tr>
            )}
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
            Page {currentPage} of {totalPages || 1}
          </span>
          <button 
            className="btn secondary-btn"
            onClick={handleNextPage} 
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next
          </button>
        </div>
      </div>

      {/* Notes Side Panel */}
      {isPanelOpen && selectedSession && (
        <DraggablePanel 
          isOpen={isPanelOpen} 
          onClose={() => {
            setIsClosing(true);
            
            // Remove panel-open class from the content-area
            const contentArea = document.querySelector('.content-area');
            if (contentArea) {
              contentArea.classList.remove('panel-open');
              contentArea.style.marginRight = '0';
            }
            
            // Actually close the panel after animation completes
            setTimeout(() => {
              setIsPanelOpen(false);
              setIsClosing(false);
              // Remove selected session highlight
              const rows = document.querySelectorAll('.session-table tbody tr');
              rows.forEach(row => row.classList.remove('selected-session'));
            }, 200); // Match the animation duration
          }}
          initialWidth={panelWidth}
          minWidth={300}
          maxWidth={800}
          onWidthChange={updateMainContentMargin}
        >
          <div className="sessions-panel-header">
            <div className="panel-header-actions">
              <FaExpand 
                className="panel-icon" 
                onClick={() => navigate(`/sessions/${selectedSession.sessionId}`)}
                title="View Full Session"
              />
              <button className="close-btn" onClick={() => setIsPanelOpen(false)}>×</button>
            </div>
          </div>

          {/* Session Info */}
          <div className="panel-section">
            <p><strong>Id:</strong> {selectedSession.sessionId}</p>
            <p><strong>Client:</strong> {selectedSession.clientName || 'Not specified'}</p>
            <p><strong>Date:</strong> {new Date(selectedSession.date).toLocaleDateString()}</p>
            <p><strong>Type:</strong> {selectedSession.type}</p>
            <p><strong>Length:</strong> {selectedSession.length} minutes</p>
          </div>

          {/* Notes Section */}
          <div className="panel-section">
            <h3>Session Notes</h3>

            <div className="sessions-panel-body">
              {isEditing ? (
                <ReactQuill
                  value={selectedSession.notes}
                  onChange={(value) =>
                    setSelectedSession((prev) => ({ ...prev, notes: value }))
                  }
                  style={{ height: '200px', marginBottom: '10px' }}
                />
              ) : (
                <div className="content-box">
                  {/* Check if notes appear to be HTML content */}
                  {selectedSession.notes && selectedSession.notes.includes('<') && selectedSession.notes.includes('>') ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedSession.notes }} />
                  ) : (
                    /* Display as plain text if not HTML */
                    <p>{selectedSession.notes || 'No notes available for this session.'}</p>
                  )}
                </div>
              )}
              {isEditing ? (
              <button className="btn primary-btn" onClick={handleSaveNotes}>Save Changes</button>
            ) : (
              <button className="btn secondary-btn" onClick={handleEditNotes}>Edit Notes</button>
            )}
            </div>
          </div>

          {/* Transcript Section */}
          <div className="panel-section">
            <h3>Session Transcript</h3>
            <div className="content-box transcript-box">
              <p>{selectedSession.transcript || 'No transcript available for this session.'}</p>
            </div>
          </div>
        </DraggablePanel>
      )}
    </div>
  );
};

export default SessionList;
