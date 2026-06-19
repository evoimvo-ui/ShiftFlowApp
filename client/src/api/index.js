import axios from 'axios';
import {
  MOCK_WORKERS,
  MOCK_CATEGORIES,
  MOCK_ABSENCES,
  MOCK_SCHEDULES,
  MOCK_SETTINGS,
  MOCK_SHIFTS,
  MOCK_GROUPS,
  MOCK_SWAPS,
  MOCK_AUDIT,
  MOCK_HOLIDAYS
} from '../utils/mockData';
import { uid, isoDate, shiftDurationHours } from '../utils/helpers';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000, // Smanjujemo timeout na 10 sekundi
});

// Provjera demo moda
const isDemoMode = () => {
  try {
    const user = JSON.parse(localStorage.getItem('sf_user'));
    return user?.isDemo;
  } catch (e) {
    return false;
  }
};

// Helper to calculate worker hours for a schedule
const calculateWorkerHours = (assignments, shifts) => {
  const hours = {};
  assignments.forEach(a => {
    const shift = shifts.find(s => s.id === a.shiftId);
    if (shift) {
      hours[a.workerId] = (hours[a.workerId] || 0) + shiftDurationHours(shift);
    }
  });
  return hours;
};

// Lokalno stanje za demo mod (da se promjene održavaju između poziva)
let demoState = {
  workers: [...MOCK_WORKERS],
  categories: [...MOCK_CATEGORIES],
  absences: [...MOCK_ABSENCES],
  schedules: [...MOCK_SCHEDULES],
  settings: { ...MOCK_SETTINGS },
  shifts: [...MOCK_SHIFTS],
  groups: [...MOCK_GROUPS],
  swaps: [...MOCK_SWAPS],
  audit: [...MOCK_AUDIT],
  holidays: [...MOCK_HOLIDAYS]
};

// Wrapper funkcija za API pozive
const wrapApi = (apiFn, mockFn) => {
  return (...args) => {
    if (isDemoMode()) {
      return Promise.resolve({ data: mockFn(...args) });
    }
    return apiFn(...args);
  };
};

// Custom event for 402 errors
export const emit402Error = (errorCode, organizationId) => {
  const event = new CustomEvent('paddle-402-error', {
    detail: { errorCode, organizationId }
  });
  window.dispatchEvent(event);
};

// Retry logika za mrežne greške
api.interceptors.response.use(null, async (error) => {
  // Handle 402 Payment Required
  if (error.response?.status === 402) {
    const errorCode = error.response.data?.code || 'unknown';
    // Get organizationId from localStorage user
    let organizationId = null;
    try {
      const user = JSON.parse(localStorage.getItem('sf_user'));
      organizationId = user?.organizationId;
    } catch (e) {}
    emit402Error(errorCode, organizationId);
  }

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
  ping: wrapApi(
    () => api.get('/health', { retry: 1 }),
    () => ({ status: 'ok' })
  )
};

export const workerApi = {
  getAll: wrapApi(
    (config = {}) => api.get('/workers', config),
    () => demoState.workers
  ),
  create: wrapApi(
    (data) => api.post('/workers', data),
    (data) => {
      const id = uid();
      const newWorker = { _id: id, id, ...data };
      demoState.workers = [...demoState.workers, newWorker];
      return newWorker;
    }
  ),
  update: wrapApi(
    (id, data) => api.put(`/workers/${id}`, data),
    (id, data) => {
      demoState.workers = demoState.workers.map(w => w.id === id ? { ...w, ...data } : w);
      return demoState.workers.find(w => w.id === id);
    }
  ),
  delete: wrapApi(
    (id) => api.delete(`/workers/${id}`),
    (id) => {
      demoState.workers = demoState.workers.filter(w => w.id !== id);
      return { success: true };
    }
  ),
};

export const groupApi = {
  getAll: wrapApi(
    (config = {}) => api.get('/groups', config),
    () => demoState.groups
  ),
  create: wrapApi(
    (data) => api.post('/groups', data),
    (data) => {
      const id = uid();
      const newGroup = { _id: id, id, ...data };
      demoState.groups = [...demoState.groups, newGroup];
      return newGroup;
    }
  ),
  update: wrapApi(
    (id, data) => api.put(`/groups/${id}`, data),
    (id, data) => {
      demoState.groups = demoState.groups.map(g => g.id === id ? { ...g, ...data } : g);
      return demoState.groups.find(g => g.id === id);
    }
  ),
  delete: wrapApi(
    (id) => api.delete(`/groups/${id}`),
    (id) => {
      demoState.groups = demoState.groups.filter(g => g.id !== id);
      return { success: true };
    }
  ),
};

export const categoryApi = {
  getAll: wrapApi(
    (config = {}) => api.get('/categories', config),
    () => demoState.categories
  ),
  create: wrapApi(
    (data) => api.post('/categories', data),
    (data) => {
      const id = uid();
      const newCategory = { _id: id, id, ...data };
      demoState.categories = [...demoState.categories, newCategory];
      return newCategory;
    }
  ),
  update: wrapApi(
    (id, data) => api.put(`/categories/${id}`, data),
    (id, data) => {
      demoState.categories = demoState.categories.map(c => c.id === id ? { ...c, ...data } : c);
      return demoState.categories.find(c => c.id === id);
    }
  ),
  delete: wrapApi(
    (id) => api.delete(`/categories/${id}`),
    (id) => {
      demoState.categories = demoState.categories.filter(c => c.id !== id);
      return { success: true };
    }
  ),
};

export const absenceApi = {
  getAll: wrapApi(
    (config = {}) => api.get('/absences', config),
    () => demoState.absences
  ),
  create: wrapApi(
    (data) => api.post('/absences', data),
    (data) => {
      const id = uid();
      const newAbsence = { _id: id, id, ...data, status: 'pending' };
      demoState.absences = [...demoState.absences, newAbsence];
      return newAbsence;
    }
  ),
  approve: wrapApi(
    (id, status) => api.put(`/absences/${id}/approve`, { status }),
    (id, status) => {
      demoState.absences = demoState.absences.map(a => a.id === id ? { ...a, status } : a);
      return demoState.absences.find(a => a.id === id);
    }
  ),
  delete: wrapApi(
    (id) => api.delete(`/absences/${id}`),
    (id) => {
      demoState.absences = demoState.absences.filter(a => a.id !== id);
      return { success: true };
    }
  ),
};

export const scheduleApi = {
  getAll: wrapApi(
    (config = {}) => api.get('/schedules', config),
    () => demoState.schedules
  ),
  generate: wrapApi(
    (data) => api.post('/schedules/generate', data),
    (data) => {
      const id = uid();
      const newSchedule = {
        _id: id,
        id,
        weekStart: data.weekStart,
        groupId: data.groupId || null,
        assignments: [],
        workerHours: {}
      };
      const filteredWorkers = demoState.workers.filter(w => 
        !data.groupId || w.groupId === data.groupId
      );
      filteredWorkers.forEach(worker => {
        if (worker.categoryIds && worker.categoryIds.length > 0) {
          for (let day = 0; day < 5; day++) {
            const shiftIds = ['morning', 'afternoon'];
            const shiftId = shiftIds[Math.floor(Math.random() * shiftIds.length)];
            const categoryId = worker.categoryIds[0];
            newSchedule.assignments.push({
              id: uid(),
              workerId: worker.id,
              categoryId,
              shiftId,
              dayOffset: day
            });
          }
        }
      });
      newSchedule.workerHours = calculateWorkerHours(newSchedule.assignments, demoState.shifts);
      demoState.schedules = [...demoState.schedules.filter(s => 
        !(s.weekStart === data.weekStart && (s.groupId || null) === (data.groupId || null))
      ), newSchedule];
      return newSchedule;
    }
  ),
  delete: wrapApi(
    (weekStart, data = {}) => api.delete(`/schedules/${weekStart}`, { data }),
    (weekStart, options = {}) => {
      demoState.schedules = demoState.schedules.filter(s => 
        !(s.weekStart === weekStart && (s.groupId || null) === (options.groupId || null))
      );
      return { success: true };
    }
  ),
  manualUpdate: wrapApi(
    (data) => api.put('/schedules/manual-update', data),
    (data) => {
      let updated = false;
      demoState.schedules = demoState.schedules.map(s => {
        if (s.id === data.scheduleId) {
          let newAssignments = [...s.assignments];
          if (data.assignmentId) {
            newAssignments = newAssignments.map(a => 
              a.id === data.assignmentId ? { ...a, workerId: data.newWorkerId } : a
            );
          } else {
            newAssignments.push({
              id: uid(),
              workerId: data.newWorkerId,
              categoryId: data.categoryId,
              shiftId: data.shiftId,
              dayOffset: data.dayOffset
            });
          }
          updated = true;
          return {
            ...s,
            assignments: newAssignments,
            workerHours: calculateWorkerHours(newAssignments, demoState.shifts)
          };
        }
        return s;
      });
      return demoState.schedules.find(s => s.id === data.scheduleId);
    }
  ),
  deleteAssignment: wrapApi(
    (scheduleId, assignmentId) => api.delete(`/schedules/assignment/${scheduleId}/${assignmentId}`),
    (scheduleId, assignmentId) => {
      demoState.schedules = demoState.schedules.map(s => {
        if (s.id === scheduleId) {
          const newAssignments = s.assignments.filter(a => a.id !== assignmentId);
          return {
            ...s,
            assignments: newAssignments,
            workerHours: calculateWorkerHours(newAssignments, demoState.shifts)
          };
        }
        return s;
      });
      return demoState.schedules.find(s => s.id === scheduleId);
    }
  ),
};

export const holidayApi = {
  getAll: wrapApi(
    (config = {}) => api.get('/holidays', config),
    () => demoState.holidays
  ),
  create: wrapApi(
    (data) => api.post('/holidays', data),
    (data) => {
      const id = uid();
      const newHoliday = { _id: id, id, ...data };
      demoState.holidays = [...demoState.holidays, newHoliday];
      return newHoliday;
    }
  ),
  delete: wrapApi(
    (id) => api.delete(`/holidays/${id}`),
    (id) => {
      demoState.holidays = demoState.holidays.filter(h => h.id !== id);
      return { success: true };
    }
  ),
};

export const swapApi = {
  getAll: wrapApi(
    (config = {}) => api.get('/swaps', config),
    () => demoState.swaps
  ),
  create: wrapApi(
    (data) => api.post('/swaps', data),
    (data) => {
      const id = uid();
      const newSwap = { _id: id, id, ...data, status: 'pending', requestedAt: isoDate(new Date()) };
      demoState.swaps = [...demoState.swaps, newSwap];
      return newSwap;
    }
  ),
  process: wrapApi(
    (id, status) => api.put(`/swaps/${id}`, { status }),
    (id, status) => {
      demoState.swaps = demoState.swaps.map(s => s.id === id ? { ...s, status } : s);
      return { success: true };
    }
  ),
};

export const auditApi = {
  getAll: wrapApi(
    (config = {}) => api.get('/audit', config),
    () => demoState.audit
  ),
};

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  resendVerification: (data) => api.post('/auth/resend-verification', data),
  getMe: wrapApi(
    () => api.get('/auth/me'),
    () => JSON.parse(localStorage.getItem('sf_user')) || { username: 'Gost', role: 'admin', isDemo: true }
  ),
  changePassword: (data) => api.post('/auth/change-password', data),
  acceptTos: wrapApi(
    (data) => api.post('/auth/accept-tos', data),
    () => {
      const user = JSON.parse(localStorage.getItem('sf_user'));
      const updatedUser = { ...user, tosAcceptedAt: isoDate(new Date()) };
      localStorage.setItem('sf_user', JSON.stringify(updatedUser));
      return updatedUser;
    }
  ),
  deleteUser: wrapApi(
    (username) => api.delete(`/auth/user/${username}`),
    () => ({ success: true })
  )
};

export const settingApi = {
  get: wrapApi(
    (config = {}) => api.get('/settings', config),
    () => demoState.settings
  ),
  getOrg: wrapApi(
    (config = {}) => api.get('/settings/organization', config),
    () => ({
      _id: 'demo-org',
      settings: {
        subscriptionPlan: 'basic',
        subscriptionStatus: 'active',
        trialEndsAt: null
      },
      currentPeriodEnd: '2026-12-31'
    })
  ),
  update: wrapApi(
    (data) => api.put('/settings', data),
    (data) => {
      demoState.settings = { ...demoState.settings, ...data };
      return demoState.settings;
    }
  ),
  getShifts: wrapApi(
    (config = {}) => api.get('/settings/shifts', config),
    () => demoState.shifts
  ),
  createShift: wrapApi(
    (data) => api.post('/settings/shifts', data),
    (data) => {
      const id = uid();
      const newShift = { _id: id, id, ...data };
      demoState.shifts = [...demoState.shifts, newShift];
      return newShift;
    }
  ),
  updateShift: wrapApi(
    (id, data) => api.put(`/settings/shifts/${id}`, data),
    (id, data) => {
      demoState.shifts = demoState.shifts.map(s => s.id === id ? { ...s, ...data } : s);
      return demoState.shifts.find(s => s.id === id);
    }
  ),
  deleteShift: wrapApi(
    (id) => api.delete(`/settings/shifts/${id}`),
    (id) => {
      demoState.shifts = demoState.shifts.filter(s => s.id !== id);
      return { success: true };
    }
  ),
};

export const notificationApi = {
  getNotifications: (userId) => api.get('/notifications', { params: { userId } }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  processNotification: (id, action) => api.post(`/notifications/${id}/process`, { action }),
};

export default api;
