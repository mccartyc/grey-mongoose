// src/components/ClientNavBar.js
import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import '../styles/styles.css'; // Ensure your styles are included

const ClientNavBar = () => {
  const { id } = useParams(); // Get the client ID from the URL
  const navigate = useNavigate();
  const location = useLocation();

  if (!id) {
    console.error('Error: No client ID found in URL.');
    return <div>Client ID is missing. Please refresh the page.</div>;
  }

  // Define navigation links
  const links = [
    { label: 'Overview', path: `/clients/${id}` },
    { label: 'Intake Form', path: `/clients/${id}/intake` },
    { label: 'Health Assessment', path: `/clients/${id}/health-assessment` },
    { label: 'Health Plan', path: `/clients/${id}/health-plan` },
  ];

  return (
    <div className="client-nav-bar">
      {links.map((link) => (
        <button
          key={link.path}
          className={`client-nav-button ${
            location.pathname === link.path ? 'active' : ''
          }`}
          onClick={() => navigate(link.path)}
        >
          {link.label}
        </button>
      ))}
    </div>
  );
};

export default ClientNavBar;