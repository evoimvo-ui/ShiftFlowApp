import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Sun, Sunset, Moon, Clock, Shield, TrendingUp, Zap } from 'lucide-react'
import { Card, Btn, Badge, Modal, Input } from '../components/UI'
import { settingApi, holidayApi } from '../api'
import { CATEGORY_COLORS, shiftDurationHours, formatDate, isoDate } from '../utils/helpers'

const ShiftIcon = ({ shift, size = 14 }) => {
  if (!shift) return null
  if (shift.icon === 'moon' || shift.id === 'night') return <Moon size={size} />
  if (shift.icon === 'sunset' || shift.id === 'afternoon') return <Sunset size={size} />
  return <Sun size={size} />
}

export default function SettingsPage({ settings, setSettings, shiftTypes, setShiftTypes, user }) {
  const isAdmin = user?.role === 'admin'
  const [shiftModal, setShiftModal] = useState(false)
  const [editShift, setEditShift] = useState(null)
  const [shiftForm, setShiftForm] = useState({ name: '', start: '06:00', end: '14:00', color: '#f59e0b', icon: 'sun', isSplit: false, start2: '', end2: '' })

  const [holidays, setHolidays] = useState([])
  const [holidayModal, setHolidayModal] = useState(false)
  const [holidayForm, setHolidayForm] = useState({ name: '', date: isoDate(new Date()), isRecurring: false })

  useEffect(() => {
    holidayApi.getAll()
      .then(res => setHolidays(res.data.map(h => ({ ...h, id: h._id }))))
      .catch(err => console.error('Holidays error:', err))
  }, [])

  if (!settings || !shiftTypes) {
    console.log('Settings state:', { settings, shiftTypes });
    return <div className="p-20 text-center text-[--text-muted]">Učitavanje...</div>
  }

  const openNewShift = () => { 
    setEditShift(null); 
    setShiftForm({ name: '', start: '06:00', end: '14:00', color: '#f59e0b', icon: 'sun', isSplit: false, start2: '', end2: '' }); 
    setShiftModal(true) 
  }
  const openEditShift = s => { 
    setEditShift(s.id); 
    setShiftForm({ 
      name: s.name, 
      start: s.start, 
      end: s.end, 
      color: s.color, 
      icon: s.icon,
      isSplit: s.isSplit || false,
      start2: s.start2 || '',
      end2: s.end2 || ''
    }); 
    setShiftModal(true) 
  }

  const saveShift = async () => {
    if (!shiftForm.name.trim()) return
    try {
      if (editShift) {
        const res = await settingApi.updateShift(editShift, shiftForm)
        const updated = { ...res.data, id: res.data._id }
        setShiftTypes(ss => ss.map(s => s.id === editShift ? updated : s))
      } else {
        const res = await settingApi.createShift(shiftForm)
        const created = { ...res.data, id: res.data._id }
        setShiftTypes(ss => [...ss, created])
      }
      setShiftModal(false)
    } catch (err) {
      alert('Greška pri spašavanju smjene: ' + err.message)
    }
  }

  const deleteShift = async (id) => {
    if (confirm('Obrisati smjenu?')) {
      try {
        await settingApi.deleteShift(id)
        setShiftTypes(ss => ss.filter(x => x.id !== id))
      } catch (err) {
        alert('Greška pri brisanju smjene: ' + err.message)
      }
    }
  }

  const updateGlobalSettings = async (newSettings) => {
    try {
      const res = await settingApi.update(newSettings)
      setSettings({ ...res.data, id: res.data._id })
    } catch (err) {
      alert('Greška pri ažuriranju postavki: ' + err.message)
    }
  }

  const saveHoliday = async () => {
    if (!holidayForm.name.trim() || !holidayForm.date) return
    try {
      const res = await holidayApi.create(holidayForm)
      setHolidays(hh => [...hh, { ...res.data, id: res.data._id }])
      setHolidayModal(false)
      setHolidayForm({ name: '', date: isoDate(new Date()), isRecurring: false })
    } catch (err) {
      alert('Greška pri spašavanju praznika: ' + err.message)
    }
  }

  const deleteHoliday = async (id) => {
    if (confirm('Obrisati praznik?')) {
      try {
        await holidayApi.delete(id)
        setHolidays(hh => hh.filter(h => h.id !== id))
      } catch (err) {
        alert('Greška pri brisanju praznika: ' + err.message)
      }
    }
  }

  const SettingRow = ({ label, hint, icon: Icon, children }) => (
    <div className="flex justify-between items-center py-5 border-b border-white/5 last:border-0 group">
      <div className="flex gap-4">
        {Icon && <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[--text-muted] group-hover:text-[--blue-bright] transition-colors"><Icon size={18} /></div>}
        <div>
          <div className="text-sm font-bold text-[--text-primary] tracking-tight">{label}</div>
          {hint && <div className="text-[11px] text-[--text-muted] mt-0.5 max-w-xs">{hint}</div>}
        </div>
      </div>
      <div className={`flex-shrink-0 ${!isAdmin ? 'opacity-50 pointer-events-none' : ''}`}>{children}</div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[--text-primary]">Podešavanja</h1>
        <p className="text-[--text-muted] text-sm mt-1 font-medium">Globalna konfiguracija algoritma i radnih smjena</p>
      </div>

      <Card className="p-8">
        <h3 className="text-xs font-bold text-[--cyan] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <Shield size={14} />
          Pravila raspoređivanja
        </h3>
        <div className="space-y-1">
          <SettingRow label="Minimalni odmor" hint="Minimalno vrijeme odmora između dvije smjene istog radnika." icon={Clock}>
            <div className="flex items-center gap-3 bg-[--bg-card] border border-[--border] rounded-xl p-1 pr-3">
              <input 
                type="number" value={settings.minRestHours} min={8} max={24}
                onChange={e => updateGlobalSettings({ ...settings, minRestHours: Number(e.target.value) })}
                className="w-14 bg-transparent border-none text-center text-sm font-bold text-[--text-primary] focus:ring-0" 
              />
              <span className="text-[10px] font-bold text-[--text-muted] uppercase tracking-widest">Sati</span>
            </div>
          </SettingRow>

          <SettingRow label="Maksimalni fond sati" hint="Standardni tjedni fond sati prije nego se računa prekovremeni rad." icon={TrendingUp}>
            <div className="flex items-center gap-3 bg-[--bg-card] border border-[--border] rounded-xl p-1 pr-3">
              <input 
                type="number" value={settings.maxHoursPerWeek} min={20} max={60}
                onChange={e => updateGlobalSettings({ ...settings, maxHoursPerWeek: Number(e.target.value) })}
                className="w-14 bg-transparent border-none text-center text-sm font-bold text-[--text-primary] focus:ring-0" 
              />
              <span className="text-[10px] font-bold text-[--text-muted] uppercase tracking-widest">Sati</span>
            </div>
          </SettingRow>

          <SettingRow label="Dozvoli prekovremeno" hint="Omogućava algoritmu da dodijeli dodatne sate ako nema dostupnih radnika." icon={Zap}>
            <button 
              onClick={() => updateGlobalSettings({ ...settings, allowOvertime: !settings.allowOvertime })}
              className={`w-11 h-6 rounded-full transition-all relative ${settings.allowOvertime ? 'bg-[--blue]' : 'bg-[--border-bright]'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings.allowOvertime ? 'left-6' : 'left-1'}`} />
            </button>
          </SettingRow>

          {settings.allowOvertime && (
            <SettingRow label="Limit prekovremenog" hint="Maksimalni broj prekovremenih sati koje radnik može imati." icon={Plus}>
              <div className="flex items-center gap-3 bg-[--bg-card] border border-[--border] rounded-xl p-1 pr-3">
                <input 
                  type="number" value={settings.maxOvertimeHours} min={1} max={20}
                  onChange={e => updateGlobalSettings({ ...settings, maxOvertimeHours: Number(e.target.value) })}
                  className="w-14 bg-transparent border-none text-center text-sm font-bold text-[--text-primary] focus:ring-0" 
                />
                <span className="text-[10px] font-bold text-[--text-muted] uppercase tracking-widest">Sati</span>
              </div>
            </SettingRow>
          )}

          <SettingRow label="Politika pauza" hint="Trajanje pauze i uvjet za ostvarivanje prava na pauzu." icon={Sun}>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-[--bg-card] border border-[--border] rounded-xl p-1 pr-3">
                <input 
                  type="number" value={settings.breakAfterHours} min={4} max={12}
                  onChange={e => updateGlobalSettings({ ...settings, breakAfterHours: Number(e.target.value) })}
                  className="w-12 bg-transparent border-none text-center text-sm font-bold text-[--text-primary] focus:ring-0" 
                />
                <span className="text-[10px] font-bold text-[--text-muted]">H rad →</span>
              </div>
              <div className="flex items-center gap-2 bg-[--bg-card] border border-[--border] rounded-xl p-1 pr-3">
                <input 
                  type="number" value={settings.breakDurationMinutes} min={15} max={60}
                  onChange={e => updateGlobalSettings({ ...settings, breakDurationMinutes: Number(e.target.value) })}
                  className="w-12 bg-transparent border-none text-center text-sm font-bold text-[--text-primary] focus:ring-0" 
                />
                <span className="text-[10px] font-bold text-[--text-muted]">Min</span>
              </div>
            </div>
          </SettingRow>
        </div>
      </Card>

      <Card className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xs font-bold text-[--cyan] uppercase tracking-[0.2em] flex items-center gap-2">
            <Clock size={14} />
            Tipovi smjena
          </h3>
          <Btn size="sm" onClick={openNewShift} icon={<Plus size={14} />}>Dodaj smjenu</Btn>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shiftTypes.map(s => (
            <div 
              key={s.id} 
              className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-[--blue]/30 transition-all group"
              style={{ borderLeft: `4px solid ${s.color}` }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15`, color: s.color }}>
                  <ShiftIcon shift={s} size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-[--text-primary]">{s.name}</div>
                  <div className="text-[11px] font-mono text-[--text-muted] mt-0.5">
                    {s.start} – {s.end}
                    {s.isSplit && s.start2 && ` + ${s.start2} – ${s.end2}`}
                    <span className="mx-1 opacity-20">|</span> {shiftDurationHours(s)}h
                  </div>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                {isAdmin && (
                  <>
                    <button onClick={() => openEditShift(s)} className="p-2 text-[--text-muted] hover:text-[--text-primary] transition-colors"><Edit2 size={14} /></button>
                    <button onClick={() => deleteShift(s.id)} className="p-2 text-[--text-muted] hover:text-[--rose] transition-colors"><Trash2 size={14} /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xs font-bold text-[--cyan] uppercase tracking-[0.2em] flex items-center gap-2">
            <Shield size={14} />
            Praznici
          </h3>
          {isAdmin && <Btn size="sm" onClick={() => setHolidayModal(true)} icon={<Plus size={14} />}>Dodaj praznik</Btn>}
        </div>
        
        <div className="space-y-3">
          {holidays.length === 0 && <p className="text-center py-4 text-[--text-muted] italic text-sm">Nema definisanih praznika.</p>}
          {holidays.map(h => (
            <div key={h.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 group">
              <div>
                <div className="text-sm font-bold text-[--text-primary]">{h.name}</div>
                <div className="text-[11px] text-[--text-muted] mt-0.5 flex items-center gap-2">
                  {formatDate(new Date(h.date))}
                  {h.isRecurring && <Badge color="var(--blue)">Svake godine</Badge>}
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => deleteHoliday(h.id)} className="p-2 text-[--text-muted] hover:text-[--rose] opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Modal open={shiftModal} onClose={() => setShiftModal(false)} title={editShift ? 'Uredi smjenu' : 'Nova smjena'}>
        <div className="flex flex-col gap-5">
          <Input label="Naziv smjene" value={shiftForm.name} onChange={v => setShiftForm(f => ({ ...f, name: v }))} placeholder="npr. Prva smjena, Vikend..." required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Početak" type="time" value={shiftForm.start} onChange={v => setShiftForm(f => ({ ...f, start: v }))} />
            <Input label="Kraj" type="time" value={shiftForm.end} onChange={v => setShiftForm(f => ({ ...f, end: v }))} />
          </div>

          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-[--text-primary]">Dvokratna smjena</span>
              <button 
                onClick={() => setShiftForm(f => ({ ...f, isSplit: !f.isSplit }))}
                className={`w-11 h-6 rounded-full transition-all relative ${shiftForm.isSplit ? 'bg-[--blue]' : 'bg-[--border-bright]'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${shiftForm.isSplit ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            {shiftForm.isSplit && (
              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
                <Input label="Drugi dio: Početak" type="time" value={shiftForm.start2} onChange={v => setShiftForm(f => ({ ...f, start2: v }))} />
                <Input label="Drugi dio: Kraj" type="time" value={shiftForm.end2} onChange={v => setShiftForm(f => ({ ...f, end2: v }))} />
              </div>
            )}
          </div>
          <div>
            <label className="text-[10px] font-bold text-[--text-secondary] tracking-widest uppercase mb-3 block">Boja smjene</label>
            <div className="flex flex-wrap gap-2.5">
              {CATEGORY_COLORS.map(c => (
                <button 
                  key={c} 
                  onClick={() => setShiftForm(f => ({ ...f, color: c }))}
                  className={`w-8 h-8 rounded-full transition-all border-4 ${shiftForm.color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-4">
            <Btn variant="ghost" onClick={() => setShiftModal(false)}>Odustani</Btn>
            <Btn onClick={saveShift}>{editShift ? 'Spremi izmjene' : 'Dodaj smjenu'}</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={holidayModal} onClose={() => setHolidayModal(false)} title="Novi praznik">
        <div className="flex flex-col gap-5">
          <Input label="Naziv praznika" value={holidayForm.name} onChange={v => setHolidayForm(f => ({ ...f, name: v }))} placeholder="npr. Nova godina, Prvi maj..." required />
          <Input label="Datum" type="date" value={holidayForm.date} onChange={v => setHolidayForm(f => ({ ...f, date: v }))} required />
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setHolidayForm(f => ({ ...f, isRecurring: !f.isRecurring }))}
              className={`w-11 h-6 rounded-full transition-all relative ${holidayForm.isRecurring ? 'bg-[--blue]' : 'bg-[--border-bright]'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${holidayForm.isRecurring ? 'left-6' : 'left-1'}`} />
            </button>
            <span className="text-sm text-[--text-secondary]">Ponavljaj svake godine</span>
          </div>
          <div className="flex gap-3 justify-end mt-4">
            <Btn variant="ghost" onClick={() => setHolidayModal(false)}>Odustani</Btn>
            <Btn onClick={saveHoliday}>Spremi praznik</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
