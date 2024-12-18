// src/pages/MyCalendar.js
import React, { useEffect, useState } from 'react';
import SideNavBar from '../components/SideNavBar';
import '../styles/styles.css'; // Ensure styles are imported
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction'; // Required for event interaction

const MyCalendar = () => {
  const [calendar, setCalendar] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [events, setEvents] = useState([
    { title: 'Client 1', start: '2024-12-01' },
    { title: 'Client 2', start: '2024-12-02' }
  ]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const calendarEl = document.getElementById('calendar');
    const newCalendar = new Calendar(calendarEl, {
      plugins: [dayGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      events: [
        { title: 'Client 1', start: '2024-12-01' },
        { title: 'Client 1', start: '2024-12-02' }
      ],
      headerToolbar: { // Add header toolbar for navigation
        left: 'prev,next today addEvent',
        center: 'title',
        right: 'dayGridMonth,dayGridWeek'
      },
      buttonText: {
        today: 'Today', // This will set the button text to "Today"
        dayGridMonth: 'Month',
        dayGridWeek: 'Week',
      },
      customButtons: {
        addEvent: {
          text: 'Add Event',
          click: () => setShowEventForm(true) // Open the form when clicked
        },
      },
      height: 'auto', // Automatically set height for better responsiveness
      // Set the height to show only one month
      contentHeight: 'auto' // This will adapt based on the content
    });
    newCalendar.render();
    setCalendar(newCalendar); // Store the calendar instance
  }, [events]);

  const handleAddEvent = (e) => {
    e.preventDefault();
    
    if (!eventTitle || !eventDate) {
      setMessage('Please enter event details'); // Simple validation
      return;
    }

    // Create a new event object
    const newEvent = {
      title: eventTitle,
      start: eventDate
    };

    // Update events state
    setEvents((prev) => [...prev, newEvent]);

    // Also add to the calendar instance
    if (calendar) {
      calendar.addEvent(newEvent);
    }

    // Reset the form
    setEventTitle('');
    setEventDate('');
    setShowEventForm(false);
    setMessage('Event added successfully!');
  };


  return (
    <div className="main-content">
      <SideNavBar />
      <div className="content-area">
        <h1 className="section-title">Calendar</h1>
        <div id="calendar" className="calendar-container"></div>
        
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
                <button type="submit" className="btn primary-btn">Add Event</button>
                <button type="button" className="btn close-btn" onClick={() => setShowEventForm(false)}>Cancel</button>
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