import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClientPage = () => {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');


  useEffect(() => {
    const fetchClients = async () => {

        const tenantId = "ed2c3dad-153b-46e7-b480-c70b867d8aa9";
        const userId = "4e0bf9c5-cc78-4028-89e5-02d6003f4cdc";
        console.log("Selected Tenant:", tenantId);
        console.log("Selected User:", userId);

      try {
        const response = await axios.get(`http://localhost:5001/api/clients?tenantId=${tenantId}&userId=${userId}`);
        setClients(response.data);
      } catch (error) {
        console.error('Error fetching clients:', error);
        setMessage('Failed to load clients.');
      }
    };

    fetchClients();
  }, []);

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
      setMessage('Failed to delete client.');
    }
  };

  const filteredClients = clients.filter((client) =>
    client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="client-page">
      <div className="content-container">
        <div className="header-container">
          <div> </div>
          <input
            type="text"
            placeholder="Search..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {message && <p className="error-message">{message}</p>}
        <table className="client-table">
          <thead>
            <tr>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>City</th>
              <th>State</th>
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
                <td>{client.phone}</td>
                <td>{client.city}</td>
                <td>{client.state}</td>
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
      </div>
    </div>
  );
};

export default ClientPage;
