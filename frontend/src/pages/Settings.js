import React from 'react';
import ContactInfoSettings from '../components/settings/ContactInfoSettings';
import PasswordSettings from '../components/settings/PasswordSettings';
import MFASettings from '../components/settings/MFASettings';
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
            <h2 className="section-title">Contact Information</h2>
            <ContactInfoSettings />
          </div>
          
          <div className="settings-card">
            <h2 className="section-title">Password</h2>
            <PasswordSettings />
          </div>
          
          <div className="settings-card">
            <h2 className="section-title">Security</h2>
            <MFASettings />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
