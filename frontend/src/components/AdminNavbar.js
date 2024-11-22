import React from "react";
import { Link } from "react-router-dom";
import "../styles/styles.css";

const AdminNavbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">MindCloud Admin</div>
      <div className="navbar-links">
        <Link to="/admin/settings" className="nav-link">Settings</Link>
        <Link to="/" className="nav-link">Logout</Link>
      </div>
    </nav>
  );
};

export default AdminNavbar;
