import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus } from 'react-icons/fa';

const ClientPage = () => {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false); // State for showing/hiding the form

  // Form state variables
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

  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !phone || !streetAddress || !city || !state || !zipcode) {
      setMessage('All fields are required.');
      return;
    }

    const tenantId = "ed2c3dad-153b-46e7-b480-c70b867d8aa9"; // Adjust as necessary
    const userId = "4e0bf9c5-cc78-4028-89e5-02d6003f4cdc"; // Adjust as necessary

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
        tenantId,
        userId,
      });
      setMessage(`Client created: ${response.data.firstName} ${response.data.lastName}`);
      setClients((prev) => [...prev, response.data]);
      resetFormFields();
      setShowForm(false); // Hide the form after creation
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

  const filteredClients = clients.filter((client) =>
    client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="client-page">
      <div className="content-container">
        <div className="header-container">
          <div>
            <button onClick={() => setShowForm(true)} className="btn create-btn">New Client</button>
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {message && <p className="error-message">{message}</p>}

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
                    <select className="option" value={gender} onChange={(e) => setGender(e.target.value)} required>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>
                  <label>
                    Birthday:
                    <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} autoComplete="off" required />
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
                    aria-label="New Session"
                    className="new-session"
                    // onClick={(event) => handleNewSessionClient(client._id, event)}
                  >
                    <FaPlus/>
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