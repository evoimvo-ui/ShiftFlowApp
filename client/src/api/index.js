import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000, // Smanjujemo timeout na 10 sekundi
});

// Retry logika za mrežne greške
api.interceptors.response.use(null, async (error) => {
  const { config } = error;
  if (!config || !config.retry) {
    return Promise.reject(error);
  }
  
  config.retryCount = config.retryCount || 0;
  if (config.retryCount >= config.retry) {
    return Promise.reject(error);
  }
  
  config.retryCount += 1;
  const delay = Math.pow(2, config.retryCount) * 1000; // Eksponencijalni backoff
  
  await new Promise(resolve => setTimeout(resolve, delay));
  return api(config);
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sf_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const healthApi = {
  ping: () => api.get('/health', { retry: 1 }) // Smanjujemo broj pokušaja
};

export const workerApi = {
  getAll: (config = {}) => api.get('/workers', config),
  create: (data) => api.post('/workers', data),
  update: (id, data) => api.put(`/workers/${id}`, data),
  delete: (id) => api.delete(`/workers/${id}`),
};

export const groupApi = {
  getAll: (config = {}) => api.get('/groups', config),
  create: (data) => api.post('/groups', data),
  update: (id, data) => api.put(`/groups/${id}`, data),
  delete: (id) => api.delete(`/groups/${id}`),
};

export const categoryApi = {
  getAll: (config = {}) => api.get('/categories', config),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const absenceApi = {
  getAll: (config = {}) => api.get('/absences', config),
  create: (data) => api.post('/absences', data),
  approve: (id, status) => api.put(`/absences/${id}/approve`, { status }),
  delete: (id) => api.delete(`/absences/${id}`),
};

export const scheduleApi = {
  getAll: (config = {}) => api.get('/schedules', config),
  generate: (data) => api.post('/schedules/generate', data),
  delete: (weekStart) => api.delete(`/schedules/${weekStart}`),
  manualUpdate: (data) => api.put('/schedules/manual-update', data),
  deleteAssignment: (scheduleId, assignmentId) => api.delete(`/schedules/assignment/${scheduleId}/${assignmentId}`),
};

export const holidayApi = {
  getAll: (config = {}) => api.get('/holidays', config),
  create: (data) => api.post('/holidays', data),
  delete: (id) => api.delete(`/holidays/${id}`),
};

export const swapApi = {
  getAll: (config = {}) => api.get('/swaps', config),
  create: (data) => api.post('/swaps', data),
  process: (id, status) => api.put(`/swaps/${id}`, { status }),
};

export const auditApi = {
  getAll: (config = {}) => api.get('/audit', config),
};

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  deleteUser: (username) => api.delete(`/auth/user/${username}`),
};

export const settingApi = {
  get: (config = {}) => api.get('/settings', config),
  getOrg: (config = {}) => api.get('/settings/organization', config),
  update: (data) => api.put('/settings', data),
  getShifts: (config = {}) => api.get('/settings/shifts', config),
  createShift: (data) => api.post('/settings/shifts', data),
  updateShift: (id, data) => api.put(`/settings/shifts/${id}`, data),
  deleteShift: (id) => api.delete(`/settings/shifts/${id}`),
};

export const notificationApi = {
  getNotifications: (userId) => api.get('/notifications', { params: { userId } }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  processNotification: (id, action) => api.post(`/notifications/${id}/process`, { action }),
};

export default api;
