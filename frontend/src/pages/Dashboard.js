// src/pages/Dashboard.js
import React, {useEffect} from 'react';
import SideNavBar from '../components/SideNavBar';
import '../styles/styles.css';

const Dashboard = () => {

  useEffect(() => {
    // Scroll to the top of the page when the component is mounted
    window.scrollTo(0, 0);
  }, []); // Empty dependency array ensures this runs only once on mount

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
