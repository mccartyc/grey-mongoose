#!/bin/bash

# Colors for console output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Setting up AWS CLI and EB CLI ===${NC}\n"

# Install AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${YELLOW}Installing AWS CLI...${NC}"
    curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
    sudo installer -pkg AWSCLIV2.pkg -target /
    rm AWSCLIV2.pkg
    echo -e "${GREEN}AWS CLI installed successfully!${NC}"
else
    echo -e "${GREEN}AWS CLI is already installed.${NC}"
fi

# Install EB CLI
if ! command -v eb &> /dev/null; then
    echo -e "${YELLOW}Installing EB CLI...${NC}"
    pip3 install awsebcli --upgrade --user
    
    # Add to PATH if not already there
    if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bash_profile
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
        export PATH="$HOME/.local/bin:$PATH"
    fi
    
    echo -e "${GREEN}EB CLI installed successfully!${NC}"
    echo -e "${YELLOW}You may need to restart your terminal or run 'source ~/.bash_profile' to use the eb command.${NC}"
else
    echo -e "${GREEN}EB CLI is already installed.${NC}"
fi

# Verify installations
echo -e "\n${BLUE}Verifying installations:${NC}"
echo -e "${YELLOW}AWS CLI version:${NC}"
aws --version
echo -e "\n${YELLOW}EB CLI version:${NC}"
eb --version

echo -e "\n${GREEN}Setup complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Configure AWS CLI with your credentials using 'aws configure'"
echo -e "2. Run the deploy-to-eb.sh script to deploy your application"
