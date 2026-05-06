import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Response interceptor for error normalization
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default api;

// Items
export const itemsAPI = {
  getAll: (params) => api.get('/items', { params }),
  getById: (id) => api.get(`/items/${id}`),
  create: (data) => api.post('/items', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`),
  getStats: () => api.get('/items/stats/overview'),
  claim: (id, data) => api.post(`/items/${id}/claim`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  rematch: (id) => api.post(`/items/${id}/rematch`),
};

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// Categories & Locations
export const metaAPI = {
  getCategories: () => api.get('/categories'),
  getLocations: () => api.get('/locations'),
};

// Messages
export const messagesAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (userId, params) => api.get(`/messages/${userId}`, { params }),
  send: (userId, data) => api.post(`/messages/${userId}`, data),
  getUnreadCount: () => api.get('/messages/unread/count'),
};

// Notifications
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// Admin
export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  getClaims: (params) => api.get('/admin/claims', { params }),
  reviewClaim: (id, data) => api.put(`/admin/claims/${id}`, data),
  getAuditLog: (params) => api.get('/admin/audit-log', { params }),
};
