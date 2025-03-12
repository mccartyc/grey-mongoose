// Secure production-ready logger
const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'production' ? 'warn' : 'debug';
};

// Define sanitization function to remove sensitive data
const sanitizeData = (data) => {
  if (!data) return data;
  
  // If data is a string, check for sensitive patterns
  if (typeof data === 'string') {
    // Replace potential tokens, passwords, keys, etc.
    return data
      .replace(/(Bearer\s+)[^\s]+/gi, '$1[REDACTED]')
      .replace(/(password["']?\s*:\s*["']?)[^"',\s]+/gi, '$1[REDACTED]')
      .replace(/(token["']?\s*:\s*["']?)[^"',\s]+/gi, '$1[REDACTED]')
      .replace(/(key["']?\s*:\s*["']?)[^"',\s]+/gi, '$1[REDACTED]')
      .replace(/(secret["']?\s*:\s*["']?)[^"',\s]+/gi, '$1[REDACTED]');
  }
  
  // If data is an object, recursively sanitize its properties
  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };
    
    // List of sensitive keys to redact
    const sensitiveKeys = [
      'password', 'token', 'accessToken', 'refreshToken', 'jwt', 
      'secret', 'key', 'apiKey', 'authorization', 'credential',
      'sessionSecret', 'jwtSecret', 'encryptionKey'
    ];
    
    // Recursively sanitize object
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = sanitizeData(sanitized[key]);
      }
    });
    
    return sanitized;
  }
  
  return data;
};

// Create formatters
const formats = [
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...rest } = info;
    const sanitizedRest = sanitizeData(rest);
    const sanitizedMessage = sanitizeData(message);
    
    return Object.keys(sanitizedRest).length
      ? `${timestamp} ${level}: ${sanitizedMessage} ${JSON.stringify(sanitizedRest)}`
      : `${timestamp} ${level}: ${sanitizedMessage}`;
  }),
];

// Add colors in development
const devFormats = [
  ...formats,
  winston.format.colorize({ all: true }),
];

// Configure transports
const transports = [
  new winston.transports.Console(),
];

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join(process.env.LOG_DIR || 'logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(process.env.LOG_DIR || 'logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format: process.env.NODE_ENV === 'production' 
    ? winston.format.combine(...formats)
    : winston.format.combine(...devFormats),
  transports,
});

// Override console methods in production to use our secure logger
if (process.env.NODE_ENV === 'production') {
  console.log = (...args) => logger.info.call(logger, ...args);
  console.info = (...args) => logger.info.call(logger, ...args);
  console.warn = (...args) => logger.warn.call(logger, ...args);
  console.error = (...args) => logger.error.call(logger, ...args);
  console.debug = (...args) => logger.debug.call(logger, ...args);
}

module.exports = logger;
