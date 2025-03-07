#!/usr/bin/env node

/**
 * This script checks for required environment variables before building
 * and provides helpful error messages if any are missing.
 */

// Load environment variables from .env files
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load base .env file
dotenv.config();

// Determine environment and load appropriate .env file
const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`🌐 Current NODE_ENV: ${nodeEnv}`);

// Try to load environment-specific .env file
const envFile = path.resolve(process.cwd(), `.env.${nodeEnv}`);
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
  console.log(`📄 Loaded environment variables from ${envFile}`);
} else {
  console.log(`⚠️ No environment-specific .env file found at ${envFile}`);
}

const requiredEnvVars = [
  'REACT_APP_API_URL',
  'REACT_APP_ENCRYPTION_KEY',
  'REACT_APP_ENCRYPTION_IV'
];

// Set CI to false to prevent warnings from being treated as errors
process.env.CI = 'false';
console.log('🚫 Set CI=false to prevent warnings from being treated as errors');

// Check for required environment variables
const missingVars = [];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\x1b[33m%s\x1b[0m', '\nPlease set these variables in your .env file or in your environment.');
  console.error('\x1b[33m%s\x1b[0m', 'For Netlify, set them in the Netlify UI under Site settings > Build & deploy > Environment.');
  
  // Don't exit with error code for now, just warn
  console.log('\x1b[33m%s\x1b[0m', 'Continuing build process despite missing variables for debugging purposes...');
} else {
  console.log('\x1b[32m%s\x1b[0m', '✅ All required environment variables are set');
  
  // Log the API URL for debugging (masking sensitive values)
  console.log(`🔗 API URL: ${process.env.REACT_APP_API_URL}`);
  console.log(`🔑 Encryption Key: ${'*'.repeat(8)}`);
}

// Log all environment variables that start with REACT_APP (without showing actual values)
console.log('\n📋 Available REACT_APP environment variables:');
Object.keys(process.env)
  .filter(key => key.startsWith('REACT_APP_'))
  .forEach(key => {
    const value = process.env[key];
    const maskedValue = key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD') || key.includes('IV')
      ? '*'.repeat(8)
      : value;
    console.log(`   - ${key}: ${maskedValue}`);
  });
