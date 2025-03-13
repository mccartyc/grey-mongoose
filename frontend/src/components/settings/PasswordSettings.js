import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/apiService';
import ConfirmationModal from '../common/ConfirmationModal';
import '../../styles/settingsStyles.css';

const PasswordSettings = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear messages when user starts typing
    setError('');
    setSuccessMessage('');
  };

  const validatePasswordChange = () => {
    if (!formData.currentPassword) return 'Current password is required';
    if (!formData.newPassword) return 'New password is required';
    if (!formData.confirmPassword) return 'Please confirm your new password';
    if (formData.newPassword !== formData.confirmPassword) return 'New passwords do not match';
    if (formData.newPassword.length < 8) return 'Password must be at least 8 characters long';
    
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validationError = validatePasswordChange();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    // Show confirmation modal
    setShowConfirmation(true);
  };
  
  const handleConfirm = async () => {
    setShowConfirmation(false);
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token || !user?.userId) {
        setError('You must be logged in to change your password');
        setLoading(false);
        return;
      }
      
      const response = await api.put(
        `/api/users/${user.userId}/password`,
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          tenantId: user.tenantId
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSuccessMessage('Password changed successfully');
      
      // Clear password fields
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

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
      
      <form onSubmit={handleSubmit} className="settings-form compact">
        <div className="form-group">
          <label className="form-label">Current Password</label>
          <input
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleInputChange}
            className="form-input"
            disabled={loading}
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              className="form-input"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="form-input"
              disabled={loading}
            />
          </div>
        </div>
        
        {/* <p className="help-text">
          Password must be at least 8 characters long
        </p>
         */}
        <button 
          type="submit" 
          className="btn secondary-btn"
          disabled={loading}
        >
          {loading ? 'Changing Password...' : 'Change Password'}
        </button>
      </form>
      
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirm}
        title="Change Password"
        message="Are you sure you want to change your password?"
      />
    </div>
  );
};

export default PasswordSettings;
