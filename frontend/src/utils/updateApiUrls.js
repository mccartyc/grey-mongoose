/**
 * This script helps identify files with hardcoded localhost URLs
 * Run this script to get a list of files that need to be updated
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const stat = util.promisify(fs.stat);

// Directories to exclude
const excludeDirs = ['node_modules', 'build', 'dist', '.git'];

// Pattern to search for
const localhostPattern = /http:\/\/localhost:5001/g;

// Function to recursively search directories
async function searchDirectory(directory) {
  const results = [];
  
  try {
    const files = await readdir(directory);
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const fileStat = await stat(filePath);
      
      // Skip excluded directories
      if (fileStat.isDirectory()) {
        if (!excludeDirs.includes(file)) {
          const subResults = await searchDirectory(filePath);
          results.push(...subResults);
        }
        continue;
      }
      
      // Only check JavaScript and JSX files
      if (!/\.(js|jsx)$/.test(file)) {
        continue;
      }
      
      // Read file content
      const content = await readFile(filePath, 'utf8');
      
      // Check if file contains localhost URLs
      if (localhostPattern.test(content)) {
        results.push({
          filePath,
          matches: (content.match(localhostPattern) || []).length
        });
        
        // Reset regex lastIndex
        localhostPattern.lastIndex = 0;
      }
    }
  } catch (error) {
    console.error(`Error searching directory ${directory}:`, error);
  }
  
  return results;
}

// Main function
async function findLocalhostUrls() {
  console.log('Searching for hardcoded localhost URLs...');
  
  const srcDir = path.resolve(__dirname, '..');
  const results = await searchDirectory(srcDir);
  
  console.log('\nFiles with hardcoded localhost URLs:');
  console.log('====================================');
  
  if (results.length === 0) {
    console.log('No hardcoded localhost URLs found!');
  } else {
    results.forEach(result => {
      console.log(`${result.filePath} (${result.matches} matches)`);
    });
    
    console.log('\nTotal files to update:', results.length);
    console.log('\nTo fix these files, update them to use the apiConfig utility:');
    console.log('1. Import: import { getApiBaseUrl, createApiInstance } from "../utils/apiConfig";');
    console.log('2. Replace axios instances with: const apiInstance = createApiInstance(token);');
    console.log('3. Replace URLs: change http://localhost:5001/api/... to /api/...');
  }
}

// Run the script
findLocalhostUrls();

module.exports = { findLocalhostUrls };
