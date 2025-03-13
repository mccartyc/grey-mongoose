// This file will be loaded in the HTML to expose environment variables to the browser console
window.ENV_CONFIG = {
  REACT_APP_API_URL: 'http://localhost:5001' || 'Not set (will use localhost:5001)',
  REACT_APP_ENCRYPTION_KEY: 'c5cd94bd263cca1652097fbc5263c373b7921f0d9134eefc899ffbfcd87e314c',
  REACT_APP_ENCRYPTION_IV: '5cdfa719004c400ba61669e819a5bcd7',
  BUILD_TIME: new Date().toISOString(),
  NODE_ENV: 'production'
};

// Log environment info to console for debugging
console.log('Environment Config Loaded:'
  //   , {
  // REACT_APP_API_URL: window.ENV_CONFIG.REACT_APP_API_URL,
  // REACT_APP_ENCRYPTION_KEY: window.ENV_CONFIG.REACT_APP_ENCRYPTION_KEY ? '********' : 'Not set',
  // REACT_APP_ENCRYPTION_IV: window.ENV_CONFIG.REACT_APP_ENCRYPTION_IV ? '********' : 'Not set',
  // BUILD_TIME: window.ENV_CONFIG.BUILD_TIME,
  // NODE_ENV: window.ENV_CONFIG.NODE_ENV
  // }
);
