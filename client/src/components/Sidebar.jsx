import React from 'react'
import { useTranslation } from 'react-i18next'
import { 
  LayoutDashboard, Calendar, Users, Tags, 
  UserX, Settings, ChevronLeft, ChevronRight, X,
  Sun, Moon, BookOpen, Bell
} from 'lucide-react'
import { isoDate } from '../utils/helpers'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'sidebar.dashboard', icon: LayoutDashboard },
  { id: 'schedule', label: 'sidebar.schedule', icon: Calendar },
  { id: 'workers', label: 'sidebar.workers', icon: Users },
  { id: 'categories', label: 'sidebar.categories', icon: Tags },
  { id: 'absences', label: 'sidebar.absences', icon: UserX },
  { id: 'settings', label: 'sidebar.settings', icon: Settings },
  { id: 'manual', label: 'userManual.title', icon: BookOpen }, // Novi item
]

export default function Sidebar({ active, setActive, collapsed, setCollapsed, workers, absences, user, theme, setTheme, onLogout, unreadCount, setCurrentNotification, setModalOpen, notifications }) {
  const { t } = useTranslation()
  const today = isoDate(new Date())
  const activeAbsences = absences.filter(a => a.startDate <= today && a.endDate >= today).length
  
  const isAdmin = user?.role === 'admin'
  const navItems = isAdmin 
    ? NAV_ITEMS 
    : NAV_ITEMS.filter(item => ['dashboard', 'schedule', 'absences', 'manual'].includes(item.id)) // Dodao sam 'manual' za radnike
  
  const handleBellClick = () => {
    if (notifications.length > 0) {
      setCurrentNotification(notifications.find(n => n.status === 'unread') || notifications[0])
      setModalOpen(true)
    } else {
      setCurrentNotification(null)
      setModalOpen(true)
    }
  }

  return (
    <aside 
      className={`hidden md:flex min-h-screen bg-[var(--bg-surface)] border-r border-[var(--border)] flex-col transition-all duration-300 sticky top-0 z-[50] ${collapsed ? 'w-16' : 'w-[220px]'}`}
    >
      {/* Logo */}
      <div className={`p-5 border-b border-[var(--border)] flex flex-col gap-1 ${collapsed ? 'items-center' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            {theme === 'dark' && <div className="absolute inset-0 bg-blue-500/40 blur-xl rounded-full scale-110"></div>}
            <div className={`w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center relative z-10 ${theme === 'dark' ? 'border border-white/10 shadow-2xl' : 'shadow-lg shadow-blue-500/10'}`}>
              <img src="/SFicon-512.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
          </div>
          {!collapsed && (
            <span className="text-lg font-extrabold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
              ShiftForge
            </span>
          )}
        </div>
        {!collapsed && user?.organizationName && (
          <div className="px-1 mt-1">
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] truncate">
              {user.organizationName}
            </div>
          </div>
        )}
      </div>

      {/* Bell Notifications Icon */}
      <div className={`px-2 mt-4 ${collapsed ? 'flex justify-center' : ''}`}>
        <button
          onClick={handleBellClick}
          className={`relative flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)] ${collapsed ? 'justify-center' : 'justify-start px-3'}`}
        >
          <Bell size={18} className="group-hover:text-[var(--text-primary)] transition-colors" />
          {!collapsed && <span className="flex-1 text-left text-[14px]">{t('sidebar.notifications') || 'Notifikacije'}</span>}
          {unreadCount > 0 && (
            <span className={`absolute ${collapsed ? 'top-0.5 right-0.5' : 'right-2.5'} bg-rose-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center shadow-sm`}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 flex flex-col gap-1 mt-2">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = active === item.id
          const badge = item.id === 'absences' && activeAbsences > 0 && isAdmin ? activeAbsences : null
          
          return (
            <button 
              key={item.id} 
              onClick={() => setActive(item.id)}
              className={`
                flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 group
                ${isActive ? 'bg-blue-500/15 text-[var(--blue-bright)] font-semibold' : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'}
                ${collapsed ? 'justify-center' : 'justify-start px-3'}
              `}
            >
              <Icon size={18} className={isActive ? 'text-[var(--blue-bright)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors'} />
              {!collapsed && <span className="flex-1 text-left text-[14px]">{item.id === 'schedule' && !isAdmin ? t('sidebar.mySchedule') : t(item.label)}</span>}
              {!collapsed && badge && (
                <span className="bg-rose-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center shadow-sm">
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* User Info & Theme Toggle & Logout */}
      <div className="p-2 border-t border-[var(--border)]">
        <div className={`flex items-center gap-3 p-2.5 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400 border border-blue-500/30">
            {user?.username?.[0].toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-bold text-[var(--text-primary)] truncate">{user?.username}</div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{user?.role === 'admin' ? t('sidebar.admin') : t('sidebar.worker')}</div>
            </div>
          )}
        </div>

        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={`w-full flex items-center gap-2 p-2.5 rounded-lg text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)] transition-all text-xs font-bold mb-1 ${collapsed ? 'justify-center' : ''}`}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {!collapsed && <span>{theme === 'dark' ? t('sidebar.lightMode') : t('sidebar.darkMode')}</span>}
        </button>

        <button 
          onClick={onLogout}
          className={`w-full flex items-center gap-2 p-2.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all text-xs font-bold ${collapsed ? 'justify-center' : ''}`}
        >
          <X size={16} />
          {!collapsed && <span>{t('sidebar.logout')}</span>}
        </button>
      </div>

      {/* Collapse btn */}
      <div className="p-2 border-t border-[var(--border)]">
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-2 p-2.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all text-xs font-medium"
        >
          {collapsed ? <ChevronRight size={16} className="mx-auto" /> : <><ChevronLeft size={16} /><span>{t('sidebar.hideMenu')}</span></>}
        </button>
      </div>
    </aside>
  )
}
