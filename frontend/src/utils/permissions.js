/**
 * Permissions utility for role-based access control
 * 
 * This file defines the permissions for each role and provides utility functions
 * to check if a user has specific permissions.
 */

// Define permissions for each role
const rolePermissions = {
  // Internal Role (Highest Permission Level)
  Internal: {
    viewAllTenants: true,
    createTenants: true,
    createUsers: true,
    viewApiCalls: true,
    createClients: false, // Internal users should not have the ability to create new clients
  },
  
  // Admin Role (Tenant-Specific)
  Admin: {
    viewAssignedTenant: true,
    viewTenantUsers: true,
    createTenantUsers: true,
    createClients: true,
    editClients: true,
    viewClients: true,
    viewApiCalls: true,
  },
  
  // User Role (Lowest Permission Level)
  User: {
    viewAssignedTenant: false,
    viewTenantUsers: false,
    createTenantUsers: false,
    createClients: true,
    editClients: true,
    viewClients: true,
    viewApiCalls: false,
  }
};

/**
 * Check if a user has a specific permission
 * @param {Object} user - The user object from AuthContext
 * @param {String} permission - The permission to check
 * @returns {Boolean} - Whether the user has the permission
 */
export const hasPermission = (user, permission) => {
  if (!user || !user.role) return false;
  
  const role = user.role;
  return rolePermissions[role] && rolePermissions[role][permission] === true;
};

/**
 * Check if a user has any of the specified permissions
 * @param {Object} user - The user object from AuthContext
 * @param {Array} permissions - Array of permissions to check
 * @returns {Boolean} - Whether the user has any of the permissions
 */
export const hasAnyPermission = (user, permissions) => {
  return permissions.some(permission => hasPermission(user, permission));
};

/**
 * Check if a user has all of the specified permissions
 * @param {Object} user - The user object from AuthContext
 * @param {Array} permissions - Array of permissions to check
 * @returns {Boolean} - Whether the user has all of the permissions
 */
export const hasAllPermissions = (user, permissions) => {
  return permissions.every(permission => hasPermission(user, permission));
};

/**
 * Check if a user has access to a specific route
 * @param {Object} user - The user object from AuthContext
 * @param {String} route - The route path
 * @returns {Boolean} - Whether the user has access to the route
 */
export const canAccessRoute = (user, route) => {
  if (!user || !user.role) return false;
  
  // Define route access by role
  const routeAccess = {
    '/dashboard': ['Internal', 'Admin', 'User'],
    '/clients': ['Internal', 'Admin', 'User'],
    '/sessions': ['Internal', 'Admin', 'User'],
    '/calendar': ['Internal', 'Admin', 'User'],
    '/invoicing': ['Internal', 'Admin', 'User'],
    '/settings': ['Internal', 'Admin', 'User'],
    '/admin': ['Internal', 'Admin'],
    '/tenants': ['Internal'],
  };
  
  // Check for exact route match
  if (routeAccess[route] && routeAccess[route].includes(user.role)) {
    return true;
  }
  
  // Check for client-specific routes (e.g., /clients/:id/overview)
  if (route.startsWith('/clients/') && 
      (route.includes('/overview') || 
       route.includes('/intake') || 
       route.includes('/health-assessment') || 
       route.includes('/health-plan') || 
       route.includes('/new-session'))) {
    return ['Internal', 'Admin', 'User'].includes(user.role);
  }
  
  // Check for session detail routes (e.g., /sessions/:id)
  if (route.startsWith('/sessions/') && !route.includes('/newsession')) {
    return ['Internal', 'Admin', 'User'].includes(user.role);
  }

  // Check for new session route
  if (route === '/sessions/newsession' || route.startsWith('/clients/') && route.includes('/new-session')) {
    return ['Internal', 'Admin', 'User'].includes(user.role);
  }
  
  return false;
};

/**
 * Check if API calls should be visible in the navigation bar
 * @param {Object} user - The user object from AuthContext
 * @returns {Boolean} - Whether API calls should be visible
 */
export const shouldShowApiCalls = (user) => {
  return hasPermission(user, 'viewApiCalls');
};

export default {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessRoute,
  shouldShowApiCalls,
};
