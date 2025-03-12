// src/pages/MyCalendar.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import SideNavBar from '../components/SideNavBar';
import '../styles/styles.css'; // Ensure styles are imported
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction'; // Required for event interaction
import { useAuth } from '../context/AuthContext'; // Import auth context
import axios from 'axios';
import { getApiBaseUrl, createApiInstance } from '../utils/apiConfig';


const categoryColors = {
  'Client Session': '#2563eb',    // Medium blue - primary color for client sessions
  'Internal Meeting': '#0891b2',  // Blue-teal - complementary professional tone
  'Preparation': '#4f46e5',       // Indigo - distinct but harmonious with blues
  'Out of Office': '#7c3aed',     // Purple - stands out while matching theme
  'Personal': '#6366f1',          // Blue-violet - personal but professional
  'Other': '#64748b',            // Slate blue-gray - neutral but cohesive
};


// Generate time options in 15-minute increments (6:00 AM to 10:00 PM)
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      const time = `${formattedHour}:${formattedMinute}`;
      const displayTime = formatDisplayTime(hour, minute);
      options.push(
        <option key={time} value={time}>
          {displayTime}
        </option>
      );
    }
  }
  return options;
};

// Format time for display (12-hour format with AM/PM)
const formatDisplayTime = (hour, minute) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const formattedMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${formattedMinute} ${period}`;
};

const MyCalendar = () => {
  const { user } = useAuth(); // Get user authentication details
  const calendarRef = useRef(null); // Reference for FullCalendar instance
  const calendarContainerRef = useRef(null); // Reference for the container element
  const [collapsed, setCollapsed] = useState(false);
  // const [calendar, setCalendar] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [category, setCategory] = useState('Other');
  const [clientId, setClientId] = useState(null); // Store selected client ID
  const [clients, setClients] = useState([]); // Store clients list
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [eventToDelete, setEventToDelete] = useState(null);

  // Toggle sidebar state
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleEventChange = useCallback(async (changeInfo) => {
    const { event } = changeInfo;
  
    const updatedEvent = {
      id:  event.id,
      title: event.title,
      start: event.start.toISOString(),
      end: event.end ? event.end.toISOString() : null,
      allDay: event.allDay,
      category: event.extendedProps.category,
    };
  
    try {
      const { token } = user;
      console.log('Outgoing event change request:', updatedEvent, ' for event:',  event.id);
      await axios.put(`http://localhost:5001/api/events/${event.id}`, updatedEvent, {
        params: {
          tenantId: user.tenantId,
          userId: user.userId,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      setEvents((prevEvents) =>
        prevEvents.map((ev) => (ev._id === event.id ? { ...ev, ...updatedEvent } : ev))
      );
    } catch (error) {
      console.error('Error updating event:', error);
    }
  }, [user, setEvents]);



  const handleEventDelete = useCallback(async (eventId) => {

    if (!eventToDelete) return;

    if (!window.confirm('Are you sure you want to delete this event?')) return;
  
    try {
      const { token } = user;
      await axios.delete(`http://localhost:5001/api/events/${eventId}`, {
        params: {
          tenantId: user.tenantId,
          userId: user.userId,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      setEvents((prevEvents) => prevEvents.filter((event) => event._id !== eventId));
      setMessage('Event deleted successfully!');
      setShowContextMenu(false);
    } catch (error) {
      console.error('Error deleting event:', error);
      setMessage('Failed to delete event');
    }
  },[user, setEvents]);

  const fetchClients = useCallback(async () => {
    if (!user) return;
    const { token } = user;

    try {
      const apiInstance = createApiInstance(token);
      const response = await apiInstance.get(`/api/clients/`, {
        params: {
          tenantId: user.tenantId,
          userId: user.userId,
        }
      });

      setClients(response.data); // Store clients in state
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  }, [user]);


  const fetchEvents = useCallback(async () => {
    if (!user) return;
    const { token } = user;
  
    try {
      const apiInstance = createApiInstance(token);
      const response = await apiInstance.get('/api/events', {
        params: {
          tenantId: user.tenantId,
          userId: user.userId,
        }
      });
  
      const formattedEvents = response.data.map(event => {
        // Store client information in the event
        const formattedEvent = {
          id: event._id,
          title: event.title,
          start: new Date(event.start).toISOString(),
          end: event.end ? new Date(event.end).toISOString() : new Date(event.start).toISOString(),
          allDay: event.allDay,
          color: categoryColors[event.category] || '#808080',
          extendedProps: {
            category: event.category,
            clientId: event.clientId,
            clientName: event.clientName
          }
        };
        
        // For client sessions, include client name in the title if available
        if (event.category === 'Client Session' && event.clientName) {
          formattedEvent.title = `${event.title} - ${event.clientName}`;
        }
        
        return formattedEvent;
      });
  
      console.log("Events fetched:", formattedEvents);
      setEvents(formattedEvents); // Store events in state
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  }, [user]);
  


  useEffect(() => {
    window.scrollTo(0, 0);

    if (!user) return;

    const fetchData = async () => {
      console.log("🔍 Fetching events and clients...");
      await Promise.all([fetchEvents(), fetchClients()]); 
    };

    fetchData();
  }, [user, fetchEvents, fetchClients]);

  // Handle calendar events
  const handleEventDrop = useCallback((info) => {
    handleEventChange(info);
  }, [handleEventChange]);

  const handleEventResize = useCallback((info) => {
    handleEventChange(info);
  }, [handleEventChange]);

  const handleDateClick = useCallback((info) => {
    setEventDate(info.dateStr);
    setShowEventForm(true);
  }, []);

  const handleEventClick = useCallback((info) => {
    console.log('Event clicked:', info.event);
    // You can implement event details view here
  }, []);



  const handleAddEvent = async (e) => {
    e.preventDefault();
    
    if (!eventTitle || !eventDate || (!allDay && (!startTime || !endTime))) {
      setMessage('Please enter all event details');
      return;
    }
    
    // Validate that end time is after start time
    if (!allDay && startTime && endTime) {
      const startDateTime = new Date(`${eventDate}T${startTime}:00`);
      const endDateTime = new Date(`${eventDate}T${endTime}:00`);
      
      if (endDateTime <= startDateTime) {
        setMessage('End time must be after start time');
        return;
      }
    }

    const newEvent = {
      title: eventTitle,
      start: allDay ? `${eventDate}T00:00:00` : `${eventDate}T${startTime}:00`,
      end: allDay ? `${eventDate}T23:59:59` : `${eventDate}T${endTime}:00`,
      allDay: allDay,
      category: category,
      color: categoryColors[category],
      clientId: category === "Client Session" ? clientId : null,
      userId: user.userId,
      tenantId: user.tenantId,
    };

    console.log("Sending event data:", newEvent); // Debug log

    try {
      const { token } = user; // Ensure user authentication
      const apiInstance = createApiInstance(token);
      const response = await apiInstance.post('/api/events', newEvent, {
        params: {
          tenantId: user.tenantId,
          userId: user.userId,
        }
      });

    setEvents((prev) => [...prev, response.data]);
    setMessage('Event added successfully!');
    if (calendarRef.current) {
      calendarRef.current.addEvent({
        id: response.data._id,
        title: response.data.title,
        start: response.data.start,
        end: response.data.end || response.data.start,
        allDay: response.data.allDay,
        color: categoryColors[response.data.category] || '#808080',
      });
    }
    await fetchEvents();
    
    // Reset form fields after successful submission
    resetFormFields();
    
    // Close the form after a short delay to show the success message
    setTimeout(() => {
      setShowEventForm(false);
    }, 1500);
  } catch (error) {
    console.error('Error saving event:', error);
    setMessage('Failed to save event');
  }
  };

  useEffect(() => {
    if (category === "Client Session") {
      fetchClients();
    }
  }, [category, fetchClients]); 

  useEffect(() => {
    // Resize calendar dynamically when the sidebar is toggled
    if (calendarRef.current) {
      setTimeout(() => {
        calendarRef.current.updateSize();
      }, 200); // Small delay to ensure DOM changes have taken effect
    }
  }, [collapsed]);

  useEffect(() => {
    // Automatically resize calendar on container resize
    const resizeObserver = new ResizeObserver(() => {
      if (calendarRef.current) {
        calendarRef.current.updateSize();
      }
    });

    if (calendarContainerRef.current) {
      resizeObserver.observe(calendarContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const resetFormFields = () => {
    setEventTitle('');
    setEventDate('');
    setStartTime('');
    setEndTime('');
    setAllDay(false);
    setCategory('Other');
    setClientId(null);
    setMessage('');
  };

  const handleCloseForm = () => {
    resetFormFields(); // Clear all form fields
    setShowEventForm(false); // Hide the form
  };

  return (
    <div className={`main-content no-scroll ${collapsed ? 'collapsed' : ''}`}>
      <SideNavBar collapsed={collapsed} toggleSidebar={toggleSidebar} />
      <div className="content-area">
        <h1 className="page-heading">Calendar</h1>
        <div className="calendar-container">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today addEvent',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            customButtons={{
              addEvent: {
                text: 'Add Event',
                click: () => setShowEventForm(true)
              }
            }}
            buttonText={{
              today: 'Today',
              month: 'Month View',
              week: 'Week View',
              day: 'Day View'
            }}
            events={events}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            height="auto"
            allDaySlot={true}
            slotDuration="00:30:00"
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            scrollTime="08:00:00"
            expandRows={true}
          />
        </div>

        {/* Modal for adding events */}
        {showEventForm && (
          <div className="overlay">
            <div className="popup-form">
              <h3>Add New Event</h3>
              <form onSubmit={handleAddEvent}>
                <label>
                  Event Title:
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Event Date:
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                  />
                </label>
                {!allDay && (
                  <>
                    <label>
                      Start Time:
                      <select
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                      >
                        <option value="">Select time</option>
                        {generateTimeOptions()}
                      </select>
                    </label>
                    <label>
                      End Time:
                      <select
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                      >
                        <option value="">Select time</option>
                        {generateTimeOptions()}
                      </select>
                    </label>
                  </>
                )}
                <div className="checkbox-container">
                  <label className="all-day-label">
                    <input
                      type="checkbox"
                      checked={allDay}
                      onChange={(e) => setAllDay(e.target.checked)}
                    />
                    <span>All Day</span>
                  </label>
                </div>
                <label>
                  Category:
                  <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                    <option value="Client Session">Client Session</option>
                    <option value="Internal Meeting">Internal Meeting</option>
                    <option value="Preparation">Preparation</option>
                    <option value="Personal">Personal</option>
                    <option value="Out of Office">Out of Office</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                {category === "Client Session" && (
                <label>
                  Select Client:
                  <select
                    value={clientId || ""}
                    onChange={(e) => setClientId(e.target.value)}
                    required={category === "Client Session"} // Required if category is "Client Session"
                  >
                    <option value="">Select a Client</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.firstName} {client.lastName}
                      </option>
                    ))}
                  </select>
                </label>
              )}
                <div className="form-buttons">
                  <button type="button" className="btn secondary-btn" onClick={handleCloseForm}>Cancel</button>
                  <button type="submit" className="btn primary-btn">Add Event</button>
                </div>
              </form>
              {message && <p>{message}</p>}

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCalendar;