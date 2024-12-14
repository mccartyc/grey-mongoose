// src/pages/Dashboard.js
import React from 'react';
import TopNavBar from '../components/TopNavBar';
import SideNavBar from '../components/SideNavBar';
import '../styles/styles.css';

const Dashboard = () => {
  return (
      <div className="main-content">
        <SideNavBar />
        <div className="content-area">
          <h1>Dashboard</h1>
          <p>Welcome to your Dashboard! Use the side navigation to access different sections.</p>
        </div>
      </div>
  );
};

export default Dashboard;
