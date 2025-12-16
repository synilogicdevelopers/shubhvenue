// Utility functions for converting venue names to URL-friendly slugs

/**
 * Convert a venue name to a URL-friendly slug
 * @param {string} name - The venue name
 * @returns {string} - URL-friendly slug
 */
export const createSlug = (name) => {
  if (!name) return ''
  
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Convert a slug back to a readable name (approximate)
 * Note: This is a best-effort conversion and may not be exact
 * @param {string} slug - The URL slug
 * @returns {string} - Readable name
 */
export const slugToName = (slug) => {
  if (!slug) return ''
  
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}









