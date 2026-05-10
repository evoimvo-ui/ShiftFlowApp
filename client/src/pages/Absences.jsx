import React, { useState } from 'react'
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

  if (!absences || !workers || !categories) return <div className="p-20 text-center text-[--text-muted]">Učitavanje...</div>

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
      alert(isAdmin ? 'Odsutnost sačuvana' : 'Zahtjev za odsutnost poslat na odobrenje')
    } catch (err) {
      alert('Greška pri spašavanju odsutnosti: ' + err.message)
    }
  }

  const approve = async (id, status) => {
    try {
      const res = await absenceApi.approve(id, status)
      const updated = { ...res.data, id: res.data._id }
      setAbsences(as => as.map(a => a.id === updated.id ? updated : a))
      if (status === 'approved' && refresh) refresh()
    } catch (err) {
      alert('Greška pri odobravanju: ' + err.message)
    }
  }

  const remove = async id => {
    if (confirm('Obrisati zapis o odsutnosti?')) {
      try {
        await absenceApi.delete(id)
        setAbsences(as => as.filter(a => a.id !== id))
      } catch (err) {
        alert('Greška pri brisanju odsutnosti: ' + err.message)
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

  const absenceTypeInfo = type => ABSENCE_TYPES.find(t => t.id === type) || ABSENCE_TYPES[3]

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[--text-primary]">{isAdmin ? 'Odsutnosti' : 'Moje Odsutnosti'}</h1>
          <p className="text-[--text-muted] text-sm mt-1 font-medium">{isAdmin ? `${active.length} radnika je trenutno na odsustvu` : 'Pregled vaših odsustava i podnošenje zahtjeva'}</p>
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
          {isAdmin ? 'Nova odsutnost' : 'Zatraži odsutnost'}
        </Btn>
      </div>

      {isAdmin && active.length > 0 && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3 shadow-lg shadow-rose-500/5 animate-pulse">
          <AlertTriangle size={18} className="text-rose-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-rose-200 leading-relaxed">
            <strong className="text-rose-400 font-bold uppercase tracking-wider text-[11px] block mb-1">Trenutno odsutni</strong>
            {active.map(a => workers.find(w => w.id === a.workerId)?.name).filter(Boolean).join(', ')}
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap bg-[--bg-card]/50 p-2 rounded-2xl border border-[--border]">
        {[{ id: 'all', label: 'Sve', color: 'var(--blue)' }, ...ABSENCE_TYPES].map(t => (
          <button 
            key={t.id} 
            onClick={() => setFilterType(t.id)}
            className={`
              px-4 py-1.5 rounded-xl text-xs font-bold transition-all border
              ${filterType === t.id 
                ? 'bg-white/10 border-white/20 text-white shadow-sm' 
                : 'bg-transparent border-transparent text-[--text-muted] hover:text-[--text-primary] hover:bg-white/5'}
            `}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="p-0 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-[--border]">
                {['Radnik', 'Tip', 'Period', 'Trajanje', 'Status', 'Napomena', ''].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-[10px] font-bold text-[--text-muted] tracking-widest uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-[--text-muted] text-sm italic opacity-50">
                    Nema zabilježenih odsutnosti u bazi.
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
                        <span className="text-sm font-semibold text-[--text-primary]">{worker?.name || 'Nepoznat'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><Badge color={typeInfo.color}>{typeInfo.label}</Badge></td>
                    <td className="px-6 py-4">
                      <div className="text-[11px] font-mono text-[--text-secondary] flex items-center gap-1.5">
                        {formatDate(start)} <span className="opacity-30">→</span> {formatDate(end)}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-[--text-muted]">{days}d</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <Badge color={isActive ? '#f43f5e' : isPast ? 'var(--text-muted)' : '#f59e0b'} size="xs">
                          {isActive ? 'Aktivan' : isPast ? 'Završen' : 'Predstojeći'}
                        </Badge>
                        <Badge color={a.status === 'approved' ? '#10b981' : a.status === 'rejected' ? '#ef4444' : '#6366f1'} size="xs">
                          {a.status === 'approved' ? 'Odobreno' : a.status === 'rejected' ? 'Odbijeno' : 'Na čekanju'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-[--text-muted] max-w-[150px] truncate italic">{a.note || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {isAdmin && a.status === 'pending' && (
                          <>
                            <button onClick={() => approve(a.id, 'approved')} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Odobri"><Plus size={14} /></button>
                            <button onClick={() => approve(a.id, 'rejected')} className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors" title="Odbij"><Trash2 size={14} /></button>
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

      <Modal open={modal} onClose={() => setModal(false)} title={isAdmin ? "Evidencija odsutnosti" : "Zatraži odsutnost"}>
        <div className="flex flex-col gap-5">
          {isAdmin ? (
            <Input label="Radnik" value={form.workerId} onChange={v => setForm(f => ({ ...f, workerId: v }))} type="select"
              options={workers.map(w => ({ value: w.id, label: w.name }))} required />
          ) : currentWorker ? (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-xs text-blue-200">Podnosite zahtjev za: <strong>{currentWorker.name}</strong></p>
            </div>
          ) : (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
              <AlertTriangle size={18} className="text-rose-400" />
              <p className="text-xs text-rose-200">
                <strong>Profil radnika nije pronađen.</strong><br/>
                Vaše korisničko ime ({user?.username}) se ne podudara sa imenom u listi radnika.
              </p>
            </div>
          )}
          <Input label="Tip odsutnosti" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} type="select"
            options={ABSENCE_TYPES.map(t => ({ value: t.id, label: t.label }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Početak" type="date" value={form.startDate} onChange={v => setForm(f => ({ ...f, startDate: v }))} required />
            <Input label="Kraj" type="date" value={form.endDate} onChange={v => setForm(f => ({ ...f, endDate: v }))} required />
          </div>
          <Input label="Napomena" value={form.note} onChange={v => setForm(f => ({ ...f, note: v }))} placeholder="Dodatne informacije..." />
          <div className="flex gap-3 justify-end mt-4">
            <Btn variant="ghost" onClick={() => setModal(false)}>Odustani</Btn>
            <Btn onClick={save} disabled={!form.workerId}>Spremi</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
