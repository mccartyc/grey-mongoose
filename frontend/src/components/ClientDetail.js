import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/styles.css';
import '../styles/clientDetailStyles.css';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SessionList from './sessions/SessionList';

const ClientDetail = () => {
  const { id } = useParams();
  const [client, setClient] = useState({});
  const [sessions, setSessions] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const { user } = useAuth();

useEffect(() => {
  const fetchClientDetails = async () => {
    if (!id || !user?.tenantId || !user?.userId || !user?.token) {
      console.error('Missing required data for fetching client details');
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

      // Fetch all data in parallel
      const [
        clientResponse,
        sessionsResponse,
        upcomingResponse
      ] = await Promise.all([
        axios.get(`http://localhost:5001/api/clients/${id}`, config),
        axios.get(`http://localhost:5001/api/sessions/client/${id}`, {
          ...config,
          params: {
            ...config.params,
            sortBy: 'date',
            order: 'desc'
          }
        }),
        axios.get(`http://localhost:5001/api/events/client/${id}`, {
          ...config,
          params: {
            ...config.params,
            sortBy: 'start',
            order: 'asc'
          }
        })
      ]);

      setClient(clientResponse.data);
      setSessions(sessionsResponse.data);
      setUpcomingAppointments(upcomingResponse.data);
    } catch (error) {
      console.error('Error fetching client details:', error);
      setError(error.response?.data?.error || 'Failed to fetch client details');
    } finally {
      setIsLoading(false);
    }
  };

  fetchClientDetails();
}, [id, user?.tenantId, user?.userId, user?.token]);

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
      `http://localhost:5001/api/sessions/client/${id}`,
      {
        headers: {
          Authorization: `Bearer ${user.token}`
        },
        params: {
          tenantId: user.tenantId,
          userId: user.userId,
          sortBy: 'date',
          order: 'desc'
        }
      }
    );

    setSessions(response.data);
    return true;
  } catch (error) {
    console.error('Error updating session:', error);
    throw error;
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

return (
  <div className="client-detail-page">
    <div className="top-section">
      <div className="client-details">
        <h3>Client Details</h3>
        <p><strong>Id:</strong> {id}</p>
        <p><strong>First Name:</strong> {client.firstName}</p>
        <p><strong>Last Name:</strong> {client.lastName}</p>
        <p><strong>Phone:</strong> {client.phone}</p>
        <p><strong>Email:</strong> {client.email}</p>
        <p><strong>Address:</strong> {client.streetAddress} {client.city}, {client.state} {client.zipcode}</p>
        <p><strong>Birthday:</strong> {new Date(client.birthday).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}</p>
        <p><strong>Gender:</strong> {client.gender}</p>
      </div>

      <div className="upcoming-appointments">
        <h3>Upcoming Appointments</h3>
        {upcomingAppointments.length > 0 ? (
          <ul>
            {upcomingAppointments.map((appointment) => (
              <li key={appointment.id}>
                {new Date(appointment.date).toLocaleString()} - {appointment.type}
              </li>
            ))}
          </ul>
        ) : (
          <p>No upcoming appointments.</p>
        )}
      </div>
    </div>

      <SessionList
        sessions={sessions}
        onSessionUpdate={handleSessionUpdate}
        user={user}
        clientId={id}
      />
      {message && <p className="message error">{message}</p>}
  </div>
);
};

export default ClientDetail;