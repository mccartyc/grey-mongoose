// This file will be loaded in the HTML to expose environment variables to the browser console
window.ENV_CONFIG = {
  REACT_APP_API_URL: '%REACT_APP_API_URL%' || 'Not set (will use localhost:5001)'
};

// Log environment info to console for debugging
console.log('Environment Config:', window.ENV_CONFIG);
