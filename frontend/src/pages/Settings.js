import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ContactInfoSettings from '../components/settings/ContactInfoSettings';
import PasswordSettings from '../components/settings/PasswordSettings';
import MFASettings from '../components/settings/MFASettings';
import SubscriptionSettings from '../components/settings/SubscriptionSettings';
import SideNavBar from '../components/SideNavBar';
import api from '../services/apiService';
import '../styles/styles.css';
import '../styles/settingsStyles.css';

const Settings = () => {
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  // Use a ref to track if we've already fetched on mount
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    // Only fetch once on initial mount
    if (!hasFetched) {
      fetchSubscriptionStatus();
      setHasFetched(true);
    }
  }, [hasFetched]);
  
  // Separate effect for handling URL params
  useEffect(() => {
    // Check for subscription success/cancel in URL params
    const params = new URLSearchParams(location.search);
    const subscriptionParam = params.get('subscription');
    
    if (subscriptionParam === 'success' && hasFetched) {
      // Show success message or update subscription status
      fetchSubscriptionStatus();
      
      // Clean up URL after processing to prevent loops
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [location.search, hasFetched]);

  const fetchSubscriptionStatus = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/subscriptions/current');
      setSubscriptionStatus(response.data);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="main-content">
      <SideNavBar />
      <div className="content-area">
        <div className="dashboard-header">
          <h1 className="page-heading">Account Settings</h1>
          <p className="description-text">Manage your account preferences, subscription, and security settings</p>
        </div>
        
        <div className="settings-container">
          {/* Subscription takes full width for emphasis */}
          <div className="settings-card">
            <h2 className="section-title">Subscription</h2>
            <SubscriptionSettings 
              subscriptionStatus={subscriptionStatus} 
              isLoading={isLoading} 
              onSubscriptionChange={fetchSubscriptionStatus} 
            />
          </div>

          {/* Account settings */}
          <div className="settings-card">
            <h2 className="section-title">Contact Information</h2>
            <div className="settings-form-container">
              {/* <p className="description-text">Update your contact details and notification preferences</p> */}
              <ContactInfoSettings />
            </div>
          </div>
          
          {/* Security settings */}
          <div className="settings-card">
            <h2 className="section-title">Security</h2>
            <div className="settings-form-container">
              {/* <p className="description-text">Manage your account security and authentication methods</p> */}
              <MFASettings />
            </div>
          </div>
          
          {/* Password settings */}
          <div className="settings-card">
            <h2 className="section-title">Password</h2>
            <div className="settings-form-container">
              {/* <p className="description-text">Change your password to keep your account secure</p> */}
              <PasswordSettings />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
