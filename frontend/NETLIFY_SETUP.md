# Netlify Deployment Setup

This document provides instructions for setting up the MindCloud application on Netlify.

## Environment Variables

The application requires the following environment variables to be set in the Netlify dashboard:

1. `REACT_APP_API_URL`: The URL of your backend API
   - Example: `https://mindcloud-beta-api.herokuapp.com`

2. `REACT_APP_ENCRYPTION_KEY`: The encryption key for secure data
   - This should match the key used by your backend

3. `REACT_APP_ENCRYPTION_IV`: The initialization vector for encryption
   - This should match the IV used by your backend

## Setting Up Environment Variables in Netlify

1. Go to your Netlify dashboard
2. Select your site
3. Navigate to **Site settings** > **Build & deploy** > **Environment**
4. Click **Edit variables**
5. Add each of the variables listed above with their corresponding values
6. Click **Save**

## Build Settings

The application is configured to use the following build settings:

- **Build command**: `npm run build`
- **Publish directory**: `build`

These settings are already configured in the `netlify.toml` file at the root of the project.

## Handling React Router

The application uses React Router for client-side routing. The necessary redirects are already configured in the `netlify.toml` file:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This ensures that all routes are handled by the React application.

## Troubleshooting

If you encounter issues with the deployed application:

1. **API Connection Issues**: 
   - Check that the `REACT_APP_API_URL` is correct
   - Ensure your backend CORS settings allow requests from your Netlify domain
   - Visit `/api-test` on your deployed site to run diagnostic tests

2. **Login Issues**:
   - Check that authentication cookies are being set correctly
   - Ensure your backend is properly handling authentication requests
   - Visit `/test-login` on your deployed site to test login functionality

3. **Build Failures**:
   - Check the build logs in Netlify for specific errors
   - Ensure all dependencies are properly installed
   - Verify that environment variables are correctly set

## Local Development vs. Production

The application uses different environment files for local development and production:

- `.env`: Used for local development
- `.env.production`: Used for production builds

When deploying to Netlify, the environment variables set in the Netlify dashboard will override those in the `.env.production` file.
