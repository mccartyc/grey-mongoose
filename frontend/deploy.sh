#!/bin/bash

# Clean up previous build
rm -rf build

# Install dependencies
npm install

# Build the app
npm run build

echo "Build completed successfully! Ready to deploy to Netlify."
echo "You can deploy using the Netlify CLI with: netlify deploy"
echo "Or by connecting your GitHub repository to Netlify."
