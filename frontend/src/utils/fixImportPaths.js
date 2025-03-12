/**
 * Script to fix import paths for apiConfig utility
 * Run with: node src/utils/fixImportPaths.js
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
      if (file === 'apiConfig.js' || file === 'fixApiUrls.js' || file === 'updateApiUrls.js' || file === 'fixImportPaths.js') {
        continue;
      }
      
      // Read file content
      let content = await readFile(filePath, 'utf8');
      
      // Check if file contains incorrect import path
      if (content.includes("import { createApiInstance } from '../utils/apiConfig'") || 
          content.includes("import { getApiBaseUrl } from '../utils/apiConfig'") ||
          content.includes("import { createApiInstance, getApiBaseUrl } from '../utils/apiConfig'")) {
        
        // Calculate the correct relative path
        const relativeToSrc = path.relative(path.dirname(filePath), path.resolve(directory, '..'));
        const correctPath = relativeToSrc.replace(/\\/g, '/'); // Ensure forward slashes for imports
        
        // Replace incorrect import paths
        content = content.replace(
          /import\s+\{\s*(createApiInstance|getApiBaseUrl|createApiInstance,\s*getApiBaseUrl|getApiBaseUrl,\s*createApiInstance)\s*\}\s*from\s*['"]\.\.\/utils\/apiConfig['"]/g,
          `import { $1 } from '${correctPath}/utils/apiConfig'`
        );
        
        // Write updated content back to file
        await writeFile(filePath, content, 'utf8');
        
        results.push({
          filePath,
          fixed: true
        });
      }
    }
  } catch (error) {
    console.error(`Error updating directory ${directory}:`, error);
  }
  
  return results;
}

// Main function
async function fixImportPaths() {
  console.log('Fixing import paths for apiConfig utility...');
  
  const srcDir = path.resolve(__dirname, '..');
  const results = await updateDirectory(srcDir);
  
  console.log('\nFiles updated:');
  console.log('==============');
  
  if (results.length === 0) {
    console.log('No files needed updating!');
  } else {
    results.forEach(result => {
      console.log(`${result.filePath}`);
    });
    
    console.log('\nTotal files updated:', results.length);
    console.log('\nNext steps:');
    console.log('1. Review the changes to ensure they work as expected');
    console.log('2. Test the application locally');
    console.log('3. Deploy the changes');
  }
}

// Run the script
fixImportPaths();

module.exports = { fixImportPaths };
