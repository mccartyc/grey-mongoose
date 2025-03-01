import React from 'react';
import MainNavbar from './MainNavbar';
import '../../styles/appLayout.css';

const AppLayout = ({ children }) => {
  return (
    <div className="app-container">
      <MainNavbar />
      <div className="app-content">
        {children}
      </div>
    </div>
  );
};

export default AppLayout;
