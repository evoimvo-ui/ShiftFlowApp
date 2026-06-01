import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { workerApi, categoryApi, absenceApi, scheduleApi, settingApi, healthApi } from '../api';

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
        settingApi.getShifts({ retry: 1 })
      ]);

      const mapId = (item) => ({ ...item, id: item._id });

      let anySuccess = false;
      if (results[0].status === 'fulfilled') { setWorkers(results[0].value.data.map(mapId)); anySuccess = true; }
      if (results[1].status === 'fulfilled') { setCategories(results[1].value.data.map(mapId)); anySuccess = true; }
      if (results[2].status === 'fulfilled') { setAbsences(results[2].value.data.map(mapId)); anySuccess = true; }
      if (results[3].status === 'fulfilled') { setSchedules(results[3].value.data.map(mapId)); anySuccess = true; }
      if (results[4].status === 'fulfilled') { setSettings(mapId(results[4].value.data)); anySuccess = true; }
      if (results[5].status === 'fulfilled') { setShiftTypes(results[5].value.data.map(mapId)); anySuccess = true; }

      const errors = results.filter(r => r.status === 'rejected');
      if (errors.length > 0) {
        console.error('Some API calls failed:', errors);
        // Ako bar nešto radi, ne prikazujemo totalni error, nego samo warning u konzoli
        // ali ako NIŠTA nije učitano, onda prikazujemo error
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
