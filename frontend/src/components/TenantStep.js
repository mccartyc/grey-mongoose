import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TenantStep = ({ onNext, onSelectTenant }) => {
  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/tenants');
        setTenants(response.data.filter(tenant => tenant.isActive));
      } catch (error) {
        console.error('Error fetching tenants:', error);
      }
    };

    fetchTenants();
  }, []);

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/api/tenants', { name });
      setMessage(`Tenant created: ${response.data.name}`);
      setTenants((prev) => [...prev, response.data]);
      setName('');
      setShowForm(false); // Close the form after creation
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to create tenant');
    }
  };

  const handleSelectTenant = (tenant) => {
    setSelectedTenantId(tenant.tenantId);
    onSelectTenant(tenant);
  };

  const handleDeleteTenant = async (tenantId, event) => {
    event.stopPropagation(); // Prevent row selection when clicking delete
    try {
      await axios.put(`http://localhost:5001/api/tenants/${tenantId}/deactivate`);
      setTenants((prev) =>
        prev.filter((tenant) => tenant.tenantId !== tenantId)
      );
    } catch (error) {
      console.error('Error deleting tenant:', error);
    }
  };

  return (
    <div>
      <h2>Select or Create Tenant</h2>
      <button onClick={() => setShowForm(true)} className="btn create-btn">Create New</button>
      {showForm && (
        <div className="popup-form">
          <form onSubmit={handleCreateTenant}>
            <label>
              Tenant Name:
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <button type="submit">Create Tenant</button>
          </form>
          {message && <p>{message}</p>}
        </div>
      )}
      <table className="tenant-table">
        <thead>
          <tr>
            <th>Tenant ID</th>
            <th>Tenant Name</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => (
            <tr
              key={tenant.tenantId}
              className={selectedTenantId === tenant.tenantId ? 'selected' : ''}
              onClick={() => handleSelectTenant(tenant)}
            >
              <td>{tenant.tenantId}</td>
              <td>{tenant.name}</td>
              <td>
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
      <button onClick={onNext} disabled={!selectedTenantId}>
        Next
      </button>
    </div>
  );
};

export default TenantStep;
