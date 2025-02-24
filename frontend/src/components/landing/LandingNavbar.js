import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../../styles/landingNavbar.css';

const LandingNavbar = () => {
  return (
    <nav className="landing-navbar">
      <div className="nav-content">
        <Link to="/" className="nav-brand">
          MindCloud
        </Link>
        
        <div className="nav-right">
          <Link to="/login" className="nav-link">Log In</Link>
          <Link to="/register" className="nav-button">Get Started</Link>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;
