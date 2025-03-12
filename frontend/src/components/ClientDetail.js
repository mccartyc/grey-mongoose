import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/styles.css';
import '../styles/clientDetailStyles.css';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SessionList from './sessions/SessionList';
import { createApiInstance } from '../utils/apiConfig';

const ClientDetail = () => {
  const { id } = useParams();
  const [client, setClient] = useState({});
  const [sessions, setSessions] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [message, setMessage] = useState('');
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
        'Content-Type': 'application/json'
      },
    };

    try {
      setIsLoading(true);
      setError(null);

      console.log(`Fetching data for client ID: ${id}`);
      
      // Fetch client details first
      const apiInstance = createApiInstance(user.token);
      const clientResponse = await apiInstance.get(`/api/clients/${id}`, {
        params: {
          tenantId: user.tenantId,
          userId: user.userId,
        }
      });
      console.log('Client data received');
      
      // The backend should already return decrypted contact information
      // If we need to do any client-side formatting, do it here
      const clientData = clientResponse.data;
      
      // Format phone number if needed
      if (clientData.phone) {
        const digits = clientData.phone.replace(/\D/g, '');
        if (digits.length === 10) {
          clientData.formattedPhone = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
        } else {
          clientData.formattedPhone = clientData.phone;
        }
      }
      
      setClient(clientData);
      
      // Then fetch sessions
      try {
        const sessionsResponse = await axios.get(`/api/sessions/client/${id}`, {
          ...config,
          params: {
            ...config.params,
            sortBy: 'date',
            order: 'desc'
          }
        });
        console.log('Sessions data:', sessionsResponse.data);
        setSessions(sessionsResponse.data);
      } catch (sessionError) {
        console.error('Error fetching sessions:', sessionError);
        setSessions([]); // Set empty array if sessions fetch fails
      }
      
      // Finally fetch upcoming events
      try {
        console.log(`Fetching events for client ID: ${id}`);
        const upcomingResponse = await apiInstance.get(`/api/events/client/${id}`, {
          params: {
            tenantId: user.tenantId,
            userId: user.userId,
            sortBy: 'start',
            order: 'asc'
          }
        });
        
        console.log('Upcoming events data:', upcomingResponse.data);
                
        setUpcomingAppointments(upcomingResponse.data);
        
      } catch (eventError) {
        console.error('Error fetching events:', eventError);
        setUpcomingAppointments([]); // Set empty array if events fetch fails
      }

      // Data is already set in the individual fetch calls
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching client details:', error);
      setError(error.response?.data?.error || 'Failed to fetch client details');
      setIsLoading(false);
    }
  };

  fetchClientDetails();
}, [id, user?.tenantId, user?.userId, user?.token]);

const handleSessionUpdate = async (sessionId, updatedNotes) => {
  try {
    await axios.put(
      `/api/sessions/${sessionId}`,
      updatedNotes,
      
    );

    // Refresh sessions
    const response = await axios.get(
      `/api/sessions/client/${id}`,
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
        <p><strong>Phone:</strong> {client.formattedPhone}</p>
        <p><strong>Email:</strong> {client.email}</p>
        <p><strong>Address:</strong> {client.streetAddress} {client.city}, {client.state} {client.zipcode}</p>
        <p><strong>Birthday:</strong> {new Date(client.birthday).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}</p>
        <p><strong>Gender:</strong> {client.gender}</p>
      </div>

      <div className="upcoming-appointments">
        <h3>Upcoming Appointments</h3>
        {upcomingAppointments.length > 0 ? (
          <ul className="appointment-list">
            {upcomingAppointments.map((appointment) => {
              // Format the date nicely
              const appointmentDate = new Date(appointment.date || appointment.start);
              const formattedDate = appointmentDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              });
              const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });
              
              return (
                <li key={appointment._id} className="appointment-item">
                  <div className="appointment-date">
                    <span className="appointment-day">{formattedDate}</span>
                    <span className="appointment-time">{formattedTime}</span>
                  </div>
                  <div className="appointment-details">
                    <span className="appointment-title">{appointment.title || 'Client Session'}</span>
                    <span className="appointment-type">{appointment.category || appointment.type}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="empty-state">
            <p>No upcoming appointments.</p>
          </div>
        )}
      </div>
    </div>

      <SessionList
        sessions={sessions}
        onSessionUpdate={handleSessionUpdate}
        user={user}
        clientId={id}
      />
      {/* {message && <p className="message error">{message}</p>} */}
  </div>
);
};

export default ClientDetail;