import React from 'react';
import MFASettings from '../components/settings/MFASettings';
import SideNavBar from '../components/SideNavBar';
import '../styles/styles.css';

const Settings = () => {
  return (
    <div className="main-content">
      <SideNavBar />
      <div className="content-area">
        <div className="dashboard-header">
          <h1>Account Settings</h1>
          <p>Manage your account preferences and security settings</p>
        </div>
        
        <div className="metrics-grid">
          <div className="metric-card">
            <MFASettings />
          </div>
          {/* Add other settings sections here */}
        </div>
      </div>
    </div>
  );
};

export default Settings;
