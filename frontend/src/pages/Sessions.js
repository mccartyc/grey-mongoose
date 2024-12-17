// src/pages/Dashboard.js
import React from 'react';
import SideNavBar from '../components/SideNavBar';
import '../styles/styles.css';

const Sessions = () => {
  return (
    <div className="home-container">
      <div className="main-content">
        <SideNavBar />
        <div className="content-area">
          <h1>Sessions</h1>
          <p>Welcome to your Sessions! Use the side navigation to access different sections.</p>
        </div>
      </div>
    </div>
  );
};

export default Sessions;
