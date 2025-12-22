import axios from 'axios';
import toast from 'react-hot-toast';

// In development, use relative URL to leverage Vite proxy
// In production, use full URL
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://shubhvenue.com/api');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/login';
      toast.error('Session expired. Please login again.');
    } else if (error.response?.status === 503) {
      const message = error.response?.data?.message || 'Database connection unavailable';
      const hint = error.response?.data?.hint || '';
      toast.error(`${message}${hint ? '\n' + hint : ''}`, { duration: 5000 });
    } else if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else if (error.message === 'Network Error') {
      toast.error('Cannot connect to server. Please check your internet connection.');
    } else {
      toast.error('Something went wrong');
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (data) => api.post('/admin/login', data),
  loginStaff: (data) => api.post('/staff/login', data), // Staff login endpoint
  logout: () => api.post('/admin/logout').catch(() => {
    // Silently fail - logout is handled locally
    return Promise.resolve({ data: { success: true } });
  }),
  getProfile: () => api.get('/admin/profile'),
  updateProfile: (data) => api.put('/admin/profile', data),
  changePassword: (data) => api.put('/admin/change-password', data),
};

// Dashboard APIs
export const dashboardAPI = {
  getStats: () => api.get('/admin/dashboard'),
};

// Users APIs
export const usersAPI = {
  getAll: (params) => api.get('/admin/users', { params }),
  getById: (id) => api.get(`/admin/users/${id}`),
  update: (id, data) => api.put(`/admin/users/${id}`, data),
  delete: (id, config = {}) => api.delete(`/admin/users/${id}`, config),
  block: (id) => api.put(`/admin/users/${id}/block`),
};

// Vendors APIs
export const vendorsAPI = {
  getAll: (params) => api.get('/admin/vendors', { params }),
  create: (data) => api.post('/admin/vendors', data),
  getById: (id) => api.get(`/admin/vendors/${id}`),
  update: (id, data) => api.put(`/admin/vendors/${id}`, data),
  approve: (id) => api.put(`/admin/vendors/${id}/approve`),
  reject: (id) => api.put(`/admin/vendors/${id}/reject`),
  delete: (id) => api.delete(`/admin/vendors/${id}`),
};

// Venues APIs
export const venuesAPI = {
  getAll: (params) => api.get('/admin/venues', { params }),
  create: (data) => {
    if (data instanceof FormData) {
      return api.post('/admin/venues', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/admin/venues', data);
  },
  getById: (id) => api.get(`/admin/venues/${id}`),
  update: (id, data) => {
    if (data instanceof FormData) {
      return api.put(`/admin/venues/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.put(`/admin/venues/${id}`, data);
  },
  delete: (id) => api.delete(`/admin/venues/${id}`),
  approve: (id) => api.put(`/admin/venues/approve/${id}`),
  reject: (id) => api.put(`/admin/venues/reject/${id}`),
  updateButtonSettings: (id, data) => api.put(`/admin/venues/${id}/button-settings`, data),
  getStates: () => api.get('/vendor/venues/states'),
  getCities: (state) => api.get('/vendor/venues/cities', { params: { state } }),
};

// Bookings APIs
export const bookingsAPI = {
  getAll: (params) => api.get('/admin/bookings', { params }),
  getById: (id) => api.get(`/admin/bookings/${id}`),
  updateStatus: (id, status) => api.put(`/admin/bookings/${id}/status`, { status }),
  approve: (id) => api.put(`/admin/bookings/${id}/approve`),
  reject: (id, reason) => api.put(`/admin/bookings/${id}/reject`, { reason }),
};

// Leads APIs
export const leadsAPI = {
  getAll: (params) => api.get('/admin/leads', { params }),
  getById: (id) => api.get(`/admin/leads/${id}`),
  updateStatus: (id, data) => api.put(`/admin/leads/${id}/status`, data),
  convertToBooking: (id, paymentId) => api.post(`/admin/leads/${id}/convert-to-booking`, { paymentId }),
};

// Payouts APIs
export const payoutsAPI = {
  getAll: (params) => api.get('/admin/payouts', { params }),
  getById: (id) => api.get(`/admin/payouts/${id}`),
  update: (id, data) => api.put(`/admin/payouts/${id}`, data),
  markCompleted: (id) => api.put(`/admin/payouts/${id}/complete`),
};

// Analytics APIs
export const analyticsAPI = {
  getAnalytics: (params) => api.get('/admin/analytics', { params }),
};

// Payment Config APIs
export const paymentConfigAPI = {
  get: () => api.get('/admin/payment-config'),
  update: (data) => api.put('/admin/payment-config', data),
};

// Google Maps Config APIs
export const googleMapsConfigAPI = {
  get: () => api.get('/admin/google-maps-config'),
  update: (data) => api.put('/admin/google-maps-config', data),
};

// Categories APIs
export const categoriesAPI = {
  getAll: (params) => api.get('/categories', { params }),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => {
    // Check if data is FormData (file upload)
    if (data instanceof FormData) {
      return api.post('/categories', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post('/categories', data);
  },
  update: (id, data) => {
    // Check if data is FormData (file upload)
    if (data instanceof FormData) {
      return api.put(`/categories/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.put(`/categories/${id}`, data);
  },
  delete: (id) => api.delete(`/categories/${id}`),
};

// Banners APIs
export const bannersAPI = {
  getAll: (params) => api.get('/admin/banners', { params }),
  getById: (id) => api.get(`/admin/banners/${id}`),
  create: (data) => {
    // Check if data is FormData (file upload)
    if (data instanceof FormData) {
      return api.post('/admin/banners', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post('/admin/banners', data);
  },
  update: (id, data) => {
    // Check if data is FormData (file upload)
    if (data instanceof FormData) {
      return api.put(`/admin/banners/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.put(`/admin/banners/${id}`, data);
  },
  delete: (id) => api.delete(`/admin/banners/${id}`),
  toggleActive: (id) => api.put(`/admin/banners/${id}/toggle-active`),
};

// Videos APIs (Admin)
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
};

// Public Videos APIs (for users/customers - no auth required)
export const publicVideosAPI = {
  getAll: () => api.get('/videos'),
  getById: (id) => api.get(`/videos/${id}`),
};

// Testimonials APIs (Admin)
export const testimonialsAPI = {
  getAll: (params) => api.get('/admin/testimonials', { params }),
  getById: (id) => api.get(`/admin/testimonials/${id}`),
  create: (data) => api.post('/admin/testimonials', data),
  update: (id, data) => api.put(`/admin/testimonials/${id}`, data),
  delete: (id) => api.delete(`/admin/testimonials/${id}`),
  toggleActive: (id) => api.put(`/admin/testimonials/${id}/toggle-active`),
};

// FAQs APIs (Admin)
export const faqsAPI = {
  getAll: (params) => api.get('/admin/faqs', { params }),
  getById: (id) => api.get(`/admin/faqs/${id}`),
  create: (data) => api.post('/admin/faqs', data),
  update: (id, data) => api.put(`/admin/faqs/${id}`, data),
  delete: (id) => api.delete(`/admin/faqs/${id}`),
  toggleActive: (id) => api.put(`/admin/faqs/${id}/toggle-active`),
};

// Company APIs (Admin)
export const companyAPI = {
  get: () => api.get('/admin/company'),
  update: (data) => api.put('/admin/company', data),
};

// Legal Pages APIs (Admin)
export const legalPagesAPI = {
  getAll: () => api.get('/admin/legal-pages'),
  getByType: (type) => api.get(`/admin/legal-pages/${type}`),
  update: (type, data) => api.put(`/admin/legal-pages/${type}`, data),
};

// Contact Submissions APIs (Admin)
export const contactsAPI = {
  getAll: (params) => api.get('/admin/contacts', { params }),
  getById: (id) => api.get(`/admin/contacts/${id}`),
  updateStatus: (id, data) => api.put(`/admin/contacts/${id}/status`, data),
  delete: (id) => api.delete(`/admin/contacts/${id}`),
};

// Menus APIs
export const menusAPI = {
  getAll: (params) => api.get('/menus', { params }),
  getById: (id) => api.get(`/menus/${id}`),
  getSubmenus: (parentMenuId) => api.get(`/menus?parentMenuId=${parentMenuId}`),
  create: (data) => {
    // Check if data is FormData (file upload)
    if (data instanceof FormData) {
      return api.post('/menus', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post('/menus', data);
  },
  update: (id, data) => {
    // Check if data is FormData (file upload)
    if (data instanceof FormData) {
      return api.put(`/menus/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.put(`/menus/${id}`, data);
  },
  delete: (id) => api.delete(`/menus/${id}`),
};

// Staff APIs
export const staffAPI = {
  getAll: (params) => api.get('/admin/staff', { params }),
  getById: (id) => api.get(`/admin/staff/${id}`),
  create: (data) => {
    if (data instanceof FormData) {
      return api.post('/admin/staff', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/admin/staff', data);
  },
  update: (id, data) => {
    if (data instanceof FormData) {
      return api.put(`/admin/staff/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.put(`/admin/staff/${id}`, data);
  },
  delete: (id) => api.delete(`/admin/staff/${id}`),
};

// Roles APIs
export const rolesAPI = {
  getAll: (params) => api.get('/admin/roles', { params }),
  getById: (id) => api.get(`/admin/roles/${id}`),
  create: (data) => api.post('/admin/roles', data),
  update: (id, data) => api.put(`/admin/roles/${id}`, data),
  delete: (id) => api.delete(`/admin/roles/${id}`),
  getAvailablePermissions: () => api.get('/admin/roles/permissions/available'),
};

// Reviews APIs
export const reviewsAPI = {
  getAll: (params) => api.get('/admin/reviews', { params }),
  getById: (id) => api.get(`/admin/reviews/${id}`),
  update: (id, data) => api.put(`/admin/reviews/${id}`, data),
  delete: (id) => api.delete(`/admin/reviews/${id}`),
};

export default api;

