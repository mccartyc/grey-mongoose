# MindCloud Application

MindCloud is a comprehensive practice management solution for mental health professionals, providing tools for client management, session tracking, scheduling, and more.

## Project Structure

- `/frontend` - React-based frontend application
- `/backend` - Node.js/Express backend API

## Deployment Instructions

### Netlify Deployment

The frontend application is configured to deploy to Netlify. Follow these steps to deploy:

1. **Set up environment variables in Netlify**:
   - Go to your Netlify site dashboard
   - Navigate to Site settings > Build & deploy > Environment
   - Add the following environment variables:
     - `REACT_APP_API_URL`: Your backend API URL (e.g., https://your-api-domain.com)
     - `REACT_APP_ENCRYPTION_KEY`: Your encryption key for sensitive data

2. **Deploy using the deploy script**:
   ```bash
   ./deploy.sh
   ```
   This script will:
   - Install dependencies
   - Run the predeploy script (update API URLs and build the app)
   - Deploy to Netlify

3. **Manual deployment**:
   If you prefer to deploy manually:
   ```bash
   cd frontend
   npm install
   npm run predeploy
   npx netlify deploy --prod
   ```

### Configuration Files

- `netlify.toml` - Contains build settings for Netlify
- `.env.production` - Production environment variables (values are overridden by Netlify environment variables)
- `frontend/public/_redirects` - URL redirect rules for the SPA

## Role-Based Access Control

The application implements role-based access control with three user roles:

1. **Internal** - Full administrative access
   - Can access Admin Panel
   - Can create/edit/delete tenants
   - Can create users with any role
   - Can view API Call Counter
   - Can see and manage all tenants

2. **Admin** - Administrative access within their tenant
   - Can access Admin Panel
   - Cannot create/edit/delete tenants
   - Can only create users with Admin and User roles
   - Cannot view API Call Counter
   - Can only see their own tenant

3. **User** - Basic access
   - Cannot access Admin Panel
   - Cannot create other users
   - Cannot view API Call Counter
   - Can only see their own tenant