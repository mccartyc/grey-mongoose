import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/apiService';
import ConfirmationModal from '../common/ConfirmationModal';
import '../../styles/settingsStyles.css';

const ContactInfoSettings = () => {
  const { user, userInfo } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
    // phoneNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  useEffect(() => {
    if (userInfo) {
      setFormData({
        firstName: userInfo.firstname || '',
        lastName: userInfo.lastname || '',
        email: userInfo.email || ''
        // phoneNumber: userInfo.phoneNumber || ''
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
    
    // if (formData.phoneNumber) {
    //   const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    //   if (!phoneRegex.test(formData.phoneNumber)) return 'Please enter a valid phone number';
    // }
    
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validationError = validateContactInfo();
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
          // phoneNumber: formData.phoneNumber,
          tenantId: user.tenantId
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSuccessMessage('Contact information updated successfully');
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile information');
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
        <div className="form-row">
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
        </div>
        
        <div className="form-row">
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
          
          {/* <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className="form-input"
              placeholder="123-456-7890"
              disabled={loading}
            />
          </div> */}
        </div>
        
        <button 
          type="submit" 
          className="btn secondary-btn"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Contact Information'}
        </button>
      </form>
      
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirm}
        title="Update Contact Information"
        message="Are you sure you want to update your contact information?"
      />
    </div>
  );
};

export default ContactInfoSettings;
