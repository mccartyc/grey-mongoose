import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClientStep = ({ onPrevious, selectedTenant, selectedUser }) => {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/clients');
        setClients(response.data);
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };

    fetchClients();
  }, []);

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/api/clients', { name });
      setMessage(`Client created: ${response.data.name}`);
      setClients((prev) => [...prev, response.data]);
      setName('');
      setShowForm(false); // Close the form after creation
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to create client');
    }
  };

  const handleSelectClient = (client) => {
    setSelectedClientId(client._id);
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="client-step">
      {showForm && (
        <div className="overlay">
          <div className="popup-form">
            <form className="form-group" onSubmit={handleCreateClient}>
              <h3>Create New Client</h3>
              <label>
                Client Name:
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
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
              <th>Client Name</th>
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
                <td>{client.name}</td>
                <td>{client._id}</td>
                <td className="action-column">
                  <span
                    role="img"
                    aria-label="delete"
                    className="trash-icon"
                    onClick={() => console.log('Delete client:', client._id)} // Add delete functionality as needed
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
