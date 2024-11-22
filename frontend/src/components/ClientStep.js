import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClientStep = ({ onPrevious, selectedTenant, selectedUser }) => {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

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
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to create client');
    }
  };

  const handleSelectClient = (client) => {
    setSelectedClientId(client._id);
  };

  return (
    <div>
      <h2>Select or Create Client</h2>
      <form onSubmit={handleCreateClient}>
        <label>
          Client Name:
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <button type="submit">Create Client</button>
      </form>
      {message && <p>{message}</p>}
      <h3>Existing Clients</h3>
      <ul>
        {clients.map((client) => (
          <li key={client._id}>
            <button onClick={() => handleSelectClient(client)}>{client.name}</button>
          </li>
        ))}
      </ul>
      <button onClick={onPrevious}>Back</button>
    </div>
  );
};

export default ClientStep;
