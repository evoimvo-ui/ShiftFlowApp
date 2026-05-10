import React, { useState } from 'react'
import { 
  Plus, Trash2, Download, Zap, RefreshCw, ChevronLeft, 
  ChevronRight, AlertTriangle, Clock, UserX 
} from 'lucide-react'
import { Card, Btn, Badge, Modal, Input } from '../components/UI'
import { scheduleApi, swapApi } from '../api'
import { isSameWorker } from './Absences'
import { 
  isoDate, formatDate, addDays, getWeekStart, 
  DAYS_BS, DAYS_FULL, shiftDurationHours, getAbsenceOnDay, ABSENCE_TYPES 
} from '../utils/helpers'

export default function SchedulePage({ schedules, setSchedules, workers, categories, absences, shiftTypes, settings, refresh, user }) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()))
  const [generating, setGenerating] = useState(false)
  const [detailModal, setDetailModal] = useState(null)
  const [manualModal, setManualModal] = useState(null)
  const [swapModal, setSwapModal] = useState(null)
  const [manualForm, setManualForm] = useState({ newWorkerId: '', reason: '' })
  const [swapForm, setSwapForm] = useState({ targetWorkerId: '' })

  const isAdmin = user?.role === 'admin'
  const weekKey = isoDate(currentWeekStart)
  const currentSchedule = schedules.find(s => s.weekStart === weekKey)

  const prevWeek = () => setCurrentWeekStart(d => addDays(d, -7))
  const nextWeek = () => setCurrentWeekStart(d => addDays(d, 7))
  const goToday = () => setCurrentWeekStart(getWeekStart(new Date()))

  const generate = async () => {
    if (!isAdmin) return;
    setGenerating(true)
    try {
      const res = await scheduleApi.generate({
        weekStart: weekKey,
        workers,
        categories,
        absences,
        shiftTypes,
        settings,
        historicalSchedules: schedules
      })
      
      const newSched = { ...res.data, id: res.data._id }
      
      setSchedules(ss => {
        const without = ss.filter(s => s.weekStart !== weekKey)
        return [...without, newSched]
      })
      if (refresh) refresh()
    } catch (err) {
      alert('Greška pri generisanju rasporeda: ' + err.message)
    } finally {
      setGenerating(false)
    }
  }

  const clearSchedule = async () => {
    if (!isAdmin) return;
    if (confirm('Obrisati raspored za ovu sedmicu?')) {
      try {
        await scheduleApi.delete(weekKey)
        setSchedules(ss => ss.filter(s => s.weekStart !== weekKey))
        if (refresh) refresh()
      } catch (err) {
        alert('Greška pri brisanju rasporeda: ' + err.message)
      }
    }
  }

  const handleManualUpdate = async () => {
    if (!manualForm.newWorkerId || !manualForm.reason) return
    
    // Provjera na frontendu prije slanja
    const targetDayOffset = manualModal.assignment ? manualModal.assignment.dayOffset : manualModal.dayOffset;
    const isAlreadyAssigned = currentSchedule.assignments.some(a => 
      !a.isWarning && 
      a.dayOffset === targetDayOffset && 
      String(a.workerId) === String(manualForm.newWorkerId) &&
      String(a._id || a.id) !== String(manualModal.assignment?._id || manualModal.assignment?.id)
    );

    if (isAlreadyAssigned) {
      alert('Ovaj radnik je već raspoređen u neku smjenu na ovaj dan!');
      return;
    }

    try {
      const payload = {
        scheduleId: currentSchedule.id,
        newWorkerId: manualForm.newWorkerId,
        reason: manualForm.reason
      };

      if (manualModal.assignment) {
        payload.assignmentId = manualModal.assignment._id;
      } else {
        payload.dayOffset = manualModal.dayOffset;
        payload.shiftId = manualModal.shiftId;
        payload.categoryId = manualModal.categoryId;
      }

      const res = await scheduleApi.manualUpdate(payload)
      
      const updatedSched = { ...res.data, id: res.data._id }
      setSchedules(ss => ss.map(s => s.id === updatedSched.id ? updatedSched : s))
      if (refresh) refresh()
      setManualModal(null)
      setDetailModal(null)
    } catch (err) {
      alert('Greška pri ručnom ažuriranju: ' + err.message)
    }
  }

  const handleDeleteAssignment = async (assignmentId) => {
    if (!isAdmin || !currentSchedule) return
    if (!confirm('Obrisati ovog radnika iz ove smjene?')) return

    try {
      const res = await scheduleApi.deleteAssignment(currentSchedule.id, assignmentId)
      const updatedSched = { ...res.data, id: res.data._id }
      setSchedules(ss => ss.map(s => s.id === updatedSched.id ? updatedSched : s))
      if (refresh) refresh()
      
      // Ažuriraj detailModal ako je otvoren
      if (detailModal) {
        setDetailModal(prev => ({
          ...prev,
          assignments: prev.assignments.filter(a => (a._id || a.id) !== assignmentId)
        }))
      }
    } catch (err) {
      alert('Greška pri brisanju smjene: ' + err.message)
    }
  }

  const handleSwapRequest = async () => {
    if (!swapForm.targetWorkerId) return
    try {
      // Pronađi assignment ciljanog radnika
      const targetAssignment = currentSchedule.assignments.find(a => 
        a.workerId === swapForm.targetWorkerId && 
        a.dayOffset === swapModal.assignment.dayOffset &&
        a.shiftId !== swapModal.assignment.shiftId
      )

      if (!targetAssignment) {
        alert('Ciljani radnik nema smjenu na ovaj dan za zamjenu.')
        return
      }

      await swapApi.create({
        requestingWorkerId: swapModal.assignment.workerId,
        targetWorkerId: swapForm.targetWorkerId,
        scheduleId: currentSchedule.id,
        originalAssignmentId: swapModal.assignment._id,
        targetAssignmentId: targetAssignment._id
      })

      alert('Zahtjev za zamjenu poslat!')
      setSwapModal(null)
      setDetailModal(null)
    } catch (err) {
      alert('Greška pri slanju zahtjeva za zamjenu: ' + err.message)
    }
  }

  const workerHours = currentSchedule?.workerHours || {}

  const getAssignments = (dayOffset, shiftId) => {
    if (!currentSchedule) return []
    return currentSchedule.assignments.filter(a => a.dayOffset === dayOffset && a.shiftId === shiftId)
  }

  const today = isoDate(new Date())

  const exportCSV = () => {
    if (!currentSchedule) return
    const rows = [['Dan', 'Smjena', 'Radnik', 'Kategorija', 'Sati']]
    currentSchedule.assignments.filter(a => !a.isWarning).forEach(a => {
      const worker = workers.find(w => w.id === a.workerId)
      const cat = categories.find(c => c.id === a.categoryId)
      const shift = shiftTypes.find(s => s.id === a.shiftId)
      const day = DAYS_FULL[a.dayOffset]
      rows.push([day, shift?.name || '', worker?.name || '', cat?.name || '', shiftDurationHours(shift || { start: '00:00', end: '08:00' })])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `raspored_${weekKey}.csv`; a.click()
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[--text-primary]">
            {isAdmin ? 'Raspored' : 'Moj Raspored'}
          </h1>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-sm font-medium text-[--text-muted] bg-white/5 px-3 py-1 rounded-full border border-white/5">
              {formatDate(currentWeekStart)} – {formatDate(addDays(currentWeekStart, 6))}
            </span>
            {currentSchedule && <Badge color="var(--emerald)">Kreirano</Badge>}
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2 flex-wrap">
            {currentSchedule && <Btn variant="outline" size="sm" onClick={exportCSV} icon={<Download size={14} />}>CSV</Btn>}
            {currentSchedule && <Btn variant="danger" size="sm" onClick={clearSchedule} icon={<Trash2 size={14} />}>Obriši</Btn>}
            <Btn onClick={generate} disabled={generating || workers.length === 0 || categories.length === 0}
              icon={generating ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
              variant="cyan">
              {generating ? 'Generisanje...' : currentSchedule ? 'Regeneriši' : 'Generiši raspored'}
            </Btn>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 bg-[--bg-card]/50 p-1.5 rounded-xl border border-[--border] w-fit">
        <button onClick={prevWeek} className="p-2 hover:bg-white/10 rounded-lg text-[--text-secondary] transition-all"><ChevronLeft size={18} /></button>
        <button onClick={goToday} className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[--text-muted] hover:text-[--text-primary] transition-all">Danas</button>
        <button onClick={nextWeek} className="p-2 hover:bg-white/10 rounded-lg text-[--text-secondary] transition-all"><ChevronRight size={18} /></button>
      </div>

      {workers.length === 0 || categories.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center gap-4 border-dashed border-2">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
            <AlertTriangle size={32} />
          </div>
          <p className="text-[--text-muted] font-medium max-w-xs">Potrebno je definisati radnike i kategorije prije kreiranja rasporeda.</p>
        </Card>
      ) : (
        <>
          <Card className="p-0 overflow-hidden shadow-2xl border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-white/5">
                    <th className="w-[120px] px-4 py-4 text-left text-[10px] font-bold text-[--text-muted] tracking-widest uppercase border-b border-[--border]">Smjena</th>
                    {DAYS_BS.map((d, i) => {
                      const dayDate = isoDate(addDays(currentWeekStart, i))
                      const isToday = dayDate === today
                      return (
                        <th key={d} className={`px-2 py-4 text-center border-b border-[--border] ${isToday ? 'bg-blue-500/10 border-b-2 border-b-[--blue]' : ''}`}>
                          <div className={`text-xs font-bold ${isToday ? 'text-[--blue-bright]' : 'text-[--text-primary]'}`}>{d}</div>
                          <div className={`text-[10px] font-mono mt-1 ${isToday ? 'text-[--blue]' : 'text-[--text-muted]'}`}>
                            {String(addDays(currentWeekStart, i).getDate()).padStart(2, '0')}.{String(addDays(currentWeekStart, i).getMonth() + 1).padStart(2, '0')}
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {shiftTypes.map(shift => (
                    <tr key={shift.id}>
                      <td className="px-4 py-4 bg-white/[0.02] border-r border-white/5 align-middle">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shadow-[0_0_8px] transition-shadow" style={{ background: shift.color, boxShadow: `0 0 8px ${shift.color}88` }} />
                          <div>
                            <div className="text-xs font-bold" style={{ color: shift.color }}>{shift.name}</div>
                            <div className="text-[10px] font-mono text-[--text-muted] mt-0.5">{shift.start}–{shift.end}</div>
                          </div>
                        </div>
                      </td>
                      {[0,1,2,3,4,5,6].map(dayOffset => {
                        const dayDate = addDays(currentWeekStart, dayOffset)
                        const isToday = isoDate(dayDate) === today
                        const assignments = getAssignments(dayOffset, shift.id)
                        const warnings = assignments.filter(a => a.isWarning)
                        const actual = assignments.filter(a => !a.isWarning)

                        return (
                          <td 
                            key={dayOffset} 
                            onClick={() => (actual.length > 0 || (currentSchedule && warnings.length > 0)) && setDetailModal({ dayOffset, shift, assignments: actual, warnings })}
                            className={`p-1.5 align-top min-w-[110px] min-h-[80px] transition-colors border-r border-white/5 last:border-r-0 ${isToday ? 'bg-blue-500/[0.02]' : ''} ${(actual.length > 0 || (currentSchedule && warnings.length > 0)) ? 'cursor-pointer hover:bg-white/[0.04]' : ''}`}
                          >
                            <div className="flex flex-col gap-1">
                              {!currentSchedule && <div className="text-[10px] text-[--text-muted] text-center py-4 opacity-20 italic">nema podataka</div>}
                              {actual.map(a => {
                                const worker = workers.find(w => w.id === a.workerId)
                                const cat = categories.find(c => String(c.id) === String(a.categoryId))
                                const isMe = isSameWorker(worker?.name, user?.username)

                                return (
                                  <div 
                                    key={a.id} 
                                    className={`px-2 py-1 rounded-md text-[10px] font-bold truncate border shadow-sm transition-transform hover:scale-[1.02] ${isMe ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[--bg-card]' : ''}`}
                                    style={{ background: (cat?.color || shift.color) + '18', borderColor: (cat?.color || shift.color) + '33', color: cat?.color || shift.color }}
                                  >
                                    {worker?.name?.split(' ')[0]} {worker?.name?.split(' ')[1]?.[0]}.
                                  </div>
                                )
                              })}
                              {warnings.map((w, i) => (
                                <div key={i} className="px-2 py-1 rounded-md bg-rose-500/20 border border-rose-500/40 text-[9px] font-bold text-rose-400 flex items-center gap-1.5 animate-pulse">
                                  <AlertTriangle size={10} /> {w.needed} radnika
                                </div>
                              ))}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {isAdmin && currentSchedule && (
            <Card className="p-6 mt-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-[--text-muted] uppercase tracking-widest flex items-center gap-2">
                  <Clock size={16} className="text-[--blue]" />
                  Pregled sati (Ova sedmica)
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {workers.map(w => {
                  const hours = workerHours[w.id] || 0
                  const firstCatRaw = (w.categoryIds || [])[0]
                  const firstCatId = firstCatRaw?.id || firstCatRaw?._id || firstCatRaw
                  const cat = categories.find(c => String(c.id) === String(firstCatId))
                  const isOvertime = hours > settings.maxHoursPerWeek
                  return (
                    <div key={w.id} className={`p-3 rounded-xl bg-white/5 border transition-all hover:bg-white/10 ${isOvertime ? 'border-amber-500/40' : 'border-white/5'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <div className="text-[10px] font-bold text-[--text-primary] truncate pr-2">{w.name}</div>
                        {isOvertime && <Badge color="#f59e0b" size="xs">!</Badge>}
                      </div>
                      <div className="flex items-end justify-between">
                        <div className="text-lg font-black text-[--text-primary] leading-none">{hours}<span className="text-[10px] font-normal ml-0.5 text-[--text-muted]">h</span></div>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: cat?.color || 'var(--blue)' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {(() => {
            const currentWorker = workers.find(w => isSameWorker(w.name, user?.username))
            const ws = isoDate(currentWeekStart)
            const we = isoDate(addDays(currentWeekStart, 6))
            
            // Prikazujemo sve odobrene odsutnosti u ovoj sedmici (bez obzira na dan)
            const weekAbsences = absences.filter(a => {
              const start = a.startDate
              const end = a.endDate
              const inWeek = (start <= we && end >= ws)
              const isApproved = a.status === 'approved'
              const isVisible = isAdmin || (currentWorker?.id && String(a.workerId?._id || a.workerId) === String(currentWorker.id))
              return inWeek && isApproved && isVisible
            })
            
            if (weekAbsences.length === 0) return null
            return (
              <Card className="mt-4 border-rose-500/20 bg-rose-500/[0.02]">
                <div className="flex items-center gap-2 mb-4">
                  <UserX size={16} className="text-rose-400" />
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">
                    {isAdmin ? 'Odsutnosti u ovoj sedmici' : 'Moje odsutnosti u ovoj sedmici'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {weekAbsences.map(a => {
                    const aWorkerId = a.workerId?._id || a.workerId
                    const worker = workers.find(w => String(w.id) === String(aWorkerId))
                    const typeInfo = ABSENCE_TYPES.find(t => t.id === a.type)
                    
                    // Izračunaj dane u ovoj sedmici
                    const start = a.startDate > ws ? a.startDate : ws
                    const end = a.endDate < we ? a.endDate : we
                    
                    return (
                      <div key={a.id || a._id} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
                        <span className="text-xs font-semibold text-[--text-secondary]">{worker?.name}</span>
                        <Badge color={typeInfo?.color || 'var(--text-muted)'}>{typeInfo?.label}</Badge>
                        <span className="text-[9px] text-[--text-muted] ml-1">
                          ({formatDate(new Date(start))} - {formatDate(new Date(end))})
                        </span>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )
          })()}
        </>
      )}

      <Modal 
        open={!!detailModal} 
        onClose={() => setDetailModal(null)} 
        title={detailModal ? `${DAYS_FULL[detailModal.dayOffset]} — ${detailModal.shift?.name}` : ''}
      >
        <div className="space-y-4">
          <div className="text-[11px] font-bold text-[--text-muted] uppercase tracking-widest mb-2">
            {detailModal && formatDate(addDays(currentWeekStart, detailModal.dayOffset))} · {detailModal?.shift?.start} – {detailModal?.shift?.end}
          </div>

          {detailModal?.assignments.map(a => {
            const worker = workers.find(w => w.id === a.workerId)
            const cat = categories.find(c => String(c.id) === String(a.categoryId))
            const hours = workerHours[a.workerId] || 0
            return (
              <div key={a._id || a.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center transition-all hover:bg-white/10">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2"
                    style={{ background: (cat?.color || 'var(--blue)') + '22', borderColor: (cat?.color || 'var(--blue)') + '44', color: cat?.color || 'var(--blue)' }}
                  >
                    {worker?.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[--text-primary]">{worker?.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {cat && <Badge color={cat.color}>{cat.name}</Badge>}
                      {isAdmin && <span className="text-[10px] font-mono text-[--text-muted]">{hours}h ukupno ove sedmice</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  {hours > settings.maxHoursPerWeek && <Badge color="var(--amber)" size="xs">!</Badge>}
                  <Btn size="xs" variant="outline" onClick={() => setSwapModal({ assignment: a, worker })}>Zamjena</Btn>
                  {isAdmin && (
                    <>
                      <Btn size="xs" variant="ghost" onClick={() => {
                        setManualForm({ newWorkerId: a.workerId, reason: '' });
                        setManualModal({ assignment: a, worker });
                      }}>Uredi</Btn>
                      <button 
                        onClick={() => handleDeleteAssignment(a._id || a.id)}
                        className="p-1.5 text-[--text-muted] hover:text-[--rose] transition-colors"
                        title="Obriši iz smjene"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
          
          {/* Prikaz upozorenja o manjku radnika sa opcijom popunjavanja */}
          {isAdmin && detailModal?.warnings?.map((w, i) => (
            <div key={`warn-${i}`} className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 flex justify-between items-center animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-rose-400">Fali radnik</div>
                  <div className="text-[10px] text-rose-400/70 uppercase tracking-widest">
                    Kategorija: {categories.find(c => String(c.id) === String(w.categoryId))?.name || 'Nepoznata'}
                  </div>
                </div>
              </div>
              <Btn size="xs" variant="danger" onClick={() => {
                setManualForm({ newWorkerId: '', reason: 'Popunjavanje prazne smjene' });
                setManualModal({ 
                  assignment: null, 
                  dayOffset: detailModal.dayOffset, 
                  shiftId: detailModal.shift.id,
                  categoryId: w.categoryId
                });
              }}>Popuni</Btn>
            </div>
          ))}
        </div>
      </Modal>

      <Modal open={!!manualModal} onClose={() => setManualModal(null)} title="Ručna izmjena smjene">
        <div className="space-y-5">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <p className="text-xs text-amber-200">
              {manualModal?.assignment 
                ? <>Mijenjate radnika <strong>{manualModal?.worker?.name}</strong> u smjeni <strong>{detailModal?.shift.name}</strong> ({DAYS_FULL[detailModal?.dayOffset || 0]}).</>
                : <>Popunjavate upražnjeno mjesto u smjeni <strong>{detailModal?.shift.name}</strong> ({DAYS_FULL[detailModal?.dayOffset || 0]}).</>
              }
            </p>
          </div>
          <Input 
            label="Novi radnik" 
            type="select" 
            value={manualForm.newWorkerId} 
            onChange={v => setManualForm(f => ({ ...f, newWorkerId: v }))}
            options={[
              { value: '', label: 'Odaberi radnika...' },
              ...workers
                .map(w => ({ 
                  value: w.id, 
                  label: `${w.name} (${(w.categoryIds || []).map(id => categories.find(c => String(c.id) === String(id))?.name).filter(Boolean).join(', ') || 'Bez kategorije'})` 
                }))
            ]}
          />
          <Input 
            label="Razlog izmjene" 
            value={manualForm.reason} 
            onChange={v => setManualForm(f => ({ ...f, reason: v }))}
            placeholder="npr. Bolovanje, dogovor radnika..."
          />
          <div className="flex gap-3 justify-end mt-4">
            <Btn variant="ghost" onClick={() => setManualModal(null)}>Odustani</Btn>
            <Btn onClick={handleManualUpdate} disabled={!manualForm.newWorkerId || !manualForm.reason}>Potvrdi izmjenu</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={!!swapModal} onClose={() => setSwapModal(null)} title="Zahtjev za zamjenu smjene">
        <div className="space-y-5">
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-200">
            Radnik <strong>{swapModal?.worker?.name}</strong> traži zamjenu za svoju smjenu.
          </div>
          <Input 
            label="Zamijeni sa radnikom" 
            type="select" 
            value={swapForm.targetWorkerId} 
            onChange={v => setSwapForm(f => ({ ...f, targetWorkerId: v }))}
            options={[
              { value: '', label: 'Odaberi radnika...' },
              ...workers
                .filter(w => String(w.id) !== String(swapModal?.worker?.id))
                .map(w => ({ 
                  value: w.id, 
                  label: `${w.name} (${(w.categoryIds || []).map(id => categories.find(c => String(c.id) === String(id))?.name).filter(Boolean).join(', ') || 'Bez kategorije'})` 
                }))
            ]}
          />
          <div className="flex gap-3 justify-end mt-4">
            <Btn variant="ghost" onClick={() => setSwapModal(null)}>Odustani</Btn>
            <Btn onClick={handleSwapRequest} disabled={!swapForm.targetWorkerId}>Pošalji zahtjev</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
