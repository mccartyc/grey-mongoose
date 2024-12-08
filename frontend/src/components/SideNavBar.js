// src/components/SideNavBar.js
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/styles.css';
import { FaTachometerAlt, FaUsers, FaCalendarAlt, FaFileInvoice, FaSignOutAlt, FaBars, FaUserCog, FaRegClipboard } from 'react-icons/fa';

const SideNavBar = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className={`side-navbar ${collapsed ? 'collapsed' : ''}`}>
      <div className="toggle-btn" onClick={toggleSidebar}>
        <FaBars />
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

      {/* Admin and Logout Links at the Bottom */}
      <div className="bottom-links">
        <ul className="nav-links">
          <li>
            <NavLink to="/admin" className={({ isActive }) => isActive ? "active-link" : ""}>
              <FaUserCog className="nav-icon" />
              {!collapsed && <span className="nav-text">Admin</span>}
            </NavLink>
          </li>
          <li className="logout">
            <NavLink to="/logout" className={({ isActive }) => isActive ? "active-link" : ""}>
              <FaSignOutAlt className="nav-icon" />
              {!collapsed && <span className="nav-text">Logout</span>}
            </NavLink>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SideNavBar;

