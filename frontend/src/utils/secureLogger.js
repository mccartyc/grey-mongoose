/**
 * Secure logger for production environments
 * Prevents sensitive information from being logged to the console
 */

// Simple version that doesn't override console methods to avoid breaking the app
const secureLogger = {
  log: (...args) => {
    // Only log in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(...args);
    }
  },
  
  info: (...args) => {
    // Only log in development
    if (process.env.NODE_ENV !== 'production') {
      console.info(...args);
    }
  },
  
  warn: (...args) => {
    // Always log warnings
    console.warn(...args);
  },
  
  error: (...args) => {
    // Always log errors
    console.error(...args);
  },
  
  debug: (...args) => {
    // Only log in development
    if (process.env.NODE_ENV !== 'production') {
      console.debug(...args);
    }
  }
};

export default secureLogger;
