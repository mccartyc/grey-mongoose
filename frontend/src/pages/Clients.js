// src/pages/Dashboard.js
import React, { useEffect } from 'react';
import SideNavBar from '../components/SideNavBar';
import '../styles/styles.css';
import Clients from '../components/Clients';


const ClientList = () => {
  useEffect(() => {
    // Scroll to the top of the page when the component is mounted
    window.scrollTo(0, 0);
  }, []); // Empty dependency array ensures this runs only once on mount

  
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
