import React, { useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../context/AuthContext"; // Import AuthContext
// import { useNavigate } from 'react-router-dom';
import "../styles/styles.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error] = useState('');
  const [message, setMessage] = useState("");
  const { login } = useAuth(); // Access login function from AuthContext
  // const navigate = useNavigate();


  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('http://localhost:5001/api/auth/login', { email, password });
      localStorage.setItem('accessToken', data.accessToken);
      const decodedToken = jwtDecode(data.accessToken);
      const userData = { 
        decodedToken: decodedToken,
        token: data.accessToken,
        userId: decodedToken.userId, // Extract from decoded token
        tenantId: decodedToken.tenantId // Extract from decoded token 
      }; 
      login(userData); // Update context
      // navigate('/dashboard'); // Redirect to dashboard
    } catch (error) {
      setMessage(error.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="form-container">
      <h1 className="form-title">Welcome Back</h1>
      <p className="form-subtitle">Login to your MindCloud account</p>
      <form className="form" onSubmit={handleLogin}>
        <div className="form-group">
          {/* <label htmlFor="email">Email</label> */}
          <input
            type="email"
            id="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          {/* <label htmlFor="password">Password</label> */}
          <input
            type="password"
            id="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn primary-btn">Login</button>
      </form>
      <p className="form-footer">
        Don't have an account? <a href="/register" className="form-link">Register</a>
      </p>
      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-message">{message}</p>}
    </div>
  );
};

export default Login;
