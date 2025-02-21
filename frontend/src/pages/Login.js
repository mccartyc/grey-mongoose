import React, { useState } from "react";
// import axios from "axios";
// import { jwtDecode } from "jwt-decode";
import { useAuth } from "../context/AuthContext";
import "../styles/styles.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    const { email, password } = formData;
    if (!email || !password) {
      setError("Please provide both email and password");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await login({ email, password });
      setFormData({ email: "", password: "" });
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || "Failed to login. Please try again.");
      
      // If it's a rate limit error, disable the form for a short time
      if (error.message.includes('Too many login attempts')) {
        setIsLoading(true);
        setTimeout(() => {
          setIsLoading(false);
          setError('');
        }, 30000); // Wait 30 seconds before allowing another attempt
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
      
      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
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
        <div className="form-group">
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
          className="btn next-btn"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;
