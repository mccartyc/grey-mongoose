#!/usr/bin/env node

/**
 * This script generates a runtime environment configuration file
 * that will be included in the build and can be loaded by the browser.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env files
dotenv.config();

// Path to the template file
const templatePath = path.join(__dirname, '..', 'public', 'env-config.js');
// Path to the output file in the build directory
const outputPath = path.join(__dirname, '..', 'build', 'env-config.js');

// Read the template file
let template = fs.readFileSync(templatePath, 'utf8');

// Set CI to false to prevent warnings from being treated as errors
process.env.CI = 'false';
console.log(' Set CI=false to prevent warnings from being treated as errors');

// Log current environment for debugging
console.log(` NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(` API URL: ${process.env.REACT_APP_API_URL || 'not set'}`);

// Replace placeholders with actual environment variables
template = template.replace(
  /'%REACT_APP_API_URL%'/g, 
  `'${process.env.REACT_APP_API_URL || 'http://localhost:5001'}'`
);

// Add encryption keys (without exposing the actual values in logs)
if (process.env.REACT_APP_ENCRYPTION_KEY) {
  console.log(' Encryption Key is set');
  template = template.replace(
    /'%REACT_APP_ENCRYPTION_KEY%'/g, 
    `'${process.env.REACT_APP_ENCRYPTION_KEY}'`
  );
} else {
  console.log(' Warning: REACT_APP_ENCRYPTION_KEY is not set');
  template = template.replace(
    /'%REACT_APP_ENCRYPTION_KEY%'/g, 
    `'${process.env.ENCRYPTION_KEY || ''}'`
  );
}

if (process.env.REACT_APP_ENCRYPTION_IV) {
  console.log(' Encryption IV is set');
  template = template.replace(
    /'%REACT_APP_ENCRYPTION_IV%'/g, 
    `'${process.env.REACT_APP_ENCRYPTION_IV}'`
  );
} else {
  console.log(' Warning: REACT_APP_ENCRYPTION_IV is not set');
  template = template.replace(
    /'%REACT_APP_ENCRYPTION_IV%'/g, 
    `'${process.env.ENCRYPTION_IV || ''}'`
  );
}

// Add NODE_ENV
template = template.replace(
  /'%NODE_ENV%'/g, 
  `'${process.env.NODE_ENV || 'production'}'`
);

// Ensure the build directory exists
if (!fs.existsSync(path.dirname(outputPath))) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

// Write the processed file to the build directory
fs.writeFileSync(outputPath, template);

console.log(` Environment configuration written to ${outputPath}`);
console.log(' Contents (partial):');
console.log(template.substring(0, 200) + '...');

// Also copy the file to the public directory for local development
const publicPath = path.join(__dirname, '..', 'public', 'env-config.js');
fs.writeFileSync(publicPath, template);
console.log(` Environment configuration also updated in ${publicPath}`);
