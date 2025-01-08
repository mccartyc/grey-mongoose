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


  useEffect(() => {


    const calendarEl = calendarContainerRef.current; // Calendar container element
    const calendar = new Calendar(calendarEl, {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'timeGridWeek',
      events: [
        { title: 'Client Session', start: '2024-12-20T10:00:00' },
        { title: 'Internal Meeting', start: '2024-12-21T14:30:00' },
      ],
      headerToolbar: {
        left: 'prev,next today',
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
      height: 'auto',
      contentHeight: 'auto',
      slotDuration: '00:30:00', // 30-minute time slots
      // slotMinTime: '08:00:00', // Calendar start time (8 AM)
      // slotMaxTime: '20:00:00', // Calendar end time (8 PM)
      // scrollTime: '08:00:00',
    });

    calendar.render();
    calendarRef.current = calendar;

    return () => {
      calendar.destroy();
    };
  }, []);

  // Resize calendar on sidebar toggle or window resize
  // useEffect(() => {
  //   const resizeCalendar = () => {
  //     const container = calendarContainerRef.current;
  //     if (container && calendarRef.current) {
  //       // Use requestAnimationFrame and setTimeout for reliable DOM updates
  //       requestAnimationFrame(() => {
  //         setTimeout(() => {
  //           calendarRef.current.updateSize();
  //         }, 100); // Adjust delay as necessary
  //       });
  //     }
  //   };

  //   // Resize calendar on sidebar toggle
  //   resizeCalendar();

  //   // Resize calendar on window resize
  //   window.addEventListener('resize', resizeCalendar);
  //   return () => {
  //     window.removeEventListener('resize', resizeCalendar);
  //   };
  // }, [collapsed]);

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
