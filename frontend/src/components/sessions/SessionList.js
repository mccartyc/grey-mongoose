import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import CryptoJS from 'crypto-js';
import DraggablePanel from './DraggablePanel';

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
  const [isClosing, setIsClosing] = useState(false);
  const [panelWidth, setPanelWidth] = useState(500); // Track panel width for persistence
  
  const navigate = useNavigate();

  const decryptText = (encryptedText) => {
    if (!encryptedText) return '';
    
    // Check if it's already plain text
    if (typeof encryptedText === 'string' && 
        (encryptedText.includes(' ') || 
         encryptedText.includes('.') || 
         encryptedText.includes('\n'))) {
      return encryptedText;
    }
    
    // The format appears to be: [ciphertext]:[iv]
    try {
      // Check if the text contains a colon which would indicate the special format
      if (encryptedText.includes(':')) {
        console.log('Found special encryption format with IV');
        const [ciphertext, iv] = encryptedText.split(':');
        
        // Get the key from the .env file
        const key = 'c5cd94bd263cca1652097fbc5263c373b7921f0d9134eefc899ffbfcd87e314c';
        
        // Create key and IV word arrays
        const keyWordArray = CryptoJS.enc.Hex.parse(key.substring(0, 32)); // Use first 32 chars (16 bytes)
        const ivWordArray = CryptoJS.enc.Hex.parse(iv);
        
        // Decrypt with the parsed key and IV
        const decrypted = CryptoJS.AES.decrypt(
          { ciphertext: CryptoJS.enc.Hex.parse(ciphertext) },
          keyWordArray,
          { iv: ivWordArray }
        ).toString(CryptoJS.enc.Utf8);
        
        if (decrypted && decrypted.length > 0) {
          console.log('Successfully decrypted content with IV');
          return decrypted;
        }
      }
      
      // Try standard decryption as fallback
      const key = 'c5cd94bd263cca1652097fbc5263c373b7921f0d9134eefc899ffbfcd87e314c';
      const decrypted = CryptoJS.AES.decrypt(encryptedText, key).toString(CryptoJS.enc.Utf8);
      
      if (decrypted && decrypted.length > 0) {
        console.log('Successfully decrypted content with standard method');
        return decrypted;
      }
      
      console.log('All decryption attempts failed');
      return 'Unable to decrypt content';
    } catch (error) {
      console.error('Error during decryption:', error.message);
      return 'Error decrypting content';
    }
  };

  const handleViewNotes = (session) => {
    // Try to decrypt the notes and transcript
    let notesContent = session.notes;
    let transcriptContent = session.transcript;
    
    if (notesContent) {
      try {
        const decrypted = decryptText(notesContent);
        notesContent = decrypted;
      } catch (error) {
        console.error('Failed to decrypt notes:', error);
      }
    }
    
    if (transcriptContent) {
      try {
        const decrypted = decryptText(transcriptContent);
        transcriptContent = decrypted;
      } catch (error) {
        console.error('Failed to decrypt transcript:', error);
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
      setMessage('Missing required data for saving notes');
      return;
    }

    try {
      // Encrypt notes using the same format as the backend
      const key = 'c5cd94bd263cca1652097fbc5263c373b7921f0d9134eefc899ffbfcd87e314c';
      const keyWordArray = CryptoJS.enc.Hex.parse(key.substring(0, 32));
      
      // Generate a random IV
      const iv = CryptoJS.lib.WordArray.random(16);
      
      // Encrypt the notes
      const encrypted = CryptoJS.AES.encrypt(selectedSession.notes, keyWordArray, {
        iv: iv
      });
      
      // Format as ciphertext:iv
      const encryptedNotes = encrypted.ciphertext.toString(CryptoJS.enc.Hex) + ':' + iv.toString(CryptoJS.enc.Hex);
      
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {currentSessions.map((session) => (
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
                <td>{new Date(session.date).toLocaleDateString()}</td>
                {!clientId && <td>{session.clientName}</td>}
                <td>{session.type}</td>
                <td>{session.length}</td>
                <td className="action-cell">
                  <i className="fa fa-chevron-right view-icon"></i>
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
            <h2>Session Details</h2>
            <button className="close-btn" onClick={() => setIsPanelOpen(false)}>×</button>
          </div>

          {/* Session Info */}
          <div className="panel-section">
            <p><strong>Date:</strong> {new Date(selectedSession.date).toLocaleDateString()}</p>
            <p><strong>Type:</strong> {selectedSession.type}</p>
            <p><strong>Length:</strong> {selectedSession.length} minutes</p>
            <p><strong>Client:</strong> {selectedSession.clientName || 'Not specified'}</p>
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
            </div>
          </div>

          {/* Transcript Section */}
          <div className="panel-section">
            <h3>Session Transcript</h3>
            <div className="content-box transcript-box">
              <p>{selectedSession.transcript || 'No transcript available for this session.'}</p>
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
              View Full Session
            </button>
          </div>
        </DraggablePanel>
      )}
    </div>
  );
};

export default SessionList;
