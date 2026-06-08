import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { Badge } from './UI'
import { formatDate, addDays, isoDate } from '../utils/helpers'

export default function ScheduleMobileView({ 
  currentWeekStart, 
  currentSchedule, 
  workers, 
  categories, 
  shiftTypes, 
  user 
}) {
  const { t, i18n } = useTranslation()
  const [selectedDayOffset, setSelectedDayOffset] = useState(() => {
    const today = new Date()
    const diff = Math.floor((today - currentWeekStart) / (1000 * 60 * 60 * 24))
    return diff >= 0 && diff <= 6 ? diff : 0
  })

  const isAdmin = user?.role === 'admin'
  const selectedDate = addDays(currentWeekStart, selectedDayOffset)
  const dayName = i18n.getResource(i18n.language, 'translation', 'days.full')[selectedDayOffset]

  const prevDay = () => setSelectedDayOffset(d => (d > 0 ? d - 1 : 6))
  const nextDay = () => setSelectedDayOffset(d => (d < 6 ? d + 1 : 0))

  const getAssignmentsForShift = (shiftId) => {
    if (!currentSchedule) return []
    return currentSchedule.assignments.filter(
      a => !a.isWarning && a.dayOffset === selectedDayOffset && a.shiftId === shiftId
    )
  }

  const isSameWorker = (name1, name2) => {
    if (!name1 || !name2) return false
    return name1.toLowerCase().trim() === name2.toLowerCase().trim()
  }

  return (
    <div className="md:hidden flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Day Navigation Header */}
      <div className="flex items-center justify-between bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border)] shadow-lg">
        <button 
          onClick={prevDay} 
          className="p-2 hover:bg-white/10 rounded-xl text-[var(--text-secondary)] transition-all active:scale-90"
        >
          <ChevronLeft size={24} />
        </button>
        
        <div className="text-center">
          <div className="text-lg font-bold text-[var(--text-primary)]">{dayName}</div>
          <div className="text-xs font-mono text-[var(--blue-bright)] font-semibold mt-0.5">
            {formatDate(selectedDate)}
          </div>
        </div>

        <button 
          onClick={nextDay} 
          className="p-2 hover:bg-white/10 rounded-xl text-[var(--text-secondary)] transition-all active:scale-90"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Shifts List */}
      <div className="flex flex-col gap-3">
        {!currentSchedule ? (
          <div className="py-12 text-center text-[var(--text-muted)] italic text-sm">
            {t('schedule.noData')}
          </div>
        ) : (
          shiftTypes.map(shift => {
            const assignments = getAssignmentsForShift(shift.id)
            if (assignments.length === 0) return null

            return (
              <div 
                key={shift.id} 
                className="bg-[var(--bg-card)] p-5 rounded-2xl border border-white/5 shadow-md flex flex-col gap-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full shadow-[0_0_10px]" 
                      style={{ background: shift.color, boxShadow: `0 0 10px ${shift.color}66` }} 
                    />
                    <div>
                      <div className="font-bold text-base" style={{ color: shift.color }}>
                        {shift.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-0.5">
                        <Clock size={12} />
                        {shift.start} {t('schedule.dash')} {shift.end}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                  {assignments.map(a => {
                    const worker = workers.find(w => w.id === a.workerId)
                    const cat = categories.find(c => String(c.id) === String(a.categoryId))
                    const isMe = isSameWorker(worker?.name, user?.username)

                    return (
                      <div 
                        key={a.id || a._id} 
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${isMe ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[var(--bg-card)]' : ''}`}
                        style={{ 
                          background: (cat?.color || shift.color) + '15', 
                          borderColor: (cat?.color || shift.color) + '30', 
                          color: cat?.color || shift.color 
                        }}
                      >
                        {worker?.name}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
