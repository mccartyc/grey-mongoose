// src/pages/MyCalendar.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import SideNavBar from '../components/SideNavBar';
import '../styles/styles.css'; // Ensure styles are imported
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timegrid from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction'; // Required for event interaction
import { useAuth } from '../context/AuthContext'; // Import auth context
import axios from 'axios';


const categoryColors = {
  'Client Session': '#1E90FF',
  'Internal Meeting': '#FF4500',
  'Preparation': '#32CD32',
  'Out of Office': '#FFD700',
  'Personal': '#FF69B4',
  'Other': '#808080',
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

  const [events, setEvents] = useState([
    { title: 'Client Session', start: '2025-02-15T10:00:00', category: 'Client Session' },
    { title: 'Internal Meeting', start: '2025-02-13T14:30:00', category: 'Internal Meeting' },
  ]);
  const [message, setMessage] = useState('');
  // Toggle sidebar state
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleEventChange = useCallback(async (changeInfo) => {
    const { event } = changeInfo;
  
    const updatedEvent = {
      title: event.title,
      start: event.start.toISOString(),
      end: event.end ? event.end.toISOString() : null,
      allDay: event.allDay,
      category: event.extendedProps.category,
    };
  
    try {
      const { token } = user;
      await axios.put(`http://localhost:5001/api/events/${event.id}`, updatedEvent, {
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
    if (!window.confirm('Are you sure you want to delete this event?')) return;
  
    try {
      const { token } = user;
      await axios.delete(`http://localhost:5001/api/events/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      setEvents((prevEvents) => prevEvents.filter((event) => event._id !== eventId));
      setMessage('Event deleted successfully!');
    } catch (error) {
      console.error('Error deleting event:', error);
      setMessage('Failed to delete event');
    }
  },[user, setEvents]);

  const fetchClients = useCallback(async () => {
    if (!user) return;
    const { token } = user;

    try {
      const response = await axios.get(`http://localhost:5001/api/clients/`, {
        params: {
          tenantId: user.tenantId,
          userId: user.userId,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      const response = await axios.get('http://localhost:5001/api/events', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const formattedEvents = response.data.map(event => ({
        id: event._id,
        title: event.title,
        start: event.start,
        end: event.end || event.start, // Default end time to start if missing
        allDay: event.allDay,
        color: categoryColors[event.category] || '#808080',
      }));
  
      console.log("✅ Events fetched:", formattedEvents);
      setEvents(formattedEvents); // ✅ Store events in state
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  }, [user]);

  useEffect(() => {
  
  
    fetchEvents();


    window.scrollTo(0, 0);

    const calendarEl = calendarContainerRef.current;

    console.log("Setting up FullCalendar with custom buttons");
    const calendar = new Calendar(calendarEl, {
      plugins: [dayGridPlugin, interactionPlugin, timegrid],
      initialView: 'timeGridWeek',
      events: events.map(event => ({
        id: event._id,
        ...event,
        color: categoryColors[event.category] || '#808080',
      })),
      editable: true, // Enable dragging and resizing
      eventDrop: handleEventChange, // Handle event movement
      eventResize: handleEventChange, // Handle event resizing
      eventClick: (info) => handleEventDelete(info.event.id), // ✅ Now handleEventDelete is used
      headerToolbar: { // Add header toolbar for navigation
        left: 'prev,next today addEvent',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      buttonText: {
        today: 'Today', // This will set the button text to "Today"
        dayGridMonth: 'Month',
        timeGridWeek: 'Week',
        timeGridDay: 'Day'
      },
      customButtons: {
        addEvent: {
          text: 'Add Event',
          click: () => {
            console.log("Add Event button clicked");
            setShowEventForm(true)}, // Open the form when clicked
          className: 'btn primary-btn'
        },
      },
      height: 'auto', // Automatically set height for better responsiveness
      // Set the height to show only one month
      contentHeight: 'auto', // This will adapt based on the content
      slotDuration: '00:30:00', // 30-minute time slots
      slotMinTime: '08:00:00', // Calendar start time (8 AM)
      slotMaxTime: '20:00:00', // Calendar end time (8 PM)
      scrollTime: '08:00:00',
    });
    calendar.render();
    calendarRef.current = calendar;
    return () => {
      calendar.destroy();
    };
  }, [fetchEvents]);

  const handleAddEvent = async (e) => {
    e.preventDefault();
    
    if (!eventTitle || !eventDate || (!allDay && (!startTime || !endTime))) {
      setMessage('Please enter all event details');
      return;
    }

    const newEvent = {
      title: eventTitle,
      start: allDay ? eventDate : `${eventDate}T${startTime}`,
      end: allDay ? null : `${eventDate}T${endTime}`,
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
      const response = await axios.post('http://localhost:5001/api/events', newEvent, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

    setEvents((prev) => [...prev, response.data]);
    setMessage('Event added successfully!');
    fetchEvents();
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

  return (
    <div className={`main-content no-scroll ${collapsed ? 'collapsed' : ''}`}>
      <SideNavBar collapsed={collapsed} toggleSidebar={toggleSidebar} />
      <div className="content-area">
        <h1>Calendar</h1>
        <div ref={calendarContainerRef} id="calendar" className="calendar-container"></div>

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
                      <input
                         type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        step="900"  // 15 minutes = 900 seconds
                        required
                      />
                    </label>
                    <label>
                      End Time:
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        step="900"
                        required
                      />
                    </label>
                  </>
                )}
                <label>
                  <input
                    type="checkbox"
                    checked={allDay}
                    onChange={(e) => setAllDay(e.target.checked)}
                  />
                  All Day
                </label>
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
                <div>
                <button type="button" className="btn close-btn" onClick={() => setShowEventForm(false)}>Cancel</button>
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