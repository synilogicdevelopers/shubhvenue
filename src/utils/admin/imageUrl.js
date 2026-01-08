/**
 * Get the base URL for images (without /api)
 */
export const getImageBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'https://shubhvenue.com/api';
  // Remove /api from the end if present
  return apiUrl.replace('/api', '');
};

/**
 * Get full image URL from a path
 * @param {string} imagePath - Image path (e.g., /uploads/venues/image.jpg)
 * @returns {string} Full image URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  
  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's a relative path starting with /uploads, add base URL
  if (imagePath.startsWith('/uploads/') || imagePath.startsWith('/uploads')) {
    const baseUrl = getImageBaseUrl();
    return `${baseUrl}${imagePath}`;
  }
  
  // If it starts with uploads (without /), add it
  if (imagePath.startsWith('uploads/')) {
    const baseUrl = getImageBaseUrl();
    return `${baseUrl}/${imagePath}`;
  }
  
  // Return as is if it doesn't match any pattern
  return imagePath;
};







