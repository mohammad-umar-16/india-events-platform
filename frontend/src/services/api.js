import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Public Events API
export const eventsAPI = {
  getAll: (params = {}) => api.get('/api/events', { params }),
  getById: (id) => api.get(`/api/events/${id}`),
  getCategories: () => api.get('/api/events/meta/categories'),
  captureEmail: (data) => api.post('/api/events/capture-email', data)
};

// Authentication API
export const authAPI = {
  getCurrentUser: () => api.get('/auth/current-user'),
  logout: () => api.post('/auth/logout'),
  loginWithGoogle: () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  }
};

// Favorites API
export const favoritesAPI = {
  toggle: (eventId) => api.post(`/api/favorites/${eventId}`),
  getAll: () => api.get('/api/favorites')
};

// dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/api/dashboard/stats'),
  getEvents: (params = {}) => api.get('/api/dashboard/events', { params }),
  getEventById: (id) => api.get(`/api/dashboard/events/${id}`),
  importEvent: (id, notes) => api.post(`/api/dashboard/events/${id}/import`, { importNotes: notes }),
  updateEventStatus: (id, status) => api.patch(`/api/dashboard/events/${id}/status`, { status }),
  getEmailCaptures: (params = {}) => api.get('/api/dashboard/email-captures', { params }),
  getCities: () => api.get('/api/dashboard/meta/cities')
};

export default api;