import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiConfig';
import { createApiInstance } from '../utils/apiConfig';

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Enable sending cookies with cross-origin requests
});

// Request interceptor to include the access token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 Unauthorized and not retrying yet, attempt token refresh
    if (
      error.response?.status === 401 &&
      !originalRequest.__isRetry &&
      error.response.data.message === 'Token is not valid'
    ) {
      try {
        originalRequest.__isRetry = true; // Mark the request as retrying

        // Request new tokens using the same baseURL from the api instance
        await axios.post(`/api/auth/refresh-token`, {}, {
          withCredentials: true
        });

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);
        localStorage.removeItem('accessToken'); // Clear expired tokens
        window.location.href = '/login'; // Redirect to login
      }
    }

    return Promise.reject(error);
  }
);

export default api;
