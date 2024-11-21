import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // For redirection
import "../styles/styles.css";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({}); // Track validation errors

  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = "Name is required.";
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return; // Stop submission if form is invalid
    }

    try {
      await axios.post("http://localhost:5000/api/auth/register", { name, email, password });
      setMessage("Registration successful! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 2000); // Redirect to dashboard after 2 seconds
    } catch (error) {
      setMessage(error.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="form-container">
      <h1 className="form-title">Create an Account</h1>
      <p className="form-subtitle">Join MindCloud today</p>
      <form className="form" onSubmit={handleRegister}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          {errors.name && <p className="form-error">{errors.name}</p>}
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {errors.email && <p className="form-error">{errors.email}</p>}
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {errors.password && <p className="form-error">{errors.password}</p>}
        </div>
        <button type="submit" className="btn primary-btn">Register</button>
      </form>
      <p className="form-footer">
        Already have an account? <a href="/login" className="form-link">Login</a>
      </p>
      {message && <p className="form-message">{message}</p>}
    </div>
  );
};

export default Register;
