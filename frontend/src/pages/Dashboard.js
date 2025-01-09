// src/pages/Dashboard.js
import React from 'react';
import SideNavBar from '../components/SideNavBar';
import Dashboard from '../components/Dashboard';
import '../styles/styles.css';

const DashboardPage = () => {
  return (
      <div className="main-content">
        <SideNavBar />
        <div className="content-area">
          <h1>Dashboard</h1>
          <Dashboard />
        </div>
      </div>
  );
};

export default DashboardPage;
