/**
 * Secure logger for production environments
 * Prevents sensitive information from being logged to the console
 */

const isProduction = process.env.NODE_ENV === 'production';

// List of patterns that might indicate sensitive data
const sensitivePatterns = [
  /password/i,
  /token/i,
  /auth/i,
  /key/i,
  /secret/i,
  /credential/i,
  /jwt/i,
  /bearer/i,
  /session/i
];

/**
 * Sanitizes objects to remove sensitive information
 * @param {any} data - Data to sanitize
 * @returns {any} - Sanitized data
 */
const sanitizeData = (data) => {
  if (!data) return data;
  
  // Handle strings
  if (typeof data === 'string') {
    // Check if the string contains sensitive information
    if (sensitivePatterns.some(pattern => pattern.test(data))) {
      return '[REDACTED]';
    }
    return data;
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  // Handle objects
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    
    Object.keys(data).forEach(key => {
      // Check if the key contains sensitive information
      if (sensitivePatterns.some(pattern => pattern.test(key))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeData(data[key]);
      }
    });
    
    return sanitized;
  }
  
  return data;
};

// Create secure logger methods
const secureLogger = {
  log: (...args) => {
    if (!isProduction) {
      console.log(...args);
    }
  },
  
  info: (...args) => {
    if (!isProduction) {
      console.info(...args);
    }
  },
  
  warn: (...args) => {
    // Always log warnings, but sanitize in production
    if (isProduction) {
      console.warn(...args.map(arg => sanitizeData(arg)));
    } else {
      console.warn(...args);
    }
  },
  
  error: (...args) => {
    // Always log errors, but sanitize in production
    if (isProduction) {
      console.error(...args.map(arg => sanitizeData(arg)));
    } else {
      console.error(...args);
    }
  },
  
  debug: (...args) => {
    if (!isProduction) {
      console.debug(...args);
    }
  }
};

// In production, override the console methods to use our secure logger
if (isProduction) {
  // Store original methods
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug
  };
  
  // Override console methods
  console.log = (...args) => secureLogger.log(...args);
  console.info = (...args) => secureLogger.info(...args);
  console.warn = (...args) => secureLogger.warn(...args);
  console.error = (...args) => secureLogger.error(...args);
  console.debug = (...args) => secureLogger.debug(...args);
}

export default secureLogger;
