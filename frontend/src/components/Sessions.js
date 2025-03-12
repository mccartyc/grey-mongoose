import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import SessionList from './sessions/SessionList';
import { createApiInstance } from '../utils/apiConfig';

const SessionPage = () => {
  const [sessions, setSessions] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user?.tenantId || !user?.userId || !user?.token) {
        console.error('Missing required user data');
        return;
      }

      try {
        setIsLoading(true);
        const response = await axios.get(
          `http://localhost:5001/api/sessions?tenantId=${user.tenantId}&userId=${user.userId}&sortBy=date&order=desc`,
          { headers: { Authorization: `Bearer ${user.token}` } }
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
        setMessage('Failed to load sessions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [user?.tenantId, user?.userId, user?.token]);

  const handleSessionUpdate = async (sessionId, updatedNotes) => {
    try {
      await axios.put(
        `http://localhost:5001/api/sessions/${sessionId}`,
        updatedNotes,
        {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        }
      );

      // Refresh sessions
      const response = await axios.get(
        `http://localhost:5001/api/sessions?tenantId=${user.tenantId}&userId=${user.userId}&sortBy=date&order=desc`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        }
      );

      const formattedSessions = response.data.map((session) => ({
        ...session,
        clientName: session.clientId
          ? `${session.clientId.firstName} ${session.clientId.lastName}`
          : "Unknown",
      }));

      setSessions(formattedSessions);
      return true;
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="session-page">
      <SessionList
        sessions={sessions}
        onSessionUpdate={handleSessionUpdate}
        user={user}
      />
      {message && <p className="message error">{message}</p>}
    </div>
  );
};

export default SessionPage;
