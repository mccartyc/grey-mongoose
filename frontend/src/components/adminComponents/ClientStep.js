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
  const [zipcode, setZipcode] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const calculateAge = (birthday) => {
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Check if the birthday has occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
  };

  useEffect(() => {
    console.log("Selected Tenant:", selectedTenant);
    console.log("Selected User:", selectedUser);

    if (selectedTenant && selectedUser) {
      const fetchClients = async () => {
        try {
          console.log("Tenant ID:", selectedTenant._id);
          console.log("User ID:", selectedUser._id);
          const response = await axios.get(`http://localhost:5001/api/clients?tenantId=${selectedTenant._id}&userId=${selectedUser._id}`);
          setClients(response.data);
        } catch (error) {
          console.error('Error fetching clients:', error);
        }
      };
  
      fetchClients();
    }
  }, [selectedTenant, selectedUser]);

  const handleCreateClient = async (e) => {
    e.preventDefault();

    console.log('selectedUser:', selectedUser); // Debug log

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
        zipcode,
        tenantId: selectedTenant._id,
        userId: selectedUser._id,
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
    setZipcode('');
  };

  const handleCloseForm = () => {
    resetFormFields(); // Clear all form fields
    setShowForm(false); // Hide the form
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
    client.clientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="client-step">
      {showForm && (
        <div className="overlay">
          <div className="popup-form">
            <form className="form-group" onSubmit={handleCreateClient} autoComplete="nope">
              <h3>Create New Client</h3>
              <div className="form-row">
                <label>
                  First Name:
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="off" required />
                </label>
                <label>
                  Last Name:
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="off" required />
                </label>
              </div>
              <label>
                Street Address:
                <input type="text" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} autoComplete="off" required />
              </label>
              <div className="form-row-three-item">
                <label>
                  City:
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="off" required />
                </label>
                <label>
                  State:
                  <input type="text" value={state} onChange={(e) => setState(e.target.value)} autoComplete="off" required />
                </label>
                <label>
                  Zip Code:
                  <input type="text" value={zipcode} onChange={(e) => setZipcode(e.target.value)} autoComplete="off" required />
                </label>
              </div>
              <label>
                Email:
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="new-email" required />
              </label>
              <div className="form-row-three-item">
                <label>
                  Phone:
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="off" required />
                </label>
                <label>
                  Gender:
                  <input type="text" value={gender} onChange={(e) => setGender(e.target.value)} autoComplete="off" required />
                </label>
                <label>
                  Birthday:
                  <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} autoComplete="off" required />
                </label>
              </div>
              <div className="button-container">
                <button onClick={handleCloseForm} className="btn close-btn">Close</button>
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
              <th>Age</th>
              <th>Gender</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Street Address</th>
              <th>City</th>
              <th>State</th>
              <th>Zip Code</th>
              <th>Client Id</th>
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
                <td>{calculateAge(client.birthday)}</td>
                <td>{client.gender}</td>
                <td>{client.email}</td>
                <td>{client.phone}</td>
                <td>{client.streetAddress}</td>
                <td>{client.city}</td>
                <td>{client.state}</td>
                <td>{client.zipcode}</td>
                <td>{client.clientId}</td>
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
