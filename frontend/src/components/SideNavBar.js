import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { NavLink } from 'react-router-dom';
import { FaBrain, FaTachometerAlt, FaUsers, FaCalendarAlt, FaFileInvoice, FaSignOutAlt, FaBars, FaAngleDoubleLeft, FaUserCog, FaRegClipboard } from 'react-icons/fa';
import '../styles/styles.css';
import { useAuth } from '../context/AuthContext'; // Import AuthContext


const SideNavBar = () => {
  // Initialize collapsed state from localStorage or default to false
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  const [userInfo, setUserInfo] = useState({ firstname: '', lastname: '' }); // Initialize the userInfo state
  // const [loading, setLoading] = useState(true);

  const { user } = useAuth(); // Access the current user from AuthContext


  useEffect(() => {
    if (user) {
      console.log("Tenant & User:", user.tenantId, user.userId); // Debug log
      const { token, userId, tenantId } = user; // Get tenantId and userId from user context
      const fetchUsers = async () => {
        try {
          const response = await axios.get(`http://localhost:5001/api/users/user?tenantId=${tenantId}&userId=${userId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            // Log the entire response to see its structure
            console.log("API Response:", response.data);

            if (response.data) {
              console.log("First Name:", response.data.firstname, "Last Name:", response.data.lastname);
              setUserInfo({
                firstName: response.data.firstname || '',
                lastName: response.data.lastname || '',
              });
            }
        } catch (error) {
          console.error('Error fetching users', error);
        }
      };

      fetchUsers();
    }
  }, [user]);


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
      <div className="toggle-btn-container">
        <div className="toggle-btn" onClick={toggleSidebar}>
          {collapsed ? <FaBars /> : <FaAngleDoubleLeft /> }
          <span className="user-name user-info">Hi, {`${userInfo.firstName} ${userInfo.lastName}`}!</span>
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
