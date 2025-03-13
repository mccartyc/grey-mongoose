import React, { useState, useEffect } from 'react';
import api from '../../services/apiService';
import '../../styles/settingsStyles.css';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';

const SubscriptionSettings = ({ subscriptionStatus, isLoading, onSubscriptionChange }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { user } = useAuth();
  const location = useLocation();
  
  // Check for query parameters after redirect from Stripe
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const subscriptionStatus = queryParams.get('subscription');
    const sessionId = queryParams.get('session_id');
    
    if (subscriptionStatus === 'success' && sessionId) {
      setSuccessMessage('Your subscription has been successfully activated!');
      // Refresh subscription status
      if (onSubscriptionChange) {
        onSubscriptionChange();
      }
    } else if (subscriptionStatus === 'cancel') {
      setError('Subscription process was canceled. You can try again when you\'re ready.');
    }
    
    // Clean up URL after processing
    if (subscriptionStatus) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [location.search, onSubscriptionChange]);

  // Calculate days left in trial
  const getDaysLeft = () => {
    if (!subscriptionStatus) return 0;
    
    if (subscriptionStatus.subscriptionStatus === 'trial') {
      return subscriptionStatus.daysLeft || 0;
    }
    return 0;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleSubscribe = async () => {
    try {
      setIsProcessing(true);
      setError('');
      setSuccessMessage('');
      
      const response = await api.post('/api/subscriptions/create-checkout-session');
      
      // Redirect to Stripe checkout
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('No checkout URL returned from server');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setError(error.response?.data?.error || 'Failed to create checkout session');
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setIsProcessing(true);
      setError('');
      setSuccessMessage('');
      
      const response = await api.post('/api/subscriptions/cancel');
      setSuccessMessage(response.data.message);
      
      // Refresh subscription status
      if (onSubscriptionChange) {
        onSubscriptionChange();
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      setError(error.response?.data?.error || 'Failed to cancel subscription');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResumeSubscription = async () => {
    try {
      setIsProcessing(true);
      setError('');
      setSuccessMessage('');
      
      const response = await api.post('/api/subscriptions/resume');
      setSuccessMessage(response.data.message);
      
      // Refresh subscription status
      if (onSubscriptionChange) {
        onSubscriptionChange();
      }
    } catch (error) {
      console.error('Error resuming subscription:', error);
      setError(error.response?.data?.error || 'Failed to resume subscription');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderSubscriptionStatus = () => {
    if (isLoading) {
      return <p>Loading subscription information...</p>;
    }

    if (!subscriptionStatus) {
      return <p>Unable to retrieve subscription information.</p>;
    }

    switch (subscriptionStatus.subscriptionStatus) {
      case 'trial':
        return (
          <div className="subscription-info">
            <div className="subscription-status trial">
              <span className="status-badge">Free Trial</span>
            </div>
            <p>
              You are currently on a free trial. Your trial will expire in <strong>{getDaysLeft()} days</strong> on {formatDate(subscriptionStatus.trialEndDate)}.
            </p>
            <p>Subscribe now to continue using all features after your trial ends.</p>
            <button 
              className="btn primary-btn" 
              onClick={handleSubscribe}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Subscribe Now - $15/month'}
            </button>
          </div>
        );
      
      case 'active':
        return (
          <div className="subscription-info">
            <div className="subscription-status active">
              <span className="status-badge">Active</span>
            </div>
            <p>
              Your subscription is active and will renew on {formatDate(subscriptionStatus.currentPeriodEnd || subscriptionStatus.subscriptionExpiryDate)}.
            </p>
            {subscriptionStatus.cancelAtPeriodEnd ? (
              <>
                <p>Your subscription is set to cancel at the end of the current billing period.</p>
                <button 
                  className="btn secondary-btn" 
                  onClick={handleResumeSubscription}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Resume Subscription'}
                </button>
              </>
            ) : (
              <button 
                className="btn secondary-btn" 
                onClick={handleCancelSubscription}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Cancel Subscription'}
              </button>
            )}
          </div>
        );
      
      case 'expired':
        return (
          <div className="subscription-info">
            <div className="subscription-status expired">
              <span className="status-badge">Expired</span>
            </div>
            <p>
              Your subscription has expired. Subscribe now to regain access to all features.
            </p>
            <button 
              className="btn primary-btn" 
              onClick={handleSubscribe}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Subscribe Now - $15/month'}
            </button>
          </div>
        );
      
      default:
        return <p>Unknown subscription status.</p>;
    }
  };

  return (
    <div className="settings-section">
      <h3>Subscription Details</h3>
      
      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="success-message" style={{ color: 'green', marginBottom: '1rem' }}>
          {successMessage}
        </div>
      )}
      
      {renderSubscriptionStatus()}
      
      <div className="subscription-details">
        <h4>Subscription Information</h4>
        <p>
          MindCloud subscription costs <strong>$15 per month per user</strong>. 
          Each new user gets a <strong>7-day free trial</strong> to explore all features.
        </p>
        <p>
          Your subscription includes:
        </p>
        <ul>
          <li>Full access to all MindCloud features</li>
          <li>Unlimited client sessions</li>
          <li>Transcription and analysis tools</li>
          <li>Calendar and scheduling features</li>
          <li>Client management system</li>
        </ul>
      </div>
    </div>
  );
};

export default SubscriptionSettings;
