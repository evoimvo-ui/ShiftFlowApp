import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { workerApi, categoryApi, absenceApi, scheduleApi, settingApi, healthApi, swapApi, auditApi, groupApi, holidayApi, authApi } from '../api';
import { uid, isoDate, getWeekStart, shiftDurationHours } from '../utils/helpers';
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

export default function useApi(user) {
  const { t } = useTranslation();
  const [workers, setWorkers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [settings, setSettings] = useState(null);
  const [shiftTypes, setShiftTypes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refs to hold mock data state that can be modified without rerenders
  const mockWorkersRef = useRef([...MOCK_WORKERS]);
  const mockCategoriesRef = useRef([...MOCK_CATEGORIES]);
  const mockAbsencesRef = useRef([...MOCK_ABSENCES]);
  const mockSchedulesRef = useRef([...MOCK_SCHEDULES]);
  const mockSettingsRef = useRef({ ...MOCK_SETTINGS });
  const mockShiftsRef = useRef([...MOCK_SHIFTS]);
  const mockGroupsRef = useRef([...MOCK_GROUPS]);
  const mockHolidaysRef = useRef([...MOCK_HOLIDAYS]);
  const mockSwapsRef = useRef([...MOCK_SWAPS]);
  const mockAuditRef = useRef([...MOCK_AUDIT]);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Fetching data for user:', user);
      
      // Ako je demo korisnik, koristi mock podatke
      if (user?.isDemo) {
        console.log('Demo mode - using mock data');
        setWorkers([...mockWorkersRef.current]);
        setCategories([...mockCategoriesRef.current]);
        setAbsences([...mockAbsencesRef.current]);
        setSchedules([...mockSchedulesRef.current]);
        setSettings({ ...mockSettingsRef.current });
        setShiftTypes([...mockShiftsRef.current]);
        setGroups([...mockGroupsRef.current]);
        setHolidays([...mockHolidaysRef.current]);
        setSwaps([...mockSwapsRef.current]);
        setAuditLogs([...mockAuditRef.current]);
        setError(null);
        setLoading(false);
        return;
      }
      
      // Prvo "ping" da probudimo server ako spava
      try {
        await healthApi.ping();
      } catch (pingErr) {
        console.warn('Ping failed, but continuing with data fetch...', pingErr);
      }
      
      const results = await Promise.allSettled([
        workerApi.getAll({ retry: 1 }),
        categoryApi.getAll({ retry: 1 }),
        absenceApi.getAll({ retry: 1 }),
        scheduleApi.getAll({ retry: 1 }),
        settingApi.get({ retry: 1 }),
        settingApi.getShifts({ retry: 1 }),
        groupApi.getAll({ retry: 1 }),
        holidayApi.getAll({ retry: 1 }),
      ]);

      const mapId = (item) => ({ ...item, id: item._id });

      let anySuccess = false;
      if (results[0].status === 'fulfilled') { setWorkers(results[0].value.data.map(mapId)); anySuccess = true; }
      if (results[1].status === 'fulfilled') { setCategories(results[1].value.data.map(mapId)); anySuccess = true; }
      if (results[2].status === 'fulfilled') { setAbsences(results[2].value.data.map(mapId)); anySuccess = true; }
      if (results[3].status === 'fulfilled') { setSchedules(results[3].value.data.map(mapId)); anySuccess = true; }
      if (results[4].status === 'fulfilled') { setSettings(mapId(results[4].value.data)); anySuccess = true; }
      if (results[5].status === 'fulfilled') { setShiftTypes(results[5].value.data.map(mapId)); anySuccess = true; }
      if (results[6].status === 'fulfilled') { setGroups(results[6].value.data.map(mapId)); anySuccess = true; }
      if (results[7].status === 'fulfilled') { setHolidays(results[7].value.data.map(mapId)); anySuccess = true; }

      const errors = results.filter(r => r.status === 'rejected');
      if (errors.length > 0) {
        console.error('Some API calls failed:', errors);
        if (!anySuccess) {
          setError(t ? t('common.connectionError') : 'Greška u povezivanju');
        } else {
          setError(t ? t('common.partialLoadError') : 'Neki podaci nisu učitani');
        }
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('API Error Details:', err.response?.data || err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Mock API wrapper
  const wrapApi = (apiMethod, mockMethod) => {
    return async (...args) => {
      if (user?.isDemo) {
        const result = await mockMethod(...args);
        return { data: result };
      }
      return apiMethod(...args);
    };
  };

  // Mock implementations
  const mockSwapApi = {
    getAll: async () => [...mockSwapsRef.current],
    process: async (id, status) => {
      mockSwapsRef.current = mockSwapsRef.current.map(s => 
        s.id === id ? { ...s, status } : s
      );
      setSwaps([...mockSwapsRef.current]);
      return { success: true };
    },
    create: async (data) => {
      const newSwap = {
        id: uid(),
        ...data,
        status: 'pending',
        requestedAt: isoDate(new Date())
      };
      mockSwapsRef.current = [...mockSwapsRef.current, newSwap];
      setSwaps([...mockSwapsRef.current]);
      return newSwap;
    }
  };

  const mockAuditApi = {
    getAll: async () => [...mockAuditRef.current]
  };

  const mockGroupApi = {
    getAll: async () => [...mockGroupsRef.current],
    create: async (data) => {
      const newGroup = { id: uid(), ...data };
      mockGroupsRef.current = [...mockGroupsRef.current, newGroup];
      setGroups([...mockGroupsRef.current]);
      return newGroup;
    },
    update: async (id, data) => {
      mockGroupsRef.current = mockGroupsRef.current.map(g => 
        g.id === id ? { ...g, ...data } : g
      );
      setGroups([...mockGroupsRef.current]);
      return mockGroupsRef.current.find(g => g.id === id);
    },
    delete: async (id) => {
      mockGroupsRef.current = mockGroupsRef.current.filter(g => g.id !== id);
      setGroups([...mockGroupsRef.current]);
      return { success: true };
    }
  };

  const mockScheduleApi = {
    getAll: async () => [...mockSchedulesRef.current],
    generate: async (data) => {
      const newSchedule = {
        id: uid(),
        weekStart: data.weekStart,
        groupId: data.groupId || null,
        assignments: [],
        workerHours: {}
      };

      const filteredWorkers = mockWorkersRef.current.filter(w => 
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

      newSchedule.workerHours = calculateWorkerHours(newSchedule.assignments, mockShiftsRef.current);
      mockSchedulesRef.current = [...mockSchedulesRef.current.filter(s => 
        !(s.weekStart === data.weekStart && (s.groupId || null) === (data.groupId || null))
      ), newSchedule];
      setSchedules([...mockSchedulesRef.current]);
      return newSchedule;
    },
    delete: async (weekStart, options = {}) => {
      mockSchedulesRef.current = mockSchedulesRef.current.filter(s => 
        !(s.weekStart === weekStart && (s.groupId || null) === (options.groupId || null))
      );
      setSchedules([...mockSchedulesRef.current]);
      return { success: true };
    },
    manualUpdate: async (data) => {
      let updated = false;
      mockSchedulesRef.current = mockSchedulesRef.current.map(s => {
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
            workerHours: calculateWorkerHours(newAssignments, mockShiftsRef.current)
          };
        }
        return s;
      });

      if (updated) setSchedules([...mockSchedulesRef.current]);
      return mockSchedulesRef.current.find(s => s.id === data.scheduleId);
    },
    deleteAssignment: async (scheduleId, assignmentId) => {
      mockSchedulesRef.current = mockSchedulesRef.current.map(s => {
        if (s.id === scheduleId) {
          const newAssignments = s.assignments.filter(a => a.id !== assignmentId);
          return {
            ...s,
            assignments: newAssignments,
            workerHours: calculateWorkerHours(newAssignments, mockShiftsRef.current)
          };
        }
        return s;
      });
      setSchedules([...mockSchedulesRef.current]);
      return mockSchedulesRef.current.find(s => s.id === scheduleId);
    }
  };

  const mockWorkerApi = {
    getAll: async () => [...mockWorkersRef.current],
    create: async (data) => {
      const newWorker = { id: uid(), ...data };
      mockWorkersRef.current = [...mockWorkersRef.current, newWorker];
      setWorkers([...mockWorkersRef.current]);
      return newWorker;
    },
    update: async (id, data) => {
      mockWorkersRef.current = mockWorkersRef.current.map(w => 
        w.id === id ? { ...w, ...data } : w
      );
      setWorkers([...mockWorkersRef.current]);
      return mockWorkersRef.current.find(w => w.id === id);
    },
    delete: async (id) => {
      mockWorkersRef.current = mockWorkersRef.current.filter(w => w.id !== id);
      setWorkers([...mockWorkersRef.current]);
      return { success: true };
    }
  };

  const mockAuthApi = {
    deleteUser: async () => {
      return { success: true };
    }
  };

  const mockCategoryApi = {
    getAll: async () => [...mockCategoriesRef.current],
    create: async (data) => {
      const newCategory = { id: uid(), ...data };
      mockCategoriesRef.current = [...mockCategoriesRef.current, newCategory];
      setCategories([...mockCategoriesRef.current]);
      return newCategory;
    },
    update: async (id, data) => {
      mockCategoriesRef.current = mockCategoriesRef.current.map(c => 
        c.id === id ? { ...c, ...data } : c
      );
      setCategories([...mockCategoriesRef.current]);
      return mockCategoriesRef.current.find(c => c.id === id);
    },
    delete: async (id) => {
      mockCategoriesRef.current = mockCategoriesRef.current.filter(c => c.id !== id);
      setCategories([...mockCategoriesRef.current]);
      return { success: true };
    }
  };

  const mockAbsenceApi = {
    getAll: async () => [...mockAbsencesRef.current],
    create: async (data) => {
      const newAbsence = { id: uid(), ...data, status: 'pending' };
      mockAbsencesRef.current = [...mockAbsencesRef.current, newAbsence];
      setAbsences([...mockAbsencesRef.current]);
      return newAbsence;
    },
    approve: async (id, status) => {
      mockAbsencesRef.current = mockAbsencesRef.current.map(a => 
        a.id === id ? { ...a, status } : a
      );
      setAbsences([...mockAbsencesRef.current]);
      return mockAbsencesRef.current.find(a => a.id === id);
    },
    delete: async (id) => {
      mockAbsencesRef.current = mockAbsencesRef.current.filter(a => a.id !== id);
      setAbsences([...mockAbsencesRef.current]);
      return { success: true };
    }
  };

  const mockHolidayApi = {
    getAll: async () => [...mockHolidaysRef.current],
    create: async (data) => {
      const newHoliday = { id: uid(), ...data };
      mockHolidaysRef.current = [...mockHolidaysRef.current, newHoliday];
      setHolidays([...mockHolidaysRef.current]);
      return newHoliday;
    },
    delete: async (id) => {
      mockHolidaysRef.current = mockHolidaysRef.current.filter(h => h.id !== id);
      setHolidays([...mockHolidaysRef.current]);
      return { success: true };
    }
  };

  const mockSettingApi = {
    get: async () => ({ ...mockSettingsRef.current }),
    update: async (data) => {
      mockSettingsRef.current = { ...mockSettingsRef.current, ...data };
      setSettings({ ...mockSettingsRef.current });
      return mockSettingsRef.current;
    },
    getShifts: async () => [...mockShiftsRef.current],
    updateShift: async (id, data) => {
      mockShiftsRef.current = mockShiftsRef.current.map(s => 
        s.id === id ? { ...s, ...data } : s
      );
      setShiftTypes([...mockShiftsRef.current]);
      return mockShiftsRef.current.find(s => s.id === id);
    },
    createShift: async (data) => {
      const newShift = { id: uid(), ...data };
      mockShiftsRef.current = [...mockShiftsRef.current, newShift];
      setShiftTypes([...mockShiftsRef.current]);
      return newShift;
    },
    deleteShift: async (id) => {
      mockShiftsRef.current = mockShiftsRef.current.filter(s => s.id !== id);
      setShiftTypes([...mockShiftsRef.current]);
      return { success: true };
    },
    getOrg: async () => ({
      _id: 'demo-org',
      settings: {
        subscriptionPlan: 'basic',
        subscriptionStatus: 'active',
        trialEndsAt: null
      },
      currentPeriodEnd: '2026-12-31'
    })
  };

  // Export wrapped APIs
  const wrappedSwapApi = {
    getAll: wrapApi(swapApi.getAll, mockSwapApi.getAll),
    process: wrapApi(swapApi.process, mockSwapApi.process),
    create: wrapApi(swapApi.create, mockSwapApi.create)
  };

  const wrappedAuditApi = {
    getAll: wrapApi(auditApi.getAll, mockAuditApi.getAll)
  };

  const wrappedGroupApi = {
    getAll: wrapApi(groupApi.getAll, mockGroupApi.getAll),
    create: wrapApi(groupApi.create, mockGroupApi.create),
    update: wrapApi(groupApi.update, mockGroupApi.update),
    delete: wrapApi(groupApi.delete, mockGroupApi.delete)
  };

  const wrappedScheduleApi = {
    getAll: wrapApi(scheduleApi.getAll, mockScheduleApi.getAll),
    generate: wrapApi(scheduleApi.generate, mockScheduleApi.generate),
    delete: wrapApi(scheduleApi.delete, mockScheduleApi.delete),
    manualUpdate: wrapApi(scheduleApi.manualUpdate, mockScheduleApi.manualUpdate),
    deleteAssignment: wrapApi(scheduleApi.deleteAssignment, mockScheduleApi.deleteAssignment)
  };

  const wrappedWorkerApi = {
    getAll: wrapApi(workerApi.getAll, mockWorkerApi.getAll),
    create: wrapApi(workerApi.create, mockWorkerApi.create),
    update: wrapApi(workerApi.update, mockWorkerApi.update),
    delete: wrapApi(workerApi.delete, mockWorkerApi.delete)
  };

  const wrappedAuthApi = {
    deleteUser: wrapApi(authApi.deleteUser, mockAuthApi.deleteUser)
  };

  const wrappedCategoryApi = {
    getAll: wrapApi(categoryApi.getAll, mockCategoryApi.getAll),
    create: wrapApi(categoryApi.create, mockCategoryApi.create),
    update: wrapApi(categoryApi.update, mockCategoryApi.update),
    delete: wrapApi(categoryApi.delete, mockCategoryApi.delete)
  };

  const wrappedAbsenceApi = {
    getAll: wrapApi(absenceApi.getAll, mockAbsenceApi.getAll),
    create: wrapApi(absenceApi.create, mockAbsenceApi.create),
    approve: wrapApi(absenceApi.approve, mockAbsenceApi.approve),
    delete: wrapApi(absenceApi.delete, mockAbsenceApi.delete)
  };

  const wrappedHolidayApi = {
    getAll: wrapApi(holidayApi.getAll, mockHolidayApi.getAll),
    create: wrapApi(holidayApi.create, mockHolidayApi.create),
    delete: wrapApi(holidayApi.delete, mockHolidayApi.delete)
  };

  const wrappedSettingApi = {
    get: wrapApi(settingApi.get, mockSettingApi.get),
    update: wrapApi(settingApi.update, mockSettingApi.update),
    getShifts: wrapApi(settingApi.getShifts, mockSettingApi.getShifts),
    updateShift: wrapApi(settingApi.updateShift, mockSettingApi.updateShift),
    createShift: wrapApi(settingApi.createShift, mockSettingApi.createShift),
    deleteShift: wrapApi(settingApi.deleteShift, mockSettingApi.deleteShift),
    getOrg: wrapApi(settingApi.getOrg, mockSettingApi.getOrg)
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  return {
    workers, setWorkers,
    categories, setCategories,
    absences, setAbsences,
    schedules, setSchedules,
    settings, setSettings,
    shiftTypes, setShiftTypes,
    groups, setGroups,
    holidays, setHolidays,
    swaps, setSwaps,
    auditLogs, setAuditLogs,
    loading, error,
    refresh: fetchData,
    // Wrapped APIs for components to use
    swapApi: wrappedSwapApi,
    auditApi: wrappedAuditApi,
    groupApi: wrappedGroupApi,
    scheduleApi: wrappedScheduleApi,
    workerApi: wrappedWorkerApi,
    authApi: wrappedAuthApi,
    categoryApi: wrappedCategoryApi,
    absenceApi: wrappedAbsenceApi,
    holidayApi: wrappedHolidayApi,
    settingApi: wrappedSettingApi
  };
}
