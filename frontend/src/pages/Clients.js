// src/pages/Dashboard.js
import React from 'react';
import SideNavBar from '../components/SideNavBar';
import '../styles/styles.css';
import Clients from '../components/Clients';

const ClientList = () => {
  return (
      <div className="main-content">
        <SideNavBar />
        <div className="content-area">
          <h1>Clients</h1>
          <Clients />
        </div>
      </div>
  );
};

export default ClientList;
