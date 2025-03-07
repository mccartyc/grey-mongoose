# Netlify Deployment Guide

This guide provides step-by-step instructions for deploying the MindCloud application to Netlify and troubleshooting common issues.

## Prerequisites

1. A Netlify account
2. The Netlify CLI installed (`npm install -g netlify-cli`)
3. Git repository with your code

## Deployment Steps

### 1. Set Up Environment Variables in Netlify

Before deploying, you need to set up the following environment variables in the Netlify dashboard:

1. Go to your Netlify dashboard
2. Select your site (or create a new one)
3. Navigate to **Site settings** > **Build & deploy** > **Environment**
4. Click **Edit variables**
5. Add the following variables:
   - `REACT_APP_API_URL`: Set to your backend API URL (e.g., `https://mindcloud-beta-api.herokuapp.com`)
   - `REACT_APP_ENCRYPTION_KEY`: Your encryption key
   - `REACT_APP_ENCRYPTION_IV`: Your encryption initialization vector
   - `CI`: Set to `false` (to prevent warnings from being treated as errors)
6. Click **Save**

### 2. Deploy Using Netlify CLI

You can deploy directly from your local machine using the Netlify CLI:

```bash
# Navigate to your frontend directory
cd frontend

# Login to Netlify (if not already logged in)
netlify login

# Initialize Netlify (if not already initialized)
netlify init

# Deploy to production
netlify deploy --prod
```

### 3. Configure Continuous Deployment (Optional)

For automatic deployments when you push to your repository:

1. Go to your Netlify dashboard
2. Select your site
3. Navigate to **Site settings** > **Build & deploy** > **Continuous Deployment**
4. Connect to your Git provider (GitHub, GitLab, or Bitbucket)
5. Select your repository
6. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `CI=false npm run build`
   - **Publish directory**: `build`
7. Click **Deploy site**

## Troubleshooting

### Login Issues

If you're experiencing login issues with your deployed application:

1. **Check CORS Configuration**: 
   - Ensure your backend CORS settings allow requests from your Netlify domain
   - Your backend should have `https://mindcloud-beta.netlify.app` in its allowed origins

2. **Test API Connection**:
   - Visit `/api-test` on your deployed site to run diagnostic tests
   - This will show if your application can connect to the backend API

3. **Check Environment Variables**:
   - Verify that all required environment variables are set in Netlify
   - Check the browser console for any environment-related errors

4. **Cookie Issues**:
   - If using cookie-based authentication, ensure cookies are being set with the correct domain
   - Check that your backend is setting the appropriate CORS headers for credentials

### Build Failures

If your build is failing on Netlify:

1. **CI=false Issue**:
   - Ensure `CI=false` is set in your build command or environment variables
   - This prevents warnings from being treated as errors

2. **Node Version**:
   - Set `NODE_VERSION=18` in your environment variables if you're using Node.js features that require a specific version

3. **Check Build Logs**:
   - Review the build logs in Netlify for specific errors
   - Look for missing dependencies or environment variables

## Testing Deployed Application

After deployment, test your application thoroughly:

1. **Basic Navigation**: Ensure all routes work correctly
2. **Authentication**: Test login, logout, and protected routes
3. **API Connectivity**: Verify that the application can communicate with your backend
4. **Role-Based Access**: Test that role-based access control works as expected

## Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Create React App Deployment Guide](https://create-react-app.dev/docs/deployment/)
- [Troubleshooting CORS Issues](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors)
