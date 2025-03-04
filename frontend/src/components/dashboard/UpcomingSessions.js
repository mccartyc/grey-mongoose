import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import '../../styles/dashboardStyles.css';

const UpcomingSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.token) {
      fetchAllUpcomingEvents();
    }
  }, [user?.token]);

  const fetchAllUpcomingEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch both sessions and calendar events
      const [sessionsData, eventsData] = await Promise.all([
        fetchUpcomingSessions(),
        fetchUpcomingCalendarEvents()
      ]);
      
      // Combine and sort all upcoming events
      const allEvents = [...sessionsData, ...eventsData];
      allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Limit to 10 events
      const limitedEvents = allEvents.slice(0, 10);
      
      setSessions(limitedEvents);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      setError('Failed to load upcoming events');
      setLoading(false);
    }
  };
  
  const fetchUpcomingSessions = async () => {
    if (!user?.token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    const axiosInstance = axios.create({
      baseURL: 'http://localhost:5001',
      timeout: 5000,
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json'
      }
    });

    try {
      // Get current date (start of today)
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      // Get date 30 days from now (end of that day)
      const nextMonth = new Date(now);
      nextMonth.setDate(now.getDate() + 30);
      nextMonth.setHours(23, 59, 59, 999);
      
      console.log('Date range for filtering:', now, 'to', nextMonth);
      
      // Format dates for API
      const startDate = now.toISOString();
      const endDate = nextMonth.toISOString();

      console.log('Fetching upcoming sessions from', startDate, 'to', endDate);

      // Fetch upcoming sessions from the server
      // Since the sessions API doesn't directly support future date filtering,
      // we'll fetch and filter client-side
      const response = await axiosInstance.get('/api/sessions', {
        params: {
          tenantId: user.tenantId,
          userId: user.userId,
          sort: 'date',
          order: 'asc'
        }
      });

      // Filter sessions to only include those in the next 30 days
      // Make sure to use the session date, not the current time for comparison
      const upcomingSessions = response.data.filter(session => {
        const sessionDate = new Date(session.date);
        // Reset hours to ensure we're comparing just the dates
        const sessionDateOnly = new Date(sessionDate);
        sessionDateOnly.setHours(0, 0, 0, 0);
        return sessionDateOnly >= now && sessionDateOnly <= nextMonth;
      });

      console.log('Filtered upcoming sessions:', upcomingSessions.length);

      // Process and format sessions
      const formattedSessions = upcomingSessions.map(session => {
        // Get client name from the populated data
        let clientName = session.clientName || 'Unknown Client';
        if (!session.clientName && session.clientId && session.clientId.firstName) {
          // If clientId is populated with client data
          clientName = `${session.clientId.firstName} ${session.clientId.lastName || ''}`;
        }
        
        return {
          ...session,
          clientName: clientName.trim(),
          formattedDate: formatDateTime(new Date(session.date))
        };
      });

      // Sort by date (ascending)
      formattedSessions.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Return formatted sessions
      return formattedSessions;
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error);
      throw error;
    }
  };

  // Format date and time in a readable format
  const formatDateTime = (date) => {
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  // Fetch upcoming calendar events
  const fetchUpcomingCalendarEvents = async () => {
    if (!user?.token) {
      throw new Error('Authentication required');
    }
    
    const axiosInstance = axios.create({
      baseURL: 'http://localhost:5001',
      timeout: 5000,
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    try {
      // Get current date (start of today)
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      // Get date 30 days from now (end of that day)
      const nextMonth = new Date(now);
      nextMonth.setDate(now.getDate() + 30);
      nextMonth.setHours(23, 59, 59, 999);
      
      console.log('Date range for filtering:', now, 'to', nextMonth);
      
      // Format dates for API
      const startDate = now.toISOString();
      const endDate = nextMonth.toISOString();
      
      console.log('Fetching upcoming calendar events from', startDate, 'to', endDate);
      
      // Fetch events for the date range
      const response = await axiosInstance.get('/api/events', {
        params: {
          tenantId: user.tenantId,
          userId: user.userId,
          startDate,
          endDate
        }
      });
      
      // Filter for only client sessions within the date range
      const clientSessionEvents = response.data.filter(event => {
        // Only include Client Session events
        if (event.category !== 'Client Session') return false;
        
        // Check if the event is within the date range
        const eventDate = new Date(event.start);
        const eventDateOnly = new Date(eventDate);
        eventDateOnly.setHours(0, 0, 0, 0);
        
        return eventDateOnly >= now && eventDateOnly <= nextMonth;
      });
      
      console.log('Filtered client session events:', clientSessionEvents.length);
      
      console.log('Client session events before formatting:', clientSessionEvents);
      
      // First, collect all client IDs that need to be looked up
      const clientIdsToLookup = [];
      clientSessionEvents.forEach(event => {
        if (event.clientId && (!event.clientName || event.clientName.startsWith('Client ID:'))) {
          clientIdsToLookup.push(event.clientId);
        }
      });
      
      // If we have client IDs to look up, fetch them all at once
      let clientMap = {};
      if (clientIdsToLookup.length > 0) {
        try {
          console.log(`Need to look up ${clientIdsToLookup.length} clients`);
          
          // Make a direct API call to get all clients
          const clientsResponse = await axiosInstance.get('/api/clients', {
            params: {
              tenantId: user.tenantId,
              userId: user.userId
            }
          });
          
          // Create a map of client IDs to names
          if (clientsResponse.data && Array.isArray(clientsResponse.data)) {
            clientsResponse.data.forEach(client => {
              clientMap[client._id] = `${client.firstName} ${client.lastName}`;
            });
            console.log('Created client map with', Object.keys(clientMap).length, 'clients');
          }
        } catch (error) {
          console.error('Error fetching clients:', error);
        }
      }
      
      // Process and format events to match session format
      const formattedEvents = await Promise.all(clientSessionEvents.map(async event => {
        // Get client name from the populated data or our client map
        let clientName = event.clientName || clientMap[event.clientId] || 'No Client';
        
        // If we still don't have a client name, try a direct lookup
        if (clientName === 'No Client' && event.clientId) {
          try {
            console.log(`Trying direct lookup for client ID: ${event.clientId}`);
            const clientResponse = await axiosInstance.get(`/api/clients/${event.clientId}`, {
              params: {
                tenantId: user.tenantId,
                userId: user.userId
              }
            });
            
            if (clientResponse.data) {
              const client = clientResponse.data;
              clientName = `${client.firstName} ${client.lastName}`;
              console.log(`Found client name via direct lookup: ${clientName}`);
            }
          } catch (error) {
            console.error(`Error in direct client lookup for ${event.clientId}:`, error);
          }
        }
        
        return {
          _id: event._id,
          date: event.start,
          clientName: clientName.trim(),
          type: event.category,
          isCalendarEvent: true,
          formattedDate: formatDateTime(new Date(event.start))
        };
      }));
      
      console.log('Formatted events with client names:', formattedEvents);
      
      return formattedEvents;
    } catch (error) {
      console.error('Error fetching upcoming calendar events:', error);
      throw error;
    }
  };
  
  // Get color based on session or event type
  const getTypeColor = (type) => {
    const typeColors = {
      'Initial Consultation': '#4F46E5',
      'Follow-up': '#10B981',
      'Therapy': '#3B82F6',
      'Assessment': '#F59E0B',
      'Group': '#8B5CF6',
      'Crisis': '#EF4444',
      // Calendar event categories
      'Client Session': '#2563eb',
      'Internal Meeting': '#0891b2',
      'Preparation': '#4f46e5',
      'Out of Office': '#7c3aed',
      'Personal': '#6366f1',
      'Other': '#64748b'
    };
    
    return typeColors[type] || '#64748B';
  };

  if (loading) {
    return (
      <div className="dashboard-card">
        <h3 style={{ fontSize: '0.875rem', color: '#0F172A', marginBottom: '12px', fontWeight: 600, paddingBottom: '8px', borderBottom: '1px solid rgba(15, 23, 42, 0.1)' }}>Upcoming Client Sessions (Next 30 Days)</h3>
        <div className="dashboard-card-content loading">
          <div className="spinner-small"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-card">
        <h3 style={{ fontSize: '0.875rem', color: '#0F172A', marginBottom: '12px', fontWeight: 600, paddingBottom: '8px', borderBottom: '1px solid rgba(15, 23, 42, 0.1)' }}>Upcoming Client Sessions (Next 30 Days)</h3>
        <div className="dashboard-card-content error">
          <p>{error}</p>
          <button onClick={fetchAllUpcomingEvents} className="retry-button-small">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      <h3 style={{ fontSize: '0.875rem', color: '#0F172A', marginBottom: '12px', fontWeight: 600, paddingBottom: '8px', borderBottom: '1px solid rgba(15, 23, 42, 0.1)' }}>Upcoming Client Sessions (Next 30 Days)</h3>
      <div className="dashboard-card-content">
        {sessions.length > 0 ? (
          <div className="upcoming-sessions-list">
            {sessions.map((session, index) => (
              <div key={session._id || index} className="upcoming-session-item">
                <div className="session-client">{session.clientName}</div>
                <div className="session-meta">
                  <span 
                    className="session-type-badge"

                  >
                    {session.type}
                  </span>
                  <span className="session-datetime">
                    {session.formattedDate.date}, {session.formattedDate.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No upcoming client sessions in the next 30 days</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingSessions;
