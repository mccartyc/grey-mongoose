import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserStep = ({ selectedTenant, onNext, onPrevious, onSelectUser }) => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('therapist'); // Default role
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (selectedTenant) {
      console.log("Selected Tenant in UserStep:", selectedTenant); // Debug log
      const fetchUsers = async () => {
        try {
          const response = await axios.get(`http://localhost:5001/api/users?tenantId=${selectedTenant._id}`);
          setUsers(response.data);
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      };

      fetchUsers();
    }
  }, [selectedTenant]);

  const handleCreateUser = async (e) => {
    e.preventDefault();

    // Check if selectedTenant is defined before proceeding
    if (!selectedTenant || !selectedTenant._id) {
      setMessage('Error: Tenant not selected or tenant ID not available.');
      return;
    }

    try {
      console.log("Creating user with details:", { name, email, password, role, tenantId: selectedTenant._id });
      const response = await axios.post('http://localhost:5001/api/users', {
        name,
        email,
        password,
        role,
        tenantId: selectedTenant._id,
      });
      console.log("User created successfully:", response.data);
      setMessage(`User created: ${response.data.name}`);
      setUsers((prev) => [...prev, response.data]);
      setName('');
      setEmail('');
      setPassword('');
      setRole('therapist');
      setShowForm(false); // Close the form after creation
    } catch (error) {
      console.error("Error creating user:", error.response?.data || error);
      setMessage(error.response?.data?.error || 'Failed to create user');
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUserId(user.userId);
    onSelectUser(user);
  };

  const handleDeleteUser = async (userId, event) => {
    event.stopPropagation(); // Prevent row selection when clicking delete
    try {
      await axios.delete(`http://localhost:5001/api/users/${userId}`);
      setUsers((prev) => prev.filter((user) => user.userId !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString(); // Format the date to the user's local time
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatTimestamp(user.createdAt).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="user-step">
      {showForm && (
        <div className="overlay">
          <div className="popup-form">
            <form className="form-group" onSubmit={handleCreateUser}>
              <h3>Create New User</h3>
              <label>
                Name:
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
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
                <select value={role} onChange={(e) => setRole(e.target.value)} required>
                  <option value="admin">Admin</option>
                  <option value="therapist">Therapist</option>
                  <option value="client">Client</option>
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
      <div className={`content-container ${showForm ? 'blur-background' : ''}`}>
        <div className="header-container">
          <h2>Select or Create User</h2>
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
        <table className="tenant-table">
          <thead>
            <tr>
              <th>User Name</th>
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
                key={user.userId}
                className={selectedUserId === user.userId ? 'selected' : ''}
                onClick={() => handleSelectUser(user)}
              >
                <td>{user.name}</td>
                <td>{user.userId}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{formatTimestamp(user.createdAt)}</td>
                <td className="action-column">
                  <span
                    role="img"
                    aria-label="delete"
                    className="trash-icon"
                    onClick={(event) => handleDeleteUser(user.userId, event)}
                  >
                    🗑️
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="navigation-buttons">
          <button className="btn secondary-btn" onClick={onPrevious}>
            Previous
          </button>
          <button className="btn primary-btn" onClick={onNext} disabled={!selectedUserId}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserStep;
