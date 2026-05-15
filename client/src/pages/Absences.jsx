import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, AlertTriangle, Heart, Plane, Briefcase, HelpCircle } from 'lucide-react'
import { Card, Btn, Badge, Modal, Input } from '../components/UI'
import { absenceApi } from '../api'
import { isoDate, formatDate, ABSENCE_TYPES } from '../utils/helpers'

export function isSameWorker(workerName, username) {
  if (!workerName || !username) return false;
  const w = workerName.trim().toLowerCase();
  const u = username.trim().toLowerCase();
  // Tačno podudaranje ili ako je korisničko ime sadržano u punom imenu radnika (npr. "fredi" u "Fredi Fredić")
  return w === u || w.includes(u) || u.includes(w);
}

export default function AbsencesPage({ absences, setAbsences, workers, categories, user, refresh }) {
  const { t } = useTranslation()
  const [modal, setModal] = useState(false)
  const isAdmin = user?.role === 'admin'
  const currentWorker = workers.find(w => isSameWorker(w.name, user?.username))

  const [form, setForm] = useState({ 
    workerId: '', 
    type: 'sick', 
    startDate: isoDate(new Date()), 
    endDate: isoDate(new Date()), 
    note: '' 
  })

  // Postavi workerId kada se učitaju radnici ili promijeni user
  React.useEffect(() => {
    if (!isAdmin && currentWorker) {
      setForm(f => ({ ...f, workerId: currentWorker.id }))
    }
  }, [currentWorker, isAdmin])
  const [filterType, setFilterType] = useState('all')

  if (!absences || !workers || !categories) return <div className="p-20 text-center text-[--text-muted]">{t('common.loading')}</div>

  const today = isoDate(new Date())
  const active = absences.filter(a => {
    const isActive = a.startDate <= today && a.endDate >= today
    const aWorkerId = a.workerId?._id || a.workerId
    const isMine = isAdmin || String(aWorkerId) === String(currentWorker?.id)
    return isActive && isMine
  })

  const save = async () => {
    if (!form.workerId || !form.startDate || !form.endDate) return
    try {
      const res = await absenceApi.create(form)
      const created = { ...res.data, id: res.data._id }
      setAbsences(as => [...as, created])
      setModal(false)
      if (isAdmin && refresh) refresh()
      setForm({ 
        workerId: isAdmin ? '' : (currentWorker?.id || ''), 
        type: 'sick', 
        startDate: today, 
        endDate: today, 
        note: '' 
      })
      alert(isAdmin ? t('absences.saved') : t('absences.requestSent'))
    } catch (err) {
      alert(t('absences.saveError', { error: err.message }))
    }
  }

  const approve = async (id, status) => {
    try {
      const res = await absenceApi.approve(id, status)
      const updated = { ...res.data, id: res.data._id }
      setAbsences(as => as.map(a => a.id === updated.id ? updated : a))
      if (status === 'approved' && refresh) refresh()
    } catch (err) {
      alert(t('absences.approveError', { error: err.message }))
    }
  }

  const remove = async id => {
    if (confirm(t('absences.deleteConfirm'))) {
      try {
        await absenceApi.delete(id)
        setAbsences(as => as.filter(a => a.id !== id))
      } catch (err) {
        alert(t('absences.deleteError', { error: err.message }))
      }
    }
  }

  const filtered = absences.filter(a => {
    const matchType = filterType === 'all' || a.type === filterType
    const aWorkerId = a.workerId?._id || a.workerId
    const matchUser = isAdmin || (currentWorker?.id && String(aWorkerId) === String(currentWorker.id))
    return matchType && matchUser
  })
    .sort((a, b) => b.startDate.localeCompare(a.startDate))

  const absenceTypeInfo = type => {
    const typeDef = ABSENCE_TYPES.find(t => t.id === type) || ABSENCE_TYPES[3]
    return { ...typeDef, label: t('absenceTypes.' + typeDef.id) }
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[--text-primary]">{isAdmin ? t('absences.title') : t('absences.myTitle')}</h1>
          <p className="text-[--text-muted] text-sm mt-1 font-medium">{isAdmin ? t('absences.subtitleAdmin', { count: active.length }) : t('absences.subtitleWorker')}</p>
        </div>
        <Btn onClick={() => { 
          setForm({ 
            workerId: isAdmin ? '' : (currentWorker?.id || ''), 
            type: 'sick', 
            startDate: today, 
            endDate: today, 
            note: '' 
          }); 
          setModal(true) 
        }} icon={<Plus size={16} />}>
          {isAdmin ? t('absences.new') : t('absences.request')}
        </Btn>
      </div>

      {isAdmin && active.length > 0 && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3 shadow-lg shadow-rose-500/5 animate-pulse">
          <AlertTriangle size={18} className="text-rose-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-rose-200 leading-relaxed">
            <strong className="text-rose-400 font-bold uppercase tracking-wider text-[11px] block mb-1">{t('absences.currentlyAbsent')}</strong>
            {active.map(a => workers.find(w => w.id === a.workerId)?.name).filter(Boolean).join(', ')}
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap bg-[--bg-card]/50 p-2 rounded-2xl border border-[--border]">
        {[{ id: 'all', label: t('absences.all'), color: 'var(--blue)' }, ...ABSENCE_TYPES.map(type => ({ ...type, label: t('absenceTypes.' + type.id) }))].map(type => (
          <button 
            key={type.id} 
            onClick={() => setFilterType(type.id)}
            className={`
              px-4 py-1.5 rounded-xl text-xs font-bold transition-all border
              ${filterType === type.id 
                ? 'bg-white/10 border-white/20 text-white shadow-sm' 
                : 'bg-transparent border-transparent text-[--text-muted] hover:text-[--text-primary] hover:bg-white/5'}
            `}
          >
            {type.label}
          </button>
        ))}
      </div>

      <Card className="p-0 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-[--border]">
                {[t('absences.worker'), t('absences.type'), t('absences.period'), t('absences.duration'), t('absences.status'), t('absences.note'), ''].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-[10px] font-bold text-[--text-muted] tracking-widest uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-[--text-muted] text-sm italic opacity-50">
                    {t('absences.noAbsences')}
                  </td>
                </tr>
              ) : filtered.map((a) => {
                const wId = a.workerId?._id || a.workerId
                const worker = workers.find(w => String(w.id) === String(wId))
                const firstCatRaw = (worker?.categoryIds || [])[0]
                const firstCatId = firstCatRaw?.id || firstCatRaw?._id || firstCatRaw
                const cat = categories.find(c => String(c.id) === String(firstCatId))
                const typeInfo = absenceTypeInfo(a.type)
                const start = new Date(a.startDate)
                const end = new Date(a.endDate)
                const days = Math.round((end - start) / 86400000) + 1
                const isActive = a.startDate <= today && a.endDate >= today
                const isPast = a.endDate < today
                
                return (
                  <tr key={a.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold"
                          style={{ background: (cat?.color || '#3b82f6') + '22', color: cat?.color || '#3b82f6', border: `1px solid ${cat?.color || '#3b82f6'}33` }}
                        >
                          {worker?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                        </div>
                        <span className="text-sm font-semibold text-[--text-primary]">{worker?.name || t('absences.unknown')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><Badge color={typeInfo.color}>{typeInfo.label}</Badge></td>
                    <td className="px-6 py-4">
                      <div className="text-[11px] font-mono text-[--text-secondary] flex items-center gap-1.5">
                        {formatDate(start)} <span className="opacity-30">{t('absences.to')}</span> {formatDate(end)}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-[--text-muted]">{days}{t('absences.days')}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <Badge color={isActive ? '#f43f5e' : isPast ? 'var(--text-muted)' : '#f59e0b'} size="xs">
                          {isActive ? t('absences.active') : isPast ? t('absences.completed') : t('absences.upcoming')}
                        </Badge>
                        <Badge color={a.status === 'approved' ? '#10b981' : a.status === 'rejected' ? '#ef4444' : '#6366f1'} size="xs">
                          {a.status === 'approved' ? t('absences.approved') : a.status === 'rejected' ? t('absences.rejected') : t('absences.pending')}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-[--text-muted] max-w-[150px] truncate italic">{a.note || t('absences.empty')}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {isAdmin && a.status === 'pending' && (
                          <>
                            <button onClick={() => approve(a.id, 'approved')} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" title={t('absences.approve')}><Plus size={14} /></button>
                            <button onClick={() => approve(a.id, 'rejected')} className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors" title={t('absences.reject')}><Trash2 size={14} /></button>
                          </>
                        )}
                        <button onClick={() => remove(a.id)} className="p-1.5 text-[--text-muted] hover:text-[--rose] opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={isAdmin ? t('absences.record') : t('absences.request')}>
        <div className="flex flex-col gap-5">
          {isAdmin ? (
            <Input label={t('absences.worker')} value={form.workerId} onChange={v => setForm(f => ({ ...f, workerId: v }))} type="select"
              options={workers.map(w => ({ value: w.id, label: w.name }))} required />
          ) : currentWorker ? (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-xs text-blue-200">{t('absences.submittingFor')} <strong>{currentWorker.name}</strong></p>
            </div>
          ) : (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
              <AlertTriangle size={18} className="text-rose-400" />
              <p className="text-xs text-rose-200">
                <strong>{t('absences.profileNotFound')}</strong><br/>
                {t('absences.usernameMismatch', { username: user?.username })}
              </p>
            </div>
          )}
          <Input label={t('absences.type')} value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} type="select"
            options={ABSENCE_TYPES.map(type => ({ value: type.id, label: t('absenceTypes.' + type.id) }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('absences.startDate')} type="date" value={form.startDate} onChange={v => setForm(f => ({ ...f, startDate: v }))} required />
            <Input label={t('absences.endDate')} type="date" value={form.endDate} onChange={v => setForm(f => ({ ...f, endDate: v }))} required />
          </div>
          <Input label={t('absences.note')} value={form.note} onChange={v => setForm(f => ({ ...f, note: v }))} placeholder={t('absences.notePlaceholder')} />
          <div className="flex gap-3 justify-end mt-4">
            <Btn variant="ghost" onClick={() => setModal(false)}>{t('common.cancel')}</Btn>
            <Btn onClick={save} disabled={!form.workerId}>{t('common.save')}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
