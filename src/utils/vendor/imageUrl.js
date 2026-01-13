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
export const getImageUrl = (imagePath, defaultCategory = 'venues') => {
  if (!imagePath) return '';
  
  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  const baseUrl = getImageBaseUrl();
  
  // If it's a relative path starting with /uploads, add base URL
  if (imagePath.startsWith('/uploads/')) {
    // Split path and encode only the filename part to handle special characters
    const pathParts = imagePath.split('/');
    const filename = pathParts.pop();
    const encodedFilename = encodeURIComponent(filename);
    const encodedPath = pathParts.join('/') + '/' + encodedFilename;
    return `${baseUrl}${encodedPath}`;
  }
  
  // If it starts with uploads (without /), add leading slash
  if (imagePath.startsWith('uploads/')) {
    // Split path and encode only the filename part
    const pathParts = imagePath.split('/');
    const filename = pathParts.pop();
    const encodedFilename = encodeURIComponent(filename);
    const encodedPath = pathParts.join('/') + '/' + encodedFilename;
    return `${baseUrl}/${encodedPath}`;
  }
  
  // If it's just a filename (no path), try to determine category from context
  // or use default category (venues, banners, decoration-categories, occasion-specials)
  if (!imagePath.includes('/')) {
    const encodedFilename = encodeURIComponent(imagePath);
    // Try common paths based on filename patterns or use default
    if (defaultCategory === 'banners' || imagePath.includes('banner')) {
      return `${baseUrl}/uploads/banners/${encodedFilename}`;
    }
    if (defaultCategory === 'decoration-categories' || imagePath.includes('decoration')) {
      return `${baseUrl}/uploads/decoration-categories/${encodedFilename}`;
    }
    if (defaultCategory === 'occasion-specials' || imagePath.includes('occasion')) {
      return `${baseUrl}/uploads/occasion-specials/${encodedFilename}`;
    }
    // Default to venues
    return `${baseUrl}/uploads/venues/${encodedFilename}`;
  }
  
  // Return as is if it doesn't match any pattern (shouldn't happen, but fallback)
  return imagePath.startsWith('/') ? `${baseUrl}${imagePath}` : `${baseUrl}/${imagePath}`;
};

