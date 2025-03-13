#!/bin/bash

# Script to update AWS Elastic Beanstalk environment variables
# Make sure you have the AWS CLI installed and configured

# Environment name - replace with your actual environment name
EB_ENV_NAME="grey-mongoose-prod"

# Application name - replace with your actual application name
EB_APP_NAME="grey-mongoose"

# Update these values for your production environment
# For Google OAuth callback, we need to use the actual backend URL
API_URL="http://grey-mongoose-prod.eba-asi6kjji.us-west-2.elasticbeanstalk.com:8081"
FRONTEND_URL="https://mindcloud.netlify.app"
# Add an additional variable for the frontend to use in API requests
FRONTEND_API_URL="https://mindcloud.netlify.app"

# Command to update environment variables
echo "Updating environment variables for $EB_ENV_NAME..."
aws elasticbeanstalk update-environment \
  --environment-name $EB_ENV_NAME \
  --application-name $EB_APP_NAME \
  --option-settings \
    "Namespace=aws:elasticbeanstalk:application:environment,OptionName=API_URL,Value=$API_URL" \
    "Namespace=aws:elasticbeanstalk:application:environment,OptionName=FRONTEND_URL,Value=$FRONTEND_URL" \
    "Namespace=aws:elasticbeanstalk:application:environment,OptionName=FRONTEND_API_URL,Value=$FRONTEND_API_URL"

echo "Environment variables updated. Please allow a few minutes for the changes to take effect."
echo "Remember to also update your Google OAuth configuration in the Google Cloud Console:"
echo "1. Go to https://console.cloud.google.com/"
echo "2. Navigate to your project"
echo "3. Go to 'APIs & Services' > 'Credentials'"
echo "4. Edit your OAuth 2.0 Client ID"
echo "5. Update the 'Authorized redirect URIs' to include:"
echo "   - $API_URL/api/auth/google/callback"
