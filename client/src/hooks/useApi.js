import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { workerApi, categoryApi, absenceApi, scheduleApi, settingApi } from '../api';
import { 
  MOCK_WORKERS, MOCK_CATEGORIES, MOCK_ABSENCES, 
  MOCK_SCHEDULES, MOCK_SETTINGS, MOCK_SHIFTS 
} from '../utils/mockData';

export default function useApi(user) {
  const { t } = useTranslation();
  const [workers, setWorkers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [settings, setSettings] = useState(null);
  const [shiftTypes, setShiftTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Fetching data for user:', user);
      
      const results = await Promise.allSettled([
        workerApi.getAll(),
        categoryApi.getAll(),
        absenceApi.getAll(),
        scheduleApi.getAll(),
        settingApi.get(),
        settingApi.getShifts()
      ]);

      const mapId = (item) => ({ ...item, id: item._id });

      if (results[0].status === 'fulfilled') setWorkers(results[0].value.data.map(mapId));
      if (results[1].status === 'fulfilled') setCategories(results[1].value.data.map(mapId));
      if (results[2].status === 'fulfilled') setAbsences(results[2].value.data.map(mapId));
      if (results[3].status === 'fulfilled') setSchedules(results[3].value.data.map(mapId));
      if (results[4].status === 'fulfilled') setSettings(mapId(results[4].value.data));
      if (results[5].status === 'fulfilled') setShiftTypes(results[5].value.data.map(mapId));

      const errors = results.filter(r => r.status === 'rejected');
      if (errors.length > 0) {
        console.error('Some API calls failed:', errors);
        setError(t ? t('common.partialLoadError') : 'Neki podaci nisu učitani');
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
    if (user) fetchData();
  }, [user]);

  return {
    workers, setWorkers,
    categories, setCategories,
    absences, setAbsences,
    schedules, setSchedules,
    settings, setSettings,
    shiftTypes, setShiftTypes,
    loading, error,
    refresh: fetchData
  };
}
