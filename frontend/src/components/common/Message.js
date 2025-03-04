import React, { useState, useEffect } from 'react';

const MessageDisplay = ({ message, duration = 5000 }) => {
    const [isVisible, setIsVisible] = useState(true);
  
    useEffect(() => {
      // Set a timeout to hide the message after the specified duration
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);
  
      // Cleanup the timer on component unmount
      return () => clearTimeout(timer);
    }, [duration]);
  
    return isVisible ? (
      <div className="message">
        {message}
      </div>
    ) : null;
  };
  
  export default MessageDisplay;