#!/usr/bin/env node

/**
 * This script finds and fixes improperly formatted template literals in the codebase
 * that were created by the update-api-urls.js script.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directory to search
const srcDir = path.join(__dirname, '..', 'src');

// Find all JS files with potentially incorrect template literals
console.log('Searching for files with incorrect template literals...');
const grepCommand = `grep -r "\\\${process.env.REACT_APP_API_URL" --include="*.js" ${srcDir}`;

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
  
  console.log(`Found ${filesToUpdate.size} files with potential template literal issues.`);
  
  // Update each file
  filesToUpdate.forEach(filePath => {
    console.log(`Processing ${filePath}...`);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix template literals that are incorrectly wrapped in quotes instead of backticks
    const updatedContent = content
      // Fix double quotes
      .replace(/"(\${process\.env\.REACT_APP_API_URL[^"]*})"/g, '`$1`')
      // Fix single quotes
      .replace(/'(\${process\.env\.REACT_APP_API_URL[^']*})'/g, '`$1`');
    
    // Only write if changes were made
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`Updated ${filePath}`);
    } else {
      console.log(`No changes needed in ${filePath}`);
    }
  });
  
  console.log('Template literal fixes complete!');
  
} catch (error) {
  console.error('Error fixing template literals:', error.message);
  process.exit(1);
}
