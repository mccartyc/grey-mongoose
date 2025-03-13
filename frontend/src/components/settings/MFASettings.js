import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/apiService';
import ConfirmationModal from '../common/ConfirmationModal';
import '../../styles/settingsStyles.css';

const MFASettings = () => {
  const { user } = useAuth();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaMethod, setMfaMethod] = useState('email');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchMFASettings();
    }
  }, []);

  const fetchMFASettings = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const response = await api.get('/api/mfa/settings', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('MFA settings response:', response.data);
      const { mfaEnabled, mfaMethod, mfaPhone } = response.data;
      setMfaEnabled(mfaEnabled || false);
      setMfaMethod(mfaMethod || 'email');
      setPhoneNumber(mfaPhone || '');
      setLoading(false);
    } catch (err) {
      console.error('Error fetching MFA settings:', err);
      if (err.response?.status === 401) {
        setError('Please log in again');
      } else {
        setError('Failed to fetch MFA settings');
      }
      setLoading(false);
    }
  };

  const handleToggleMFA = () => {
    setError('');
    setSuccessMessage('');
    
    // Prepare the pending action
    const action = !mfaEnabled;
    setPendingAction(action);
    
    // Show confirmation modal
    setShowConfirmation(true);
  };
  
  const handleConfirmToggle = async () => {
    setShowConfirmation(false);
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      setError('');
      setSuccessMessage('');
      
      const headers = {
        Authorization: `Bearer ${token}`
      };
      
      if (!pendingAction) {
        // Disable MFA
        await api.post('/api/mfa/disable', {}, { headers });
        setMfaEnabled(false);
        setSuccessMessage('MFA has been disabled');
      } else {
        // Enable MFA
        if (mfaMethod === 'sms' && !phoneNumber) {
          setError('Please enter a phone number for SMS verification');
          return;
        }

        await api.post('/api/mfa/enable', {
          method: mfaMethod,
          phone: phoneNumber
        }, { headers });
        setMfaEnabled(true);
        setSuccessMessage('MFA has been enabled');
      }
    } catch (err) {
      console.error('Error updating MFA settings:', err);
      if (err.response?.status === 401) {
        setError('Please log in again');
      } else {
        setError(err.response?.data?.message || 'Failed to update MFA settings');
      }
    }
  };

  const handleMethodChange = (e) => {
    setMfaMethod(e.target.value);
    setError('');
    setSuccessMessage('');
  };

  const handlePhoneChange = (e) => {
    setPhoneNumber(e.target.value);
    setError('');
    setSuccessMessage('');
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    
    if (mfaEnabled && mfaMethod === 'sms' && !phoneNumber) {
      setError('Please enter a phone number for SMS verification');
      return;
    }
    
    // Show confirmation modal
    setShowConfirmation(true);
  };

  if (loading) {
    return <div className="flex justify-center items-center">Loading...</div>;
  }

  return (
    <div className="settings-form-container">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="settings-form compact">
        <div className="form-group">
          <div className="flex-between">
            <div>
              <h3 className="sub-title">Two-Factor Authentication</h3>
              <p className="description-text">
                Add an extra layer of security to your account
              </p>
            </div>
            <div className="toggle-switch">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={mfaEnabled}
                  onChange={handleToggleMFA}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Verification Method
            </label>
            <select
              value={mfaMethod}
              onChange={handleMethodChange}
              disabled={!mfaEnabled}
              className="form-select"
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </div>

          {mfaMethod === 'sms' && (
            <div className="form-group">
              <label className="form-label">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                disabled={!mfaEnabled}
                placeholder="+1234567890"
                className="form-input"
              />
              <p className="help-text">
                Enter your phone number in international format (e.g., +1234567890)
              </p>
            </div>
          )}
          
          {mfaEnabled && mfaMethod === 'sms' && (
            <button 
              type="submit" 
              className="btn secondary-btn"
              disabled={loading}
            >
              Save Settings
            </button>
          )}
        </div>
      </form>
      
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmToggle}
        title={pendingAction ? "Enable Two-Factor Authentication" : "Disable Two-Factor Authentication"}
        message={pendingAction 
          ? "Are you sure you want to enable two-factor authentication?" 
          : "Are you sure you want to disable two-factor authentication? This will reduce the security of your account."}
      />
    </div>
  );
};

export default MFASettings;
