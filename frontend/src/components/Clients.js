import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiBaseUrl, createApiInstance } from '../utils/apiConfig';
// import { FaPlus } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext'; // Import AuthContext
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { useNotification } from '../context/NotificationContext'; // Import NotificationContext

const ClientPage = () => {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false); // State for showing/hiding the form
  const [showDeleteModal, setShowDeleteModal] = useState(false); // State for delete confirmation modal
  const [clientToDelete, setClientToDelete] = useState(null); // Track tenant to delete

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
  const [isLoading, setIsLoading] = useState(true); // Loading state for the spinner
  
  // US States array for dropdown
  const usStates = [
    { name: "Alabama", abbreviation: "AL" },
    { name: "Alaska", abbreviation: "AK" },
    { name: "Arizona", abbreviation: "AZ" },
    { name: "Arkansas", abbreviation: "AR" },
    { name: "California", abbreviation: "CA" },
    { name: "Colorado", abbreviation: "CO" },
    { name: "Connecticut", abbreviation: "CT" },
    { name: "Delaware", abbreviation: "DE" },
    { name: "Florida", abbreviation: "FL" },
    { name: "Georgia", abbreviation: "GA" },
    { name: "Hawaii", abbreviation: "HI" },
    { name: "Idaho", abbreviation: "ID" },
    { name: "Illinois", abbreviation: "IL" },
    { name: "Indiana", abbreviation: "IN" },
    { name: "Iowa", abbreviation: "IA" },
    { name: "Kansas", abbreviation: "KS" },
    { name: "Kentucky", abbreviation: "KY" },
    { name: "Louisiana", abbreviation: "LA" },
    { name: "Maine", abbreviation: "ME" },
    { name: "Maryland", abbreviation: "MD" },
    { name: "Massachusetts", abbreviation: "MA" },
    { name: "Michigan", abbreviation: "MI" },
    { name: "Minnesota", abbreviation: "MN" },
    { name: "Mississippi", abbreviation: "MS" },
    { name: "Missouri", abbreviation: "MO" },
    { name: "Montana", abbreviation: "MT" },
    { name: "Nebraska", abbreviation: "NE" },
    { name: "Nevada", abbreviation: "NV" },
    { name: "New Hampshire", abbreviation: "NH" },
    { name: "New Jersey", abbreviation: "NJ" },
    { name: "New Mexico", abbreviation: "NM" },
    { name: "New York", abbreviation: "NY" },
    { name: "North Carolina", abbreviation: "NC" },
    { name: "North Dakota", abbreviation: "ND" },
    { name: "Ohio", abbreviation: "OH" },
    { name: "Oklahoma", abbreviation: "OK" },
    { name: "Oregon", abbreviation: "OR" },
    { name: "Pennsylvania", abbreviation: "PA" },
    { name: "Rhode Island", abbreviation: "RI" },
    { name: "South Carolina", abbreviation: "SC" },
    { name: "South Dakota", abbreviation: "SD" },
    { name: "Tennessee", abbreviation: "TN" },
    { name: "Texas", abbreviation: "TX" },
    { name: "Utah", abbreviation: "UT" },
    { name: "Vermont", abbreviation: "VT" },
    { name: "Virginia", abbreviation: "VA" },
    { name: "Washington", abbreviation: "WA" },
    { name: "West Virginia", abbreviation: "WV" },
    { name: "Wisconsin", abbreviation: "WI" },
    { name: "Wyoming", abbreviation: "WY" }
  ];
  
  // Validation state variables
  const [errors, setErrors] = useState({
    email: '',
    phone: '',
    city: '',
    state: '',
    zipcode: ''
  });

  const { user } = useAuth(); // Access the current user from AuthContext
  const navigate = useNavigate(); // Use navigate hook
  const { showNotification } = useNotification(); // Use notification context

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };
  

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

  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const phoneNumber = value.replace(/\D/g, '');
    
    // Format as ###-###-####
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    } else {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
    if (!phoneRegex.test(phone)) {
      return 'Phone must be in format: ###-###-####';
    }
    return '';
  };

  const validateCity = (city) => {
    if (city.trim().length < 2) {
      return 'City name must be at least 2 characters';
    }
    // Only allow letters, spaces, and hyphens
    const cityRegex = /^[a-zA-Z\s-]+$/;
    if (!cityRegex.test(city)) {
      return 'City should only contain letters, spaces, and hyphens';
    }
    return '';
  };

  const validateState = (state) => {
    if (!state) {
      return 'Please select a state';
    }
    return '';
  };

  const validateZipcode = (zipcode) => {
    // US zipcode validation (5 digits or 5+4)
    const zipcodeRegex = /^\d{5}(-\d{4})?$/;
    if (!zipcodeRegex.test(zipcode)) {
      return 'Zipcode must be 5 digits or 5+4 format (e.g., 12345 or 12345-6789)';
    }
    return '';
  };

  const handlePhoneChange = (e) => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    setPhone(formattedPhone);
    setErrors({...errors, phone: validatePhone(formattedPhone)});
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setErrors({...errors, email: validateEmail(e.target.value)});
  };

  const handleCityChange = (e) => {
    setCity(e.target.value);
    setErrors({...errors, city: validateCity(e.target.value)});
  };

  const handleStateChange = (e) => {
    const stateValue = e.target.value;
    setState(stateValue);
    setErrors({...errors, state: validateState(stateValue)});
  };

  const handleZipcodeChange = (e) => {
    setZipcode(e.target.value);
    setErrors({...errors, zipcode: validateZipcode(e.target.value)});
  };

  const [isEditMode, setIsEditMode] = useState(false);

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
    setErrors({
      email: '',
      phone: '',
      city: '',
      state: '',
      zipcode: ''
    });
    setIsEditMode(false);
    setSelectedClientId(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?.tenantId || !user?.userId || !user?.token) {
      showNotification('Error: Authentication required', 'error');
      return;
    }
    
    const { tenantId, userId, token } = user;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showNotification('Error: Please enter a valid email address', 'error');
      return;
    }
    
    // Format phone number for consistency (remove any formatting)
    const formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.length < 10) {
      showNotification('Error: Please enter a valid phone number (at least 10 digits)', 'error');
      return;
    }
    
    try {
      let response;
      
      // Prepare client data with formatted values
      const clientData = {
        firstName,
        lastName,
        birthday,
        gender,
        email: email.trim(),
        phone: formattedPhone,
        streetAddress,
        city,
        state,
        zipcode,
        tenantId,
        userId,
      };
      
      console.log('Submitting client data:', clientData);
      
      if (isEditMode && selectedClientId) {
        // Update existing client
        response = await axios.put(`http://localhost:5001/api/clients/${selectedClientId}`, 
          clientData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          }
        );
        
        showNotification(`Client updated: ${response.data.firstName} ${response.data.lastName}`, 'success');
        
        setClients((prev) => 
          prev.map((client) => 
            client._id === selectedClientId 
              ? { ...response.data, phone: formatPhoneForDisplay(response.data.phone) } 
              : client
          )
        );
      } else {
        // Create new client
        response = await axios.post('/api/clients', 
          clientData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          }
        );
        
        showNotification(`Client created: ${response.data.firstName} ${response.data.lastName}`, 'success');
        
        // Format the phone number in the response data before adding to clients array
        const formattedClient = {
          ...response.data,
          phone: formatPhoneForDisplay(response.data.phone)
        };
        
        setClients((prev) => [...prev, formattedClient]);
      }
      
      resetFormFields();
      setShowForm(false); // Hide the form after creation/update
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} client:`, error);
      showNotification(error.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} client`, 'error');
    }
  };

  useEffect(() => {
    const fetchClients = async () => {
      if (!user?.tenantId || !user?.userId || !user?.token) {
        console.error('User is not logged in or data is missing.');
        return;
      }

      const { tenantId, userId, token } = user;

      try {
        setIsLoading(true);
        const apiInstance = createApiInstance(token);
        const response = await apiInstance.get(
          `/api/clients?tenantId=${tenantId}&userId=${userId}`
        );
        // Backend will return decrypted contact information
        setClients(response.data);
      } catch (error) {
        console.error('Error fetching clients:', error);
        showNotification('Failed to load clients.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, [user?.token, showNotification]); // Only re-run when user token changes

  const handleRowDoubleClick = (clientId, firstName, lastName) => {
    console.log('Double Click Client:', clientId, firstName, lastName);
    navigate(`/clients/${clientId}/overview`); // Navigate to client detail page
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
    
    setIsEditMode(true);
    setShowForm(true); // Show the form for editing
  };

  const handleDeleteClick = (client, event) => {
    event.stopPropagation(); // Prevent row selection
    setClientToDelete(client); // Store the entire client object instead of just the ID
    setShowDeleteModal(true); // Show confirmation modal
  };

  const handleDeleteClient = async () => {

    const { tenantId, token } = user;

    if (!clientToDelete || !clientToDelete._id) {
      console.error('No client selected for deletion');
      return;
    }

    try {
      console.log('Attempting to delete client:', {
        clientId: clientToDelete._id,
        tenantId: tenantId,
        client: clientToDelete
      });
      
      const response = await axios.put(
        `http://localhost:5001/api/clients/${clientToDelete._id}/deactivate`,
        {
          tenantId: tenantId,
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
    } catch (error) {
      console.error('Error deleting client:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete client';
      showNotification(errorMessage, 'error');
      
      if (error.response?.data?.details) {
        console.error('Error details:', error.response.data.details);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const formatPhoneForDisplay = (phone) => {
    if (!phone) return '';
    // Remove any existing formatting
    const digits = phone.replace(/\D/g, '');
    // Apply ###-###-#### format
    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
    return phone; // Return original if not 10 digits
  };

  const filteredClients = clients.filter((client) =>
    client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="client-page">
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

      <div className="sessions-section">
        <div className="content-container">
          <div className="header-container">
            <div>
              <button onClick={() => setShowForm(true)} className="btn primary-btn">New Client</button>
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {showForm && (
            <div className="overlay">
              <div className="popup-form">
                <form className="form-group" onSubmit={handleFormSubmit} 
                  autoComplete="off" 
                  autoCorrect="off" 
                  spellCheck="false">
                  <h3>{isEditMode ? 'Edit Client' : 'Create New Client'}</h3>
                  <div className="form-row">
                    <label>
                      First Name:
                      <input 
                        type="text" 
                        value={firstName} 
                        onChange={(e) => setFirstName(e.target.value)} 
                        autoComplete="new-password" 
                        required 
                      />
                    </label>
                    <label>
                      Last Name:
                      <input 
                        type="text" 
                        value={lastName} 
                        onChange={(e) => setLastName(e.target.value)} 
                        autoComplete="new-password" 
                        required 
                      />
                    </label>
                  </div>
                  <label>
                    Street Address:
                    <input 
                      type="text" 
                      value={streetAddress} 
                      onChange={(e) => setStreetAddress(e.target.value)} 
                      autoComplete="new-password" 
                      required 
                    />
                  </label>
                  <div className="form-row-three-item">
                    <label>
                      City:
                      <input 
                        type="text" 
                        value={city} 
                        onChange={handleCityChange} 
                        autoComplete="new-password" 
                        required 
                        className={errors.city ? "error-input" : ""}
                        title={errors.city || ""}
                      />
                    </label>
                    <label>
                      State:
                      <select 
                        value={state} 
                        onChange={handleStateChange} 
                        required 
                        className={errors.state ? "error-input" : ""}
                        title={errors.state || ""}
                      >
                        <option value="">Select State</option>
                        {usStates.map((state) => (
                          <option key={state.abbreviation} value={state.abbreviation}>{state.name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Zip Code:
                      <input 
                        type="text" 
                        value={zipcode} 
                        onChange={handleZipcodeChange} 
                        autoComplete="new-password" 
                        required 
                        className={errors.zipcode ? "error-input" : ""}
                        title={errors.zipcode || ""}
                      />
                    </label>
                  </div>
                  <label>
                    Email:
                    <input 
                      type="email" 
                      value={email} 
                      onChange={handleEmailChange} 
                      autoComplete="new-password" 
                      required 
                      className={errors.email ? "error-input" : ""}
                      title={errors.email || ""}
                    />
                  </label>
                  <div className="form-row-three-item">
                    <label>
                      Phone:
                      <input 
                        type="tel" 
                        value={phone} 
                        onChange={handlePhoneChange} 
                        autoComplete="new-password" 
                        placeholder="###-###-####"
                        required 
                        className={errors.phone ? "error-input" : ""}
                        title={errors.phone || ""}
                      />
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
                      <input 
                        type="date" 
                        value={birthday} 
                        onChange={(e) => setBirthday(e.target.value)} 
                        autoComplete="new-password" 
                        required 
                      />
                    </label>
                  </div>
                  <div className="button-container">
                    <button onClick={() => {
                      setShowForm(false);
                      resetFormFields();
                    }} className="btn secondary-btn">Close</button>
                    <button type="submit" className="btn primary-btn">
                      {isEditMode ? 'Update Client' : 'Create Client'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

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
              {filteredClients.map((client) => (
                <tr
                  key={client._id}
                  className={selectedClientId === client._id ? 'selected' : ''}
                  onClick={() => handleSelectClient(client)}
                  onDoubleClick={() => handleRowDoubleClick(client._id, client.firstName, client.lastName)} // Handle double-click
                >
                  <td>{client.firstName}</td>
                  <td>{client.lastName}</td>
                  <td>{calculateAge(client.birthday)}</td>
                  <td>{client.gender}</td>
                  <td>{client.email}</td>
                  <td>{formatPhoneForDisplay(client.phone)}</td>
                  <td>{client.streetAddress} {client.city}, {client.state} {client.zipcode}</td>
                  <td>{client._id}</td>
                  <td className="action-column">
                  <span
                      role="img"
                      aria-label="edit"
                      className="edit-icon"
                      onClick={(event) => {
                        event.stopPropagation(); // Prevent row selection when clicking edit icon
                        handleEditClient(client); // Open form to edit tenant
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientPage;