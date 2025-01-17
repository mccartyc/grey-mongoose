// src/pages/Dashboard.js
import React from 'react';
import SideNavBar from '../components/SideNavBar';
import '../styles/styles.css';
import ClientNavBar from '../components/ClientNavBar.js';

const HealthAssessmentPage = () => {
  return (
      <div className="main-content">
        <SideNavBar />
        <div className="content-area">
        <div className="client-detail-header-container">
            <h1>Client Detail</h1>
            <ClientNavBar/>
            </div>
            <h3>HealthAssessment ...coming soon</h3>
        </div>
      </div>
  );
};

export default HealthAssessmentPage;
