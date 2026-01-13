/**
 * Utility function to clear all authentication data and logout user
 * This ensures complete cleanup of all user-related data from localStorage
 */

export const clearAllAuthData = () => {
  // Clear vendor auth data
  localStorage.removeItem('vendor_token');
  localStorage.removeItem('vendor_user');
  
  // Clear admin auth data
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_role');
  localStorage.removeItem('admin_permissions');
  localStorage.removeItem('admin_user');
  
  // Clear customer auth data
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Clear any other potential auth-related data
  localStorage.removeItem('fcmToken');
  localStorage.removeItem('userRole');
  
  // Dispatch logout events for all contexts
  window.dispatchEvent(new CustomEvent('userLogout'));
  window.dispatchEvent(new CustomEvent('vendorLogout'));
  window.dispatchEvent(new CustomEvent('adminLogout'));
};

/**
 * Force logout and redirect to appropriate login page
 * @param {string} reason - Reason for logout (e.g., 'blocked', 'expired')
 * @param {string} redirectPath - Path to redirect to (optional)
 */
export const forceLogout = (reason = 'session_expired', redirectPath = null) => {
  // Clear all auth data
  clearAllAuthData();
  
  // Determine redirect path based on current location or provided path
  let loginPath = '/';
  
  if (redirectPath) {
    loginPath = redirectPath;
  } else if (window.location.pathname.startsWith('/vendor')) {
    loginPath = '/vendor/login';
  } else if (window.location.pathname.startsWith('/admin')) {
    loginPath = '/admin/login';
  } else {
    loginPath = '/';
  }
  
  // Don't redirect if we're already on the login page (prevent infinite loops)
  const currentPath = window.location.pathname;
  if (currentPath === loginPath || currentPath.includes('/login')) {
    // Already on login page, just clear data and reload
    window.location.reload();
    return;
  }
  
  // Force immediate redirect (don't use navigate as it might not work in interceptors)
  // Use replace to prevent back button issues
  window.location.replace(loginPath);
};

