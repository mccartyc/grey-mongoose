import React from 'react';
import ProfileSettings from '../components/settings/ProfileSettings';
import SideNavBar from '../components/SideNavBar';
import '../styles/styles.css';
import '../styles/settingsStyles.css';

const Settings = () => {
  return (
    <div className="main-content">
      <SideNavBar />
      <div className="content-area">
        <div className="dashboard-header">
          <h1 className="page-heading">Account Settings</h1>
          <p>Manage your account preferences and security settings</p>
        </div>
        
        <div className="settings-container">
          <div className="settings-card">
            <ProfileSettings />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
