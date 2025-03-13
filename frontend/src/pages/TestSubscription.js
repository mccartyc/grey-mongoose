import React, { useState } from 'react';
import api from '../services/apiService';
import { useAuth } from '../context/AuthContext';

const TestSubscription = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const { user } = useAuth();

  const handleCheckStatus = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await api.get('/api/subscriptions/trial-status');
      setSubscriptionStatus(response.data);
      
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setError(error.response?.data?.error || 'Failed to check subscription status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccessMessage('');
      
      const response = await api.post('/api/subscriptions/cancel');
      setSuccessMessage(response.data.message);
      handleCheckStatus();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      setError(error.response?.data?.error || 'Failed to cancel subscription');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Subscription Test Page</h1>
      
      {error && (
        <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
          {error}
        </div>
      )}
      
      {successMessage && (
        <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
          {successMessage}
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={handleCheckStatus}
          style={{ 
            padding: '10px 16px', 
            backgroundColor: '#4f46e5', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px',
            cursor: 'pointer'
          }}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Check Subscription Status'}
        </button>
        
        <button 
          onClick={handleSubscribe}
          style={{ 
            padding: '10px 16px', 
            backgroundColor: '#16a34a', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px',
            cursor: 'pointer'
          }}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Subscribe Now'}
        </button>
        
        <button 
          onClick={handleCancelSubscription}
          style={{ 
            padding: '10px 16px', 
            backgroundColor: '#dc2626', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px',
            cursor: 'pointer'
          }}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Cancel Subscription'}
        </button>
      </div>
      
      {subscriptionStatus && (
        <div style={{ 
          backgroundColor: '#f8fafc', 
          padding: '20px', 
          borderRadius: '8px', 
          border: '1px solid #e2e8f0',
          marginTop: '20px'
        }}>
          <h2>Current Subscription Status</h2>
          <pre style={{ 
            backgroundColor: '#f1f5f9', 
            padding: '16px', 
            borderRadius: '6px', 
            overflow: 'auto',
            fontSize: '14px'
          }}>
            {JSON.stringify(subscriptionStatus, null, 2)}
          </pre>
        </div>
      )}
      
      <div style={{ marginTop: '30px' }}>
        <h2>Test Instructions</h2>
        <ol style={{ lineHeight: '1.6' }}>
          <li>Click "Check Subscription Status" to see your current subscription state</li>
          <li>Click "Subscribe Now" to start the Stripe checkout process</li>
          <li>Use Stripe test card: 4242 4242 4242 4242 with any future date and any CVC</li>
          <li>After successful subscription, you'll be redirected back to the settings page</li>
          <li>Check your subscription status again to verify it's active</li>
          <li>Try canceling your subscription with the "Cancel Subscription" button</li>
        </ol>
      </div>
    </div>
  );
};

export default TestSubscription;
