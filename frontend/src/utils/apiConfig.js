/**
 * API configuration utility
 * Ensures all API calls use the correct base URL from environment variables
 */

// Get the base API URL from environment variables or use a fallback
export const getApiBaseUrl = () => {
  // For production, use the environment variable
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // For local development, use localhost
  return 'http://localhost:5001';
};

// Create a configured axios instance
export const createApiInstance = (token) => {
  const axios = require('axios');
  
  return axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 10000, // 10 seconds
    headers: token ? {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    } : {
      'Content-Type': 'application/json'
    },
    withCredentials: true
  });
};

export default {
  getApiBaseUrl,
  createApiInstance
};
