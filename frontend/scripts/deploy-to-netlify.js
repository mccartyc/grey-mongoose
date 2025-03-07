#!/usr/bin/env node

/**
 * This script helps deploy the application to Netlify with the correct environment variables.
 * It runs the build process and then deploys to Netlify.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.cyan}=== MindCloud Netlify Deployment Tool ===${colors.reset}\n`);

// Check if .env.production exists
const envProdPath = path.join(__dirname, '..', '.env.production');
if (!fs.existsSync(envProdPath)) {
  console.log(`${colors.red}Error: .env.production file not found.${colors.reset}`);
  console.log('Please create this file with your production environment variables.');
  process.exit(1);
}

// Read the current .env.production file
const envProd = fs.readFileSync(envProdPath, 'utf8');
const apiUrlMatch = envProd.match(/REACT_APP_API_URL=(.+)/);
const currentApiUrl = apiUrlMatch ? apiUrlMatch[1].trim() : 'Not set';

console.log(`${colors.yellow}Current production API URL:${colors.reset} ${currentApiUrl}\n`);

const promptApiUrl = () => {
  rl.question(`Enter the API URL for production [${currentApiUrl}]: `, (apiUrl) => {
    const newApiUrl = apiUrl.trim() || currentApiUrl;
    
    console.log(`\n${colors.yellow}Deployment Configuration:${colors.reset}`);
    console.log(`- API URL: ${newApiUrl}`);
    
    rl.question(`\nProceed with deployment? (y/n): `, (answer) => {
      if (answer.toLowerCase() === 'y') {
        deployToNetlify(newApiUrl);
      } else {
        console.log(`\n${colors.yellow}Deployment cancelled.${colors.reset}`);
        rl.close();
      }
    });
  });
};

const deployToNetlify = (apiUrl) => {
  try {
    // Update .env.production with the new API URL
    let updatedEnvProd = envProd;
    if (apiUrlMatch) {
      updatedEnvProd = updatedEnvProd.replace(/REACT_APP_API_URL=(.+)/, `REACT_APP_API_URL=${apiUrl}`);
    } else {
      updatedEnvProd += `\nREACT_APP_API_URL=${apiUrl}\n`;
    }
    
    fs.writeFileSync(envProdPath, updatedEnvProd);
    console.log(`\n${colors.green}Updated .env.production with new API URL.${colors.reset}`);
    
    // Run the build process
    console.log(`\n${colors.cyan}Running build process...${colors.reset}`);
    execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    
    // Deploy to Netlify
    console.log(`\n${colors.cyan}Deploying to Netlify...${colors.reset}`);
    execSync('npx netlify deploy --prod', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    
    console.log(`\n${colors.green}${colors.bright}Deployment completed successfully!${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.red}Deployment failed:${colors.reset}`, error.message);
  } finally {
    rl.close();
  }
};

// Start the deployment process
promptApiUrl();
