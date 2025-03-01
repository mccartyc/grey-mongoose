import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SideNavBar from '../components/SideNavBar';
import '../styles/styles.css';
import ClientDetail from '../components/ClientDetail.js';
import ClientNavBar from '../components/ClientNavBar.js';

const ClientList = () => {
  const { id } = useParams();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="main-content">
      <SideNavBar />
      <div className="content-area">
        <div className="client-detail-header-container">
          <h1 className="page-heading">Client Detail</h1>
          {id && <ClientNavBar />}
        </div>
        {id && <ClientDetail />}
      </div>
    </div>
  );
};

export default ClientList;
