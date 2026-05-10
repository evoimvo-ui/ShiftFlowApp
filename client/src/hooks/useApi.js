import { useState, useEffect } from 'react';
import { workerApi, categoryApi, absenceApi, scheduleApi, settingApi } from '../api';
import { 
  MOCK_WORKERS, MOCK_CATEGORIES, MOCK_ABSENCES, 
  MOCK_SCHEDULES, MOCK_SETTINGS, MOCK_SHIFTS 
} from '../utils/mockData';

export default function useApi(user) {
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
      const [w, c, a, s, st, sh] = await Promise.all([
        workerApi.getAll(),
        categoryApi.getAll(),
        absenceApi.getAll(),
        scheduleApi.getAll(),
        settingApi.get(),
        settingApi.getShifts()
      ]);

      const mapId = (item) => ({ ...item, id: item._id });

      setWorkers(w.data.map(mapId));
      setCategories(c.data.map(mapId));
      setAbsences(a.data.map(mapId));
      setSchedules(s.data.map(mapId));
      setSettings(mapId(st.data));
      setShiftTypes(sh.data.map(mapId));
      setError(null);
    } catch (err) {
      console.error('API Error Details:', err.response?.data || err.message);
      setError(err.message);
      
      // DODAJEMO: Ako se desi greška, a nismo u demo modu, ne učitavaj ništa
      // Ovo će sprečiti "skakanje" u demo mod ako server vrati grešku
      setWorkers([]);
      setCategories([]);
      setAbsences([]);
      setSchedules([]);
      setSettings(null);
      setShiftTypes([]);
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
