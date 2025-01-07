import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext'; // Import AuthContext


const TenantStep = ({ onNext, onSelectTenant }) => {
  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { user } = useAuth(); // Access the current user from AuthContext

  useEffect(() => {
    const fetchTenants = async () => {
      const { token } = user; // Get tenantId and userId from user context
      try {
        const response = await axios.get('http://localhost:5001/api/tenants',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        setTenants(response.data.filter(tenant => tenant.isActive));
      } catch (error) {
        console.error('Error fetching tenants:', error);
      }
    };

    fetchTenants();
  }, [user]);

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    const { token } = user; // Get tenantId and userId from user context
    try {
      const response = await axios.post('http://localhost:5001/api/tenants', { name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      setMessage(`Tenant created: ${response.data.name}`);
      setTenants((prev) => [...prev, response.data]);
      resetForm(); // Reset form after creation
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to create tenant');
    }
  };

  const handleUpdateTenant = async (e) => {
    e.preventDefault();
    const { token } = user; // Get tenantId and userId from user context
    try {
      if (!selectedTenantId) return; // Safety check
      
      const response = await axios.put(`http://localhost:5001/api/tenants/${selectedTenantId}`, { name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      setMessage(`Tenant updated: ${response.data.name}`);
      setTenants((prev) =>
        prev.map((tenant) => (tenant.tenantId === selectedTenantId ? { ...tenant, name: response.data.name } : tenant))
      );
      resetForm(); // Reset form after update
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to update tenant');
    }
  };

  const resetForm = () => {
    setName('');
    setSelectedTenantId(null); // Resetting selected tenant ID
    setShowForm(false); // Close the form after operation
  };

  const handleSelectTenant = (tenant) => {
    setSelectedTenantId(tenant.tenantId);
    setName(tenant.name);  // Store the selected tenant's name if you want to show it somewhere (if needed)
    onSelectTenant(tenant);
  };

  const handleEditTenant = (tenant) => {
    setSelectedTenantId(tenant.tenantId);
    setName(tenant.name); // Populate the form with the selected tenant's name
    setShowForm(true); // Show the form for editing
  };

  const handleDeleteTenant = async (tenantId, event) => {
    event.stopPropagation(); // Prevent row selection when clicking delete
    const { token } = user; // Get tenantId and userId from user context
    try {
      await axios.put(`http://localhost:5001/api/tenants/${tenantId}/deactivate`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      setTenants((prev) => prev.filter((tenant) => tenant.tenantId !== tenantId));
    } catch (error) {
      console.error('Error deleting tenant:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString(); // Format the date to the user's local time
  };

  const filteredTenants = tenants.filter((tenant) =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.tenantId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatTimestamp(tenant.createdAt).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNextStep = () => { 
    console.log('Selected Tenant ID:', selectedTenantId); 
    onNext(selectedTenantId); 
  };

  return (
    <div className="tenant-step">
      {showForm && (
        <div className="overlay">
          <div className="popup-form">
            <form className="form-group" onSubmit={selectedTenantId ? handleUpdateTenant : handleCreateTenant} autoComplete="off">
              <h3>{selectedTenantId ? 'Edit Tenant' : 'Create New Tenant'}</h3>
              <label>
                Tenant Name:
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                />
              </label>
              <div className="button-container">
                <button type="button" onClick={resetForm} className="btn close-btn">Close</button>
                <button type="submit" className="btn primary-btn">{selectedTenantId ? 'Update Tenant' : 'Create Tenant'}</button>
              </div>
            </form>
            {message && <p>{message}</p>}
          </div>
        </div>
      )}
      <div className={`content-container ${showForm ? 'blur-background' : ''}`}>
        <div className="header-container">
          <h2>Select or Create Tenant</h2>
          <div className="right-button-container">
            <input
              type="text"
              placeholder="Search..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button onClick={() => { 
              resetForm(); 
              setShowForm(true); 
            }} className="btn create-btn">Create New</button>
          </div>
        </div>
        <table className="tenant-table">
          <thead>
            <tr>
              <th>Tenant Name</th>
              <th>Tenant ID</th>
              <th>Created Timestamp</th>
              <th className="action-column">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTenants.map((tenant) => (
              <tr key={tenant.tenantId}
                  className={selectedTenantId === tenant.tenantId ? 'selected' : ''}
                  onClick={() => handleSelectTenant(tenant)} 
              >
                <td>{tenant.name}</td>
                <td>{tenant.tenantId}</td>
                <td>{formatTimestamp(tenant.createdAt)}</td>
                <td className="action-column">
                  <span
                    role="img"
                    aria-label="edit"
                    className="edit-icon"
                    onClick={(event) => {
                      event.stopPropagation(); // Prevent row selection when clicking edit icon
                      handleEditTenant(tenant); // Open form to edit tenant
                    }}
                    style={{ cursor: 'pointer', marginRight: '10px' }}
                  >
                    ✏️
                  </span>
                  <span
                    role="img"
                    aria-label="delete"
                    className="trash-icon"
                    onClick={(event) => handleDeleteTenant(tenant.tenantId, event)}
                  >
                    🗑️
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="right-button-container">
          <button className="btn next-btn" onClick={handleNextStep} disabled={!selectedTenantId}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantStep;