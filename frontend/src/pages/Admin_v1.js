// src/components/Admin.js
import React, { useState } from "react";
import axios from "axios";
import "../styles/styles.css";

const Admin = () => {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setName(e.target.value);
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    console.log('Form Data:', { name }); // Log the form data
    try {
      const response = await axios.post("http://localhost:5001/api/tenants", { name });
      setMessage(`Tenant created: ${response.data.name}`);
      setName(""); // Clear form after successful submission
    } catch (error) {
      setMessage(error.response?.data?.error || "Failed to create tenant");
      console.error('Error Response:', error.response); // Log the error response
    }
  };

  return (
    <div className="form-container">
      <h1 className="form-title">Create New Tenant</h1>
      <p className="form-subtitle">Add a new tenant to your MindCloud account</p>
      <form className="form" onSubmit={handleCreateTenant}>
        <div className="form-group">
          <label htmlFor="name">Tenant Name</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Enter tenant name"
            value={name}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="btn primary-btn">Create Tenant</button>
      </form>
      {message && <p className="form-message">{message}</p>}
    </div>
  );
};

export default Admin;
