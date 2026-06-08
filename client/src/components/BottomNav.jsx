import React from 'react'
import { useTranslation } from 'react-i18next'
import { 
  LayoutDashboard, Calendar, Users, Tags, 
  UserX, Settings 
} from 'lucide-react'

const NAV = [
  { id: 'dashboard', label: 'sidebar.dashboard', icon: LayoutDashboard },
  { id: 'schedule', label: 'sidebar.schedule', icon: Calendar },
  { id: 'workers', label: 'sidebar.workers', icon: Users },
  { id: 'categories', label: 'sidebar.categories', icon: Tags },
  { id: 'absences', label: 'sidebar.absences', icon: UserX },
  { id: 'settings', label: 'sidebar.settings', icon: Settings },
]

export default function BottomNav({ active, setActive, user, isAdmin }) {
  const { t } = useTranslation()
  
  const navItems = isAdmin 
    ? NAV 
    : NAV.filter(item => ['dashboard', 'schedule', 'absences'].includes(item.id))

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden h-16 bg-[var(--bg-surface)] border-t border-[var(--border)] flex items-center justify-around px-2">
      {navItems.map(item => {
        const Icon = item.icon
        const isActive = active === item.id
        
        return (
          <button 
            key={item.id} 
            onClick={() => setActive(item.id)}
            className={`
              flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200
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
    </nav>
  )
}
