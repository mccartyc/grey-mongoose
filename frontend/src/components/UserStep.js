import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserStep = ({ onNext, onPrevious, onSelectUser }) => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/api/users', { name });
      setMessage(`User created: ${response.data.name}`);
      setUsers((prev) => [...prev, response.data]);
      setName('');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to create user');
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUserId(user._id);
    onSelectUser(user);
  };

  return (
    <div>
      <h2>Select or Create User</h2>
      <form onSubmit={handleCreateUser}>
        <label>
          User Name:
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <button type="submit">Create User</button>
      </form>
      {message && <p>{message}</p>}
      <h3>Existing Users</h3>
      <ul>
        {users.map((user) => (
          <li key={user._id}>
            <button onClick={() => handleSelectUser(user)}>{user.name}</button>
          </li>
        ))}
      </ul>
      <button onClick={onPrevious}>Back</button>
      <button onClick={onNext} disabled={!selectedUserId}>
        Next
      </button>
    </div>
  );
};

export default UserStep;
