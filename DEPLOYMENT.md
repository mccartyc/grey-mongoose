# Deployment Guide

This guide explains how to deploy your application to Netlify (frontend) and set up your backend separately.

## Frontend Deployment to Netlify

### Prerequisites
- GitHub, GitLab, or Bitbucket account (to connect to Netlify)
- Netlify account (free tier available)
- Node.js and npm installed locally

### Option 1: Deploy via Netlify UI

1. **Prepare your code**
   - Ensure all changes are committed to your repository
   - Make sure your frontend code is ready for production

2. **Create a Netlify account**
   - Sign up at [netlify.com](https://www.netlify.com/)

3. **Connect your repository**
   - Click "New site from Git"
   - Connect to your Git provider (GitHub, GitLab, etc.)
   - Select your repository

4. **Configure build settings**
   - Build command: `npm run build`
   - Publish directory: `build`

5. **Set up environment variables**
   - Go to Site settings > Build & deploy > Environment
   - Add the following variables:
     - `REACT_APP_API_URL`: URL to your backend API (e.g., https://your-backend-api.com)
     - `REACT_APP_ENCRYPTION_KEY`: Your encryption key (keep this secure)

6. **Deploy your site**
   - Click "Deploy site"
   - Netlify will build and deploy your application

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Authenticate with Netlify**
   ```bash
   netlify login
   ```

3. **Run the update script to fix hardcoded URLs**
   ```bash
   cd frontend
   npm run update-api-urls
   ```

4. **Build your application**
   ```bash
   npm run build
   ```

5. **Initialize Netlify site**
   ```bash
   netlify init
   ```
   - Follow the prompts to create a new site or connect to an existing one

6. **Set environment variables**
   ```bash
   netlify env:set REACT_APP_API_URL https://your-backend-api.com
   netlify env:set REACT_APP_ENCRYPTION_KEY your-encryption-key
   ```

7. **Deploy to production**
   ```bash
   netlify deploy --prod
   ```

## Backend Deployment

Your backend needs to be deployed separately. Here are some options:

### Option 1: Heroku

1. **Create a Heroku account**
   - Sign up at [heroku.com](https://www.heroku.com/)

2. **Install Heroku CLI**
   ```bash
   brew install heroku/brew/heroku
   ```

3. **Login to Heroku**
   ```bash
   heroku login
   ```

4. **Create a new Heroku app**
   ```bash
   cd backend
   heroku create your-app-name
   ```

5. **Set environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-jwt-secret
   # Add all other environment variables from your .env file
   ```

6. **Deploy to Heroku**
   ```bash
   git subtree push --prefix backend heroku main
   ```

### Option 2: AWS Elastic Beanstalk

1. **Install AWS CLI and EB CLI**
   ```bash
   pip install awscli
   pip install awsebcli
   ```

2. **Configure AWS credentials**
   ```bash
   aws configure
   ```

3. **Initialize EB application**
   ```bash
   cd backend
   eb init
   ```

4. **Create an environment**
   ```bash
   eb create your-environment-name
   ```

5. **Set environment variables**
   ```bash
   eb setenv NODE_ENV=production JWT_SECRET=your-jwt-secret
   # Add all other environment variables from your .env file
   ```

6. **Deploy your application**
   ```bash
   eb deploy
   ```

## Connecting Frontend and Backend

1. **Update your frontend environment variables**
   - Set `REACT_APP_API_URL` to your deployed backend URL
   - This ensures all API requests go to the correct backend

2. **Configure CORS on your backend**
   - Make sure your backend allows requests from your Netlify domain
   - Update your CORS configuration in your backend code

3. **Test the connection**
   - Verify that your frontend can successfully communicate with your backend

## Troubleshooting

### Common Issues

1. **API requests failing**
   - Check that `REACT_APP_API_URL` is set correctly
   - Verify CORS is properly configured on your backend
   - Ensure your backend is running and accessible

2. **Build failures on Netlify**
   - Check Netlify build logs for errors
   - Verify your build command and publish directory are correct
   - Make sure all dependencies are properly installed

3. **Routing issues (404 errors)**
   - Verify that the `_redirects` file is in your `public` directory
   - Check that `netlify.toml` is properly configured

4. **Environment variables not working**
   - Remember that environment variables in Create React App are embedded during build time
   - You need to rebuild your application after changing environment variables

## Security Considerations

1. **Never commit sensitive information**
   - Keep API keys, secrets, and credentials in environment variables
   - Do not hardcode sensitive information in your code

2. **Use HTTPS for all API calls**
   - Ensure your backend API uses HTTPS
   - Update your frontend to use HTTPS URLs for all API calls

3. **Implement proper authentication**
   - Use secure authentication methods (JWT, OAuth, etc.)
   - Set secure and HTTP-only flags on cookies

4. **Regular updates**
   - Keep your dependencies updated to patch security vulnerabilities
   - Regularly update your application with security fixes
