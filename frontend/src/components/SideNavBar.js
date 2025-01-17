import React, { useState, useEffect } from 'react';
// import axios from 'axios';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaUsers, FaCalendarAlt, FaFileInvoice, FaSignOutAlt, FaBars, FaAngleDoubleLeft, FaUserCog, FaRegClipboard } from 'react-icons/fa';
import '../styles/styles.css';
import { useAuth } from '../context/AuthContext'; // Import AuthContext
import mindcloudLogo from '../assets/mindcloud_white.png';



const SideNavBar = () => {
  // Initialize collapsed state from localStorage or default to false
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  // const [userInfo, setUserInfo] = useState({ firstname: '', lastname: '' }); // Initialize the userInfo state
  // const [loading, setLoading] = useState(true);

  const { userInfo, logout, loading} = useAuth(); // Access the current user from AuthContext

  const handleLogout = () => {
    logout(); // Call logout function to clear local storage and navigate
  };


  // Toggle function to handle sidebar collapse and persist state
  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem('sidebarCollapsed', newState);
      return newState;
    });
  };

  useEffect(() => {
    // Sync collapsed state with localStorage on component mount
    const savedState = localStorage.getItem('sidebarCollapsed') === 'true';
    setCollapsed(savedState);
  }, []);

    // Gracefully handle cases where userInfo is not yet available
    // const userFirstName = userInfo?.firstname || 'User';
    // const userLastName = userInfo?.lastname || '';
  
  const userFirstName = userInfo?.firstname || (loading ? 'Fetching...' : 'User');
  const userLastName = userInfo?.lastname || '';

  return (
    <div className={`side-navbar ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand">
        {/* <FaBrain className="brand-icon" /> */}
        <img
          src={mindcloudLogo}
          alt=""
          className="brand-icon"
        />
        {!collapsed && <span className="brand-name">MindCloud</span>}
      </div>
      <div className="toggle-btn-container">
        <div className="toggle-btn" onClick={toggleSidebar}>
          {collapsed ? <FaBars /> : <FaAngleDoubleLeft /> }
          <span className="user-name user-info">
          Hi, {`${userFirstName } ${userLastName || ''}`}!
          </span>
        </div>
      </div>
      <ul className="nav-links">
        <li>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active-link" : ""}>
            <FaTachometerAlt className="nav-icon" />
            {!collapsed && <span className="nav-text">Dashboard</span>}
          </NavLink>
        </li>
        <li>
          <NavLink to="/clients" className={({ isActive }) => isActive ? "active-link" : ""}>
            <FaUsers className="nav-icon" />
            {!collapsed && <span className="nav-text">Clients</span>}
          </NavLink>
        </li>
        <li>
          <NavLink to="/sessions" className={({ isActive }) => isActive ? "active-link" : ""}>
            <FaRegClipboard className="nav-icon" />
            {!collapsed && <span className="nav-text">Sessions</span>}
          </NavLink>
        </li>
        <li>
          <NavLink to="/calendar" className={({ isActive }) => isActive ? "active-link" : ""}>
            <FaCalendarAlt className="nav-icon" />
            {!collapsed && <span className="nav-text">Calendar</span>}
          </NavLink>
        </li>
        <li>
          <NavLink to="/invoicing" className={({ isActive }) => isActive ? "active-link" : ""}>
            <FaFileInvoice className="nav-icon" />
            {!collapsed && <span className="nav-text">Invoicing</span>}
          </NavLink>
        </li>
      </ul>
      <div className="bottom-links">
        <ul className="nav-links">
          <li>
            <NavLink to="/admin" className={({ isActive }) => isActive ? "active-link" : ""}>
              <FaUserCog className="nav-icon" />
              {!collapsed && <span className="nav-text">Admin</span>}
            </NavLink>
          </li>
          <li className="logout">
            <button onClick={handleLogout} className="logout-btn">
              <FaSignOutAlt className="nav-icon" />
              {!collapsed && <span className="nav-text">Logout</span>}
            </button>
          </li>
          {/* <li className="logout"> 
            <NavLink to="/login" className={({ isActive }) => isActive ? "active-link" : ""}>
              <FaSignOutAlt className="nav-icon" />
              {!collapsed && <span className="nav-text">Logout</span>}
            </NavLink>
          </li> */}
        </ul>
      </div>
    </div>
  );
};

export default SideNavBar;
