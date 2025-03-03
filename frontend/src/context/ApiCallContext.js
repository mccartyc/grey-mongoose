import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create context
const ApiCallContext = createContext();

// Custom hook to use the API call context
export const useApiCall = () => useContext(ApiCallContext);

// Provider component
export const ApiCallProvider = ({ children }) => {
  const [apiCalls, setApiCalls] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    pending: 0,
    rateLimited: 0,
    lastCall: null
  });

  // Reset counters at midnight
  useEffect(() => {
    const resetCounters = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        setApiCalls({
          total: 0,
          successful: 0,
          failed: 0,
          pending: 0,
          rateLimited: 0,
          lastCall: null
        });
      }
    };

    const interval = setInterval(resetCounters, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Set up axios interceptors to track API calls
  useEffect(() => {
    // Request interceptor
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        setApiCalls(prev => ({
          ...prev,
          total: prev.total + 1,
          pending: prev.pending + 1,
          lastCall: new Date().toISOString()
        }));
        return config;
      },
      (error) => {
        setApiCalls(prev => ({
          ...prev,
          failed: prev.failed + 1,
          pending: Math.max(0, prev.pending - 1)
        }));
        return Promise.reject(error);
      }
    );

    // Response interceptor
    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        setApiCalls(prev => ({
          ...prev,
          successful: prev.successful + 1,
          pending: Math.max(0, prev.pending - 1)
        }));
        return response;
      },
      (error) => {
        // Check if rate limited (status code 429)
        if (error.response && error.response.status === 429) {
          setApiCalls(prev => ({
            ...prev,
            rateLimited: prev.rateLimited + 1,
            failed: prev.failed + 1,
            pending: Math.max(0, prev.pending - 1)
          }));
        } else {
          setApiCalls(prev => ({
            ...prev,
            failed: prev.failed + 1,
            pending: Math.max(0, prev.pending - 1)
          }));
        }
        return Promise.reject(error);
      }
    );

    // Clean up interceptors
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  return (
    <ApiCallContext.Provider value={{ apiCalls }}>
      {children}
    </ApiCallContext.Provider>
  );
};

export default ApiCallContext;
