import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { createApiInstance, getApiBaseUrl } from '../utils/apiConfig';

const ApiTest = () => {
  const [apiUrl, setApiUrl] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Display the current environment variables
    const url = getApiBaseUrl();
    setApiUrl(url);
  }, []);

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);
    
    // Add a result to the test results
    const addResult = (name, status, message, details = null) => {
      setTestResults(prev => [...prev, { name, status, message, details, timestamp: new Date() }]);
    };
    
    try {
      // Test 1: Check if the API URL is set
      if (!apiUrl) {
        addResult('API URL Check', 'error', 'API URL is not set. Check your environment variables.');
      } else {
        addResult('API URL Check', 'success', `API URL is set to: ${apiUrl}`);
      }
      
      // Test 2: Basic connectivity test with a simple GET request
      try {
        const response = await axios.get(`${apiUrl}/api/health`, { timeout: 5000 });
        addResult(
          'Basic Connectivity', 
          'success', 
          'Successfully connected to the API server',
          { status: response.status, data: response.data }
        );
      } catch (error) {
        addResult(
          'Basic Connectivity', 
          'error', 
          `Failed to connect to the API server: ${error.message}`,
          { 
            error: error.message,
            response: error.response?.data,
            status: error.response?.status
          }
        );
      }
      
      // Test 3: Test CORS with credentials
      try {
        const corsResponse = await axios.get(`${apiUrl}/api/health`, { 
          withCredentials: true,
          timeout: 5000
        });
        addResult(
          'CORS with Credentials', 
          'success', 
          'CORS with credentials is working correctly',
          { status: corsResponse.status, data: corsResponse.data }
        );
      } catch (error) {
        addResult(
          'CORS with Credentials', 
          'error', 
          `CORS test failed: ${error.message}`,
          { 
            error: error.message,
            response: error.response?.data,
            status: error.response?.status
          }
        );
      }
      
      // Test 4: Test authentication endpoints
      try {
        // We're not actually logging in, just checking if the endpoint exists
        await axios.options(`${apiUrl}/api/auth/login`, { timeout: 5000 });
        addResult(
          'Authentication Endpoint', 
          'success', 
          'Authentication endpoint is accessible'
        );
      } catch (error) {
        addResult(
          'Authentication Endpoint', 
          'error', 
          `Authentication endpoint test failed: ${error.message}`,
          { 
            error: error.message,
            response: error.response?.data,
            status: error.response?.status
          }
        );
      }
      
      // Test 5: Check for network issues
      const networkInfo = {
        online: navigator.onLine,
        userAgent: navigator.userAgent,
        cookiesEnabled: navigator.cookieEnabled
      };
      
      addResult(
        'Browser Network Info', 
        navigator.onLine ? 'success' : 'warning', 
        navigator.onLine ? 'Browser is online' : 'Browser is offline',
        networkInfo
      );
      
    } catch (error) {
      addResult('Test Suite', 'error', `An error occurred while running tests: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>API Connection Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Environment Information</h3>
        <p><strong>REACT_APP_API_URL:</strong> {apiUrl || 'Not set'}</p>
        <p><strong>Current URL:</strong> {window.location.href}</p>
        <p><strong>Window ENV_CONFIG:</strong> {window.ENV_CONFIG ? JSON.stringify(window.ENV_CONFIG) : 'Not available'}</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runTests} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Running Tests...' : 'Run API Tests'}
        </button>
      </div>
      
      <div>
        <h3>Test Results</h3>
        {testResults.length === 0 && !loading ? (
          <p>No tests have been run yet. Click the button above to start testing.</p>
        ) : (
          <div>
            {testResults.map((result, index) => (
              <div 
                key={index}
                style={{ 
                  marginBottom: '15px', 
                  padding: '15px',
                  borderRadius: '4px',
                  backgroundColor: result.status === 'success' ? '#e8f5e9' : 
                                   result.status === 'warning' ? '#fff8e1' : '#ffebee'
                }}
              >
                <h4 style={{ margin: '0 0 10px 0' }}>
                  {result.status === 'success' ? '✅ ' : 
                   result.status === 'warning' ? '⚠️ ' : '❌ '}
                  {result.name}
                </h4>
                <p style={{ margin: '0 0 10px 0' }}>{result.message}</p>
                {result.details && (
                  <details>
                    <summary>Details</summary>
                    <pre style={{ 
                      background: '#f5f5f5', 
                      padding: '10px', 
                      borderRadius: '4px',
                      overflow: 'auto',
                      maxHeight: '200px'
                    }}>
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
                <small style={{ color: '#666' }}>
                  {result.timestamp.toLocaleTimeString()}
                </small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiTest;
