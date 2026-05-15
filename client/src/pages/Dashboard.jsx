import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Users, Calendar, Clock, AlertTriangle, TrendingUp, Zap, 
  ArrowRightLeft, History, Check, X, UserX, Tag 
} from 'lucide-react'
import { Card, StatCard, Badge, Btn } from '../components/UI'
import { isoDate, formatDate, getWeekStart, DAYS_FULL, ABSENCE_TYPES } from '../utils/helpers'
import { swapApi, auditApi } from '../api'
import { isSameWorker } from './Absences'

export default function DashboardPage({ workers, categories, absences, schedules, shiftTypes, settings, refresh, user }) {
  const { t, i18n } = useTranslation()
  const [swaps, setSwaps] = useState([])
  const [auditLogs, setAuditLogs] = useState([])

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    swapApi.getAll().then(res => setSwaps(res.data.map(s => ({ ...s, id: s._id }))))
    if (isAdmin) {
      auditApi.getAll().then(res => setAuditLogs(res.data.map(l => ({ ...l, id: l._id }))))
    }
  }, [isAdmin])

  const handleProcessSwap = async (id, status) => {
    try {
      await swapApi.process(id, status)
      setSwaps(ss => ss.map(s => s.id === id ? { ...s, status } : s))
      if ((status === 'approved' || status === 'accepted_by_worker') && refresh) {
        refresh()
      }
      const msg = status === 'approved' ? t('dashboard.approvedByAdmin') : status === 'accepted_by_worker' ? t('dashboard.acceptedByWorker') : t('dashboard.rejected');
      alert(msg)
    } catch (err) {
      alert(t('dashboard.swapProcessError', { error: err.message }))
    }
  }

  const today = isoDate(new Date())
  const activeAbsences = absences.filter(a => a.startDate <= today && a.endDate >= today)

  const currentWeekStart = getWeekStart(new Date())
  const weekKey = isoDate(currentWeekStart)
  const currentSchedule = schedules.find(s => s.weekStart === weekKey)

  const totalHoursScheduled = currentSchedule
    ? Object.values(currentSchedule.workerHours || {}).reduce((s, h) => s + h, 0)
    : 0

  const overtimeWorkers = currentSchedule
    ? Object.entries(currentSchedule.workerHours || {}).filter(([, h]) => h > settings.maxHoursPerWeek).length
    : 0

  // Shift distribution
  const shiftDist = {}
  shiftTypes.forEach(s => { shiftDist[s.id] = 0 })
  if (currentSchedule) {
    currentSchedule.assignments.filter(a => !a.isWarning).forEach(a => {
      shiftDist[a.shiftId] = (shiftDist[a.shiftId] || 0) + 1
    })
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[--text-primary]">
          {isAdmin ? t('dashboard.title') : t('dashboard.greeting', { username: user?.username })}
        </h1>
        <p className="text-[--text-muted] text-sm mt-1 font-medium">
          {i18n.getResource(i18n.language, 'translation', 'days.full')[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]}, {formatDate(new Date())}
        </p>
      </div>

      {isAdmin ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label={t('dashboard.totalWorkers')} value={workers.length} sub={t('dashboard.inCategories', { count: categories.length })} icon={<Users size={18} />} color="#3b82f6" />
          <StatCard label={t('dashboard.absentToday')} value={activeAbsences.length} sub={t('dashboard.absentDescription')} icon={<UserX size={18} />} color="#f43f5e" />
          <StatCard label={t('dashboard.hoursThisWeek')} value={totalHoursScheduled} sub={currentSchedule ? t('dashboard.scheduled') : t('dashboard.notScheduled')} icon={<Clock size={18} />} color="#06b6d4" />
          <StatCard label={t('dashboard.overtime')} value={overtimeWorkers} sub={t('dashboard.overtimeDescription')} icon={<TrendingUp size={18} />} color="#f59e0b" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(() => {
            const worker = workers.find(w => isSameWorker(w.name, user?.username))
            const hours = worker ? (currentSchedule?.workerHours?.[worker.id] || 0) : 0
            const isAbsent = activeAbsences.some(a => {
              const aWorkerId = a.workerId?._id || a.workerId
              return String(aWorkerId) === String(worker?.id)
            })
            
            return (
              <>
                <StatCard 
                  label={t('dashboard.myHoursThisWeek')} 
                  value={`${hours}${t('dashboard.hours')}`} 
                  sub={hours > settings.maxHoursPerWeek ? t('dashboard.aboveNorm') : t('dashboard.withinNorm')} 
                  icon={<Clock size={18} />} 
                  color={hours > settings.maxHoursPerWeek ? "#f59e0b" : "#3b82f6"} 
                />
                <StatCard 
                  label={t('dashboard.status')} 
                  value={isAbsent ? t('dashboard.absent') : t('dashboard.active')} 
                  sub={isAbsent ? t('dashboard.absentStatusDescription') : t('dashboard.activeDescription')} 
                  icon={isAbsent ? <UserX size={18} /> : <Zap size={18} />} 
                  color={isAbsent ? "#f43f5e" : "#10b981"} 
                />
                <StatCard 
                  label={t('dashboard.myCategory')} 
                  value={worker?.categoryIds?.length || 0} 
                  sub={t('dashboard.assignedRoles')} 
                  icon={<Tag size={18} />} 
                  color="#8b5cf6" 
                />
              </>
            )
          })()}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-[--text-muted] uppercase tracking-widest flex items-center gap-2">
              <ArrowRightLeft size={16} className="text-[--blue]" />
              {t('dashboard.swapRequests')}
            </h3>
            {isAdmin ? (
              swaps.filter(s => s.status === 'accepted_by_worker').length > 0 && (
                <Badge color="var(--blue)">{swaps.filter(s => s.status === 'accepted_by_worker').length} {t('dashboard.pendingApproval')}</Badge>
              )
            ) : (
              swaps.filter(s => s.status === 'pending' && s.targetWorkerId?.name.toLowerCase().includes(user?.username.toLowerCase())).length > 0 && (
                <Badge color="var(--blue)">{swaps.filter(s => s.status === 'pending' && s.targetWorkerId?.name.toLowerCase().includes(user?.username.toLowerCase())).length} {t('dashboard.newRequests')}</Badge>
              )
            )}
          </div>
          
          <div className="space-y-3">
            {(() => {
              const relevantSwaps = isAdmin 
                ? swaps.filter(s => s.status === 'accepted_by_worker')
                : swaps.filter(s => s.status === 'pending' && s.targetWorkerId?.name.toLowerCase().includes(user?.username.toLowerCase()));

              if (relevantSwaps.length === 0) {
                return <p className="text-center py-8 text-[--text-muted] italic text-xs">{t('dashboard.noActiveSwaps')}</p>
              }

              return relevantSwaps.map(s => (
                <div key={s.id} className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="text-xs">
                      <span className="font-bold text-[--text-primary]">{s.requestingWorkerId?.name}</span>
                      <span className="mx-2 text-[--text-muted]">{isAdmin ? t('dashboard.swappedWith') : t('dashboard.swapRequest')}</span>
                      <span className="font-bold text-[--text-primary]">{isAdmin ? s.targetWorkerId?.name : ''}</span>
                    </div>
                    <div className="text-[9px] text-[--text-muted] uppercase font-mono">{formatDate(new Date(s.requestedAt))}</div>
                  </div>
                  <div className="flex gap-2">
                    <Btn size="xs" className="flex-1" onClick={() => handleProcessSwap(s.id, isAdmin ? 'approved' : 'accepted_by_worker')} icon={<Check size={12} />}>
                      {isAdmin ? t('dashboard.approveSwap') : t('dashboard.acceptRequest')}
                    </Btn>
                    <Btn size="xs" variant="ghost" className="flex-1 text-rose-400 hover:bg-rose-500/10" onClick={() => handleProcessSwap(s.id, 'rejected')} icon={<X size={12} />}>
                      {t('dashboard.reject')}
                    </Btn>
                  </div>
                </div>
              ));
            })()}
          </div>
        </Card>

        {isAdmin && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-[--text-muted] uppercase tracking-widest flex items-center gap-2">
                <History size={16} className="text-[--blue]" />
                {t('dashboard.auditHistory')}
              </h3>
            </div>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {auditLogs.length === 0 && (
                <p className="text-center py-8 text-[--text-muted] italic text-xs">{t('dashboard.noAuditLogs')}</p>
              )}
              {auditLogs.map(log => {
                const oldWorker = workers.find(w => w.id === log.details?.oldWorkerId)
                const newWorker = workers.find(w => w.id === log.details?.newWorkerId)
                return (
                  <div key={log.id} className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="text-[10px] font-bold text-[--text-primary] uppercase tracking-wider">{log.adminId?.username}</div>
                      <div className="text-[9px] text-[--text-muted] font-mono">{formatDate(new Date(log.timestamp))}</div>
                    </div>
                    <div className="text-xs text-[--text-secondary]">
                      {t('dashboard.replacedWith', { oldWorker: oldWorker?.name, newWorker: newWorker?.name })}
                    </div>
                    {log.reason && (
                      <div className="text-[10px] italic text-[--text-muted] bg-white/5 p-2 rounded">
                        {t('dashboard.reason', { reason: log.reason })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>

      {isAdmin && (
        <Card className="p-6">
          <h3 className="text-sm font-bold text-[--text-secondary] uppercase tracking-wider mb-6">{t('dashboard.workerCategories')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map(cat => {
              const catWorkers = workers.filter(w => (w.categoryIds || []).some(cid => String(cid.id || cid._id || cid) === String(cat.id)))
              const catAbsent = catWorkers.filter(w => activeAbsences.some(a => {
                const aWorkerId = a.workerId?._id || a.workerId
                return String(aWorkerId) === String(w.id)
              }))
              return (
                <div key={cat.id} className="p-4 bg-[--bg-elevated]/50 rounded-2xl border border-[--border] border-l-4 transition-all hover:translate-y-[-2px] hover:shadow-lg" style={{ borderLeftColor: cat.color }}>
                  <div className="font-bold text-[--text-primary] mb-2">{cat.name}</div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[--text-muted]">{t('dashboard.workersCount')}</span>
                      <span className="font-bold" style={{ color: cat.color }}>{catWorkers.length}</span>
                    </div>
                    {catAbsent.length > 0 && (
                      <div className="flex justify-between items-center text-xs text-[--rose]">
                        <span>{t('dashboard.absentCount')}</span>
                        <span className="font-bold">{catAbsent.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
