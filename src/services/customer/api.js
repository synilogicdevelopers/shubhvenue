// Local server URL
const API_BASE_URL = 'http://localhost:8030/api';

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || error.error || 'Request failed');
    }

    return {
      data: await response.json(),
      status: response.status,
    };
  } catch (error) {
    throw error;
  }
};

// Public Videos APIs (no auth required)
export const publicVideosAPI = {
  getAll: () => apiRequest('/videos'),
  getById: (id) => apiRequest(`/videos/${id}`),
};

// Public Testimonials APIs (no auth required)
export const publicTestimonialsAPI = {
  getAll: () => apiRequest('/testimonials'),
  getById: (id) => apiRequest(`/testimonials/${id}`),
};

// Public FAQs APIs (no auth required)
export const publicFAQsAPI = {
  getAll: () => apiRequest('/faqs'),
  getById: (id) => apiRequest(`/faqs/${id}`),
};

// Public Company APIs (no auth required)
export const publicCompanyAPI = {
  get: () => apiRequest('/company'),
};

// Public Legal Pages APIs (no auth required)
export const publicLegalPagesAPI = {
  getByType: (type) => apiRequest(`/legal-pages/${type}`),
};

// Public Contact APIs (no auth required)
export const publicContactAPI = {
  submit: (data) => apiRequest('/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }),
  getById: (id) => apiRequest(`/contact/${id}`),
  getByEmail: (email) => apiRequest(`/contact/by-email?email=${encodeURIComponent(email)}`),
};

// Public Categories APIs (no auth required)
export const publicCategoriesAPI = {
  getAll: (params) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return apiRequest(`/categories${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => apiRequest(`/categories/${id}`),
};

// Public Vendor Categories APIs (no auth required)
export const publicVendorCategoriesAPI = {
  getAll: () => apiRequest('/admin/vendor-categories/public'),
};

// Public Venues APIs (no auth required)
export const publicVenuesAPI = {
  getAll: (params) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return apiRequest(`/vendor/venues${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => apiRequest(`/vendor/venues/${id}`),
  search: (params) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return apiRequest(`/vendor/venues/search${queryString ? `?${queryString}` : ''}`);
  },
  getStates: () => apiRequest('/vendor/venues/states'),
  getCities: (state) => {
    const queryString = state ? `?state=${encodeURIComponent(state)}` : '';
    return apiRequest(`/vendor/venues/cities${queryString}`);
  },
  getSearchSuggestions: (query, limit = 10) => {
    const queryString = query ? `?q=${encodeURIComponent(query)}&limit=${limit}` : '';
    return apiRequest(`/vendor/venues/search/suggestions${queryString}`);
  },
};

// Auth APIs
export const authAPI = {
  login: (email, password) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  register: (data) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ ...data, role: 'customer' }),
  }),
  googleLogin: (idToken, role = 'customer', fcmToken = null) => 
    apiRequest('/auth/google-login', {
      method: 'POST',
      body: JSON.stringify({ idToken, role, fcmToken }),
    }),
  getProfile: () => apiRequest('/auth/profile'),
  updateProfile: (data) => apiRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// Review APIs (requires authentication)
export const reviewAPI = {
  create: (venueId, rating, comment) => apiRequest('/reviews', {
    method: 'POST',
    body: JSON.stringify({ venueId, rating, comment }),
  }),
  getByVenue: (venueId) => apiRequest(`/reviews/venue/${venueId}`),
  getById: (id) => apiRequest(`/reviews/${id}`),
  update: (id, rating, comment) => apiRequest(`/reviews/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ rating, comment }),
  }),
  delete: (id) => apiRequest(`/reviews/${id}`, {
    method: 'DELETE',
  }),
};

// Booking APIs (public - no auth required)
export const bookingAPI = {
  create: (data) => apiRequest('/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getBookings: (params) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return apiRequest(`/bookings${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => apiRequest(`/bookings/${id}`),
  updateStatus: (id, status) => apiRequest(`/bookings/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
  checkAvailability: (venueId, checkIn, checkOut) => {
    // Simple availability check - just return available
    // Backend will handle actual availability check during booking creation
    return Promise.resolve({
      data: {
        available: true,
        message: 'Dates available'
      },
      status: 200
    });
  },
};

// Payment APIs (public - no auth required)
export const paymentAPI = {
  getConfig: () => apiRequest('/payment/config'),
  createOrder: (data) => apiRequest('/payment/create-order', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  verify: (data) => apiRequest('/payment/verify', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  verifyForLead: (data) => apiRequest('/payment/verify-lead', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Public Menus APIs (no auth required)
export const publicMenusAPI = {
  getMenus: (params) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return apiRequest(`/menus${queryString ? `?${queryString}` : ''}`);
  },
  getSubmenus: (parentMenuId) => {
    return apiRequest(`/menus?parentMenuId=${parentMenuId}`);
  },
};

// Shotlist APIs (optional auth - works with deviceId for non-logged in users)
export const shotlistAPI = {
  // Toggle like/unlike a venue
  toggleLike: (venueId, deviceId) => {
    // Send deviceId in body only (not in header) to avoid CORS issues
    // Backend controller checks both req.body.deviceId and req.headers['x-device-id']
    return apiRequest(`/shotlist/venue/${venueId}/like`, {
      method: 'POST',
      body: JSON.stringify({ deviceId }),
    });
  },
  // Get all shotlisted venues
  getAll: (deviceId) => {
    // Send deviceId in query string only (not in header) to avoid CORS issues
    const queryString = deviceId ? `?deviceId=${encodeURIComponent(deviceId)}` : '';
    return apiRequest(`/shotlist${queryString}`);
  },
  // Check if venue is liked
  checkStatus: (venueId, deviceId) => {
    // Send deviceId in query string only (not in header) to avoid CORS issues
    const queryString = deviceId ? `?deviceId=${encodeURIComponent(deviceId)}` : '';
    return apiRequest(`/shotlist/venue/${venueId}/status${queryString}`);
  },
};

export default { apiRequest };

