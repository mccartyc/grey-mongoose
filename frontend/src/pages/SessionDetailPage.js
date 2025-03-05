import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SideNavBar from '../components/SideNavBar';
import '../styles/styles.css';
import SessionDetail from '../components/SessionDetail';

const SessionDetailPage = () => {
  const { id } = useParams();

  useEffect(() => {
    // Scroll to the top of the page when the component is mounted
    window.scrollTo(0, 0);
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <div className="main-content">
      <SideNavBar />
      <div className="content-area">
        <h1 className="page-heading">Session Details</h1>
        {id && <SessionDetail />}
      </div>
    </div>
  );
};

export default SessionDetailPage;
