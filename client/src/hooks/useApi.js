import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { workerApi, categoryApi, absenceApi, scheduleApi, settingApi, healthApi, groupApi, holidayApi } from '../api';
import { uid } from '../utils/helpers';
import { MOCK_GROUPS } from '../utils/mockData';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Wrapper za groupApi da koristi mock u demo modu
  const wrappedGroupApi = {
    getAll: (...args) => {
      console.log('groupApi mock:', MOCK_GROUPS);
      if (user?.isDemo) {
        return Promise.resolve({ data: MOCK_GROUPS });
      }
      return groupApi.getAll(...args);
    },
    create: (...args) => {
      if (user?.isDemo) {
        return Promise.resolve({ data: { _id: uid(), id: uid(), ...args[0] } });
      }
      return groupApi.create(...args);
    },
    update: (...args) => {
      if (user?.isDemo) {
        return Promise.resolve({ data: { _id: args[0], id: args[0], ...args[1] } });
      }
      return groupApi.update(...args);
    },
    delete: (...args) => {
      if (user?.isDemo) {
        return Promise.resolve({ data: { success: true } });
      }
      return groupApi.delete(...args);
    },
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Fetching data for user:', user);
      
      // Prvo "ping" da probudimo server ako spava (ne za demo, ali ne škodi)
      try {
        if (!user?.isDemo) {
          await healthApi.ping();
        }
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
        wrappedGroupApi.getAll({ retry: 1 }),
        holidayApi.getAll({ retry: 1 }),
      ]);

      const mapId = (item) => ({ ...item, id: item._id });

      let anySuccess = false;
      console.log('All results:', results);
      if (results[0].status === 'fulfilled') { setWorkers(results[0].value.data.map(mapId)); anySuccess = true; }
      if (results[1].status === 'fulfilled') { setCategories(results[1].value.data.map(mapId)); anySuccess = true; }
      if (results[2].status === 'fulfilled') { setAbsences(results[2].value.data.map(mapId)); anySuccess = true; }
      if (results[3].status === 'fulfilled') { setSchedules(results[3].value.data.map(mapId)); anySuccess = true; }
      if (results[4].status === 'fulfilled') { setSettings(mapId(results[4].value.data)); anySuccess = true; }
      if (results[5].status === 'fulfilled') { setShiftTypes(results[5].value.data.map(mapId)); anySuccess = true; }
      if (results[6].status === 'fulfilled') { 
        console.log('Groups data:', results[6].value.data);
        console.log('Groups data after mapId:', results[6].value.data.map(mapId));
        setGroups(results[6].value.data.map(mapId)); 
        anySuccess = true; 
      }
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

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  return {
    workers, setWorkers,
    categories, setCategories,
    absences, setAbsences,
    schedules, setSchedules,
    settings, setSettings,
    shiftTypes, setShiftTypes,
    groups,
    holidays,
    loading,
    error,
    fetchData,
    refresh: fetchData,
    groupApi: wrappedGroupApi
  };
}