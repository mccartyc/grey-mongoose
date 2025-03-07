#!/usr/bin/env node

/**
 * This script helps test a deployed application by making requests to key endpoints
 * and checking for common issues.
 * 
 * Usage: 
 *   node test-deployment.js https://your-deployed-app.netlify.app
 */

const axios = require('axios');
const { program } = require('commander');
const chalk = require('chalk');

// Set up command line arguments
program
  .argument('<url>', 'The URL of the deployed application')
  .option('-v, --verbose', 'Show detailed output')
  .parse(process.argv);

const deployedUrl = program.args[0];
const options = program.opts();
const verbose = options.verbose;

// Helper function to log with colors
const log = {
  info: (msg) => console.log(chalk.blue(msg)),
  success: (msg) => console.log(chalk.green(`✓ ${msg}`)),
  warning: (msg) => console.log(chalk.yellow(`⚠ ${msg}`)),
  error: (msg) => console.log(chalk.red(`✗ ${msg}`)),
  detail: (msg) => verbose && console.log(chalk.gray(`  ${msg}`))
};

// Main test function
async function runTests() {
  log.info(`\n=== Testing Deployed Application: ${deployedUrl} ===\n`);
  
  // Test 1: Basic connectivity
  try {
    log.info('Testing basic connectivity...');
    const response = await axios.get(deployedUrl);
    log.success(`Connected to ${deployedUrl}`);
    log.detail(`Status: ${response.status}`);
    log.detail(`Content type: ${response.headers['content-type']}`);
  } catch (error) {
    log.error(`Failed to connect to ${deployedUrl}`);
    log.detail(error.message);
  }
  
  // Test 2: Check for env-config.js
  try {
    log.info('\nChecking for environment configuration...');
    const envConfigResponse = await axios.get(`${deployedUrl}/env-config.js`);
    if (envConfigResponse.status === 200) {
      log.success('Environment configuration file found');
      
      // Check if it contains API URL
      if (envConfigResponse.data.includes('REACT_APP_API_URL')) {
        log.success('API URL configuration found in env-config.js');
      } else {
        log.warning('API URL configuration not found in env-config.js');
      }
    }
  } catch (error) {
    log.error('Environment configuration file not found');
    log.detail(error.message);
  }
  
  // Test 3: Check for API test route
  try {
    log.info('\nChecking API test route...');
    const response = await axios.get(`${deployedUrl}/api-test`);
    if (response.status === 200) {
      log.success('API test route is accessible');
    }
  } catch (error) {
    log.error('API test route is not accessible');
    log.detail(error.message);
  }
  
  // Test 4: Check for test login route
  try {
    log.info('\nChecking test login route...');
    const response = await axios.get(`${deployedUrl}/test-login`);
    if (response.status === 200) {
      log.success('Test login route is accessible');
    }
  } catch (error) {
    log.error('Test login route is not accessible');
    log.detail(error.message);
  }
  
  // Test 5: Check for common static assets
  try {
    log.info('\nChecking for static assets...');
    const staticAssets = [
      '/static/js/main.js',
      '/static/css/main.css',
      '/manifest.json',
      '/favicon.ico'
    ];
    
    for (const asset of staticAssets) {
      try {
        const response = await axios.head(`${deployedUrl}${asset}`);
        if (response.status === 200) {
          log.success(`Found ${asset}`);
        }
      } catch (error) {
        log.warning(`Could not find ${asset}`);
      }
    }
  } catch (error) {
    log.error('Error checking static assets');
    log.detail(error.message);
  }
  
  log.info('\n=== Deployment Test Complete ===\n');
  log.info('Next steps:');
  log.info('1. Manually test login functionality');
  log.info('2. Check browser console for any errors');
  log.info('3. Test role-based access control');
}

// Run the tests
runTests().catch(error => {
  log.error('An unexpected error occurred:');
  console.error(error);
});
