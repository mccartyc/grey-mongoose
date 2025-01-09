import React, { useEffect, useRef, useState } from 'react';
import SideNavBar from '../components/SideNavBar';
import '../styles/styles.css';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const MyCalendar = () => {
  const calendarRef = useRef(null); // Reference for FullCalendar instance
  const calendarContainerRef = useRef(null); // Reference for the container element
  const [collapsed, setCollapsed] = useState(false);

  // Toggle sidebar state
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const addEvent = () => { const title = prompt('Enter event title:'); const date = prompt('Enter event date and time (YYYY-MM-DDTHH:MM:SS):'); if (title && date) { calendarRef.current.addEvent({ title, start: date }); } };


  useEffect(() => {


    const calendarEl = calendarContainerRef.current; // Calendar container element
    const calendar = new Calendar(calendarEl, {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'timeGridWeek',
      events: [
        { title: 'Client Session', start: '2025-01-09T10:00:00' },
        { title: 'Internal Meeting', start: '2025-01-08T14:30:00' },
      ], 
      customButtons: { 
        addEventButton: { 
          text: 'Add Event', 
          click: addEvent } 
      },
      headerToolbar: {
        left: 'prev,next today addEventButton',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay',
      },
      buttonText: {
        today: 'Today', // This will set the button text to "Today"
        dayGridMonth: 'Month',
        dayGridWeek: 'Week',
        timeGridWeek: 'Week',
        timeGridDay: 'Day'
      },
      allDayText: "Day",
      height: 'auto',
      contentHeight: 'auto',
      slotDuration: '00:30:00', // 30-minute time slots
      slotMinTime: '07:00:00', // Calendar start time (5 AM) 
      slotMaxTime: '24:00:00', // Calendar end time (midnight) 
      scrollTime: '08:00:00', // Initial scroll time (8 AM)
      
    });

    calendar.render();
    calendarRef.current = calendar;

    // Update scroll position after render 
    // calendarEl.querySelector('.fc-timegrid-col-frame').scrollTop = calendarEl.querySelector('.fc-timegrid-col-frame').scrollHeight / 24 * 3;

    return () => {
      calendar.destroy();
    };
  }, []);

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
      </div>
    </div>
  );
};

export default MyCalendar;
