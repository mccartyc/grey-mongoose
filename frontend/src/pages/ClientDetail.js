// src/pages/Dashboard.js
import React from 'react';
import SideNavBar from '../components/SideNavBar';
import '../styles/styles.css';
import ClientDetail from '../components/ClientDetail.js';

const ClientList = () => {
  return (
      <div className="main-content">
        <SideNavBar />
        <div className="content-area">
          <ClientDetail />
        </div>
      </div>
  );
};

export default ClientList;
