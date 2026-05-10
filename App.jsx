import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Users, Tag, Calendar, Settings, LayoutDashboard, Plus, Trash2,
  Edit2, X, Check, ChevronLeft, ChevronRight, AlertTriangle,
  Clock, TrendingUp, Zap, Moon, Sun, Sunset, UserX, Briefcase,
  Plane, Heart, HelpCircle, RefreshCw, Download, Menu, Bell,
  BarChart2, Shield, Coffee
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9)

const DAYS_BS = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned']
const DAYS_FULL = ['Ponedjeljak', 'Utorak', 'Srijeda', 'Četvrtak', 'Petak', 'Subota', 'Nedjelja']
const MONTHS_BS = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni', 'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar']

function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function formatDate(date) {
  const d = new Date(date)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

function isoDate(date) {
  const d = new Date(date)
  return d.toISOString().slice(0, 10)
}

function parseTime(t) { // "HH:MM" -> minutes from midnight
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function shiftDurationHours(shift) {
  let s = parseTime(shift.start)
  let e = parseTime(shift.end)
  if (e <= s) e += 24 * 60
  return (e - s) / 60
}

function isWorkerAbsent(workerId, date, absences) {
  const iso = isoDate(date)
  return absences.some(a => a.workerId === workerId && a.startDate <= iso && a.endDate >= iso)
}

function getAbsenceOnDay(workerId, date, absences) {
  const iso = isoDate(date)
  return absences.find(a => a.workerId === workerId && a.startDate <= iso && a.endDate >= iso)
}

function hasRestTime(lastShift, currentShift, minRestHours) {
  if (!lastShift) return true
  const lastEnd = parseTime(lastShift.end) + (parseTime(lastShift.end) <= parseTime(lastShift.start) ? 24 * 60 : 0)
  const currentStart = parseTime(currentShift.start) + lastShift.dayOffset * 24 * 60 + currentShift.dayOffset * 24 * 60
  const restMinutes = (currentShift.dayOffset - lastShift.dayOffset) * 24 * 60 + parseTime(currentShift.start) - parseTime(lastShift.end)
  const corrected = parseTime(lastShift.end) > parseTime(currentShift.start) + (currentShift.dayOffset - lastShift.dayOffset) * 24 * 60
    ? (currentShift.dayOffset - lastShift.dayOffset) * 24 * 60 + parseTime(currentShift.start) + 24 * 60 - parseTime(lastShift.end)
    : (currentShift.dayOffset - lastShift.dayOffset) * 24 * 60 + parseTime(currentShift.start) - parseTime(lastShift.end)
  return corrected >= minRestHours * 60
}

// ─── Scheduling Algorithm ─────────────────────────────────────────────────────

function generateSchedule(weekStart, workers, categories, absences, shiftTypes, settings, historicalSchedules) {
  const assignments = []
  const workerHours = {}
  const workerLastShift = {} // workerId -> { dayOffset, end }
  const workerShiftCount = {} // workerId -> { shiftId -> count }

  // Load historical shift distribution
  historicalSchedules.slice(-8).forEach(sched => {
    sched.assignments.forEach(a => {
      if (!workerShiftCount[a.workerId]) workerShiftCount[a.workerId] = {}
      workerShiftCount[a.workerId][a.shiftId] = (workerShiftCount[a.workerId][a.shiftId] || 0) + 1
    })
  })

  const minRest = settings.minRestHours || 11
  const maxHours = settings.maxHoursPerWeek || 40

  // Sort shifts by start time
  const sortedShifts = [...shiftTypes].sort((a, b) => parseTime(a.start) - parseTime(b.start))

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const dayDate = addDays(weekStart, dayOffset)

    for (const shift of sortedShifts) {
      for (const category of categories) {
        const required = (category.requiredPerShift || {})[shift.id] || 0
        if (required === 0) continue

        const shiftDur = shiftDurationHours(shift)

        // Get available workers for this category/day/shift
        const available = workers.filter(w => {
          if (w.categoryId !== category.id) return false
          if (isWorkerAbsent(w.id, dayDate, absences)) return false
          // Check weekly hours
          const hoursUsed = workerHours[w.id] || 0
          if (hoursUsed + shiftDur > maxHours + (settings.allowOvertime ? settings.maxOvertimeHours || 8 : 0)) return false
          // Check rest time
          const last = workerLastShift[w.id]
          if (last) {
            const restMins = (dayOffset - last.dayOffset) * 24 * 60 +
              parseTime(shift.start) -
              (parseTime(last.end) > parseTime(shift.start) || last.dayOffset === dayOffset
                ? parseTime(last.end) - 24 * 60
                : parseTime(last.end))
            const endIsNextDay = parseTime(shift.end) <= parseTime(shift.start)
            const lastEndIsNextDay = last.endsNextDay
            const actualRest = (dayOffset - last.dayOffset) * 24 * 60 + parseTime(shift.start) - (lastEndIsNextDay ? parseTime(last.end) + 24 * 60 - 24 * 60 : parseTime(last.end))
            const restCalc = (dayOffset - last.dayOffset) * 24 * 60 + parseTime(shift.start) - parseTime(last.end)
            const trueRest = lastEndIsNextDay
              ? (dayOffset - last.dayOffset - 1) * 24 * 60 + parseTime(shift.start) + (24 * 60 - parseTime(last.end))
              : (dayOffset - last.dayOffset) * 24 * 60 + parseTime(shift.start) - parseTime(last.end)
            if (trueRest < minRest * 60) return false
          }
          return true
        })

        // Score and sort for fairness
        available.sort((a, b) => {
          const aHours = workerHours[a.id] || 0
          const bHours = workerHours[b.id] || 0
          const aShiftCount = (workerShiftCount[a.id] || {})[shift.id] || 0
          const bShiftCount = (workerShiftCount[b.id] || {})[shift.id] || 0
          // Prefer fewer hours, then fewer times on this shift
          const score = (aHours - bHours) * 2 + (aShiftCount - bShiftCount)
          return score
        })

        const toAssign = available.slice(0, required)
        for (const worker of toAssign) {
          assignments.push({
            id: uid(),
            workerId: worker.id,
            categoryId: category.id,
            shiftId: shift.id,
            dayOffset,
          })
          workerHours[worker.id] = (workerHours[worker.id] || 0) + shiftDur
          const endsNextDay = parseTime(shift.end) <= parseTime(shift.start)
          workerLastShift[worker.id] = { dayOffset: endsNextDay ? dayOffset + 1 : dayOffset, end: shift.end, endsNextDay }
          if (!workerShiftCount[worker.id]) workerShiftCount[worker.id] = {}
          workerShiftCount[worker.id][shift.id] = (workerShiftCount[worker.id][shift.id] || 0) + 1
        }

        // Check for understaffing
        if (toAssign.length < required) {
          assignments.push({
            id: uid(),
            isWarning: true,
            categoryId: category.id,
            shiftId: shift.id,
            dayOffset,
            needed: required - toAssign.length,
          })
        }
      }
    }
  }

  return { id: uid(), weekStart: isoDate(weekStart), assignments, workerHours }
}

// ─── Initial Data ─────────────────────────────────────────────────────────────

const DEFAULT_SHIFTS = [
  { id: 'morning', name: 'Jutarnja', start: '06:00', end: '14:00', color: '#f59e0b', icon: 'sun' },
  { id: 'afternoon', name: 'Popodnevna', start: '14:00', end: '22:00', color: '#3b82f6', icon: 'sunset' },
  { id: 'night', name: 'Noćna', start: '22:00', end: '06:00', color: '#8b5cf6', icon: 'moon' },
]

const DEFAULT_SETTINGS = {
  minRestHours: 11,
  maxHoursPerWeek: 40,
  allowOvertime: true,
  maxOvertimeHours: 8,
  breakAfterHours: 6,
  breakDurationMinutes: 30,
}

const ABSENCE_TYPES = [
  { id: 'sick', label: 'Bolovanje', color: '#f43f5e', icon: 'heart' },
  { id: 'vacation', label: 'Godišnji odmor', color: '#10b981', icon: 'plane' },
  { id: 'business', label: 'Službeni put', color: '#06b6d4', icon: 'briefcase' },
  { id: 'other', label: 'Ostalo', color: '#8899b4', icon: 'help' },
]

const CATEGORY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4', '#ec4899', '#14b8a6']

// ─── useLocalStorage hook ────────────────────────────────────────────────────

function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initial
    } catch { return initial }
  })
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} }, [key, val])
  return [val, setVal]
}

// ─── UI Primitives ────────────────────────────────────────────────────────────

const Btn = ({ children, onClick, variant = 'primary', size = 'md', disabled, className = '', icon }) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500',
    ghost: 'bg-transparent hover:bg-white/5 text-[--text-secondary] hover:text-[--text-primary] border border-transparent',
    danger: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30',
    success: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    outline: 'bg-transparent hover:bg-white/5 text-[--text-primary] border border-[--border-bright]',
    cyan: 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/40',
  }
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${variants[variant]} ${sizes[size]} rounded-lg font-medium transition-all duration-150 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {icon && icon}
      {children}
    </button>
  )
}

const Input = ({ label, value, onChange, type = 'text', placeholder, required, min, max, options, hint }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {label && <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}{required && <span style={{ color: 'var(--rose)', marginLeft: 3 }}>*</span>}</label>}
    {type === 'select' ? (
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14, outline: 'none', width: '100%' }}
      >
        {options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    ) : (
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14, outline: 'none', width: '100%' }}
        onFocus={e => e.target.style.borderColor = 'var(--blue)'}
        onBlur={e => e.target.style.borderColor = 'var(--border-bright)'}
      />
    )}
    {hint && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{hint}</span>}
  </div>
)

const Badge = ({ children, color = '#3b82f6', size = 'sm' }) => (
  <span style={{
    background: color + '22',
    color: color,
    border: `1px solid ${color}44`,
    borderRadius: 6,
    padding: size === 'sm' ? '2px 8px' : '4px 12px',
    fontSize: size === 'sm' ? 11 : 12,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    letterSpacing: '0.04em',
  }}>{children}</span>
)

const Card = ({ children, className, style }) => (
  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, ...style }} className={className}>
    {children}
  </div>
)

const Modal = ({ open, onClose, title, children, width = 500 }) => {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)', borderRadius: 16, padding: 28, width: '100%', maxWidth: width, maxHeight: '90vh', overflowY: 'auto', animation: 'fadeIn 0.2s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

const StatCard = ({ label, value, sub, icon, color = '#3b82f6' }) => (
  <Card style={{ position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at top right, ${color}22, transparent)`, borderRadius: '0 12px 0 80px' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>{sub}</div>}
      </div>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}22`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
    </div>
  </Card>
)

// ─── Shift Icon ───────────────────────────────────────────────────────────────

const ShiftIcon = ({ shift, size = 14 }) => {
  if (!shift) return null
  if (shift.icon === 'moon' || shift.id === 'night') return <Moon size={size} />
  if (shift.icon === 'sunset' || shift.id === 'afternoon') return <Sunset size={size} />
  return <Sun size={size} />
}

// ─── WORKERS PAGE ─────────────────────────────────────────────────────────────

function WorkersPage({ workers, setWorkers, categories }) {
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', categoryId: '', phone: '', email: '', maxHoursPerWeek: 40 })
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')

  const openNew = () => { setEditing(null); setForm({ name: '', categoryId: categories[0]?.id || '', phone: '', email: '', maxHoursPerWeek: 40 }); setModal(true) }
  const openEdit = w => { setEditing(w.id); setForm({ name: w.name, categoryId: w.categoryId, phone: w.phone || '', email: w.email || '', maxHoursPerWeek: w.maxHoursPerWeek || 40 }); setModal(true) }

  const save = () => {
    if (!form.name.trim() || !form.categoryId) return
    if (editing) {
      setWorkers(ws => ws.map(w => w.id === editing ? { ...w, ...form, maxHoursPerWeek: Number(form.maxHoursPerWeek) } : w))
    } else {
      setWorkers(ws => [...ws, { id: uid(), ...form, maxHoursPerWeek: Number(form.maxHoursPerWeek), createdAt: new Date().toISOString() }])
    }
    setModal(false)
  }

  const remove = id => { if (confirm('Obrisati radnika?')) setWorkers(ws => ws.filter(w => w.id !== id)) }

  const filtered = workers.filter(w => {
    const matchSearch = w.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === 'all' || w.categoryId === filterCat
    return matchSearch && matchCat
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>Radnici</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{workers.length} registrovanih radnika</p>
        </div>
        <Btn onClick={openNew} icon={<Plus size={15} />}>Dodaj radnika</Btn>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input
          placeholder="Pretraži po imenu..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', color: 'var(--text-primary)', fontSize: 13 }}
        />
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13 }}
        >
          <option value="all">Sve kategorije</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Ime i prezime', 'Kategorija', 'Maks. sati/sedm.', 'Kontakt', 'Akcije'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                {workers.length === 0 ? 'Nema radnika. Dodajte prvog radnika.' : 'Nema rezultata pretrage.'}
              </td></tr>
            ) : filtered.map((w, i) => {
              const cat = categories.find(c => c.id === w.categoryId)
              return (
                <tr key={w.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: (cat?.color || '#3b82f6') + '33', border: `2px solid ${cat?.color || '#3b82f6'}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: cat?.color || '#3b82f6' }}>
                        {w.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 500 }}>{w.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {cat ? <Badge color={cat.color}>{cat.name}</Badge> : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)' }}>{w.maxHoursPerWeek}h</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                    {w.phone || w.email || '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(w)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.color = 'var(--blue)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                      ><Edit2 size={13} /></button>
                      <button onClick={() => remove(w.id)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#f43f5e'; e.currentTarget.style.color = '#f43f5e' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                      ><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Uredi radnika' : 'Novi radnik'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Ime i prezime" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="npr. Marko Marković" required />
          <Input label="Kategorija" value={form.categoryId} onChange={v => setForm(f => ({ ...f, categoryId: v }))} type="select"
            options={categories.map(c => ({ value: c.id, label: c.name }))} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Telefon" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="+387..." />
            <Input label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="email@..." />
          </div>
          <Input label="Maks. sati/sedmici" type="number" value={form.maxHoursPerWeek} onChange={v => setForm(f => ({ ...f, maxHoursPerWeek: v }))} min={1} max={60} hint="Standardno 40h, može se prilagoditi za part-time" />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setModal(false)}>Odustani</Btn>
            <Btn onClick={save} disabled={!form.name.trim() || !form.categoryId}>{editing ? 'Spremi izmjene' : 'Dodaj radnika'}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── CATEGORIES PAGE ──────────────────────────────────────────────────────────

function CategoriesPage({ categories, setCategories, shiftTypes, workers }) {
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', color: CATEGORY_COLORS[0], requiredPerShift: {} })

  const openNew = () => {
    const req = {}
    shiftTypes.forEach(s => req[s.id] = 1)
    setEditing(null); setForm({ name: '', color: CATEGORY_COLORS[0], requiredPerShift: req }); setModal(true)
  }
  const openEdit = c => { setEditing(c.id); setForm({ name: c.name, color: c.color, requiredPerShift: { ...c.requiredPerShift } }); setModal(true) }

  const save = () => {
    if (!form.name.trim()) return
    if (editing) {
      setCategories(cs => cs.map(c => c.id === editing ? { ...c, ...form } : c))
    } else {
      setCategories(cs => [...cs, { id: uid(), ...form }])
    }
    setModal(false)
  }

  const remove = id => {
    const count = workers.filter(w => w.categoryId === id).length
    if (count > 0 && !confirm(`Kategorija ima ${count} radnika. Brisanjem kategorije, radnici ostaju bez kategorije. Nastaviti?`)) return
    setCategories(cs => cs.filter(c => c.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>Kategorije radnika</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Definirajte grupe i potreban broj radnika po smjeni</p>
        </div>
        <Btn onClick={openNew} icon={<Plus size={15} />}>Nova kategorija</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {categories.length === 0 && (
          <Card style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            Nema kategorija. Dodajte prvu kategoriju radnika.
          </Card>
        )}
        {categories.map(cat => {
          const catWorkers = workers.filter(w => w.categoryId === cat.id)
          return (
            <Card key={cat.id} style={{ borderLeft: `3px solid ${cat.color}`, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: cat.color, boxShadow: `0 0 8px ${cat.color}` }} />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>{cat.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(cat)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 7px', color: 'var(--text-muted)', cursor: 'pointer' }}><Edit2 size={12} /></button>
                  <button onClick={() => remove(cat.id)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 7px', color: 'var(--text-muted)', cursor: 'pointer' }}><Trash2 size={12} /></button>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{catWorkers.length} radnika u kategoriji</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {shiftTypes.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-elevated)', borderRadius: 7 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
                      <ShiftIcon shift={s} size={13} />
                      <span style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
                    </div>
                    <Badge color={s.color}>{(cat.requiredPerShift || {})[s.id] || 0} radnika</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )
        })}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Uredi kategoriju' : 'Nova kategorija'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Naziv kategorije" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="npr. Kasiri, Skladištari..." required />
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Boja</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CATEGORY_COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? `3px solid white` : '3px solid transparent', cursor: 'pointer', boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none' }}
                />
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Potreban broj radnika po smjeni</label>
            {shiftTypes.map(s => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8, marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShiftIcon shift={s} size={14} />
                  <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{s.name} ({s.start}–{s.end})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => setForm(f => ({ ...f, requiredPerShift: { ...f.requiredPerShift, [s.id]: Math.max(0, (f.requiredPerShift[s.id] || 0) - 1) } }))}
                    style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>−</button>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, width: 20, textAlign: 'center' }}>{(form.requiredPerShift || {})[s.id] || 0}</span>
                  <button onClick={() => setForm(f => ({ ...f, requiredPerShift: { ...f.requiredPerShift, [s.id]: (f.requiredPerShift[s.id] || 0) + 1 } }))}
                    style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setModal(false)}>Odustani</Btn>
            <Btn onClick={save} disabled={!form.name.trim()}>{editing ? 'Spremi' : 'Dodaj'}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── ABSENCES PAGE ────────────────────────────────────────────────────────────

function AbsencesPage({ absences, setAbsences, workers, categories }) {
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ workerId: '', type: 'sick', startDate: isoDate(new Date()), endDate: isoDate(new Date()), note: '' })
  const [filterType, setFilterType] = useState('all')

  const today = isoDate(new Date())
  const active = absences.filter(a => a.startDate <= today && a.endDate >= today)

  const save = () => {
    if (!form.workerId || !form.startDate || !form.endDate) return
    setAbsences(as => [...as, { id: uid(), ...form, createdAt: new Date().toISOString() }])
    setModal(false)
    setForm({ workerId: '', type: 'sick', startDate: today, endDate: today, note: '' })
  }

  const remove = id => setAbsences(as => as.filter(a => a.id !== id))

  const filtered = absences.filter(a => filterType === 'all' || a.type === filterType)
    .sort((a, b) => b.startDate.localeCompare(a.startDate))

  const absenceTypeInfo = type => ABSENCE_TYPES.find(t => t.id === type) || ABSENCE_TYPES[3]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>Odsutnosti</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{active.length} aktivnih odsutnosti danas</p>
        </div>
        <Btn onClick={() => { setForm({ workerId: workers[0]?.id || '', type: 'sick', startDate: today, endDate: today, note: '' }); setModal(true) }} icon={<Plus size={15} />}>Nova odsutnost</Btn>
      </div>

      {active.length > 0 && (
        <div style={{ padding: '12px 16px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={16} style={{ color: '#f43f5e', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#f43f5e' }}>
            <strong>{active.length}</strong> radnika je trenutno odsutno: {active.map(a => workers.find(w => w.id === a.workerId)?.name).filter(Boolean).join(', ')}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[{ id: 'all', label: 'Sve', color: 'var(--blue)' }, ...ABSENCE_TYPES].map(t => (
          <button key={t.id} onClick={() => setFilterType(t.id)}
            style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${filterType === t.id ? t.color : 'var(--border)'}`, background: filterType === t.id ? t.color + '22' : 'transparent', color: filterType === t.id ? t.color : 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Radnik', 'Tip', 'Od', 'Do', 'Trajanje', 'Status', 'Napomena', ''].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Nema zabilježenih odsutnosti.</td></tr>
            ) : filtered.map((a, i) => {
              const worker = workers.find(w => w.id === a.workerId)
              const cat = categories.find(c => c.id === worker?.categoryId)
              const typeInfo = absenceTypeInfo(a.type)
              const start = new Date(a.startDate)
              const end = new Date(a.endDate)
              const days = Math.round((end - start) / 86400000) + 1
              const isActive = a.startDate <= today && a.endDate >= today
              const isPast = a.endDate < today
              return (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: (cat?.color || '#3b82f6') + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: cat?.color || '#3b82f6' }}>
                        {worker?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{worker?.name || 'Nepoznat'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px' }}><Badge color={typeInfo.color}>{typeInfo.label}</Badge></td>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(start)}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(end)}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{days}d</td>
                  <td style={{ padding: '10px 14px' }}>
                    <Badge color={isActive ? '#f43f5e' : isPast ? 'var(--text-muted)' : '#f59e0b'}>
                      {isActive ? 'Aktivan' : isPast ? 'Završen' : 'Predstojeći'}
                    </Badge>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>{a.note || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <button onClick={() => remove(a.id)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 7px', color: 'var(--text-muted)', cursor: 'pointer' }}><Trash2 size={12} /></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Unos odsutnosti">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Radnik" value={form.workerId} onChange={v => setForm(f => ({ ...f, workerId: v }))} type="select"
            options={workers.map(w => ({ value: w.id, label: w.name }))} required />
          <Input label="Tip odsutnosti" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} type="select"
            options={ABSENCE_TYPES.map(t => ({ value: t.id, label: t.label }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Datum od" type="date" value={form.startDate} onChange={v => setForm(f => ({ ...f, startDate: v }))} required />
            <Input label="Datum do" type="date" value={form.endDate} onChange={v => setForm(f => ({ ...f, endDate: v }))} required />
          </div>
          <Input label="Napomena" value={form.note} onChange={v => setForm(f => ({ ...f, note: v }))} placeholder="Opcionalna napomena..." />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setModal(false)}>Odustani</Btn>
            <Btn onClick={save} disabled={!form.workerId}>Spremi</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────

function SettingsPage({ settings, setSettings, shiftTypes, setShiftTypes }) {
  const [shiftModal, setShiftModal] = useState(false)
  const [editShift, setEditShift] = useState(null)
  const [shiftForm, setShiftForm] = useState({ name: '', start: '06:00', end: '14:00', color: '#f59e0b', icon: 'sun' })

  const openNewShift = () => { setEditShift(null); setShiftForm({ name: '', start: '06:00', end: '14:00', color: '#f59e0b', icon: 'sun' }); setShiftModal(true) }
  const openEditShift = s => { setEditShift(s.id); setShiftForm({ name: s.name, start: s.start, end: s.end, color: s.color, icon: s.icon }); setShiftModal(true) }

  const saveShift = () => {
    if (!shiftForm.name.trim()) return
    if (editShift) {
      setShiftTypes(ss => ss.map(s => s.id === editShift ? { ...s, ...shiftForm } : s))
    } else {
      setShiftTypes(ss => [...ss, { id: uid(), ...shiftForm }])
    }
    setShiftModal(false)
  }

  const S = ({ label, hint, children }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{hint}</div>}
      </div>
      {children}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease', maxWidth: 700 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>Podešavanja</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Konfiguracija radnog vremena i pravila raspoređivanja</p>
      </div>

      <Card>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 4, color: 'var(--cyan)' }}>Radno vrijeme</h3>
        <S label="Min. odmor između smjena" hint="Zakonom propisano minimalno 11 sati odmora">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="number" value={settings.minRestHours} min={8} max={24}
              onChange={e => setSettings(s => ({ ...s, minRestHours: Number(e.target.value) }))}
              style={{ width: 64, background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)', borderRadius: 8, padding: '6px 10px', color: 'var(--text-primary)', textAlign: 'center' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>sati</span>
          </div>
        </S>
        <S label="Maks. sati sedmično" hint="Standardni puni radni tjedan">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="number" value={settings.maxHoursPerWeek} min={20} max={60}
              onChange={e => setSettings(s => ({ ...s, maxHoursPerWeek: Number(e.target.value) }))}
              style={{ width: 64, background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)', borderRadius: 8, padding: '6px 10px', color: 'var(--text-primary)', textAlign: 'center' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>sati</span>
          </div>
        </S>
        <S label="Dozvoljeni prekovremeni rad" hint="Prekovremeni rad iznad standardnog fonda">
          <button onClick={() => setSettings(s => ({ ...s, allowOvertime: !s.allowOvertime }))}
            style={{ width: 44, height: 24, borderRadius: 12, background: settings.allowOvertime ? 'var(--blue)' : 'var(--border-bright)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: settings.allowOvertime ? 23 : 3, transition: 'left 0.2s' }} />
          </button>
        </S>
        {settings.allowOvertime && (
          <S label="Maks. prekovremenih sati/sedmici" hint="">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="number" value={settings.maxOvertimeHours} min={1} max={20}
                onChange={e => setSettings(s => ({ ...s, maxOvertimeHours: Number(e.target.value) }))}
                style={{ width: 64, background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)', borderRadius: 8, padding: '6px 10px', color: 'var(--text-primary)', textAlign: 'center' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>sati</span>
            </div>
          </S>
        )}
        <S label="Pauza (odmor) nakon" hint="Pravo na pauzu pri radu dužem od zadanog broja sati">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="number" value={settings.breakAfterHours} min={4} max={12}
              onChange={e => setSettings(s => ({ ...s, breakAfterHours: Number(e.target.value) }))}
              style={{ width: 60, background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)', borderRadius: 8, padding: '6px 10px', color: 'var(--text-primary)', textAlign: 'center' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>sati →</span>
            <input type="number" value={settings.breakDurationMinutes} min={15} max={60}
              onChange={e => setSettings(s => ({ ...s, breakDurationMinutes: Number(e.target.value) }))}
              style={{ width: 60, background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)', borderRadius: 8, padding: '6px 10px', color: 'var(--text-primary)', textAlign: 'center' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>min pauza</span>
          </div>
        </S>
      </Card>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--cyan)' }}>Tipovi smjena</h3>
          <Btn size="sm" onClick={openNewShift} icon={<Plus size={13} />}>Dodaj smjenu</Btn>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shiftTypes.map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 10, border: `1px solid ${s.color}33` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
                <span style={{ fontWeight: 500 }}>{s.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{s.start}–{s.end}</span>
                <Badge color={s.color}>{shiftDurationHours(s)}h</Badge>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEditShift(s)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 7px', color: 'var(--text-muted)', cursor: 'pointer' }}><Edit2 size={12} /></button>
                <button onClick={() => setShiftTypes(ss => ss.filter(x => x.id !== s.id))} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 7px', color: 'var(--text-muted)', cursor: 'pointer' }}><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={shiftModal} onClose={() => setShiftModal(false)} title={editShift ? 'Uredi smjenu' : 'Nova smjena'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Naziv smjene" value={shiftForm.name} onChange={v => setShiftForm(f => ({ ...f, name: v }))} placeholder="npr. Jutarnja" required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Početak" type="time" value={shiftForm.start} onChange={v => setShiftForm(f => ({ ...f, start: v }))} />
            <Input label="Kraj" type="time" value={shiftForm.end} onChange={v => setShiftForm(f => ({ ...f, end: v }))} hint="Kraj < početak = prelaz ponoći" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Boja</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {CATEGORY_COLORS.map(c => (
                <button key={c} onClick={() => setShiftForm(f => ({ ...f, color: c }))}
                  style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: shiftForm.color === c ? '3px solid white' : '3px solid transparent', cursor: 'pointer' }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setShiftModal(false)}>Odustani</Btn>
            <Btn onClick={saveShift}>{editShift ? 'Spremi' : 'Dodaj'}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── SCHEDULE PAGE ────────────────────────────────────────────────────────────

function SchedulePage({ schedules, setSchedules, workers, categories, absences, shiftTypes, settings }) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()))
  const [generating, setGenerating] = useState(false)
  const [detailModal, setDetailModal] = useState(null) // { day, shift }

  const weekKey = isoDate(currentWeekStart)
  const currentSchedule = schedules.find(s => s.weekStart === weekKey)

  const prevWeek = () => setCurrentWeekStart(d => addDays(d, -7))
  const nextWeek = () => setCurrentWeekStart(d => addDays(d, 7))
  const goToday = () => setCurrentWeekStart(getWeekStart(new Date()))

  const generate = () => {
    setGenerating(true)
    setTimeout(() => {
      const sched = generateSchedule(currentWeekStart, workers, categories, absences, shiftTypes, settings, schedules)
      setSchedules(ss => {
        const without = ss.filter(s => s.weekStart !== weekKey)
        return [...without, sched]
      })
      setGenerating(false)
    }, 600)
  }

  const clearSchedule = () => {
    if (confirm('Obrisati raspored za ovu sedmicu?'))
      setSchedules(ss => ss.filter(s => s.weekStart !== weekKey))
  }

  const workerHours = currentSchedule?.workerHours || {}

  // Get assignments for a specific day+shift
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>Sedmični raspored</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {formatDate(currentWeekStart)} – {formatDate(addDays(currentWeekStart, 6))}
            </span>
            {currentSchedule && <Badge color="var(--emerald)">Raspored generisan</Badge>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {currentSchedule && <Btn variant="outline" size="sm" onClick={exportCSV} icon={<Download size={13} />}>Izvoz CSV</Btn>}
          {currentSchedule && <Btn variant="danger" size="sm" onClick={clearSchedule} icon={<Trash2 size={13} />}>Obriši</Btn>}
          <Btn onClick={generate} disabled={generating || workers.length === 0 || categories.length === 0}
            icon={generating ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={14} />}
            variant="cyan">
            {generating ? 'Generisanje...' : currentSchedule ? 'Regeneriši' : 'Generiši raspored'}
          </Btn>
        </div>
      </div>

      {/* Week nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={prevWeek} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 10px', color: 'var(--text-primary)', cursor: 'pointer' }}><ChevronLeft size={16} /></button>
        <button onClick={goToday} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 14px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Danas</button>
        <button onClick={nextWeek} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 10px', color: 'var(--text-primary)', cursor: 'pointer' }}><ChevronRight size={16} /></button>
      </div>

      {workers.length === 0 || categories.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 50 }}>
          <AlertTriangle size={32} style={{ color: 'var(--amber)', margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>Potrebno je dodati radnike i kategorije prije generisanja rasporeda.</div>
        </Card>
      ) : (
        <>
          {/* Schedule Grid */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr>
                  <th style={{ width: 100, padding: '10px 12px', textAlign: 'left', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Smjena</th>
                  {DAYS_BS.map((d, i) => {
                    const dayDate = isoDate(addDays(currentWeekStart, i))
                    const isToday = dayDate === today
                    return (
                      <th key={d} style={{ padding: '10px 6px', textAlign: 'center', background: isToday ? 'rgba(59,130,246,0.1)' : 'var(--bg-card)', borderBottom: `1px solid ${isToday ? 'var(--blue)' : 'var(--border)'}`, fontSize: 12 }}>
                        <div style={{ fontWeight: 700, color: isToday ? 'var(--blue-bright)' : 'var(--text-primary)' }}>{d}</div>
                        <div style={{ fontSize: 11, color: isToday ? 'var(--blue)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {String(addDays(currentWeekStart, i).getDate()).padStart(2, '0')}.{String(addDays(currentWeekStart, i).getMonth() + 1).padStart(2, '0')}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {shiftTypes.map(shift => (
                  <tr key={shift.id}>
                    <td style={{ padding: '8px 12px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: shift.color, boxShadow: `0 0 5px ${shift.color}` }} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: shift.color }}>{shift.name}</div>
                          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{shift.start}–{shift.end}</div>
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
                        <td key={dayOffset} onClick={() => actual.length > 0 && setDetailModal({ dayOffset, shift, assignments: actual })}
                          style={{ padding: '6px', verticalAlign: 'top', background: isToday ? 'rgba(59,130,246,0.04)' : 'transparent', borderBottom: '1px solid var(--border)', borderRight: dayOffset === 6 ? 'none' : '1px solid var(--border)', cursor: actual.length > 0 ? 'pointer' : 'default', minWidth: 90, minHeight: 70 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {!currentSchedule && (
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>—</div>
                            )}
                            {actual.map(a => {
                              const worker = workers.find(w => w.id === a.workerId)
                              const cat = categories.find(c => c.id === a.categoryId)
                              const absToday = getAbsenceOnDay(a.workerId, dayDate, absences)
                              return (
                                <div key={a.id} style={{ padding: '3px 7px', borderRadius: 6, background: (cat?.color || shift.color) + '18', border: `1px solid ${cat?.color || shift.color}33`, fontSize: 11, fontWeight: 500, color: cat?.color || shift.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {worker?.name?.split(' ')[0] || '?'} {worker?.name?.split(' ')[1]?.[0] || ''}.
                                </div>
                              )
                            })}
                            {warnings.map((w, i) => (
                              <div key={i} style={{ padding: '3px 7px', borderRadius: 6, background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', fontSize: 10, color: '#f43f5e', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <AlertTriangle size={9} />-{w.needed} radnika
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

          {/* Worker Hours Summary */}
          {currentSchedule && (
            <Card>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'var(--text-secondary)' }}>Pregled radnih sati — ova sedmica</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {workers.map(w => {
                  const hours = workerHours[w.id] || 0
                  const cat = categories.find(c => c.id === w.categoryId)
                  const isOvertime = hours > settings.maxHoursPerWeek
                  const isAbsent = Object.values(absences).some ? absences.some(a => {
                    const ws = isoDate(currentWeekStart)
                    const we = isoDate(addDays(currentWeekStart, 6))
                    return a.workerId === w.id && a.startDate <= we && a.endDate >= ws
                  }) : false
                  return (
                    <div key={w.id} style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--bg-elevated)', border: `1px solid ${isOvertime ? '#f59e0b44' : cat?.color + '33' || 'var(--border)'}`, display: 'flex', alignItems: 'center', gap: 10, minWidth: 160 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: (cat?.color || '#3b82f6') + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: cat?.color || '#3b82f6', flexShrink: 0 }}>
                        {w.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                          <div style={{ height: 3, flex: 1, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, hours / settings.maxHoursPerWeek * 100)}%`, background: isOvertime ? '#f59e0b' : cat?.color || '#3b82f6', borderRadius: 2, transition: 'width 0.5s ease' }} />
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: isOvertime ? '#f59e0b' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>{hours}h</span>
                        </div>
                      </div>
                      {isOvertime && <AlertTriangle size={12} style={{ color: '#f59e0b', flexShrink: 0 }} />}
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Absence alerts for this week */}
          {(() => {
            const ws = isoDate(currentWeekStart)
            const we = isoDate(addDays(currentWeekStart, 6))
            const weekAbsences = absences.filter(a => a.startDate <= we && a.endDate >= ws)
            if (weekAbsences.length === 0) return null
            return (
              <Card style={{ borderColor: 'rgba(244,63,94,0.2)', background: 'rgba(244,63,94,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <UserX size={16} style={{ color: '#f43f5e' }} />
                  <span style={{ fontWeight: 600, fontSize: 13, color: '#f43f5e' }}>Odsutni radnici ove sedmice</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {weekAbsences.map(a => {
                    const worker = workers.find(w => w.id === a.workerId)
                    const typeInfo = ABSENCE_TYPES.find(t => t.id === a.type)
                    return (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-elevated)', borderRadius: 20, border: `1px solid ${typeInfo?.color || 'var(--border)'}44` }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{worker?.name}</span>
                        <Badge color={typeInfo?.color || 'var(--text-muted)'}>{typeInfo?.label}</Badge>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )
          })()}
        </>
      )}

      {/* Detail Modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title={detailModal ? `${DAYS_FULL[detailModal.dayOffset]} — ${detailModal.shift?.name}` : ''}>
        {detailModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
              {formatDate(addDays(currentWeekStart, detailModal.dayOffset))} · {detailModal.shift?.start}–{detailModal.shift?.end}
            </div>
            {detailModal.assignments.map(a => {
              const worker = workers.find(w => w.id === a.workerId)
              const cat = categories.find(c => c.id === a.categoryId)
              const dayDate = addDays(currentWeekStart, a.dayOffset)
              const absence = getAbsenceOnDay(a.workerId, dayDate, absences)
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 10, border: `1px solid ${cat?.color || 'var(--border)'}33` }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: (cat?.color || '#3b82f6') + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: cat?.color || '#3b82f6' }}>
                    {worker?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{worker?.name}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      {cat && <Badge color={cat.color}>{cat.name}</Badge>}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{workerHours[a.workerId] || 0}h ove sedmice</span>
                    </div>
                  </div>
                  {workerHours[a.workerId] > settings.maxHoursPerWeek && <Badge color="#f59e0b">Prekovremeno</Badge>}
                </div>
              )
            })}
          </div>
        )}
      </Modal>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────

function DashboardPage({ workers, categories, absences, schedules, shiftTypes, settings }) {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800 }}>Pregled</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          {DAYS_FULL[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]}, {formatDate(new Date())}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        <StatCard label="Ukupno radnika" value={workers.length} sub={`u ${categories.length} kategorija`} icon={<Users size={18} />} color="#3b82f6" />
        <StatCard label="Odsutni danas" value={activeAbsences.length} sub="bolovanje, odmor, put..." icon={<UserX size={18} />} color="#f43f5e" />
        <StatCard label="Sati ovaj tjedan" value={totalHoursScheduled} sub={currentSchedule ? 'raspoređeno' : 'raspored nije kreiran'} icon={<Clock size={18} />} color="#06b6d4" />
        <StatCard label="Prekovremeni rad" value={overtimeWorkers} sub="radnika iznad normativi" icon={<TrendingUp size={18} />} color="#f59e0b" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'var(--text-secondary)' }}>Distribucija po smjenama (ova sedmica)</h3>
          {shiftTypes.map(s => {
            const count = shiftDist[s.id] || 0
            const max = Math.max(...Object.values(shiftDist), 1)
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 90 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.name}</span>
                </div>
                <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: s.color, borderRadius: 3, transition: 'width 0.8s ease' }} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', width: 20, textAlign: 'right' }}>{count}</span>
              </div>
            )
          })}
          {!currentSchedule && <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>Raspored za ovu sedmicu nije kreiran</div>}
        </Card>

        <Card>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'var(--text-secondary)' }}>Aktivne odsutnosti</h3>
          {activeAbsences.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>Nema aktivnih odsutnosti ✓</div>
          ) : activeAbsences.slice(0, 6).map(a => {
            const worker = workers.find(w => w.id === a.workerId)
            const typeInfo = ABSENCE_TYPES.find(t => t.id === a.type)
            const cat = categories.find(c => c.id === worker?.categoryId)
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: (cat?.color || '#3b82f6') + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: cat?.color || '#3b82f6' }}>
                  {worker?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{worker?.name}</span>
                <Badge color={typeInfo?.color || 'var(--text-muted)'}>{typeInfo?.label}</Badge>
              </div>
            )
          })}
        </Card>
      </div>

      <Card>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'var(--text-secondary)' }}>Kategorije radnika</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {categories.map(cat => {
            const catWorkers = workers.filter(w => w.categoryId === cat.id)
            const catAbsent = catWorkers.filter(w => activeAbsences.some(a => a.workerId === w.id))
            return (
              <div key={cat.id} style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 12, border: `1px solid ${cat.color}33`, borderLeft: `3px solid ${cat.color}`, minWidth: 160 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{cat.name}</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}><strong style={{ color: cat.color }}>{catWorkers.length}</strong> radnika</span>
                  {catAbsent.length > 0 && <span style={{ fontSize: 12, color: '#f43f5e' }}><strong>{catAbsent.length}</strong> odsutno</span>}
                </div>
              </div>
            )
          })}
          {categories.length === 0 && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nema kategorija. Počnite dodavanjem kategorija radnika.</span>}
        </div>
      </Card>
    </div>
  )
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────

const NAV = [
  { id: 'dashboard', label: 'Pregled', icon: LayoutDashboard },
  { id: 'schedule', label: 'Raspored', icon: Calendar },
  { id: 'workers', label: 'Radnici', icon: Users },
  { id: 'categories', label: 'Kategorije', icon: Tag },
  { id: 'absences', label: 'Odsutnosti', icon: UserX },
  { id: 'settings', label: 'Podešavanja', icon: Settings },
]

function Sidebar({ active, setActive, collapsed, setCollapsed, workers, absences }) {
  const today = isoDate(new Date())
  const activeAbsences = absences.filter(a => a.startDate <= today && a.endDate >= today).length

  return (
    <aside style={{
      width: collapsed ? 60 : 220,
      minHeight: '100vh',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s ease',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{ padding: collapsed ? '20px 0' : '20px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Zap size={16} color="white" />
        </div>
        {!collapsed && <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, background: 'linear-gradient(90deg, #60a5fa, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ShiftFlow</span>}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(item => {
          const Icon = item.icon
          const isActive = active === item.id
          const badge = item.id === 'absences' && activeAbsences > 0 ? activeAbsences : null
          return (
            <button key={item.id} onClick={() => setActive(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '10px 0' : '10px 12px',
                borderRadius: 8, border: 'none', background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: isActive ? 'var(--blue-bright)' : 'var(--text-secondary)',
                cursor: 'pointer', transition: 'all 0.15s', width: '100%',
                justifyContent: collapsed ? 'center' : 'flex-start',
                fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: isActive ? 600 : 400,
                borderLeft: isActive && !collapsed ? '2px solid var(--blue)' : '2px solid transparent',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-primary)' } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' } }}
            >
              <Icon size={17} />
              {!collapsed && <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>}
              {!collapsed && badge && <span style={{ background: '#f43f5e', color: 'white', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '1px 6px' }}>{badge}</span>}
            </button>
          )
        })}
      </nav>

      {/* Collapse btn */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        <button onClick={() => setCollapsed(!collapsed)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Sakrij</span></>}
        </button>
      </div>
    </aside>
  )
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [active, setActive] = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)

  const [workers, setWorkers] = useLocalStorage('sf_workers', [])
  const [categories, setCategories] = useLocalStorage('sf_categories', [])
  const [absences, setAbsences] = useLocalStorage('sf_absences', [])
  const [schedules, setSchedules] = useLocalStorage('sf_schedules', [])
  const [shiftTypes, setShiftTypes] = useLocalStorage('sf_shifts', DEFAULT_SHIFTS)
  const [settings, setSettings] = useLocalStorage('sf_settings', DEFAULT_SETTINGS)

  const pages = {
    dashboard: <DashboardPage workers={workers} categories={categories} absences={absences} schedules={schedules} shiftTypes={shiftTypes} settings={settings} />,
    schedule: <SchedulePage schedules={schedules} setSchedules={setSchedules} workers={workers} categories={categories} absences={absences} shiftTypes={shiftTypes} settings={settings} />,
    workers: <WorkersPage workers={workers} setWorkers={setWorkers} categories={categories} />,
    categories: <CategoriesPage categories={categories} setCategories={setCategories} shiftTypes={shiftTypes} workers={workers} />,
    absences: <AbsencesPage absences={absences} setAbsences={setAbsences} workers={workers} categories={categories} />,
    settings: <SettingsPage settings={settings} setSettings={setSettings} shiftTypes={shiftTypes} setShiftTypes={setShiftTypes} />,
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <Sidebar active={active} setActive={setActive} collapsed={collapsed} setCollapsed={setCollapsed} workers={workers} absences={absences} />
      <main style={{ flex: 1, padding: '32px 28px', overflowY: 'auto', maxWidth: 'calc(100vw - 60px)' }}>
        {pages[active]}
      </main>
    </div>
  )
}
