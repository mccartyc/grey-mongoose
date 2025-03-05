import React, { useEffect } from 'react';
import '../../styles/notification.css';

const Notification = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    // Auto-close the notification after 3 seconds
    const timer = setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 3000);

    // Clean up the timer when component unmounts
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`notification ${type}`}>
      <p>{message}</p>
    </div>
  );
};

export default Notification;
