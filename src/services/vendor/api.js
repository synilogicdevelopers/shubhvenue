import axios from 'axios'

// In development, use relative URL to leverage Vite proxy
// In production, use full URL
// Default to local backend for web; override via VITE_API_URL when needed
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://shubhvenue.com/api')

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vendor_token')
      localStorage.removeItem('vendor_user')
      window.location.href = '/vendor/login'
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
  getBookings: () => api.get('/vendor/bookings'),
  createBooking: (data) => api.post('/vendor/bookings', data),
  getPayouts: () => api.get('/vendor/payouts'),
  getLedger: () => api.get('/vendor/ledger'),
  addLedgerEntry: (data) => api.post('/vendor/ledger', data),
  updateLedgerEntry: (id, data) => api.put(`/vendor/ledger/${id}`, data),
  deleteLedgerEntry: (id) => api.delete(`/vendor/ledger/${id}`),
  getVenues: () => api.get('/vendor/venues'),
  getVenueById: (id) => api.get(`/vendor/venues/${id}`),
  getStates: () => api.get('/vendor/venues/states'),
  getCities: (state) => api.get('/vendor/venues/cities', { params: { state } }),
  createVenue: (formData) => {
    // Don't set Content-Type manually - axios will set it with boundary for FormData
    return api.post('/vendor/venues', formData)
  },
  updateVenue: (id, formData) => {
    // Don't set Content-Type manually - axios will set it with boundary for FormData
    return api.put(`/vendor/venues/${id}`, formData)
  },
  toggleVenueStatus: (id) => api.patch(`/vendor/venues/${id}/toggle-status`),
  deleteVenue: (id) => api.delete(`/vendor/venues/${id}`),
  updateBookingStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
  getBlockedDates: (venueId) => api.get('/vendor/blocked-dates', { params: venueId ? { venueId } : {} }),
  addBlockedDates: (venueId, dates) => api.post('/vendor/blocked-dates', { venueId, dates }),
  removeBlockedDates: (venueId, dates) => api.delete('/vendor/blocked-dates', { data: { venueId, dates } }),
}

// Category APIs
export const categoryAPI = {
  getCategories: () => api.get('/categories'),
}

// Menu APIs
export const menuAPI = {
  getMenus: (params) => api.get('/menus', { params }),
  getMenuById: (id) => api.get(`/menus/${id}`),
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
  getReviewsByVendor: () => api.get('/reviews/vendor/all'),
  
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
    // Check if data is FormData (file upload)
    if (data instanceof FormData) {
      return api.post('/admin/videos', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post('/admin/videos', data);
  },
  update: (id, data) => {
    // Check if data is FormData (file upload)
    if (data instanceof FormData) {
      return api.put(`/admin/videos/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
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

export default api


