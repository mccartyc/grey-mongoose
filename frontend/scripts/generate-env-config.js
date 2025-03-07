#!/usr/bin/env node

/**
 * This script generates a runtime environment configuration file
 * that will be included in the build and can be loaded by the browser.
 */

const fs = require('fs');
const path = require('path');

// Path to the template file
const templatePath = path.join(__dirname, '..', 'public', 'env-config.js');
// Path to the output file in the build directory
const outputPath = path.join(__dirname, '..', 'build', 'env-config.js');

// Read the template file
let template = fs.readFileSync(templatePath, 'utf8');

// Replace placeholders with actual environment variables
template = template.replace(
  /'%REACT_APP_API_URL%'/g, 
  `'${process.env.REACT_APP_API_URL || 'http://localhost:5001'}'`
);

// Ensure the build directory exists
if (!fs.existsSync(path.dirname(outputPath))) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

// Write the processed file to the build directory
fs.writeFileSync(outputPath, template);

console.log('Generated env-config.js with runtime environment variables');
