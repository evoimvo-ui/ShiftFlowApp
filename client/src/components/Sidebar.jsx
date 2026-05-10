import React from 'react'
import { 
  LayoutDashboard, Calendar, Users, Tags, 
  UserX, Settings, Zap, ChevronLeft, ChevronRight, X 
} from 'lucide-react'
import { isoDate } from '../utils/helpers'

const NAV = [
  { id: 'dashboard', label: 'Pregled', icon: LayoutDashboard },
  { id: 'schedule', label: 'Raspored', icon: Calendar },
  { id: 'workers', label: 'Radnici', icon: Users },
  { id: 'categories', label: 'Kategorije', icon: Tags },
  { id: 'absences', label: 'Odsutnosti', icon: UserX },
  { id: 'settings', label: 'Podešavanja', icon: Settings },
]

export default function Sidebar({ active, setActive, collapsed, setCollapsed, workers, absences, user }) {
  const today = isoDate(new Date())
  const activeAbsences = absences.filter(a => a.startDate <= today && a.endDate >= today).length
  
  const isAdmin = user?.role === 'admin'
  const navItems = isAdmin 
    ? NAV 
    : NAV.filter(item => ['dashboard', 'schedule', 'absences'].includes(item.id))

  return (
    <aside 
      className={`min-h-screen bg-[--bg-surface] border-r border-[--border] flex flex-col transition-all duration-300 sticky top-0 z-[50] ${collapsed ? 'w-16' : 'w-[220px]'}`}
    >
      {/* Logo */}
      <div className={`p-5 border-b border-[--border] flex flex-col gap-1 ${collapsed ? 'items-center' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
            <Zap size={16} color="white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-extrabold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
              ShiftFlow
            </span>
          )}
        </div>
        {!collapsed && user?.organizationName && (
          <div className="px-1 mt-1">
            <div className="text-[10px] font-bold text-[--text-muted] uppercase tracking-[0.15em] truncate">
              {user.organizationName}
            </div>
          </div>
        )}
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
                ${isActive ? 'bg-blue-500/15 text-[--blue-bright] font-semibold' : 'text-[--text-secondary] hover:bg-white/5 hover:text-[--text-primary]'}
                ${collapsed ? 'justify-center' : 'justify-start px-3'}
              `}
            >
              <Icon size={18} className={isActive ? 'text-[--blue-bright]' : 'text-[--text-muted] group-hover:text-[--text-primary] transition-colors'} />
              {!collapsed && <span className="flex-1 text-left text-[14px]">{item.id === 'schedule' && !isAdmin ? 'Moj Raspored' : item.label}</span>}
              {!collapsed && badge && (
                <span className="bg-rose-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center shadow-sm">
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-2 border-t border-[--border]">
        <div className={`flex items-center gap-3 p-2.5 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400 border border-blue-500/30">
            {user?.username?.[0].toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-bold text-[--text-primary] truncate">{user?.username}</div>
              <div className="text-[10px] text-[--text-muted] uppercase tracking-wider">{user?.role}</div>
            </div>
          )}
        </div>
        <button 
          onClick={() => { localStorage.clear(); window.location.reload(); }}
          className={`w-full flex items-center gap-2 p-2.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all text-xs font-bold ${collapsed ? 'justify-center' : ''}`}
        >
          <X size={16} />
          {!collapsed && <span>Odjava</span>}
        </button>
      </div>

      {/* Collapse btn */}
      <div className="p-2 border-t border-[--border]">
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-2 p-2.5 rounded-lg text-[--text-muted] hover:text-[--text-primary] hover:bg-white/5 transition-all text-xs font-medium"
        >
          {collapsed ? <ChevronRight size={16} className="mx-auto" /> : <><ChevronLeft size={16} /><span>Sakrij meni</span></>}
        </button>
      </div>
    </aside>
  )
}
