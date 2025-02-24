import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserCircle } from 'react-icons/fa';
import '../../styles/mainNavbar.css';

const MainNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <nav className="main-navbar">
      <div className="nav-content">
        <div className="nav-left">
          <Link to="/" className="nav-brand">
            MindCloud
          </Link>
          {user && (
            <div className="nav-links">
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/clients">Clients</Link>
              <Link to="/sessions">Sessions</Link>
              <Link to="/calendar">Calendar</Link>
            </div>
          )}
        </div>

        <div className="nav-right">
          {!user ? (
            <div className="auth-buttons">
              <Link to="/login" className="btn secondary-btn">Log In</Link>
              <Link to="/register" className="btn primary-btn">Sign Up</Link>
            </div>
          ) : (
            <div className="user-menu">
              <button 
                className="user-menu-button"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <FaUserCircle />
                <span>{user.name || 'User'}</span>
              </button>
              
              <AnimatePresence>
                {showDropdown && (
                  <motion.div 
                    className="dropdown-menu"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link to="/settings">Settings</Link>
                    <button onClick={handleLogout}>Log Out</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default MainNavbar;
