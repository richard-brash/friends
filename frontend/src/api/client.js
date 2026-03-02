import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
};

// Friends API
export const friendsAPI = {
  getAll: () => api.get('/friends'),
  getById: (id) => api.get(`/friends/${id}`),
  create: (data) => api.post('/friends', data),
  update: (id, data) => api.put(`/friends/${id}`, data),
  delete: (id) => api.delete(`/friends/${id}`),
  getLocationHistory: (id) => api.get(`/friends/${id}/location-history`),
  spot: (locationId, friendId) => api.post('/friends/spot', { locationId, friendId }),
};

// Runs API
export const runsAPI = {
  getAll: () => api.get('/runs'),
  getById: (id) => api.get(`/runs/${id}`),
  create: (data) => api.post('/runs', data),
  update: (id, data) => api.put(`/runs/${id}`, data),
  delete: (id) => api.delete(`/runs/${id}`),
  getTeam: (id) => api.get(`/runs/${id}/team`),
  addTeamMember: (id, userId) => api.post(`/runs/${id}/team`, { userId }),
  removeTeamMember: (id, userId) => api.delete(`/runs/${id}/team/${userId}`),
  prepare: (id) => api.post(`/runs/${id}/prepare`),
  getExecutionContext: (id) => api.get(`/runs/${id}/execution`),
  start: (id) => api.post(`/runs/${id}/start`),
  advanceStop: (id) => api.post(`/runs/${id}/advance`),
  previousStop: (id) => api.post(`/runs/${id}/previous`),
  complete: (id) => api.post(`/runs/${id}/complete`),
  trackDelivery: (id, data) => api.post(`/runs/${id}/delivery`, data),
};

// Requests API
export const requestsAPI = {
  getAll: () => api.get('/requests'),
  getById: (id) => api.get(`/requests/${id}`),
  create: (data) => api.post('/requests', data),
  update: (id, data) => api.put(`/requests/${id}`, data),
  delete: (id) => api.delete(`/requests/${id}`),
  updateStatus: (id, status, notes) => api.post(`/requests/${id}/status`, { status, notes }),
  getHistory: (id) => api.get(`/requests/${id}/history`),
};

// Routes API
export const routesAPI = {
  getAll: () => api.get('/routes'),
  getById: (id) => api.get(`/routes/${id}`),
};

// Locations API
export const locationsAPI = {
  getAll: () => api.get('/locations'),
  getById: (id) => api.get(`/locations/${id}`),
  getByRoute: (routeId) => api.get(`/locations/route/${routeId}`),
};

export default api;
