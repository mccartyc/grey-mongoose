import React from 'react';
import { Link } from 'react-router-dom';
import { FaLock, FaHome } from 'react-icons/fa';
import '../styles/styles.css';

const Unauthorized = () => {
  return (
    <div className="unauthorized-container">
      <div className="unauthorized-content">
        <FaLock className="unauthorized-icon" />
        <h1>Access Denied</h1>
        <p>You do not have permission to access this page.</p>
        <p>Please contact your administrator if you believe this is an error.</p>
        <Link to="/dashboard" className="back-to-home-btn">
          <FaHome className="home-icon" /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
