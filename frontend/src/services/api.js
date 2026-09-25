import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
};

// Dashboard endpoints
export const dashboardAPI = {
  getManager: () => api.get('/api/dashboard/manager'),
  getFrontDesk: () => api.get('/api/dashboard/front-desk'),
  getDepartment: () => api.get('/api/dashboard/department'),
  getStaff: () => api.get('/api/dashboard/staff'),
};

// Forecast endpoints
export const forecastAPI = {
  getOccupancy: (days = 7) => api.get(`/api/forecast/occupancy?days=${days}`),
  getWorkload: () => api.get('/api/forecast/workload'),
};

// Recommendations endpoints
export const recommendationsAPI = {
  getAll: (status = null) => api.get('/api/recommendations', { params: { status } }),
  generate: () => api.post('/api/recommendations/generate'),
  approve: (id) => api.post(`/api/recommendations/${id}/approve`),
  reject: (id, data) => api.post(`/api/recommendations/${id}/reject`, data),
  modify: (id, data) => api.post(`/api/recommendations/${id}/modify`, data),
};

// Tasks endpoints
export const tasksAPI = {
  getAll: (params) => api.get('/api/tasks', { params }),
  create: (data) => api.post('/api/tasks', data),
  assign: (id, assignedTo) => api.patch(`/api/tasks/${id}/assign`, { assigned_to: assignedTo }),
  updateStatus: (id, status) => api.patch(`/api/tasks/${id}/status`, { status }),
};

// Inventory endpoints
export const inventoryAPI = {
  getItems: () => api.get('/api/inventory'),
  getStockouts: () => api.get('/api/inventory/stockouts'),
  getPurchaseOrders: () => api.get('/api/inventory/purchase-orders'),
  createPurchaseOrder: (data) => api.post('/api/inventory/purchase-orders', data),
  receivePurchaseOrder: (id) => api.patch(`/api/inventory/purchase-orders/${id}/receive`),
};

// Guest requests endpoints
export const guestRequestsAPI = {
  create: (data) => api.post('/api/guest-requests', data),
  getAll: (status) => api.get('/api/guest-requests', { params: { status } }),
  updateStatus: (id, status) => api.patch(`/api/guest-requests/${id}/status`, { status }),
};

// Activity log endpoints
export const activityLogAPI = {
  getAll: (limit = 100, actionType = null) =>
    api.get('/api/activity-log', { params: { limit, action_type: actionType } }),
};

// Demo endpoints
export const demoAPI = {
  reset: () => api.post('/api/demo/reset'),
};

export default api;
