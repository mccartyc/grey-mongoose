// src/pages/MyCalendar.js
import React, { useEffect, useRef, useState } from 'react';
import SideNavBar from '../components/SideNavBar';
import '../styles/styles.css'; // Ensure styles are imported
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timegrid from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction'; // Required for event interaction


const categoryColors = {
  'Client Session': '#1E90FF',
  'Internal Meeting': '#FF4500',
  'Preparation': '#32CD32',
  'Out of Office': '#FFD700',
  'Personal': '#FF69B4',
  'Other': '#808080',
};


const MyCalendar = () => {
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
  const [events, setEvents] = useState([
    { title: 'Client Session', start: '2025-01-15T10:00:00', category: 'Client Session' },
    { title: 'Internal Meeting', start: '2025-01-16T14:30:00', category: 'Internal Meeting' },
  ]);
  const [message, setMessage] = useState('');
  // Toggle sidebar state
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const addEvent = () => { const title = prompt('Enter event title:'); const date = prompt('Enter event date and time (YYYY-MM-DDTHH:MM:SS):'); if (title && date) { calendarRef.current.addEvent({ title, start: date }); } };

  useEffect(() => {
    const calendarEl = calendarContainerRef.current;
    const calendar = new Calendar(calendarEl, {
      plugins: [dayGridPlugin, interactionPlugin, timegrid],
      initialView: 'timeGridWeek',
      events: events.map(event => ({
        ...event,
        color: categoryColors[event.category],
      })),
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
          click: () => setShowEventForm(true), // Open the form when clicked
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
  }, [events]);

  const handleAddEvent = (e) => {
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
    };

    setEvents((prev) => [...prev, newEvent]);

    if (calendarRef) {
      calendarRef.addEvent(addEvent);
    }

    setEventTitle('');
    setEventDate('');
    setStartTime('');
    setEndTime('');
    setAllDay(false);
    setCategory('Other');
    setShowEventForm(false);
    setMessage('Event added successfully!');
  };

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