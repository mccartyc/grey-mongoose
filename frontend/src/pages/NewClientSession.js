// src/pages/Dashboard.js
import React from 'react';
import SideNavBar from '../components/SideNavBar';
import '../styles/styles.css';
import ClientNavBar from '../components/ClientNavBar.js';
import NewSession from '../components/NewSession.js';

const NewClientSession = () => {
  return (
      <div className="main-content">
        <SideNavBar />
        <div className="content-area">
        <div className="client-detail-header-container">
            <h1>Client Detail</h1>
            <ClientNavBar/>
            </div>
            <NewSession/>
        </div>
      </div>
  );
};

export default NewClientSession;
