#!/bin/bash

# Colors for console output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== MindCloud Heroku Deployment Tool ===${NC}\n"

# Check if heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo -e "${YELLOW}Heroku CLI not found. Installing...${NC}"
    brew tap heroku/brew && brew install heroku
fi

# Check if user is logged in to Heroku
if ! heroku whoami &> /dev/null; then
    echo -e "${YELLOW}You need to log in to Heroku first.${NC}"
    heroku login
fi

# Ask for app name
echo -e "${YELLOW}Enter your Heroku app name [mindcloud-beta-api]:${NC}"
read APP_NAME
APP_NAME=${APP_NAME:-mindcloud-beta-api}

# Check if app exists
if heroku apps:info --app $APP_NAME &> /dev/null; then
    echo -e "${GREEN}App $APP_NAME exists. Will deploy to existing app.${NC}"
else
    echo -e "${YELLOW}App $APP_NAME does not exist. Creating new app...${NC}"
    heroku create $APP_NAME
fi

# Add MongoDB add-on or prompt for MongoDB URI
echo -e "${YELLOW}Do you want to use MongoDB Atlas (recommended) or Heroku MongoDB add-on? [atlas/heroku]:${NC}"
read DB_CHOICE
DB_CHOICE=${DB_CHOICE:-atlas}

if [ "$DB_CHOICE" = "heroku" ]; then
    echo -e "${YELLOW}Adding MongoDB add-on to Heroku app...${NC}"
    heroku addons:create mongolab:sandbox --app $APP_NAME
else
    echo -e "${YELLOW}Enter your MongoDB Atlas connection string:${NC}"
    read -s MONGO_URI
    
    if [ -z "$MONGO_URI" ]; then
        echo -e "${RED}MongoDB URI is required for Atlas option.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Setting MongoDB URI in Heroku config...${NC}"
    heroku config:set MONGODB_URI="$MONGO_URI" --app $APP_NAME
fi

# Set other environment variables
echo -e "${YELLOW}Setting other environment variables...${NC}"
heroku config:set NODE_ENV="production" --app $APP_NAME

# Check for encryption keys in .env
if [ -f "../.env" ]; then
    ENCRYPTION_KEY=$(grep ENCRYPTION_KEY ../.env | cut -d '=' -f2)
    ENCRYPTION_IV=$(grep ENCRYPTION_IV ../.env | cut -d '=' -f2)
    
    if [ ! -z "$ENCRYPTION_KEY" ] && [ ! -z "$ENCRYPTION_IV" ]; then
        echo -e "${GREEN}Found encryption keys in .env file. Setting in Heroku...${NC}"
        heroku config:set ENCRYPTION_KEY="$ENCRYPTION_KEY" --app $APP_NAME
        heroku config:set ENCRYPTION_IV="$ENCRYPTION_IV" --app $APP_NAME
    else
        echo -e "${YELLOW}Encryption keys not found in .env file.${NC}"
        echo -e "${YELLOW}Enter your encryption key:${NC}"
        read -s ENCRYPTION_KEY
        echo -e "${YELLOW}Enter your encryption IV:${NC}"
        read -s ENCRYPTION_IV
        
        heroku config:set ENCRYPTION_KEY="$ENCRYPTION_KEY" --app $APP_NAME
        heroku config:set ENCRYPTION_IV="$ENCRYPTION_IV" --app $APP_NAME
    fi
fi

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}Initializing git repository...${NC}"
    git init
    git add .
    git commit -m "Initial commit for Heroku deployment"
fi

# Add Heroku remote
echo -e "${YELLOW}Adding Heroku remote...${NC}"
heroku git:remote -a $APP_NAME

# Deploy to Heroku
echo -e "${BLUE}Deploying to Heroku...${NC}"
git push heroku master

echo -e "\n${GREEN}Deployment completed!${NC}"
echo -e "${YELLOW}Your API is now available at: https://$APP_NAME.herokuapp.com${NC}"

# Update frontend environment variables
echo -e "\n${YELLOW}Do you want to update your frontend environment variables with the new API URL? [y/n]:${NC}"
read UPDATE_FRONTEND
UPDATE_FRONTEND=${UPDATE_FRONTEND:-y}

if [ "$UPDATE_FRONTEND" = "y" ]; then
    FRONTEND_ENV_PROD="../frontend/.env.production"
    if [ -f "$FRONTEND_ENV_PROD" ]; then
        echo -e "${GREEN}Updating $FRONTEND_ENV_PROD with new API URL...${NC}"
        sed -i '' "s|REACT_APP_API_URL=.*|REACT_APP_API_URL=https://$APP_NAME.herokuapp.com|g" "$FRONTEND_ENV_PROD"
        echo -e "${GREEN}Updated $FRONTEND_ENV_PROD with API URL: https://$APP_NAME.herokuapp.com${NC}"
    else
        echo -e "${RED}Error: $FRONTEND_ENV_PROD not found.${NC}"
    fi
fi

echo -e "\n${BLUE}Next steps:${NC}"
echo -e "1. Test your API by visiting: https://$APP_NAME.herokuapp.com/api/health"
echo -e "2. Deploy your frontend to Netlify with the updated API URL"
echo -e "3. Check your application logs with: heroku logs --tail --app $APP_NAME"
