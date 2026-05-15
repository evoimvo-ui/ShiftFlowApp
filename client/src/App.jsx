import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import NotificationModal from './components/NotificationModal'
import LanguageSelector from './components/LanguageSelector'
import DashboardPage from './pages/Dashboard'
import SchedulePage from './pages/Schedule'
import WorkersPage from './pages/Workers'
import CategoriesPage from './pages/Categories'
import AbsencesPage from './pages/Absences'
import SettingsPage from './pages/Settings'
import LoginPage from './pages/Login'
import { DEFAULT_SHIFTS, DEFAULT_SETTINGS } from './utils/helpers'
import useApi from './hooks/useApi'
import { settingApi } from './api'
import { useNotifications } from './hooks/useNotifications'
import { useTranslation } from 'react-i18next'

export default function App() {
  const { t } = useTranslation()
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sf_user')
    return saved ? JSON.parse(saved) : null
  })

  // Efekat za dopunjavanje naziva firme ako nedostaje
  useEffect(() => {
    if (user && !user.organizationName && !user.isDemo) {
      settingApi.getOrg().then(res => {
        const updatedUser = { ...user, organizationName: res.data.name };
        setUser(updatedUser);
        localStorage.setItem('sf_user', JSON.stringify(updatedUser));
      }).catch(err => console.error("Greška pri učitavanju naziva firme:", err));
    }
  }, [user]);

  const [active, setActive] = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)

  const { 
    workers, setWorkers, 
    categories, setCategories, 
    absences, setAbsences, 
    schedules, setSchedules,
    settings, setSettings,
    shiftTypes, setShiftTypes,
    loading, error,
    refresh 
  } = useApi(user)

  // Pronađi trenutnog radnika za notifikacije
  const currentWorker = workers?.find(w => 
    (w.username?.toLowerCase() === user?.username?.toLowerCase()) || 
    (w.name?.toLowerCase() === user?.username?.toLowerCase())
  )
  const currentWorkerId = currentWorker?.id || currentWorker?._id

  console.log('Debug - User:', user?.username, 'Role:', user?.role)
  console.log('Debug - Workers:', workers?.map(w => w.name))
  console.log('Debug - Current worker:', currentWorker)
  console.log('Debug - Current worker ID:', currentWorkerId)

  // Za admin koristimo user._id, za radnike worker._id
  const notificationUserId = user?.role === 'admin' ? user._id : currentWorkerId

  console.log('Debug - Notification user ID:', notificationUserId)

  // Notifikacije - UVEK pozivamo hook, ali prosleđujemo null ako nema usera
  const {
    currentNotification,
    modalOpen,
    closeModal
  } = useNotifications(notificationUserId)

  if (!user) {
    return <LoginPage onLogin={setUser} />
  }

  if (loading) {
    console.log('App loading state:', { loading, settings, shiftTypes });
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-6 max-w-xs text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-500/10 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-white font-bold tracking-tight">{t('common.loading')}</h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              {t('common.loadingDescription')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const pages = {
    dashboard: <DashboardPage workers={workers} categories={categories} absences={absences} schedules={schedules} shiftTypes={shiftTypes} settings={settings} refresh={refresh} user={user} />,
    schedule: <SchedulePage schedules={schedules} setSchedules={setSchedules} workers={workers} categories={categories} absences={absences} shiftTypes={shiftTypes} settings={settings} refresh={refresh} user={user} />,
    workers: <WorkersPage workers={workers} setWorkers={setWorkers} categories={categories} user={user} />,
    categories: <CategoriesPage categories={categories} setCategories={setCategories} shiftTypes={shiftTypes} workers={workers} user={user} />,
    absences: <AbsencesPage absences={absences} setAbsences={setAbsences} workers={workers} categories={categories} user={user} refresh={refresh} />,
    settings: <SettingsPage settings={settings} setSettings={setSettings} shiftTypes={shiftTypes} setShiftTypes={setShiftTypes} user={user} />,
  }

  return (
    <div className="flex min-h-screen bg-[--bg-surface] text-[--text-primary] selection:bg-blue-500/30">
      <Sidebar 
        active={active} 
        setActive={setActive} 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        workers={workers} 
        absences={absences} 
        user={user}
      />
      <main className="flex-1 p-8 overflow-y-auto max-w-full">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-end mb-4">
            <LanguageSelector />
          </div>
          {user?.isDemo && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between shadow-lg shadow-amber-500/5 animate-in slide-in-from-top duration-500">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-200">{t('common.demoVersion')}</p>
                  <p className="text-[10px] text-amber-500/80 font-medium uppercase tracking-wider">{t('common.demoDescription')}</p>
                </div>
              </div>
            </div>
          )}
          {error && !user?.isDemo && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between shadow-lg shadow-rose-500/5 animate-in slide-in-from-top duration-500">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-rose-200">{t('common.connectionError')}</p>
                  <p className="text-[10px] text-rose-500/80 font-medium uppercase tracking-wider">{t('common.serverError', { error })}</p>
                </div>
              </div>
              <button onClick={refresh} className="px-3 py-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-lg hover:bg-rose-400 transition-colors uppercase tracking-widest">
                {t('common.retry')}
              </button>
            </div>
          )}
          {pages[active]}
        </div>
      </main>
      <NotificationModal 
        open={modalOpen} 
        onClose={closeModal} 
        notification={currentNotification}
        workers={workers}
      />
    </div>
  )
}

function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initial
    } catch { return initial }
  })
  useEffect(() => { 
    try { 
      localStorage.setItem(key, JSON.stringify(val)) 
    } catch {} 
  }, [key, val])
  return [val, setVal]
}
