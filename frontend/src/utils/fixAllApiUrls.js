/**
 * Script to fix all hardcoded localhost URLs in the codebase
 * Run with: node src/utils/fixAllApiUrls.js
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

// Files to exclude from modifications
const excludeFiles = [
  'apiConfig.js',
  'fixApiUrls.js',
  'updateApiUrls.js',
  'fixImportPaths.js',
  'fixAllApiUrls.js'
];

// Function to get the correct relative path to apiConfig
function getRelativePath(filePath, srcDir) {
  const relativePath = path.relative(path.dirname(filePath), path.resolve(srcDir, 'utils'));
  return relativePath.replace(/\\/g, '/'); // Ensure forward slashes for imports
}

// Function to add the createApiInstance import if it doesn't exist
function addApiConfigImport(content, relativePath) {
  if (content.includes("import { createApiInstance } from")) {
    return content; // Already has the import
  }
  
  // Check if it has a different import from apiConfig
  if (content.includes("import { getApiBaseUrl } from")) {
    // Replace with combined import
    return content.replace(
      /import\s+{\s*getApiBaseUrl\s*}\s+from\s+['"](.*?)['"];/,
      `import { getApiBaseUrl, createApiInstance } from '$1';`
    );
  }
  
  // Add new import after other imports
  const importLines = content.match(/import .+?;/g) || [];
  if (importLines.length > 0) {
    const lastImport = importLines[importLines.length - 1];
    const lastImportIndex = content.lastIndexOf(lastImport) + lastImport.length;
    
    return (
      content.slice(0, lastImportIndex) + 
      `\nimport { createApiInstance } from '${relativePath}/apiConfig';` + 
      content.slice(lastImportIndex)
    );
  }
  
  // If no imports found, add at the beginning
  return `import { createApiInstance } from '${relativePath}/apiConfig';\n${content}`;
}

// Function to recursively search and update files
async function updateDirectory(directory, srcDir) {
  const results = [];
  
  try {
    const files = await readdir(directory);
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const fileStat = await stat(filePath);
      
      // Skip excluded directories
      if (fileStat.isDirectory()) {
        if (!excludeDirs.includes(file)) {
          const subResults = await updateDirectory(filePath, srcDir);
          results.push(...subResults);
        }
        continue;
      }
      
      // Only check JavaScript and JSX files
      if (!/\.(js|jsx)$/.test(file)) {
        continue;
      }
      
      // Skip excluded files
      if (excludeFiles.includes(file)) {
        continue;
      }
      
      // Read file content
      let content = await readFile(filePath, 'utf8');
      let originalContent = content;
      
      // Check if file contains hardcoded localhost URLs
      const hasHardcodedUrls = content.includes('http://localhost:5001');
      
      if (hasHardcodedUrls) {
        // Get the relative path for imports
        const relativePath = getRelativePath(filePath, srcDir);
        
        // Add the createApiInstance import if needed
        content = addApiConfigImport(content, relativePath);
        
        // Pattern 1: Direct axios calls to localhost
        content = content.replace(
          /axios\.(get|post|put|delete)\(`http:\/\/localhost:5001(\/api\/[^`]+)`(,\s*{[^}]*})?\)/g,
          (match, method, endpoint, options) => {
            if (options) {
              // Remove Authorization header if present
              const cleanOptions = options.replace(
                /{\s*headers:\s*{\s*Authorization:\s*`Bearer \${user\.token}`[^}]*}\s*}/,
                '{}'
              );
              return `createApiInstance(user.token).${method}(\`${endpoint}\`${cleanOptions})`;
            } else {
              return `createApiInstance(user.token).${method}(\`${endpoint}\`)`;
            }
          }
        );
        
        // Pattern 2: Template literal with process.env fallback
        content = content.replace(
          /axios\.(get|post|put|delete)\(`\${process\.env\.REACT_APP_API_URL \|\| ['"](http:\/\/localhost:5001)['"]}\/api\/([^`]+)`(,\s*{[^}]*})?\)/g,
          (match, method, baseUrl, endpoint, options) => {
            if (options) {
              // Remove Authorization header if present
              const cleanOptions = options.replace(
                /{\s*headers:\s*{\s*Authorization:\s*`Bearer \${user\.token}`[^}]*}\s*}/,
                '{}'
              );
              return `createApiInstance(user.token).${method}(\`/api/${endpoint}\`${cleanOptions})`;
            } else {
              return `createApiInstance(user.token).${method}(\`/api/${endpoint}\`)`;
            }
          }
        );
        
        // Pattern 3: Template string with URL and no axios prefix
        content = content.replace(
          /`http:\/\/localhost:5001(\/api\/[^`]+)`/g,
          (match, endpoint) => {
            return `\`${endpoint}\``;
          }
        );
        
        // Pattern 4: Template string with process.env fallback and no axios prefix
        content = content.replace(
          /`\${process\.env\.REACT_APP_API_URL \|\| ['"](http:\/\/localhost:5001)['"]}\/api\/([^`]+)`/g,
          (match, baseUrl, endpoint) => {
            return `\`/api/${endpoint}\``;
          }
        );
        
        // Pattern 5: Direct string assignment
        content = content.replace(
          /const\s+apiUrl\s*=\s*process\.env\.REACT_APP_API_URL\s*\|\|\s*['"](http:\/\/localhost:5001)['"];/g,
          (match, baseUrl) => {
            return `const apiUrl = getApiBaseUrl();`;
          }
        );
        
        // If content was modified, write it back
        if (content !== originalContent) {
          await writeFile(filePath, content, 'utf8');
          results.push({
            filePath,
            fixed: true
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error updating directory ${directory}:`, error);
  }
  
  return results;
}

// Main function
async function fixAllApiUrls() {
  console.log('Fixing all hardcoded API URLs in the codebase...');
  
  const srcDir = path.resolve(__dirname, '..');
  const results = await updateDirectory(srcDir, srcDir);
  
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
fixAllApiUrls();

module.exports = { fixAllApiUrls };
