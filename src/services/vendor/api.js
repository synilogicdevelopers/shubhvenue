import axios from 'axios'
import toast from 'react-hot-toast'
import { forceLogout } from '../../utils/auth/logout'

// Server base URL - use localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://shubhvenue.com/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 5 minutes timeout for large file uploads
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vendor_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Don't override Content-Type for FormData - let axios set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Check if response is HTML (error page) instead of JSON
    const contentType = response.headers?.['content-type'] || ''
    if (contentType.includes('text/html')) {
      console.error('Server returned HTML instead of JSON:', response)
      return Promise.reject(new Error('Server error: Invalid response format'))
    }
    return response
  },
  (error) => {
    // Check if error response is HTML
    if (error.response) {
      const contentType = error.response.headers?.['content-type'] || ''
      if (contentType.includes('text/html')) {
        console.error('Server returned HTML error page:', error.response)
        error.message = 'Server error: Please check server logs'
        error.isHtmlError = true
      }
    }
    
    if (error.response?.status === 401) {
      // Session expired - force logout
      toast.error('Session expired. Please login again.')
      forceLogout('expired', '/vendor/login')
    } else if (error.response?.status === 403 && error.response?.data?.isBlocked) {
      // User is blocked - logout immediately and clear all data
      toast.error('Your account has been blocked. Please contact support.')
      forceLogout('blocked', '/vendor/login')
    }
    return Promise.reject(error)
  }
)

// Auth APIs
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', { ...data, role: 'vendor' }),
  googleLogin: (idToken, fcmToken) => api.post('/auth/google-login', { idToken, role: 'vendor', fcmToken }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
}

// Vendor APIs
export const vendorAPI = {
  getDashboard: (month, year) => {
    const params = {}
    if (month) params.month = month
    if (year) params.year = year
    return api.get('/vendor/dashboard', { params })
  },
  getBookings: (params) => api.get('/vendor/bookings', { params }),
  createBooking: (data) => api.post('/vendor/bookings', data),
  getPayouts: () => api.get('/vendor/payouts'),
  getLedger: () => api.get('/vendor/ledger'),
  addLedgerEntry: (data) => api.post('/vendor/ledger', data),
  updateLedgerEntry: (id, data) => api.put(`/vendor/ledger/${id}`, data),
  deleteLedgerEntry: (id) => api.delete(`/vendor/ledger/${id}`),
  getVenues: (params) => api.get('/vendor/venues', { params }),
  getVenueById: (id) => api.get(`/vendor/venues/${id}`),
  getStates: () => api.get('/vendor/venues/states'),
  getCities: (state) => api.get('/vendor/venues/cities', { params: { state } }),
  createVenue: (formData, onUploadProgress) => {
    // Don't set Content-Type manually - axios will set it with boundary for FormData
    return api.post('/vendor/venues', formData, {
      onUploadProgress: onUploadProgress ? (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
        onUploadProgress(percentCompleted);
      } : undefined,
    })
  },
  updateVenue: (id, formData, onUploadProgress) => {
    // Don't set Content-Type manually - axios will set it with boundary for FormData
    return api.put(`/vendor/venues/${id}`, formData, {
      onUploadProgress: onUploadProgress ? (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
        onUploadProgress(percentCompleted);
      } : undefined,
    })
  },
  toggleVenueStatus: (id) => api.patch(`/vendor/venues/${id}/toggle-status`),
  deleteVenue: (id) => api.delete(`/vendor/venues/${id}`),
  updateBookingStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
  getBlockedDates: (venueId) => api.get('/vendor/blocked-dates', { params: venueId ? { venueId } : {} }),
  addBlockedDates: (venueId, dates) => api.post('/vendor/blocked-dates', { venueId, dates }),
  removeBlockedDates: (venueId, dates) => api.delete('/vendor/blocked-dates', { data: { venueId, dates } }),
  // Calendar Events APIs
  getCalendarEvents: (venueId) => api.get('/vendor/calendar-events', { params: venueId ? { venueId } : {} }),
  createCalendarEvent: (data) => api.post('/vendor/calendar-events', data),
  updateCalendarEvent: (id, data) => api.put(`/vendor/calendar-events/${id}`, data),
  deleteCalendarEvent: (id) => api.delete(`/vendor/calendar-events/${id}`),
}

// Category APIs
export const categoryAPI = {
  getCategories: () => api.get('/categories'),
}

// Vendor Categories APIs (public - no auth required)
export const vendorCategoriesAPI = {
  getPublic: () => api.get('/admin/vendor-categories/public'),
}

// Menu APIs
export const menuAPI = {
  getMenus: (params) => api.get('/menus', { params }),
  getMenuById: (id) => api.get(`/menus/${id}`),
}

// Decoration Categories APIs (public - no auth required)
export const decorationCategoriesAPI = {
  getAll: (params) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return api.get(`/decoration-categories${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => api.get(`/decoration-categories/${id}`),
}

// Occasion Specials APIs (public - no auth required)
export const occasionSpecialsAPI = {
  getAll: (params) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return api.get(`/occasion-specials${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => api.get(`/occasion-specials/${id}`),
}

// Review APIs
export const reviewAPI = {
  // Create a new review
  createReview: (data) => api.post('/reviews', data),
  
  // Get reviews by venue ID
  getReviewsByVenue: (venueId) => api.get(`/reviews/venue/${venueId}`),
  
  // Get reviews by user ID
  getReviewsByUser: (userId) => api.get(`/reviews/user/${userId}`),
  
  // Get all reviews for vendor's venues
  getReviewsByVendor: (params) => api.get('/reviews/vendor/all', { params }),
  
  // Get all reviews (with optional filters)
  getReviews: (params) => api.get('/reviews', { params }),
  
  // Get a single review by ID
  getReviewById: (reviewId) => api.get(`/reviews/${reviewId}`),
  
  // Update a review
  updateReview: (reviewId, data) => api.put(`/reviews/${reviewId}`, data),
  
  // Delete a review
  deleteReview: (reviewId) => api.delete(`/reviews/${reviewId}`),
  
  // Reply to a review (vendor only)
  addReplyToReview: (reviewId, message) => api.post(`/reviews/${reviewId}/reply`, { message }),
  
  // Update reply to a review (vendor only)
  updateReplyToReview: (reviewId, message) => api.put(`/reviews/${reviewId}/reply`, { message }),
  
  // Delete reply from a review (vendor only)
  deleteReplyFromReview: (reviewId) => api.delete(`/reviews/${reviewId}/reply`),
}

// Video APIs (Admin)
export const videosAPI = {
  getAll: (params) => api.get('/admin/videos', { params }),
  getById: (id) => api.get(`/admin/videos/${id}`),
  create: (data) => {
    // FormData handling is now done in the interceptor - no need to set headers manually
    return api.post('/admin/videos', data);
  },
  update: (id, data) => {
    // FormData handling is now done in the interceptor - no need to set headers manually
    return api.put(`/admin/videos/${id}`, data);
  },
  delete: (id) => api.delete(`/admin/videos/${id}`),
  toggleActive: (id) => api.put(`/admin/videos/${id}/toggle-active`),
}

// Public Video APIs (for users/customers - no auth required)
export const publicVideosAPI = {
  getAll: () => api.get('/videos'),
  getById: (id) => api.get(`/videos/${id}`),
}

// Vendor Roles APIs
export const vendorRolesAPI = {
  getAll: (params) => api.get('/vendor/roles', { params }),
  getById: (id) => api.get(`/vendor/roles/${id}`),
  create: (data) => api.post('/vendor/roles', data),
  update: (id, data) => api.put(`/vendor/roles/${id}`, data),
  delete: (id) => api.delete(`/vendor/roles/${id}`),
  getAvailablePermissions: () => api.get('/vendor/roles/permissions/available'),
}

// Vendor Staff APIs
export const vendorStaffAPI = {
  login: (data) => api.post('/vendor/staff/login', data),
  getProfile: () => api.get('/vendor/staff/profile'),
  getAll: (params) => api.get('/vendor/staff', { params }),
  getById: (id) => api.get(`/vendor/staff/${id}`),
  create: (data) => {
    if (data instanceof FormData) {
      return api.post('/vendor/staff', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/vendor/staff', data);
  },
  update: (id, data) => {
    if (data instanceof FormData) {
      return api.put(`/vendor/staff/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.put(`/vendor/staff/${id}`, data);
  },
  delete: (id) => api.delete(`/vendor/staff/${id}`),
}

// Vendor Plans APIs
export const vendorPlansAPI = {
  getAll: () => api.get('/vendor/plans'),
  getSubscriptions: () => api.get('/vendor/subscriptions'),
  purchase: (data) => api.post('/vendor/plans/purchase', data),
  verifyPayment: (data) => api.post('/vendor/plans/verify-payment', data),
}

export default api


