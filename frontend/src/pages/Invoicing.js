// src/pages/Dashboard.js
import React, {useEffect}  from 'react';
import SideNavBar from '../components/SideNavBar';
import '../styles/styles.css';

const Invoicing = () => {
  useEffect(() => {
    // Scroll to the top of the page when the component is mounted
    window.scrollTo(0, 0);
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
     <div className="main-content">
        <SideNavBar />
        <div className="content-area">
          <h1 className="page-heading">Invoicing</h1>
          <p>Welcome to your Invoicing! Use the side navigation to access different sections.</p>
        </div>
      </div>
  );
};

export default Invoicing;
