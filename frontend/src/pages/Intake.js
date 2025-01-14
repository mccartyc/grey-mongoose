// src/pages/Dashboard.js
import React from 'react';
import SideNavBar from '../components/SideNavBar';
import '../styles/styles.css';
import IntakeForm from '../components/IntakeForm.js';

const IntakeFormPage = () => {
  return (
      <div className="main-content">
        <SideNavBar />
        <div className="content-area">
          <IntakeForm />
        </div>
      </div>
  );
};

export default IntakeFormPage;
