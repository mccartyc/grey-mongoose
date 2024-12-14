// src/pages/Dashboard.js
import React from 'react';
import TopNavBar from '../components/TopNavBar';
import SideNavBar from '../components/SideNavBar';
import '../styles/styles.css';

const Clients = () => {
  return (
      <div className="main-content">
        <SideNavBar />
        <div className="content-area">
          <h1>Clients</h1>
          <p>Welcome to your Clients! Use the side navigation to access different sections.</p>
        </div>
      </div>
  );
};

export default Clients;
