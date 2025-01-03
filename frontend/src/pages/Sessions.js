// src/pages/Dashboard.js
import React from 'react';
import SideNavBar from '../components/SideNavBar';
import '../styles/styles.css';
import Sessions from '../components/Sessions';

const SessionList = () => {
  return (
    <div className="home-container">
      <div className="main-content">
        <SideNavBar />
        <div className="content-area">
          <h1>Sessions</h1>
            <Sessions />
        </div>
      </div>
    </div>
  );
};

export default SessionList;
