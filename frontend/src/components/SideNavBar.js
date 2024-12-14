import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { FaBrain, FaTachometerAlt, FaUsers, FaCalendarAlt, FaFileInvoice, FaSignOutAlt, FaAngleDoubleLeft, FaAngleDoubleRight, FaUserCog, FaRegClipboard } from 'react-icons/fa';
import '../styles/styles.css';

const user = {
  firstName: 'John',
  lastName: 'Doe',
};

const SideNavBar = () => {
  // Initialize collapsed state from localStorage or default to false
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

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

  return (
    <div className={`side-navbar ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand">
        <FaBrain className="brand-icon" />
        {!collapsed && <span className="brand-name">MindCloud</span>}
      </div>
      <div className="user-name">
        {collapsed ? <p>  </p> : <p>Hi, {`${user.firstName} ${user.lastName}`}!</p>}
      </div>
      <div className="toggle-btn" onClick={toggleSidebar}>
        {collapsed ? <FaAngleDoubleRight /> : <FaAngleDoubleLeft />}
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
