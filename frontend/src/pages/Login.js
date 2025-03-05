import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from '../services/apiService';
import "../styles/styles.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    mfaCode: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [requireMFA, setRequireMFA] = useState(false);
  const [mfaMethod, setMfaMethod] = useState("");
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerateMFA = async () => {
    try {
      const response = await api.post('/api/mfa/generate', {
        email: formData.email
      });

      const { method, message } = response.data;
      setMfaMethod(method);
      setError(''); // Clear any previous errors
      setRequireMFA(true);
    } catch (err) {
      console.error('Error generating MFA code:', err);
      setError(err.response?.data?.message || 'Failed to generate MFA code');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    const { email, password, mfaCode } = formData;
    if (!email || !password) {
      setError("Please provide both email and password");
      return;
    }

    if (requireMFA && !mfaCode) {
      setError("Please enter the MFA code");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await login({ email, password, mfaCode });
      
      if (response?.requireMFA) {
        setRequireMFA(true);
        setMfaMethod(response.method);
        if (response.method !== 'authenticator') {
          await handleGenerateMFA();
        }
        setError(response.message || 'Please enter your MFA code');
        setIsLoading(false);
        return;
      }

      // Successful login
      setFormData({ email: "", password: "", mfaCode: "" });
      setRequireMFA(false);
      setMfaMethod("");
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || error.message || "Failed to login. Please try again.");
      
      // If it's a rate limit error, disable the form for a short time
      if (error.message?.includes('Too many login attempts')) {
        setIsLoading(true);
        setTimeout(() => {
          setIsLoading(false);
          setError('');
        }, 30000);
      }
    } finally {
      if (!error?.message?.includes('Too many login attempts')) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="form-container">
      <h1 className="form-title">Welcome Back</h1>
      <p className="form-subtitle">Login to your MindCloud account</p>
      
      {requireMFA && (
        <div className="info-message">
          {mfaMethod === 'authenticator' 
            ? 'Please enter the code from your authenticator app'
            : `Please enter the code sent to your ${mfaMethod}`
          }
        </div>
      )}
      
      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group login-form">
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
        </div>
        <div className="form-group login-form">
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
        </div>
        <button 
          type="submit" 
          className="btn primary-btn"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;
