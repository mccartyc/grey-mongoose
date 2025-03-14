import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { createApiInstance } from '../../utils/apiConfig';
import { useAuth } from '../../context/AuthContext'; // Import AuthContext
import { useNotification } from '../../context/NotificationContext'; // Import NotificationContext


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
  const [showDeleteModal, setShowDeleteModal] = useState(false); // State for delete confirmation modal
  const [clientToDelete, setClientToDelete] = useState(null); // Track tenant to delete


  const { user } = useAuth(); // Access the current user from AuthContext
  const { showNotification } = useNotification(); // Use notification context
  // const { tenantId, userId, token } = user; // Get tenantId and userId from user context

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

  const fetchClients = useCallback(async () => {
    if (selectedTenant && selectedUser) {
      console.log(selectedTenant,selectedUser );
      const { token } = user; // Get tenantId and userId from user context
      try {
        const response = await axios.get(
          `/api/clients?tenantId=${selectedTenant._id}&userId=${selectedUser._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        // Backend will return decrypted contact information
        setClients(response.data);
      } catch (error) {
        console.error('Error fetching clients:', error);
        setMessage('Failed to fetch clients');
      }
    }
  }, [selectedTenant, selectedUser, user]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);


  /*Create a new client*/
  const handleCreateClient = async (e) => {
    e.preventDefault();
    
    if (!selectedTenant || !selectedUser) {
      showNotification('Error: Tenant and user must be selected.', 'error');
      return;
    }

    const { token } = user; // Get tenantId and userId from user context

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showNotification('Error: Please enter a valid email address.', 'error');
      return;
    }

    // Format phone number for consistency (remove any formatting)
    const formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.length < 10) {
      showNotification('Error: Please enter a valid phone number.', 'error');
      return;
    }
    
    // Validate birthday format
    if (!birthday) {
      showNotification('Error: Please enter a valid birth date.', 'error');
      return;
    }
    
    try {
      // Format the birthday as a proper ISO string
      const birthdayDate = new Date(birthday);
      if (isNaN(birthdayDate.getTime())) {
        showNotification('Error: Invalid birth date format.', 'error');
        return;
      }
      
      // Format as YYYY-MM-DD
      const formattedBirthday = birthdayDate.toISOString().split('T')[0];
      console.log("Formatted birthday:", formattedBirthday);
      
      const clientData = {
        firstName,
        lastName,
        birthday: formattedBirthday,
        gender,
        email: email.trim(), // Trim any whitespace
        phone: formattedPhone, // Use the cleaned phone number
        streetAddress,
        city,
        state,
        zipcode,
        tenantId: selectedTenant._id,
        userId: selectedUser._id,
      };

      console.log('Sending client data:', clientData);

      try {
        const response = await axios.post(`/api/clients`, 
          clientData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          }
        );
        showNotification(`Client created: ${response.data.firstName} ${response.data.lastName}`, 'success');
        setClients((prev) => [...prev, response.data]);
        setShowForm(false);
        resetFormFields();
      } catch (error) {
        console.error('Error creating client:', error);
        const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Failed to create client';
        showNotification(`Error: ${errorMessage}`, 'error');
      }
    } catch (error) {
      console.error('Error formatting birthday:', error);
      showNotification('Error: Invalid birth date format.', 'error');
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

  const handleEditClient = (client) => {
    setSelectedClientId(client._id);
    setFirstName(client.firstName); // Populate the form with the selected tenant's name
    setLastName(client.lastName); // Populate the form with the selected tenant's name
    setGender(client.gender);
    setEmail(client.email);
    setPhone(client.phone);
    setStreetAddress(client.streetAddress);
    setCity(client.city);
    setState(client.state);
    setZipcode(client.zipcode);
    
    // Format the birthday to YYYY-MM-DD for the date input
    if (client.birthday) {
      const date = new Date(client.birthday);
      const formattedDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      setBirthday(formattedDate);
    } else {
      setBirthday('');
    }
    
    setMessage(false);
    setShowForm(true); // Show the form for editing
  };

  const handleDeleteClick = (client, event) => {
    event.stopPropagation(); // Prevent row selection
    setClientToDelete(client); // Store the entire client object instead of just the ID
    setShowDeleteModal(true); // Show confirmation modal
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete || !clientToDelete._id) {
      console.error('No client selected for deletion');
      return;
    }

    if (!selectedTenant || !selectedTenant._id) {
      console.error('No tenant selected');
      showNotification('Error: No tenant selected', 'error');
      return;
    }

    const { token } = user;

    try {
      console.log('Attempting to delete client:', {
        clientId: clientToDelete._id,
        tenantId: selectedTenant._id,
        client: clientToDelete
      });
      
      const response = await axios.put(
        `/api/clients/${clientToDelete._id}/deactivate`,
        {
          tenantId: selectedTenant._id,
          reason: 'User requested deletion'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      console.log('Deactivation response:', response.data);
      
      setClients((prev) => prev.filter((client) => client._id !== clientToDelete._id));
      setShowDeleteModal(false);
      setClientToDelete(null);
      showNotification('Client successfully deactivated', 'success');
      await fetchClients(); // Refresh the client list
    } catch (error) {
      console.error('Error deleting client:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Failed to delete client';
      showNotification(errorMessage, 'error');
      
      if (error.response?.data?.details) {
        console.error('Error details:', error.response.data.details);
      }
    }
  };

  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format if the length is appropriate
    if (digits.length < 4) return digits;  // 123
    if (digits.length < 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`; // 123-456
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`; // 123-456-7890
  };

  const handlePhoneChange = (e) => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    setPhone(formattedPhone);
  };

  const handleZipCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // This will remove non-digit characters
    if (value.length <= 5) {
      setZipcode(value); // Update only if it's 5 digits or less
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
                  <input type="text" value={zipcode} onChange={handleZipCodeChange} autoComplete="off" required />
                </label>
              </div>
              <label>
                Email:
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="new-email" required />
              </label>
              <div className="form-row-three-item">
                <label>
                  Phone:
                  <input type="tel" value={phone} onChange={handlePhoneChange} autoComplete="off" required />
                </label>
                <label>
                  Gender:
                  <select className="option" value={gender} onChange={(e) => setGender(e.target.value)} required>
                    <option value="">Select Gender</option> {/* Placeholder option */}
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
                <button onClick={handleCloseForm} className="btn secondary-btn">Close</button>
                <button type="submit" className="btn primary-btn">Create Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="overlay">
          <div className="cofirm-modal-content">
            <h2>Confirm Deletion</h2>
            <p>
              Are you sure you want to delete this client?
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
              <button type="submit" onClick={handleDeleteClient} className="btn primary-btn">
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`content-container ${showForm ? 'blur-background' : ''}`}>
        <div className="header-container">
          <h2 className="section-heading">Select or Create Client</h2>
          <div className="right-button-container">
            <input
              type="text"
              placeholder="Search..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button onClick={() => setShowForm(true)} className="btn primary-btn">Create New</button>
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
              <th>Client Id</th>
              <th className="action-column">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => {
              const fullAddress = `${client.streetAddress} ${client.city}, ${client.state} ${client.zipcode}`;
              return (
                <tr
                  key={client._id}
                  className={selectedClientId === client._id ? 'selected' : ''}
                  onClick={() => handleSelectClient(client)}
                >
                  <td title={client.firstName}>{client.firstName}</td>
                  <td title={client.lastName}>{client.lastName}</td>
                  <td>{calculateAge(client.birthday)}</td>
                  <td>{client.gender}</td>
                  <td title={client.email}>{client.email}</td>
                  <td title={client.phone}>{client.phone}</td>
                  <td title={fullAddress}>{fullAddress}</td>
                  <td title={client._id}>{client._id}</td>
                  <td className="action-column">
                    <span
                      role="img"
                      aria-label="edit"
                      className="edit-icon"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleEditClient(client);
                      }}
                      style={{ cursor: 'pointer', marginRight: '10px' }}
                    >
                      ✏️
                    </span>
                    <span
                      role="img"
                      aria-label="delete"
                      className="trash-icon"
                      onClick={(event) => handleDeleteClick(client, event)}
                    >
                      🗑️
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="right-button-container">
          <button className="btn secondary-btn" onClick={onPrevious}>
            Previous
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientStep;
