import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { createApiInstance } from '../utils/apiConfig';

const TestLogin = () => {
  const [apiUrl, setApiUrl] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth(); // Get the login function from AuthContext at component level

  useEffect(() => {
    // Display the current environment variables
    setApiUrl(process.env.REACT_APP_API_URL || 'Not set (will use localhost:5001)');
  }, []);

  const testDirectLogin = async () => {
    setLoading(true);
    setResult('Testing direct API call...');
    
    try {
      // Test with direct URL
      const response = await axios.post(
        `/api/auth/login`, 
        { email, password },
        { withCredentials: true }
      );
      
      setResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('Login error:', error);
      setResult(
        `Error: ${error.message}\n` +
        `Response: ${JSON.stringify(error.response?.data || {}, null, 2)}\n` +
        `Status: ${error.response?.status || 'Unknown'}\n` +
        `Headers: ${JSON.stringify(error.response?.headers || {}, null, 2)}`
      );
    } finally {
      setLoading(false);
    }
  };

  const testContextLogin = async () => {
    setLoading(true);
    setResult('Testing login through AuthContext...');
    
    try {
      // Use the login function from the hook we called at the component level
      const response = await login({ email, password });
      setResult(JSON.stringify(response || 'Login successful', null, 2));
    } catch (error) {
      console.error('Login error:', error);
      setResult(
        `Error: ${error.message}\n` +
        `Response: ${JSON.stringify(error.response?.data || {}, null, 2)}\n` +
        `Status: ${error.response?.status || 'Unknown'}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Login Test Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Environment Information</h3>
        <p><strong>REACT_APP_API_URL:</strong> {apiUrl}</p>
        <p><strong>Current URL:</strong> {window.location.href}</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Test Login</h3>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={testDirectLogin} 
            disabled={loading}
            style={{ padding: '8px 16px' }}
          >
            Test Direct API Call
          </button>
          
          <button 
            onClick={testContextLogin} 
            disabled={loading}
            style={{ padding: '8px 16px' }}
          >
            Test Context Login
          </button>
        </div>
      </div>
      
      <div>
        <h3>Result</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <pre 
            style={{ 
              background: '#f5f5f5', 
              padding: '15px', 
              borderRadius: '4px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {result || 'No results yet'}
          </pre>
        )}
      </div>
    </div>
  );
};

export default TestLogin;
