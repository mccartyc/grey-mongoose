// src/pages/Dashboard.js
import React from 'react';
import TopNavBar from '../components/TopNavBar';
import SideNavBar from '../components/SideNavBar';
import '../styles/styles.css';

const Invoicing = () => {
  return (
    <div className="home-container">
      <TopNavBar />
      <div className="main-content">
        <SideNavBar />
        <div className="content-area">
          <h1>Invoicing</h1>
          <p>Welcome to your Invoicing! Use the side navigation to access different sections.</p>
        </div>
      </div>
    </div>
  );
};

export default Invoicing;
