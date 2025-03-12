/**
 * Script to update all hardcoded localhost URLs in the codebase
 * Run with: node src/utils/fixApiUrls.js
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const stat = util.promisify(fs.stat);

// Directories to exclude
const excludeDirs = ['node_modules', 'build', 'dist', '.git'];

// Pattern to search for
const localhostPattern = /http:\/\/localhost:5001/g;

// Function to recursively search and update files
async function updateDirectory(directory) {
  const results = [];
  
  try {
    const files = await readdir(directory);
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const fileStat = await stat(filePath);
      
      // Skip excluded directories
      if (fileStat.isDirectory()) {
        if (!excludeDirs.includes(file)) {
          const subResults = await updateDirectory(filePath);
          results.push(...subResults);
        }
        continue;
      }
      
      // Only check JavaScript and JSX files
      if (!/\.(js|jsx)$/.test(file)) {
        continue;
      }
      
      // Skip the apiConfig and this script
      if (file === 'apiConfig.js' || file === 'fixApiUrls.js' || file === 'updateApiUrls.js') {
        continue;
      }
      
      // Read file content
      let content = await readFile(filePath, 'utf8');
      
      // Check if file contains localhost URLs
      if (localhostPattern.test(content)) {
        // Count matches before updating
        const matches = (content.match(localhostPattern) || []).length;
        
        // Update imports if needed
        if (!content.includes('import { createApiInstance }') && 
            !content.includes('import { getApiBaseUrl }')) {
          
          // Find the last import statement
          const importRegex = /^import .+;$/gm;
          const importMatches = [...content.matchAll(importRegex)];
          
          if (importMatches.length > 0) {
            const lastImport = importMatches[importMatches.length - 1];
            const lastImportIndex = lastImport.index + lastImport[0].length;
            
            // Insert our import after the last import
            content = content.slice(0, lastImportIndex) + 
                     '\nimport { createApiInstance } from \'../utils/apiConfig\';' + 
                     content.slice(lastImportIndex);
          }
        }
        
        // Replace axios instance creation
        const axiosInstanceRegex = /const\s+\w+\s*=\s*axios\.create\(\s*\{\s*baseURL:\s*['"]http:\/\/localhost:5001['"],?[\s\S]*?\}\s*\);/g;
        content = content.replace(axiosInstanceRegex, (match, offset, string) => {
          // Extract variable name
          const varNameMatch = /const\s+(\w+)\s*=/.exec(match);
          const varName = varNameMatch ? varNameMatch[1] : 'apiInstance';
          
          // Extract token variable if present
          const tokenMatch = /['"]Authorization['"]:\s*['"]\$\{([^}]+)\}['"]/i.exec(match);
          const tokenVar = tokenMatch ? tokenMatch[1] : 'user.token';
          
          return `const ${varName} = createApiInstance(${tokenVar});`;
        });
        
        // Replace direct URL references
        content = content.replace(/['"]http:\/\/localhost:5001\/api\//g, '"/api/');
        
        // Write updated content back to file
        await writeFile(filePath, content, 'utf8');
        
        results.push({
          filePath,
          matches
        });
      }
    }
  } catch (error) {
    console.error(`Error updating directory ${directory}:`, error);
  }
  
  return results;
}

// Main function
async function fixApiUrls() {
  console.log('Updating hardcoded localhost URLs...');
  
  const srcDir = path.resolve(__dirname, '..');
  const results = await updateDirectory(srcDir);
  
  console.log('\nFiles updated:');
  console.log('==============');
  
  if (results.length === 0) {
    console.log('No files needed updating!');
  } else {
    results.forEach(result => {
      console.log(`${result.filePath} (${result.matches} matches)`);
    });
    
    console.log('\nTotal files updated:', results.length);
    console.log('\nNext steps:');
    console.log('1. Review the changes to ensure they work as expected');
    console.log('2. Fix any remaining issues manually');
    console.log('3. Test the application');
    console.log('4. Deploy the changes');
  }
}

// Run the script
fixApiUrls();

module.exports = { fixApiUrls };
