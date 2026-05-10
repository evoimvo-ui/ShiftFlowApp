import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sf_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const workerApi = {
  getAll: () => api.get('/workers'),
  create: (data) => api.post('/workers', data),
  update: (id, data) => api.put(`/workers/${id}`, data),
  delete: (id) => api.delete(`/workers/${id}`),
};

export const categoryApi = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const absenceApi = {
  getAll: () => api.get('/absences'),
  create: (data) => api.post('/absences', data),
  approve: (id, status) => api.put(`/absences/${id}/approve`, { status }),
  delete: (id) => api.delete(`/absences/${id}`),
};

export const scheduleApi = {
  getAll: () => api.get('/schedules'),
  generate: (data) => api.post('/schedules/generate', data),
  delete: (weekStart) => api.delete(`/schedules/${weekStart}`),
  manualUpdate: (data) => api.put('/schedules/manual-update', data),
  deleteAssignment: (scheduleId, assignmentId) => api.delete(`/schedules/assignment/${scheduleId}/${assignmentId}`),
};

export const holidayApi = {
  getAll: () => api.get('/holidays'),
  create: (data) => api.post('/holidays', data),
  delete: (id) => api.delete(`/holidays/${id}`),
};

export const swapApi = {
  getAll: () => api.get('/swaps'),
  create: (data) => api.post('/swaps', data),
  process: (id, status) => api.put(`/swaps/${id}`, { status }),
};

export const auditApi = {
  getAll: () => api.get('/audit'),
};

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  deleteUser: (username) => api.delete(`/auth/user/${username}`),
};

export const settingApi = {
  get: () => api.get('/settings'),
  getOrg: () => api.get('/settings/organization'),
  update: (data) => api.put('/settings', data),
  getShifts: () => api.get('/settings/shifts'),
  createShift: (data) => api.post('/settings/shifts', data),
  updateShift: (id, data) => api.put(`/settings/shifts/${id}`, data),
  deleteShift: (id) => api.delete(`/settings/shifts/${id}`),
};

export default api;
