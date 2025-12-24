/**
 * Get user permissions from localStorage
 */
export const getUserPermissions = () => {
  try {
    const permissionsStr = localStorage.getItem('admin_permissions');
    if (permissionsStr) {
      return JSON.parse(permissionsStr);
    }
  } catch (error) {
    console.error('Error parsing permissions:', error);
  }
  return [];
};

/**
 * Check if user has a specific permission
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export const hasPermission = (permission) => {
  const userPermissions = getUserPermissions();
  
  // Admin has all permissions (check for '*' or 'admin' role)
  if (userPermissions.includes('*') || userPermissions.includes('admin')) {
    return true;
  }
  
  // Check specific permission
  return userPermissions.includes(permission);
};

/**
 * Check if user has any of the provided permissions
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean}
 */
export const hasAnyPermission = (permissions) => {
  if (!permissions || permissions.length === 0) return false;
  return permissions.some(permission => hasPermission(permission));
};

/**
 * Check if user has all of the provided permissions
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean}
 */
export const hasAllPermissions = (permissions) => {
  if (!permissions || permissions.length === 0) return false;
  return permissions.every(permission => hasPermission(permission));
};

/**
 * Get user role from localStorage
 */
export const getUserRole = () => {
  return localStorage.getItem('admin_role') || 'admin';
};

/**
 * Check if user is admin
 */
export const isAdmin = () => {
  const role = getUserRole();
  const permissions = getUserPermissions();
  return role === 'admin' || permissions.includes('*') || permissions.includes('admin');
};




