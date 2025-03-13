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
      // Note: We don't call onSubscriptionChange() here as it's handled by the parent component
    } else if (subscriptionStatus === 'cancel') {
      setError('Subscription process was canceled. You can try again when you\'re ready.');
    }
    
    // URL cleanup is now handled by the parent component
  }, [location.search]);

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

  const handleManageSubscription = async () => {
    try {
      setIsProcessing(true);
      setError('');
      setSuccessMessage('');
      
      try {
        // First try to use the customer portal
        const response = await api.post('/api/subscriptions/customer-portal');
        
        // Redirect to Stripe's customer portal if available
        if (response.data.url) {
          window.location.href = response.data.url;
          return;
        }
      } catch (portalError) {
        console.log('Customer portal not configured, falling back to basic cancellation');
        // If customer portal fails, fall back to basic cancellation
        const cancelResponse = await api.post('/api/subscriptions/cancel');
        setSuccessMessage(cancelResponse.data.message || 'Your subscription will be canceled at the end of the billing period');
        
        // Refresh subscription status
        if (onSubscriptionChange) {
          onSubscriptionChange();
        }
      }
    } catch (error) {
      console.error('Error managing subscription:', error);
      setError(error.response?.data?.error || 'Failed to manage subscription');
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
      return <div className="subscription-info"><p className="description-text">Loading subscription information...</p></div>;
    }

    if (!subscriptionStatus) {
      return <div className="subscription-info"><p className="description-text">Unable to retrieve subscription information.</p></div>;
    }

    switch (subscriptionStatus.subscriptionStatus) {
      case 'trial':
        return (
          <div className="subscription-info">
            <div className="subscription-status trial">
              <span className="status-badge">Free Trial</span>
              <span>{getDaysLeft()} days remaining</span>
            </div>
            <p className="description-text">
              Your trial will expire on <strong>{formatDate(subscriptionStatus.trialEndDate)}</strong>. Subscribe now to continue using all features after your trial ends.
            </p>
            <div className="premium-benefits">
              <h4>Upgrade to Premium for:</h4>
              <ul>
                <li>✓ Full access to all MindCloud features</li>
                <li>✓ Unlimited client sessions</li>
                <li>✓ Transcription and analysis tools</li>
                <li>✓ Calendar and scheduling features</li>
                <li>✓ Client management system</li>
              </ul>
            </div>
            <div style={{ marginTop: '24px' }}>
              <button 
                className="btn primary-btn" 
                onClick={handleSubscribe}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Subscribe Now - $15/month'}
              </button>
            </div>
          </div>
        );
      
      case 'active':
        return (
          <div className="subscription-info">
            <div className="subscription-status active">
              <span className="status-badge">Premium Plan</span>
              <span>Active</span>
            </div>
            <p className="description-text">
              Your premium subscription is active and will renew on <strong>{formatDate(subscriptionStatus.currentPeriodEnd || subscriptionStatus.subscriptionExpiryDate)}</strong>.
            </p>
            
            <div className="premium-benefits">
              <h4>Your Premium Benefits</h4>
              <ul>
                <li>✓ Full access to all MindCloud features</li>
                <li>✓ Unlimited client sessions</li>
                <li>✓ Transcription and analysis tools</li>
                <li>✓ Calendar and scheduling features</li>
                <li>✓ Client management system</li>
              </ul>
            </div>
            
            {subscriptionStatus.cancelAtPeriodEnd ? (
              <>
                <div className="error-message">
                  Your subscription is set to cancel at the end of the current billing period.
                  You will still have access until {formatDate(subscriptionStatus.currentPeriodEnd)}.
                </div>
                <div style={{ marginTop: '24px' }}>
                  <button 
                    className="btn secondary-btn" 
                    onClick={handleResumeSubscription}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Resume Subscription'}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ marginTop: '24px' }}>
                <button 
                  className="btn secondary-btn" 
                  onClick={handleManageSubscription}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Cancel Subscription'}
                </button>
              </div>
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
        <div className="success-message" style={{ color: 'green', marginBottom: '1rem', padding: '1rem', backgroundColor: '#e6f7e6', borderRadius: '4px' }}>
          {successMessage}
        </div>
      )}
      
      {renderSubscriptionStatus()}
      
      {/* Only show subscription information for non-active subscriptions */}
      {(!subscriptionStatus || subscriptionStatus.subscriptionStatus !== 'active') && (
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
      )}
    </div>
  );
};

export default SubscriptionSettings;
