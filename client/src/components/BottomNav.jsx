import React from 'react'
import { useTranslation } from 'react-i18next'
import { 
  LayoutDashboard, Calendar, Users, Tags, 
  UserX, Settings, X, Bell
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'sidebar.dashboard', icon: LayoutDashboard },
  { id: 'schedule', label: 'sidebar.schedule', icon: Calendar },
  { id: 'workers', label: 'sidebar.workers', icon: Users },
  { id: 'categories', label: 'sidebar.categories', icon: Tags },
  { id: 'absences', label: 'sidebar.absences', icon: UserX },
  { id: 'settings', label: 'sidebar.settings', icon: Settings },
]

export default function BottomNav({ active, setActive, user, isAdmin, onLogout, unreadCount, setCurrentNotification, setModalOpen, notifications }) {
  const { t } = useTranslation()
  
  const navItems = isAdmin 
    ? NAV_ITEMS 
    : NAV_ITEMS.filter(item => ['dashboard', 'schedule', 'absences'].includes(item.id))
  
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden h-16 bg-[var(--bg-surface)] border-t border-[var(--border)] flex items-center justify-around px-2 w-full overflow-hidden">
      {navItems.map(item => {
        const Icon = item.icon
        const isActive = active === item.id
        
        return (
          <button 
            key={item.id} 
            onClick={() => setActive(item.id)}
            className={`
              flex flex-col items-center justify-center gap-1 flex-1 min-w-0 h-full transition-all duration-200
              ${isActive ? 'text-[var(--blue-bright)]' : 'text-[var(--text-muted)]'}
            `}
          >
            <Icon size={20} className={isActive ? 'text-[var(--blue-bright)]' : 'text-[var(--text-muted)]'} />
            <span className="text-[10px] font-bold uppercase tracking-tight truncate w-full text-center px-1">
              {item.id === 'schedule' && !isAdmin ? t('sidebar.mySchedule') : t(item.label)}
            </span>
          </button>
        )
      })}
      
      {/* Bell Notifications Icon for Mobile */}
      <button
        onClick={handleBellClick}
        className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 h-full transition-all duration-200 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <div className="relative">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 min-w-[16px] text-center shadow-sm">
              {unreadCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-tight truncate w-full text-center px-1">
          {t('sidebar.notifications') || 'Notifikacije'}
        </span>
      </button>
      
      {/* Logout button */}
      <button 
        onClick={onLogout}
        className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 h-full transition-all duration-200 text-rose-400 hover:text-rose-300"
      >
        <X size={20} />
        <span className="text-[10px] font-bold uppercase tracking-tight truncate w-full text-center px-1">
          {t('sidebar.logout')}
        </span>
      </button>
    </nav>
  )
}
