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

  useEffect(() => {
    // Check for subscription success/cancel in URL params
    const params = new URLSearchParams(location.search);
    const subscriptionParam = params.get('subscription');
    
    if (subscriptionParam === 'success') {
      // Show success message or update subscription status
      fetchSubscriptionStatus();
    }
    
    // Fetch subscription status on component mount
    fetchSubscriptionStatus();
  }, [location]);

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
          <p>Manage your account preferences and security settings</p>
        </div>
        
        <div className="settings-container">
          <div className="settings-card">
            <h2 className="section-title">Subscription</h2>
            <SubscriptionSettings 
              subscriptionStatus={subscriptionStatus} 
              isLoading={isLoading} 
              onSubscriptionChange={fetchSubscriptionStatus} 
            />
          </div>

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
