import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { decryptText, encryptText } from '../utils/encryption';
import '../styles/sessionDetailStyles.css';
import { createApiInstance } from '../utils/apiConfig';

const SessionDetail = () => {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [client, setClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [notesContent, setNotesContent] = useState('');
  const { user } = useAuth();
  const apiInstance = createApiInstance(user.token);

  useEffect(() => {
    const fetchSessionDetails = async () => {
      if (!id || !user?.tenantId || !user?.userId || !user?.token) {
        console.error('Missing required data for fetching session details');
        return;
      }

      const config = {
        params: {
          tenantId: user.tenantId,
          userId: user.userId,
        },
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      try {
        setIsLoading(true);
        setError(null);

        console.log(`Fetching data for session ID: ${id}`);
        
        
        // Directly fetch the specific session by ID
        const sessionResponse = await apiInstance.get(`/api/sessions/detail/${id}`, {
          params: {
            tenantId: user.tenantId,
            userId: user.userId
          }
        });
        
        if (!sessionResponse.data) {
          throw new Error('Session not found');
        }
        
        const sessionData = sessionResponse.data;
        
        console.log('Session data:', sessionData);
        
        // Safely decrypt notes and transcript if they exist
        if (sessionData.notes) {
          try {
            const decryptedNotes = decryptText(sessionData.notes);
            // Check if decryption was successful or returned an error message
            if (decryptedNotes.startsWith('Error') || decryptedNotes === 'Unable to decrypt content') {
              console.warn('Could not decrypt notes, using original content');
              sessionData.notes = 'Notes could not be decrypted. Please contact support.';
            } else {
              sessionData.notes = decryptedNotes;
            }
            setNotesContent(sessionData.notes);
          } catch (decryptError) {
            console.error('Error decrypting notes:', decryptError);
            sessionData.notes = 'Notes could not be decrypted. Please contact support.';
            setNotesContent(sessionData.notes);
          }
        }
        
        if (sessionData.transcript) {
          try {
            const decryptedTranscript = decryptText(sessionData.transcript);
            // Check if decryption was successful or returned an error message
            if (decryptedTranscript.startsWith('Error') || decryptedTranscript === 'Unable to decrypt content') {
              console.warn('Could not decrypt transcript, using original content');
              sessionData.transcript = 'Transcript could not be decrypted. Please contact support.';
            } else {
              sessionData.transcript = decryptedTranscript;
            }
          } catch (decryptError) {
            console.error('Error decrypting transcript:', decryptError);
            sessionData.transcript = 'Transcript could not be decrypted. Please contact support.';
          }
        }
        
        setSession(sessionData);
        
        // Fetch client details using the session's clientId
        if (sessionData.clientId) {
          console.log(`Fetching client data for clientId: ${sessionData.clientId}`);
          try {
            const clientResponse = await apiInstance.get(`/api/clients/${sessionData.clientId}`, {
              params: {
                tenantId: user.tenantId,
                userId: user.userId
              }
            });
            console.log('Client data:', clientResponse.data);
            // Backend will return decrypted contact information
            setClient(clientResponse.data);
          } catch (clientError) {
            console.error('Error fetching client details:', clientError);
            // Don't fail the whole operation if client fetch fails
          }
        } else {
          console.warn('No clientId found in session data');
        }
      } catch (error) {
        console.error('Error fetching session details:', error);
        setError(error.response?.data?.error || 'Failed to fetch session details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionDetails();
  }, [id, user?.tenantId, user?.userId, user?.token]);

  const handleEditNotes = () => {
    setIsEditing(true);
  };

  const handleNotesChange = (content) => {
    setNotesContent(content);
  };

  const handleSaveNotes = async () => {
    if (!session?.sessionId || !user?.token) {
      setMessage('Missing required data for saving notes');
      return;
    }

    try {
      console.log(`Attempting to save notes for session: ${session.sessionId}`);
      
      // Send notes as plain text and let the backend handle encryption
      const updatedNotes = {
        notes: notesContent,
        tenantId: user.tenantId,
        userId: user.userId
      };

      await apiInstance.put(
        `/api/sessions/detail/${session.sessionId}`,
        updatedNotes
      );
      
      // Update the session object with the new notes
      setSession({
        ...session,
        notes: notesContent
      });
      
      setIsEditing(false);
      setMessage('Notes saved successfully');
      
      // Clear the message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error saving notes:', error);
      setMessage(error.response?.data?.error || 'Failed to save notes');
    }
  };

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  if (isLoading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!session) {
    return <div className="error-message">Session not found</div>;
  }

  return (
    <div className="session-detail-container">
      {message && <p className={`message ${message.includes('success') ? 'success' : 'error'}`}>{message}</p>}
      
      <div className="session-detail-content">
        <div className="session-info-section">

          {client && (
            <div className="client-info-card">
              <h3 className="section-title">Client Information</h3>
              <div className="info-grid">
              <div className="info-item">
                  <span className="info-label">Client ID:</span>
                  <span className="info-value">{client._id}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Name:</span>
                  <span className="info-value">{client.firstName} {client.lastName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Phone:</span>
                  <span className="info-value">
                    {client.phone || (client.contact && client.contact.phone) || 'Not available'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">
                    {client.email || (client.contact && client.contact.email) || 'Not available'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="session-info-card">
            <h3 className="section-title">Session Information</h3>
            <div className="info-grid">
            <div className="info-item">
                <span className="info-label">Session ID:</span>
                <span className="info-value">{session.sessionId}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Date:</span>
                <span className="info-value">{new Date(session.date).toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Type:</span>
                <span className="info-value">{session.type}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Length:</span>
                <span className="info-value">{session.length} minutes</span>
              </div>
            </div>
          </div>
        </div>

        <div className="session-notes-section">
          <div className="notes-header">
            <h3 className="section-title">Session Notes</h3>
            {isEditing ? (
              <button className="btn primary-btn" onClick={handleSaveNotes}>Save Notes</button>
            ) : (
              <button className="btn secondary-btn" onClick={handleEditNotes}>Edit Notes</button>
            )}
          </div>
          <div className="notes-content">
            {isEditing ? (
              <ReactQuill
                value={notesContent}
                onChange={handleNotesChange}
                className="notes-editor"
              />
            ) : (
              <div className="content-box">
                {/* Check if notes appear to be HTML content */}
                {notesContent && notesContent.includes('<') && notesContent.includes('>') ? (
                  <div dangerouslySetInnerHTML={{ __html: notesContent }} />
                ) : (
                  /* Display as plain text if not HTML */
                  <p>{notesContent || 'No notes available for this session.'}</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="session-transcript-section">
          <div className="notes-header">
            <h3 className="section-title">Session Transcript</h3>
          </div>
          <div className="content-box transcript-box">
            <p>{session.transcript || 'No transcript available for this session.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionDetail;
