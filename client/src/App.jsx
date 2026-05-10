import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import DashboardPage from './pages/Dashboard'
import SchedulePage from './pages/Schedule'
import WorkersPage from './pages/Workers'
import CategoriesPage from './pages/Categories'
import AbsencesPage from './pages/Absences'
import SettingsPage from './pages/Settings'
import LoginPage from './pages/Login'
import { DEFAULT_SHIFTS, DEFAULT_SETTINGS } from './utils/helpers'
import useApi from './hooks/useApi'

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sf_user')
    return saved ? JSON.parse(saved) : null
  })

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

  if (!user) {
    return <LoginPage onLogin={setUser} />
  }

  if (loading) {
    console.log('App loading state:', { loading, settings, shiftTypes });
    return (
      <div className="min-h-screen bg-[--bg-surface] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[--blue] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[--text-muted] font-medium animate-pulse">Učitavanje podataka...</p>
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
          {user?.isDemo && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between shadow-lg shadow-amber-500/5 animate-in slide-in-from-top duration-500">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-200">Demo Verzija</p>
                  <p className="text-[10px] text-amber-500/80 font-medium uppercase tracking-wider">Koristite testne podatke za pregled funkcionalnosti.</p>
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
                  <p className="text-sm font-bold text-rose-200">Greška u povezivanju</p>
                  <p className="text-[10px] text-rose-500/80 font-medium uppercase tracking-wider">Server je vratio grešku: {error}</p>
                </div>
              </div>
              <button onClick={refresh} className="px-3 py-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-lg hover:bg-rose-400 transition-colors uppercase tracking-widest">
                Pokušaj ponovo
              </button>
            </div>
          )}
          {pages[active]}
        </div>
      </main>
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
