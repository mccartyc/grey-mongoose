// src/pages/Dashboard.js
import React from 'react';
import SideNavBar from '../components/SideNavBar';
import '../styles/styles.css';
import IntakeForm from '../components/IntakeForm.js';
import ClientNavBar from '../components/ClientNavBar.js';

const IntakeFormPage = () => {
  return (
      <div className="main-content">
        <SideNavBar />
        <div className="content-area">
        <div className="client-detail-header-container">
            <h1>Client Detail</h1>
            <ClientNavBar/>
            </div>
          <IntakeForm />
        </div>
      </div>
  );
};

export default IntakeFormPage;
