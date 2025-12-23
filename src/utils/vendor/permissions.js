/**
 * Get vendor permissions from localStorage or JWT token
 */
export const getVendorPermissions = () => {
  try {
    // Try to get from localStorage first
    const userStr = localStorage.getItem('vendor_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      
      // Check direct permissions array
      if (user.permissions && Array.isArray(user.permissions)) {
        return user.permissions;
      }
      
      // Check if permissions are nested in role object (for vendor_staff)
      if (user.role && typeof user.role === 'object' && user.role.permissions && Array.isArray(user.role.permissions)) {
        return user.role.permissions;
      }
    }
    
    // Try to get from token (decode JWT)
    const token = localStorage.getItem('vendor_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.permissions && Array.isArray(payload.permissions)) {
          return payload.permissions;
        }
      } catch (e) {
        // Token decode failed, ignore
      }
    }
  } catch (error) {
    console.error('Error getting vendor permissions:', error);
  }
  return [];
};

/**
 * Check if vendor has a specific permission
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export const hasVendorPermission = (permission) => {
  const userPermissions = getVendorPermissions();
  
  // Dashboard is allowed for all authenticated vendor users (like admin)
  if (permission === 'vendor_view_dashboard') {
    return true;
  }
  
  // Vendor owners have all permissions
  const userStr = localStorage.getItem('vendor_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      // If role is 'vendor' (not 'vendor_staff'), they have all permissions
      if (user.role === 'vendor') {
        return true;
      }
    } catch (e) {
      // Ignore parse error
    }
  }
  
  // If no permissions array and role is vendor, grant all access
  if (userPermissions.length === 0) {
    const userStr = localStorage.getItem('vendor_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'vendor') {
          return true; // Vendor owner has all permissions
        }
      } catch (e) {
        // Ignore
      }
    }
  }
  
  // For vendor_staff, check if they have the specific permission
  // Check specific permission
  return userPermissions.includes(permission);
};

/**
 * Check if vendor has any of the provided permissions
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean}
 */
export const hasAnyVendorPermission = (permissions) => {
  if (!permissions || permissions.length === 0) return false;
  return permissions.some(permission => hasVendorPermission(permission));
};

/**
 * Check if vendor has all of the provided permissions
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean}
 */
export const hasAllVendorPermissions = (permissions) => {
  if (!permissions || permissions.length === 0) return false;
  return permissions.every(permission => hasVendorPermission(permission));
};

/**
 * Get vendor role from localStorage
 */
export const getVendorRole = () => {
  try {
    const userStr = localStorage.getItem('vendor_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.role || 'vendor';
    }
  } catch (e) {
    // Ignore
  }
  return 'vendor';
};

/**
 * Check if user is vendor owner (not vendor_staff)
 */
export const isVendorOwner = () => {
  const role = getVendorRole();
  return role === 'vendor';
};

