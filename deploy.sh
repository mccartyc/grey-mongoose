#!/bin/bash

# Deploy script for Netlify

# Make script exit if any command fails
set -e

echo "Starting deployment process..."

# Navigate to frontend directory
cd frontend

# Install dependencies
echo "Installing dependencies..."
npm install

# Run predeploy script (updates API URLs and builds the app)
echo "Running predeploy script..."
npm run predeploy

# Deploy to Netlify
echo "Deploying to Netlify..."
npx netlify deploy --prod

echo "Deployment complete!"
