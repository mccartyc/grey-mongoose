import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const GoogleAuthSetup = () => {
  const [formData, setFormData] = useState({
    registrationType: '',
    tenantName: '',
    tenantId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { setUserData } = useAuth();
  const [googleUserData, setGoogleUserData] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userData = params.get('userData');
    if (userData) {
      setGoogleUserData(JSON.parse(decodeURIComponent(userData)));
    } else {
      setError('No user data found');
      navigate('/login');
    }
  }, [location, navigate]);



  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear tenant-specific fields when registration type changes
    if (name === 'registrationType') {
      setFormData(prev => ({
        ...prev,
        tenantName: '',
        tenantId: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { registrationType, tenantName, tenantId } = formData;

      if (!registrationType) {
        throw new Error('Please select a registration type');
      }

      if (registrationType === 'individual' && !tenantName) {
        throw new Error('Please enter an organization name');
      }

      if (registrationType === 'existing' && !tenantId) {
        throw new Error('Please select an organization');
      }

      // Complete the registration with tenant information
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/google/complete-registration`, {
        ...googleUserData,
        registrationType,
        tenantName: registrationType === 'individual' ? tenantName : undefined,
        tenantId: registrationType === 'existing' ? tenantId : undefined
      });

      const { token, user } = response.data;

      // Update auth context
      setUserData({
        token,
        decodedToken: user,
        userId: user._id,
        tenantId: user.tenantId,
        role: user.role
      }, user);

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.error || error.message || 'Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  if (!googleUserData) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100 justify-center items-center p-4">
      <div className="login-form-container">
        <h2 className="form-title">Complete Your Registration</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          <div>
            <label className="form-subtitle">Registration Type</label>
            <select
              name="registrationType"
              value={formData.registrationType}
              onChange={handleChange}
              className="form-group login-form"
              disabled={loading}
            >
              <option value="">Select registration type</option>
              <option value="individual">Create New Organization</option>
              <option value="existing">Join Existing Organization</option>
            </select>
          </div>

          {formData.registrationType === 'individual' && (
            <div>
              <label className="form-subtitle">Organization Name</label>
              <input
                type="text"
                name="tenantName"
                value={formData.tenantName}
                onChange={handleChange}
                placeholder="Enter organization name"
                className="form-group login-form"
                disabled={loading}
              />
            </div>
          )}

          {formData.registrationType === 'existing' && (
            <div>
              <label className="form-subtitle">Organization ID</label>
              <input
                type="text"
                name="tenantId"
                value={formData.tenantId}
                onChange={handleChange}
                placeholder="Enter organization ID"
                className="form-group login-form"
                disabled={loading}
              />
            </div>
          )}

          <button
            type="submit"
            className="btn primary-btn"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GoogleAuthSetup;