#!/bin/bash

# Colors for console output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== MindCloud Netlify Deployment Tool ===${NC}\n"

# Check if netlify-cli is installed
if ! command -v netlify &> /dev/null; then
    echo -e "${YELLOW}Netlify CLI not found. Installing...${NC}"
    npm install -g netlify-cli
fi

# Check if user is logged in to Netlify
if ! netlify status &> /dev/null; then
    echo -e "${YELLOW}You need to log in to Netlify first.${NC}"
    netlify login
fi

# Set environment variables for the build
export CI=false

# Ask for API URL
echo -e "${YELLOW}Enter the API URL for production [https://mindcloud-beta-api.herokuapp.com]:${NC}"
read API_URL
API_URL=${API_URL:-https://mindcloud-beta-api.herokuapp.com}

# Update .env.production with the new API URL
ENV_PROD_FILE=".env.production"
if [ -f "$ENV_PROD_FILE" ]; then
    # Update existing API URL
    sed -i '' "s|REACT_APP_API_URL=.*|REACT_APP_API_URL=$API_URL|g" "$ENV_PROD_FILE"
    echo -e "${GREEN}Updated $ENV_PROD_FILE with API URL: $API_URL${NC}"
else
    echo -e "${RED}Error: $ENV_PROD_FILE not found.${NC}"
    exit 1
fi

# Build the application
echo -e "\n${BLUE}Building the application...${NC}"
npm run build

# Deploy to Netlify
echo -e "\n${BLUE}Deploying to Netlify...${NC}"
netlify deploy --prod

echo -e "\n${GREEN}Deployment completed!${NC}"
echo -e "${YELLOW}Don't forget to check your environment variables in the Netlify dashboard:${NC}"
echo -e "  - REACT_APP_API_URL"
echo -e "  - REACT_APP_ENCRYPTION_KEY"
echo -e "  - REACT_APP_ENCRYPTION_IV"
echo -e "  - CI=false"

echo -e "\n${BLUE}Visit your deployed site and test the following:${NC}"
echo -e "  1. Navigate to /api-test to check API connectivity"
echo -e "  2. Navigate to /test-login to test login functionality"
echo -e "  3. Check browser console for any errors"
