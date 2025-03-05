import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/apiService';
import MFASettings from './MFASettings';
import '../../styles/settingsStyles.css';

const ProfileSettings = () => {
  const { user, userInfo } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('contact');

  useEffect(() => {
    if (userInfo) {
      setFormData({
        ...formData,
        firstName: userInfo.firstname || '',
        lastName: userInfo.lastname || '',
        email: userInfo.email || '',
        phoneNumber: userInfo.phoneNumber || ''
      });
    }
  }, [userInfo]);

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

  const validateContactInfo = () => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';
    if (!formData.email.trim()) return 'Email is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return 'Please enter a valid email address';
    
    if (formData.phoneNumber) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(formData.phoneNumber)) return 'Please enter a valid phone number';
    }
    
    return null;
  };

  const validatePasswordChange = () => {
    if (!formData.currentPassword) return 'Current password is required';
    if (!formData.newPassword) return 'New password is required';
    if (!formData.confirmPassword) return 'Please confirm your new password';
    if (formData.newPassword !== formData.confirmPassword) return 'New passwords do not match';
    if (formData.newPassword.length < 8) return 'Password must be at least 8 characters long';
    
    return null;
  };

  const handleContactInfoUpdate = async (e) => {
    e.preventDefault();
    
    const validationError = validateContactInfo();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token || !user?.userId) {
        setError('You must be logged in to update your profile');
        setLoading(false);
        return;
      }
      
      const response = await api.put(
        `/api/users/${user.userId}/profile`,
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          tenantId: user.tenantId
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSuccessMessage('Contact information updated successfully');
      
      // Update local state with the response data if needed
      // This might require a refresh of user context
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile information');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    const validationError = validatePasswordChange();
    if (validationError) {
      setError(validationError);
      return;
    }
    
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
        ...formData,
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
    <div className="profile-settings-container">
      <h2 className="section-title">Account Settings</h2>
      
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
      
      <div className="settings-tabs">
        <button 
          className={`tab-button ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          Contact Information
        </button>
        <button 
          className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          Change Password
        </button>
        <button 
          className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'contact' && (
          <form onSubmit={handleContactInfoUpdate} className="settings-form">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="form-input"
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="form-input"
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="form-input"
                placeholder="+1234567890"
                disabled={loading}
              />
              <p className="help-text">
                Enter your phone number in international format (e.g., +1234567890)
              </p>
            </div>
            
            <button 
              type="submit" 
              className="primary-button"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Contact Information'}
            </button>
          </form>
        )}
        
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordChange} className="settings-form">
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
              <p className="help-text">
                Password must be at least 8 characters long
              </p>
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
            
            <button 
              type="submit" 
              className="primary-button"
              disabled={loading}
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        )}
        
        {activeTab === 'security' && (
          <div className="security-settings">
            <MFASettings />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;
