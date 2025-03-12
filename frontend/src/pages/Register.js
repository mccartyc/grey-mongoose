import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/styles.css";
import { createApiInstance } from '../utils/apiConfig';

const Register = () => {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    registrationType: "individual", // 'individual' or 'company'
    tenantName: "", // for individual registration
    tenantId: "" // for company registration
  });
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({}); // Track validation errors

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for auth error in URL
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    if (error) {
      setMessage(error === 'auth_failed' ? 'Registration failed. Please try again.' : error);
    }
  }, [location]);

  const handleGoogleRegister = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/google`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    const { firstname, lastname, email, password, registrationType, tenantName, tenantId } = formData;

    if (!firstname.trim()) {
      newErrors.firstname = "First name is required.";
    }

    if (!lastname.trim()) {
      newErrors.lastname = "Last name is required.";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    if (registrationType === 'individual' && !tenantName.trim()) {
      newErrors.tenantName = "Company name is required.";
    } else if (registrationType === 'company' && !tenantId.trim()) {
      newErrors.tenantId = "Tenant ID is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return; // Stop submission if form is invalid
    }

    try {
      const { firstname, lastname, email, password, registrationType, tenantName, tenantId } = formData;
      const registrationData = {
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        email: email.trim(),
        password,
        registrationType,
        ...(registrationType === 'individual' ? { tenantName: tenantName.trim() } : { tenantId: tenantId.trim() })
      };

      console.log('Sending registration data:', registrationData);

      await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/auth/register`,
        registrationData
      );
      
      setMessage("Registration successful! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (error) {
      setMessage(error.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="login-form-container">
      <h1 className="form-title">Create an Account</h1>
      <p className="form-subtitle">Join MindCloud today</p>
      <form className="form" onSubmit={handleRegister}>
        <div className="form-group login-form">
          <input
            type="text"
            id="firstname"
            name="firstname"
            placeholder="First Name"
            value={formData.firstname}
            onChange={handleInputChange}
            required
          />
          {errors.firstname && <p className="form-error">{errors.firstname}</p>}
        </div>
        <div className="form-group login-form">
          <input
            type="text"
            id="lastname"
            name="lastname"
            placeholder="Last Name"
            value={formData.lastname}
            onChange={handleInputChange}
            required
          />
          {errors.lastname && <p className="form-error">{errors.lastname}</p>}
        </div>
        <div className="form-group login-form">
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          {errors.email && <p className="form-error">{errors.email}</p>}
        </div>
        <div className="form-group login-form">
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
          {errors.password && <p className="form-error">{errors.password}</p>}
        </div>

        <div className="form-group login-form">
          <select
            name="registrationType"
            value={formData.registrationType}
            onChange={handleInputChange}
            className="form-select"
          >
            <option value="individual">Register as Individual/New Company</option>
            <option value="company">Join Existing Company</option>
          </select>
        </div>

        {formData.registrationType === 'individual' ? (
          <div className="form-group login-form">
            <input
              type="text"
              id="tenantName"
              name="tenantName"
              placeholder="Enter your company name"
              value={formData.tenantName}
              onChange={handleInputChange}
              required
            />
            {errors.tenantName && <p className="form-error">{errors.tenantName}</p>}
          </div>
        ) : (
          <div className="form-group login-form">
            <input
              type="text"
              id="tenantId"
              name="tenantId"
              placeholder="Enter your company's Tenant ID"
              value={formData.tenantId}
              onChange={handleInputChange}
              required
            />
            {errors.tenantId && <p className="form-error">{errors.tenantId}</p>}
          </div>
        )}
        <button type="submit" className="btn primary-btn">Register with Email</button>

        <div className="form-divider">
          <span>OR</span>
        </div>

        <button
          type="button"
          onClick={handleGoogleRegister}
          className="btn google-btn"
        >
          <img
            src="/google-icon.svg"
            alt="Google"
            className="google-icon"
          />
          Sign up with Google
        </button>
      </form>
      <p className="form-footer">
        Already have an account? <a href="/login" className="form-link">Login</a>
      </p>
      {message && <p className="form-message">{message}</p>}
    </div>
  );
};

export default Register;
