import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import NotificationModal from './components/NotificationModal'
import LanguageSelector from './components/LanguageSelector'
import UpgradeModal from './components/UpgradeModal'
import ConsentModal from './components/ConsentModal'
import DashboardPage from './pages/Dashboard'
import SchedulePage from './pages/Schedule'
import WorkersPage from './pages/Workers'
import CategoriesPage from './pages/Categories'
import AbsencesPage from './pages/Absences'
import SettingsPage from './pages/Settings'
import LoginPage from './pages/Login'
import ChangePasswordPage from './pages/ChangePassword'
import UserManualPage from './pages/UserManual' // Dodao sam ovu liniju
import useApi from './hooks/useApi'
import { useNotifications } from './hooks/useNotifications'
import { useTranslation } from 'react-i18next'
import { Toaster, toast } from 'react-hot-toast'
import { authApi, settingApi } from './api'
import { initializePaddle } from '@paddle/paddle-js'
import { HelpCircle } from 'lucide-react'; // Dodajem HelpCircle ikonicu

export default function App() {
  const { t } = useTranslation()
  const [theme, setTheme] = useState(() => localStorage.getItem('sf_theme') || 'dark')
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sf_user')
      return saved ? JSON.parse(saved) : null
    } catch (e) {
      return null
    }
  })

  // Upgrade Modal state
  const [upgradeModal, setUpgradeModal] = useState({
    isOpen: false,
    errorCode: null,
    organizationId: null
  })
  // Consent Modal state
  const [showConsentModal, setShowConsentModal] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('sf_theme', theme)
  }, [theme])

  // Initialize Paddle on mount
useEffect(() => {
  initializePaddle({
    environment: 'production',
    token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN
  }).then((paddle) => {
    if (paddle) {
      window.Paddle = paddle;
    }
  });
}, []);
  // Listen for 402 events
  useEffect(() => {
    const handle402Error = (event) => {
      setUpgradeModal({
        isOpen: true,
        errorCode: event.detail.errorCode,
        organizationId: event.detail.organizationId
      });
    };

    window.addEventListener('paddle-402-error', handle402Error);
    return () => {
      window.removeEventListener('paddle-402-error', handle402Error);
    };
  }, [user]);

  // Osvježavanje podataka o korisniku pri svakom učitavanju aplikacije
  useEffect(() => {
    if (user && !user.isDemo) {
      authApi.getMe().then(res => {
        const updatedUser = res.data;
        console.log('updatedUser:', updatedUser);
        // Ako se uloga promijenila, prisilno odjavi korisnika ili osvježi state
        if (user.role !== updatedUser.role) {
          toast.error(t('common.roleChanged'));
          setTimeout(() => {
            localStorage.removeItem('sf_user');
            localStorage.removeItem('sf_token');
            window.location.reload();
          }, 2000);
        } else {
          setUser(updatedUser);
          localStorage.setItem('sf_user', JSON.stringify(updatedUser));
          // Provjeri da li je korisnik prihvatio ToS
          if (!updatedUser.tosAcceptedAt) {
            setShowConsentModal(true);
          }
        }
      }).catch(err => {
        if (err.response?.status === 401) {
          localStorage.removeItem('sf_user');
          localStorage.removeItem('sf_token');
          setUser(null);
        }
      });
    }
  }, []);

  // Funkcija za prihvat ToS-a
  const handleAcceptTos = async () => {
    const res = await authApi.acceptTos({ tosVersion: '1.0' });
    const updatedUser = res.data;
    setUser(updatedUser);
    localStorage.setItem('sf_user', JSON.stringify(updatedUser));
    setShowConsentModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('sf_token');
    localStorage.removeItem('sf_user');
    setUser(null);
  };

  const [active, setActive] = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)

  const { 
    workers, setWorkers, 
    categories, setCategories, 
    absences, setAbsences, 
    schedules, setSchedules,
    settings, setSettings,
    shiftTypes, setShiftTypes,
    groups,
    loading, error,
    refresh 
  } = useApi(user)

  const currentWorker = workers?.find(w => 
    (w.username?.toLowerCase() === user?.username?.toLowerCase()) || 
    (w.name?.toLowerCase() === user?.username?.toLowerCase())
  )
  const currentWorkerId = currentWorker?.id || currentWorker?._id
  const notificationUserId = user?.role === 'admin' ? user._id : currentWorkerId

  const {
    currentNotification,
    modalOpen,
    closeModal
  } = useNotifications(notificationUserId)

  if (!user) {
    return <LoginPage onLogin={setUser} />
  }

  if (user.mustChangePassword) {
    return <ChangePasswordPage onPasswordChanged={() => {
      // Osvježi korisničke podatke nakon promjene lozinke
      authApi.getMe().then(res => {
        setUser(res.data)
        localStorage.setItem('sf_user', JSON.stringify(res.data))
      })
    }} />
  }

  if (showConsentModal) {
    return (
      <div className="min-h-screen bg-[var(--bg-surface)] flex items-center justify-center p-6">
        <ConsentModal
          isOpen={showConsentModal}
          onAccept={handleAcceptTos}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-surface)] flex items-center justify-center p-6">
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
    schedule: <SchedulePage schedules={schedules} setSchedules={setSchedules} workers={workers} categories={categories} absences={absences} shiftTypes={shiftTypes} settings={settings} refresh={refresh} user={user} groups={groups} />,
    workers: <WorkersPage workers={workers} setWorkers={setWorkers} categories={categories} user={user} />,
    categories: <CategoriesPage categories={categories} setCategories={setCategories} shiftTypes={shiftTypes} workers={workers} user={user} />,
    absences: <AbsencesPage absences={absences} setAbsences={setAbsences} workers={workers} categories={categories} user={user} refresh={refresh} />,
    settings: <SettingsPage settings={settings} setSettings={setSettings} shiftTypes={shiftTypes} setShiftTypes={setShiftTypes} user={user} />,
    manual: <UserManualPage />, // Dodana UserManualPage
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-surface)] text-[var(--text-primary)]">
      <Toaster position="top-right" />
      <Sidebar 
        active={active} 
        setActive={setActive} 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        workers={workers} 
        absences={absences} 
        user={user}
        theme={theme}
        setTheme={setTheme}
        onLogout={handleLogout}
      />
      <main className="flex-1 p-8 overflow-y-auto max-w-full pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-end gap-2 mb-4"> {/* Dodao sam gap-2 */}
            <button
              onClick={() => setActive('manual')}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-2 rounded-lg md:hidden" // Prikazuje se samo na mobilnom
              title={t('userManual.title')}
            >
              <HelpCircle size={20} />
            </button>
            <LanguageSelector />
          </div>
          {user?.isDemo && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-200">{t('common.demoVersion')}</p>
                </div>
              </div>
            </div>
          )}
          {error && !user?.isDemo && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-rose-200">{t('common.connectionError')}</p>
                </div>
              </div>
              <button onClick={refresh} className="px-3 py-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-lg hover:bg-rose-400">
                {t('common.retry')}
              </button>
            </div>
          )}
          {pages[active]}
        </div>
      </main>
      <BottomNav 
        active={active} 
        setActive={setActive} 
        user={user} 
        isAdmin={user?.role === 'admin'} 
        onLogout={handleLogout}
      />
      <NotificationModal 
        open={modalOpen} 
        onClose={closeModal} 
        notification={currentNotification}
        workers={workers}
      />
      <UpgradeModal
        isOpen={upgradeModal.isOpen}
        errorCode={upgradeModal.errorCode}
        organizationId={upgradeModal.organizationId}
        onClose={() => setUpgradeModal({ ...upgradeModal, isOpen: false })}
      />
    </div>
  )
}
