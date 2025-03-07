import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext'; // Import AuthContext


const UserStep = ({ selectedTenant, onNext, onPrevious, onSelectUser }) => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [firstname, setFirstName] = useState('');
  const [lastname, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('User'); // Default role
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false); // State for delete confirmation modal
  const [userToDelete, setUserToDelete] = useState(null); // Track tenant to delete


  const { user, userInfo } = useAuth(); // Access the current user from AuthContext

  const fetchInProgress = useRef(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!selectedTenant?._id || !user?.token) return;
      
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/users?tenantId=${selectedTenant._id}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          });
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [selectedTenant?._id, user?.token]);

  const handleCreateUser = async (e) => {
    e.preventDefault();

    // Check if selectedTenant is defined before proceeding
    if (!selectedTenant || !selectedTenant._id) {
      setMessage('Error: Tenant not selected or tenant ID not available.');
      return;
    }
    const { token } = user; // Get tenantId and userId from user context
    try {
      console.log("Creating user with details:", { firstname, lastname, email, password, role, tenantId: selectedTenant._id });
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/users`, {
        firstname,
        lastname,
        email,
        password,
        role,
        tenantId: selectedTenant._id,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("User created successfully:", response.data);
      setMessage(`User created: ${response.data.name}`);
      setUsers((prev) => [...prev, response.data]);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setRole('User');
      setShowForm(false); // Close the form after creation
    } catch (error) {
      console.error("Error creating user:", error.response?.data || error);
      setMessage(error.response?.data?.error || 'Failed to create user');
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUserId(user._id);
    console.log('Selected User:', user); // Debug log
    onSelectUser(user);
  };

  const handleEditUser = (user) => {
    setSelectedUserId(user._id);
    setFirstName(user.firstname); // Populate the form with the selected user's name
    setLastName(user.lastname); // Populate the form with the selected user's name
    setEmail(user.email);
    setPassword(user.password);
    setRole(user.role);
    setMessage(false);
    setShowForm(true); // Show the form for editing
  };

  const handleDeleteClick = (user, event) => {
    event.stopPropagation(); // Prevent row selection
    setUserToDelete(user._id); // Set tenant to delete
    setShowDeleteModal(true); // Show confirmation modal
  };

  const handleDeleteUser = async () => {
    // event.stopPropagation(); // Prevent row selection when clicking delete
    const { token } = user; // Get tenantId and userId from user context
    try {
      await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/users/${userToDelete}/deactivate`,
      {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      setUsers((prev) => prev.filter((user) => user._id !== userToDelete));
      setShowDeleteModal(false); // Close modal after successful delete
      setUserToDelete(null); // Reset tenant to delete
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString(); // Format the date to the user's local time
  };

  const filteredUsers = users.filter((user) =>
    user.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatTimestamp(user.createdAt).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNextStep = () => { 
    console.log('Selected User ID:', selectedUserId); 
    onNext(selectedUserId); 
  };

  // Determine available roles based on current user's role
  const getAvailableRoles = () => {
    if (userInfo?.role === 'Internal') {
      return ['Internal', 'Admin', 'User'];
    } else if (userInfo?.role === 'Admin') {
      return ['Admin', 'User'];
    } else {
      return ['User'];
    }
  };

  const availableRoles = getAvailableRoles();

  return (
    <div className="user-step">

      {showForm && (
        <div className="overlay">
          <div className="popup-form">
            <form className="form-group" onSubmit={handleCreateUser} autocomplete="off">
              <h3>Create New User</h3>
              <label>
                First Name:
                <input type="text" value={firstname} onChange={(e) => setFirstName(e.target.value)} required />
              </label>
              <label>
                Last Name:
                <input type="text" value={lastname} onChange={(e) => setLastName(e.target.value)} required />
              </label>
              <label>
                Email:
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
              <label>
                Password:
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </label>
              <label>
                Role:
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)} 
                  required
                >
                  {availableRoles.map(roleOption => (
                    <option key={roleOption} value={roleOption}>{roleOption}</option>
                  ))}
                </select>
              </label>
              <div className="button-container">
                <button onClick={() => setShowForm(false)} className="btn close-btn">Close</button>
                <button type="submit" className="btn primary-btn">Create User</button>
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
              Are you sure you want to delete this user?
            </p>
            <p>
             This action is{' '}
              <strong>irreversible</strong>.
            </p>
            <div className="button-container">
              <button
                type= "button"
                onClick={() => setShowDeleteModal(false)}
                className="btn close-btn"
              >
                Cancel
              </button>
              <button type="submit" onClick={handleDeleteUser} className="btn primary-btn">
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`content-container ${showForm ? 'blur-background' : ''}`}>
        <div className="header-container">
          <h2 className="section-heading">Select or Create User</h2>
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
        <table className="tenant-table">
          <thead>
            <tr>
              <th>First Name</th>
              <th>Last Name</th>
              <th>User ID</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created Timestamp</th>
              <th className="action-column">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr
                key={user._id}
                className={selectedUserId === user._id ? 'selected' : ''}
                onClick={() => handleSelectUser(user)}
                onDoubleClick={() => {
                  handleSelectUser(user);  // Select the tenant
                  handleNextStep(); // Immediately move to next step
                }}
              >
                <td>{user.firstname}</td>
                <td>{user.lastname}</td>
                <td>{user._id}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{formatTimestamp(user.createdAt)}</td>
                <td className="action-column">
                <span
                    role="img"
                    aria-label="edit"
                    className="edit-icon"
                    onClick={(event) => {
                      event.stopPropagation(); // Prevent row selection when clicking edit icon
                      handleEditUser(user); // Open form to edit tenant
                    }}
                    style={{ cursor: 'pointer', marginRight: '10px' }}
                  >
                    ✏️
                  </span>
                  <span
                    role="img"
                    aria-label="delete"
                    className="trash-icon"
                    onClick={(event) => handleDeleteClick(user._id, event)}
                  >
                    🗑️
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="right-button-container">
          <button className="btn primary-btn" onClick={onPrevious}>
            Previous
          </button>
          <button className="btn primary-btn" onClick={handleNextStep} disabled={!selectedUserId}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserStep;
