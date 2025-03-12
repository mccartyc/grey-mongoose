import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { createApiInstance } from '../../utils/apiConfig';
import { useAuth } from '../../context/AuthContext'; // Import AuthContext


const TenantStep = ({ onNext, onSelectTenant }) => {
  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false); // State for delete confirmation modal
  const [tenantToDelete, setTenantToDelete] = useState(null); // Track tenant to delete

  const { user, userInfo } = useAuth(); // Access the current user from AuthContext

  // Check if user can create/edit/delete tenants (only Internal users)
  const canManageTenants = userInfo?.role === 'Internal';
  
  // Check if user can see all tenants (only Internal users)
  const canSeeAllTenants = userInfo?.role === 'Internal';

  // Memoize the fetch tenants function to prevent unnecessary re-renders
  const fetchTenants = useCallback(async () => {
    if (!user?.token) return;

    try {
      const response = await axios.get(`/api/tenants`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      
      let filteredTenants = response.data.filter(tenant => tenant.isActive);
      
      // If not an Internal user, only show the user's own tenant
      if (!canSeeAllTenants && userInfo?.tenantId) {
        filteredTenants = filteredTenants.filter(tenant => tenant._id === userInfo.tenantId);
      }
      
      setTenants(filteredTenants);
      
      // If Admin/User and only has one tenant, auto-select it
      if (!canSeeAllTenants && filteredTenants.length === 1) {
        setSelectedTenantId(filteredTenants[0]._id);
        onSelectTenant(filteredTenants[0]);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  }, [user?.token, canSeeAllTenants, userInfo?.tenantId]); // Remove onSelectTenant from deps

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    const { token } = user; // Get token from user context
    try {
      const response = await axios.post(`/api/tenants`, { name },
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
    const { token } = user; // Get token from user context
    try {
      if (!selectedTenantId) return; // Safety check
      
      const response = await axios.put(`/api/tenants/${selectedTenantId}`, { name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      setMessage(`Tenant updated: ${response.data.name}`);
      setTenants((prev) =>
        prev.map((tenant) => (tenant._id === selectedTenantId ? { ...tenant, name: response.data.name } : tenant))
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
    setSelectedTenantId(tenant._id);
    setName(tenant.name);  // Store the selected tenant's name if you want to show it somewhere (if needed)
    onSelectTenant(tenant);
  };

  const handleEditTenant = (tenant) => {
    setSelectedTenantId(tenant._id);
    setName(tenant.name); // Populate the form with the selected tenant's name
    setMessage(false);
    setShowForm(true); // Show the form for editing
  };

  const handleDeleteClick = (tenant, event) => {
    event.stopPropagation(); // Prevent row selection
    setTenantToDelete(tenant._id); // Set tenant to delete
    setShowDeleteModal(true); // Show confirmation modal
  };

  const handleDeleteTenant = async () => {
    const { token } = user; // Get token from user context
    try {
      await axios.put(`/api/tenants/${tenantToDelete}/deactivate`,{},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      setTenants((prev) => prev.filter((tenant) => tenant._id !== tenantToDelete));
      setShowDeleteModal(false); // Close modal after successful delete
      setTenantToDelete(null); // Reset tenant to delete
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
    tenant.tenantId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                <button type="button" onClick={resetForm} className="btn secondary-btn">Close</button>
                <button type="submit" className="btn primary-btn">{selectedTenantId ? 'Update Tenant' : 'Create Tenant'}</button>
              </div>
            </form>
            {message && <p>{message}</p>}
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="overlay">
          <div className="cofirm-modal-content">
            <h2>Confirm Deletion</h2>
            <p>
              Are you sure you want to delete this tenant?
            </p>
            <p>
             This action is{' '}
              <strong>irreversible</strong>.
            </p>
            <div className="button-container">
              <button
                type= "button"
                onClick={() => setShowDeleteModal(false)}
                className="btn secondary-btn"
              >
                Cancel
              </button>
              <button type="submit" onClick={handleDeleteTenant} className="btn primary-btn">
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}


      <div className={`content-container ${showForm ? 'blur-background' : ''} ${showDeleteModal ? 'blur-background' : ''}`}>
        <div className="header-container">
          <h2 className="section-heading">Select or Create Tenant</h2>
          <div className="right-button-container">
            <input
              type="text"
              placeholder="Search..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {canManageTenants && (
              <button onClick={() => { 
                resetForm(); 
                setShowForm(true); 
              }} className="btn primary-btn">Create New</button>
            )}
          </div>
        </div>
        <table className="tenant-table">
          <thead>
            <tr>
              <th>Tenant Name</th>
              <th>Tenant ID</th>
              <th>Created Timestamp</th>
              {canManageTenants && <th className="action-column">Action</th>}
            </tr>
          </thead>
          <tbody>
            {filteredTenants.map((tenant) => (
              <tr key={tenant._id}
                  className={selectedTenantId === tenant._id ? 'selected' : ''}
                  onClick={() => handleSelectTenant(tenant)} 
                  onDoubleClick={() => {
                    handleSelectTenant(tenant);  // Select the tenant
                    handleNextStep(); // Immediately move to next step
                  }}
              >
                <td title={tenant.name}>{tenant.name}</td>
                <td title={tenant._id}>{tenant._id}</td>
                <td title={formatTimestamp(tenant.createdAt)}>{formatTimestamp(tenant.createdAt)}</td>
                {canManageTenants && (
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
                      onClick={(event) => handleDeleteClick(tenant._id, event)}
                    >
                      🗑️
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="right-button-container">
          <button className="btn primary-btn" onClick={handleNextStep} disabled={!selectedTenantId}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantStep;