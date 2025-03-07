#!/bin/bash

# Colors for console output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== MindCloud AWS Elastic Beanstalk Deployment Tool ===${NC}\n"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI not found. Please run the setup-aws-tools.sh script first.${NC}"
    exit 1
fi

# Check if EB CLI is installed
if ! command -v eb &> /dev/null; then
    echo -e "${RED}EB CLI not found. Please run the setup-aws-tools.sh script first.${NC}"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${YELLOW}AWS CLI is not configured. Running aws configure...${NC}"
    aws configure
fi

# Navigate to the backend directory
cd "$(dirname "$0")/.." || exit

# Ask for application name
echo -e "${YELLOW}Enter your application name [mindcloud-api]:${NC}"
read APP_NAME
APP_NAME=${APP_NAME:-mindcloud-api}

# Ask for environment name
echo -e "${YELLOW}Enter your environment name [production]:${NC}"
read ENV_NAME
ENV_NAME=${ENV_NAME:-production}

# Ask for instance type
echo -e "${YELLOW}Choose instance type:${NC}"
echo -e "1) t3.micro (2 vCPU, 1GB RAM) - Good for development (~$8-10/month)"
echo -e "2) t3.small (2 vCPU, 2GB RAM) - Good for small production (~$15-20/month)"
echo -e "3) t3.medium (2 vCPU, 4GB RAM) - Better for production (~$30-40/month)"
read -p "Enter your choice [1]: " INSTANCE_CHOICE
INSTANCE_CHOICE=${INSTANCE_CHOICE:-1}

case $INSTANCE_CHOICE in
    1) INSTANCE_TYPE="t3.micro" ;;
    2) INSTANCE_TYPE="t3.small" ;;
    3) INSTANCE_TYPE="t3.medium" ;;
    *) INSTANCE_TYPE="t3.micro" ;;
esac

echo -e "${GREEN}Using instance type: $INSTANCE_TYPE${NC}"

# Check if .elasticbeanstalk directory exists
if [ -d ".elasticbeanstalk" ]; then
    echo -e "${YELLOW}Elastic Beanstalk configuration already exists. Do you want to create a new application? [y/N]:${NC}"
    read CREATE_NEW
    CREATE_NEW=${CREATE_NEW:-n}
    
    if [ "$CREATE_NEW" = "y" ] || [ "$CREATE_NEW" = "Y" ]; then
        echo -e "${YELLOW}Creating new Elastic Beanstalk application...${NC}"
        rm -rf .elasticbeanstalk
        eb init $APP_NAME --platform node.js --region us-west-2
    else
        echo -e "${GREEN}Using existing Elastic Beanstalk configuration.${NC}"
    fi
else
    echo -e "${YELLOW}Initializing Elastic Beanstalk application...${NC}"
    eb init $APP_NAME --platform node.js --region us-west-2
fi

# Check if environment exists
if eb status $ENV_NAME &> /dev/null; then
    echo -e "${GREEN}Environment $ENV_NAME exists. Will deploy to existing environment.${NC}"
else
    echo -e "${YELLOW}Environment $ENV_NAME does not exist. Creating new environment...${NC}"
    
    # Ask if load balancer is needed
    echo -e "${YELLOW}Do you want to create a load-balanced environment? This costs ~$16/month extra but provides better reliability. [y/N]:${NC}"
    read LOAD_BALANCED
    LOAD_BALANCED=${LOAD_BALANCED:-n}
    
    if [ "$LOAD_BALANCED" = "y" ] || [ "$LOAD_BALANCED" = "Y" ]; then
        echo -e "${YELLOW}Creating load-balanced environment...${NC}"
        eb create $ENV_NAME --instance-type $INSTANCE_TYPE --elb-type application
    else
        echo -e "${YELLOW}Creating single-instance environment...${NC}"
        eb create $ENV_NAME --instance-type $INSTANCE_TYPE --single
    fi
fi

# Ask for MongoDB URI
echo -e "${YELLOW}Enter your MongoDB Atlas connection string:${NC}"
read -s MONGO_URI

if [ -z "$MONGO_URI" ]; then
    echo -e "${RED}MongoDB URI is required.${NC}"
    exit 1
fi

# Set environment variables
echo -e "${YELLOW}Setting environment variables...${NC}"
eb setenv NODE_ENV=production MONGODB_URI="$MONGO_URI"

# Check for encryption keys in .env
if [ -f ".env" ]; then
    ENCRYPTION_KEY=$(grep ENCRYPTION_KEY .env | cut -d '=' -f2)
    ENCRYPTION_IV=$(grep ENCRYPTION_IV .env | cut -d '=' -f2)
    
    if [ ! -z "$ENCRYPTION_KEY" ] && [ ! -z "$ENCRYPTION_IV" ]; then
        echo -e "${GREEN}Found encryption keys in .env file. Setting in Elastic Beanstalk...${NC}"
        eb setenv ENCRYPTION_KEY="$ENCRYPTION_KEY" ENCRYPTION_IV="$ENCRYPTION_IV"
    else
        echo -e "${YELLOW}Encryption keys not found in .env file.${NC}"
        echo -e "${YELLOW}Enter your encryption key:${NC}"
        read -s ENCRYPTION_KEY
        echo -e "${YELLOW}Enter your encryption IV:${NC}"
        read -s ENCRYPTION_IV
        
        eb setenv ENCRYPTION_KEY="$ENCRYPTION_KEY" ENCRYPTION_IV="$ENCRYPTION_IV"
    fi
fi

# Create .ebignore file to exclude unnecessary files
echo -e "${YELLOW}Creating .ebignore file...${NC}"
cat > .ebignore << EOL
node_modules
npm-debug.log
.git
.gitignore
.env
.env.*
*.zip
*.log
EOL

# Deploy to Elastic Beanstalk
echo -e "${BLUE}Deploying to Elastic Beanstalk...${NC}"
eb deploy $ENV_NAME

# Get the environment URL
ENV_URL=$(eb status $ENV_NAME | grep CNAME | awk '{print $2}')

echo -e "\n${GREEN}Deployment completed!${NC}"
echo -e "${YELLOW}Your API is now available at: http://$ENV_URL${NC}"

# Update frontend environment variables
echo -e "\n${YELLOW}Do you want to update your frontend environment variables with the new API URL? [y/n]:${NC}"
read UPDATE_FRONTEND
UPDATE_FRONTEND=${UPDATE_FRONTEND:-y}

if [ "$UPDATE_FRONTEND" = "y" ]; then
    FRONTEND_ENV_PROD="../frontend/.env.production"
    if [ -f "$FRONTEND_ENV_PROD" ]; then
        echo -e "${GREEN}Updating $FRONTEND_ENV_PROD with new API URL...${NC}"
        sed -i '' "s|REACT_APP_API_URL=.*|REACT_APP_API_URL=http://$ENV_URL|g" "$FRONTEND_ENV_PROD"
        echo -e "${GREEN}Updated $FRONTEND_ENV_PROD with API URL: http://$ENV_URL${NC}"
    else
        echo -e "${RED}Error: $FRONTEND_ENV_PROD not found.${NC}"
    fi
fi

echo -e "\n${BLUE}Next steps:${NC}"
echo -e "1. Test your API by visiting: http://$ENV_URL/api/health"
echo -e "2. Deploy your frontend to Netlify with the updated API URL"
echo -e "3. Set up HTTPS for your API (recommended)"
echo -e "4. Monitor your application with: eb health $ENV_NAME"
