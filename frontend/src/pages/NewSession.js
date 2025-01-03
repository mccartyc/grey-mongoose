// src/pages/Dashboard.js
import React from 'react';
import SideNavBar from '../components/SideNavBar';
import '../styles/styles.css';
import NewSession from '../components/NewSession';

const SessionList = () => {
  return (
    <div className="home-container">
      <div className="main-content">
        <SideNavBar />
        <div className="content-area">
          <h1>Sessions</h1>
            <NewSession />
        </div>
      </div>
    </div>
  );
};

export default SessionList;
