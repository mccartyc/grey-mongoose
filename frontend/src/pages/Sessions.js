// src/pages/Dashboard.js
import React, {useEffect} from 'react';
import SideNavBar from '../components/SideNavBar';
import '../styles/styles.css';
import Sessions from '../components/Sessions';

const SessionList = () => {

  useEffect(() => {
    // Scroll to the top of the page when the component is mounted
    window.scrollTo(0, 0);
  }, []); // Empty dependency array ensures this runs only once on mount


  return (
    <div className="home-container">
      <div className="main-content">
        <SideNavBar />
        <div className="content-area">
          <h1 className="page-heading">Sessions</h1>
            <Sessions />
        </div>
      </div>
    </div>
  );
};

export default SessionList;
