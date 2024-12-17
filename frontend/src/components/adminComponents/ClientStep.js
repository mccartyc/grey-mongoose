import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClientStep = ({ onPrevious, selectedTenant, selectedUser }) => {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (selectedTenant) {
      const fetchClients = async () => {
        try {
          const response = await axios.get(`http://localhost:5001/api/clients?tenantId=${selectedTenant._id}`);
          setClients(response.data);
        } catch (error) {
          console.error('Error fetching clients:', error);
        }
      };

      fetchClients();
    }
  }, [selectedTenant]);

  const handleCreateClient = async (e) => {
    e.preventDefault();

    if (!selectedTenant || !selectedUser) {
      setMessage('Error: Tenant or User not selected.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5001/api/clients', {
        firstName,
        lastName,
        birthday,
        gender,
        email,
        phone,
        streetAddress,
        city,
        state,
        tenantId: selectedTenant._id,
        createdBy: selectedUser.userId,
      });
      setMessage(`Client created: ${response.data.firstName} ${response.data.lastName}`);
      setClients((prev) => [...prev, response.data]);
      setShowForm(false);
      resetFormFields();
    } catch (error) {
      console.error('Error creating client:', error);
      setMessage(error.response?.data?.error || 'Failed to create client');
    }
  };

  const resetFormFields = () => {
    setFirstName('');
    setLastName('');
    setBirthday('');
    setGender('');
    setEmail('');
    setPhone('');
    setStreetAddress('');
    setCity('');
    setState('');
  };

  const handleSelectClient = (client) => {
    setSelectedClientId(client._id);
  };

  const handleDeleteClient = async (clientId, event) => {
    event.stopPropagation();
    try {
      await axios.put(`http://localhost:5001/api/clients/${clientId}/deactivate`);
      setClients((prev) => prev.filter((client) => client._id !== clientId));
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const filteredClients = clients.filter((client) =>
    client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client._id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="client-step">
      {showForm && (
        <div className="overlay">
          <div className="popup-form">
            <form className="form-group" onSubmit={handleCreateClient} autoComplete="off">
              <h3>Create New Client</h3>
              <div className="form-row">
                <label>
                  First Name:
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </label>
                <label>
                  Last Name:
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </label>
              </div>
              <label>
                Street Address:
                <input type="text" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} required />
              </label>
              <div className="form-row">
                <label>
                  City:
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required />
                </label>
                <label>
                  State:
                  <input type="text" value={state} onChange={(e) => setState(e.target.value)} required />
                </label>
              </div>
              <label>
                Email:
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
              <div className="form-row-three-item">
                <label>
                  Phone:
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </label>
                <label>
                  Gender:
                  <input type="text" value={gender} onChange={(e) => setGender(e.target.value)} required />
                </label>
                <label>
                  Birthday:
                  <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} required />
                </label>
              </div>
              <div className="button-container">
                <button onClick={() => setShowForm(false)} className="btn close-btn">Close</button>
                <button type="submit" className="btn primary-btn">Create Client</button>
              </div>
            </form>
            {message && <p>{message}</p>}
          </div>
        </div>
      )}
      <div className={`content-container ${showForm ? 'blur-background' : ''}`}>
        <div className="header-container">
          <h2>Select or Create Client</h2>
          <div className="right-button-container">
            <input
              type="text"
              placeholder="Search..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button onClick={() => setShowForm(true)} className="btn create-btn">Create New</button>
          </div>
        </div>
        <table className="client-table">
          <thead>
            <tr>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Email</th>
              <th>Client ID</th>
              <th className="action-column">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => (
              <tr
                key={client._id}
                className={selectedClientId === client._id ? 'selected' : ''}
                onClick={() => handleSelectClient(client)}
              >
                <td>{client.firstName}</td>
                <td>{client.lastName}</td>
                <td>{client.email}</td>
                <td>{client._id}</td>
                <td className="action-column">
                  <span
                    role="img"
                    aria-label="delete"
                    className="trash-icon"
                    onClick={(event) => handleDeleteClient(client._id, event)}
                  >
                    🗑️
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="right-button-container">
          <button className="btn create-btn" onClick={onPrevious}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientStep;
