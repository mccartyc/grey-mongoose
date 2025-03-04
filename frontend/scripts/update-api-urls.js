#!/usr/bin/env node

/**
 * This script finds and updates hardcoded API URLs in the codebase
 * to use the environment variable REACT_APP_API_URL.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directory to search
const srcDir = path.join(__dirname, '..', 'src');

// Find all JS files with hardcoded localhost URLs
console.log('Searching for files with hardcoded API URLs...');
const grepCommand = `grep -r "http://localhost:5001\\|http://localhost:5000" --include="*.js" ${srcDir}`;

try {
  const grepResult = execSync(grepCommand).toString();
  const filesToUpdate = new Set();
  
  // Extract unique filenames from grep results
  grepResult.split('\n').forEach(line => {
    if (line.trim()) {
      const filePath = line.split(':')[0];
      filesToUpdate.add(filePath);
    }
  });
  
  console.log(`Found ${filesToUpdate.size} files with hardcoded URLs.`);
  
  // Update each file
  filesToUpdate.forEach(filePath => {
    console.log(`Processing ${filePath}...`);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace hardcoded URLs with environment variable
    const updatedContent = content
      .replace(/http:\/\/localhost:5001/g, '${process.env.REACT_APP_API_URL || "http://localhost:5001"}')
      .replace(/http:\/\/localhost:5000/g, '${process.env.REACT_APP_API_URL || "http://localhost:5001"}');
    
    // Only write if changes were made
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`Updated ${filePath}`);
    } else {
      console.log(`No changes needed in ${filePath}`);
    }
  });
  
  console.log('URL update complete!');
  console.log('Remember to update your code to use template literals for the updated URLs.');
  console.log('Example: `${process.env.REACT_APP_API_URL}/api/endpoint`');
  
} catch (error) {
  console.error('Error updating API URLs:', error.message);
  process.exit(1);
}
