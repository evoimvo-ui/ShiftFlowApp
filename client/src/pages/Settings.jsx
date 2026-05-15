import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Edit2, Trash2, Sun, Sunset, Moon, Clock, Shield, TrendingUp, Zap, Calendar, RefreshCcw, Landmark } from 'lucide-react'
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
  const { t } = useTranslation()
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
    return <div className="p-20 text-center text-[--text-muted]">{t('common.loading')}</div>
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
      alert(t('settings.saveShiftError', { error: err.message }))
    }
  }

  const deleteShift = async (id) => {
    if (confirm(t('settings.deleteShiftConfirm'))) {
      try {
        await settingApi.deleteShift(id)
        setShiftTypes(ss => ss.filter(x => x.id !== id))
      } catch (err) {
        alert(t('settings.deleteShiftError', { error: err.message }))
      }
    }
  }

  const updateGlobalSettings = async (newSettings) => {
    // Odmah ažuriraj lokalni state za bolji UX
    setSettings(newSettings)
    try {
      const res = await settingApi.update(newSettings)
      const updated = { ...res.data, id: res.data._id }
      setSettings(updated)
    } catch (err) {
      alert(t('settings.updateError', { error: err.message }))
      // Vrati na staro ako ne uspije (refresh će svakako povući zadnje stanje)
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
      alert(t('settings.saveHolidayError', { error: err.message }))
    }
  }

  const deleteHoliday = async (id) => {
    if (confirm(t('settings.deleteHolidayConfirm'))) {
      try {
        await holidayApi.delete(id)
        setHolidays(hh => hh.filter(h => h.id !== id))
      } catch (err) {
        alert(t('settings.deleteHolidayError', { error: err.message }))
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
        <h1 className="text-3xl font-extrabold tracking-tight text-[--text-primary]">{t('settings.title')}</h1>
        <p className="text-[--text-muted] text-sm mt-1 font-medium">{t('settings.subtitle')}</p>
      </div>

      <Card className="p-8">
        <h3 className="text-xs font-bold text-[--cyan] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <Shield size={14} />
          {t('settings.schedulingRules')}
        </h3>
        <div className="space-y-1">
          <SettingRow label={t('settings.minRest')} hint={t('settings.minRestHint')} icon={Clock}>
            <div className="flex items-center gap-3 bg-[--bg-card] border border-[--border] rounded-xl p-1 pr-3">
              <input 
                type="number" value={settings.minRestHours} min={8} max={24}
                onChange={e => updateGlobalSettings({ ...settings, minRestHours: Number(e.target.value) })}
                className="w-14 bg-transparent border-none text-center text-sm font-bold text-[--text-primary] focus:ring-0" 
              />
              <span className="text-[10px] font-bold text-[--text-muted] uppercase tracking-widest">{t('settings.hours')}</span>
            </div>
          </SettingRow>

          <SettingRow label={t('settings.maxHours')} hint={t('settings.maxHoursHint')} icon={TrendingUp}>
            <div className="flex items-center gap-3 bg-[--bg-card] border border-[--border] rounded-xl p-1 pr-3">
              <input 
                type="number" value={settings.maxHoursPerWeek} min={20} max={60}
                onChange={e => updateGlobalSettings({ ...settings, maxHoursPerWeek: Number(e.target.value) })}
                className="w-14 bg-transparent border-none text-center text-sm font-bold text-[--text-primary] focus:ring-0" 
              />
              <span className="text-[10px] font-bold text-[--text-muted] uppercase tracking-widest">{t('settings.hours')}</span>
            </div>
          </SettingRow>

          <SettingRow label={t('settings.allowOvertime')} hint={t('settings.allowOvertimeHint')} icon={Zap}>
            <button 
              onClick={() => updateGlobalSettings({ ...settings, allowOvertime: !settings.allowOvertime })}
              className={`w-11 h-6 rounded-full transition-all relative ${settings.allowOvertime ? 'bg-[--blue]' : 'bg-[--border-bright]'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings.allowOvertime ? 'left-6' : 'left-1'}`} />
            </button>
          </SettingRow>

          {settings.allowOvertime && (
            <SettingRow label={t('settings.overtimeLimit')} hint={t('settings.overtimeLimitHint')} icon={Plus}>
              <div className="flex items-center gap-3 bg-[--bg-card] border border-[--border] rounded-xl p-1 pr-3">
                <input 
                  type="number" value={settings.maxOvertimeHours} min={1} max={20}
                  onChange={e => updateGlobalSettings({ ...settings, maxOvertimeHours: Number(e.target.value) })}
                  className="w-14 bg-transparent border-none text-center text-sm font-bold text-[--text-primary] focus:ring-0" 
                />
                <span className="text-[10px] font-bold text-[--text-muted] uppercase tracking-widest">{t('settings.hours')}</span>
              </div>
            </SettingRow>
          )}

          <SettingRow label={t('settings.breakPolicy')} hint={t('settings.breakPolicyHint')} icon={Sun}>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-[--bg-card] border border-[--border] rounded-xl p-1 pr-3">
                <input 
                  type="number" value={settings.breakAfterHours} min={4} max={12}
                  onChange={e => updateGlobalSettings({ ...settings, breakAfterHours: Number(e.target.value) })}
                  className="w-12 bg-transparent border-none text-center text-sm font-bold text-[--text-primary] focus:ring-0" 
                />
                <span className="text-[10px] font-bold text-[--text-muted]">{t('settings.hoursWork')}</span>
              </div>
              <div className="flex items-center gap-2 bg-[--bg-card] border border-[--border] rounded-xl p-1 pr-3">
                <input 
                  type="number" value={settings.breakDurationMinutes} min={15} max={60}
                  onChange={e => updateGlobalSettings({ ...settings, breakDurationMinutes: Number(e.target.value) })}
                  className="w-12 bg-transparent border-none text-center text-sm font-bold text-[--text-primary] focus:ring-0" 
                />
                <span className="text-[10px] font-bold text-[--text-muted]">{t('settings.minutes')}</span>
              </div>
            </div>
          </SettingRow>
        </div>
      </Card>

      <Card className="p-8">
        <h3 className="text-xs font-bold text-[--cyan] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <Calendar size={14} />
          {t('settings.rotationStrategy')}
        </h3>
        <div className="space-y-1">
          <SettingRow 
            label={t('settings.schedulingModel')} 
            hint={t('settings.schedulingModelHint')} 
            icon={RefreshCcw}
          >
            <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
              <button 
                type="button"
                onClick={() => updateGlobalSettings({ ...settings, schedulingStrategy: 'fixed' })}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${settings.schedulingStrategy !== 'accumulation' ? 'bg-blue-600 text-white shadow-lg' : 'text-[--text-muted] hover:text-white'}`}
              >
                {t('settings.fixedModel')}
              </button>
              <button 
                type="button"
                onClick={() => updateGlobalSettings({ ...settings, schedulingStrategy: 'accumulation' })}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${settings.schedulingStrategy === 'accumulation' ? 'bg-blue-600 text-white shadow-lg' : 'text-[--text-muted] hover:text-white'}`}
              >
                {t('settings.accumulationModel')}
              </button>
            </div>
          </SettingRow>

          <SettingRow 
            label={t('settings.weekendRotation')} 
            hint={t('settings.weekendRotationHint')} 
            icon={Landmark}
          >
            <button 
              type="button"
              onClick={() => updateGlobalSettings({ ...settings, weekendRotationEnabled: !settings.weekendRotationEnabled })}
              className={`w-11 h-6 rounded-full transition-all relative ${settings.weekendRotationEnabled ? 'bg-[--blue]' : 'bg-[--border-bright]'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings.weekendRotationEnabled ? 'left-6' : 'left-1'}`} />
            </button>
          </SettingRow>

          {settings.weekendRotationEnabled && (
            <SettingRow 
              label={t('settings.cycleDuration')} 
              hint={t('settings.cycleDurationHint')} 
              icon={Clock}
            >
              <div className="flex items-center gap-3 bg-[--bg-card] border border-[--border] rounded-xl p-1 pr-3">
                <input 
                  type="number" value={settings.weekendCycleWeeks} min={2} max={6}
                  onChange={e => updateGlobalSettings({ ...settings, weekendCycleWeeks: Number(e.target.value) })}
                  className="w-14 bg-transparent border-none text-center text-sm font-bold text-[--text-primary] focus:ring-0" 
                />
                <span className="text-[10px] font-bold text-[--text-muted] uppercase tracking-widest">{t('settings.weeks')}</span>
              </div>
            </SettingRow>
          )}
        </div>
      </Card>

      <Card className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xs font-bold text-[--cyan] uppercase tracking-[0.2em] flex items-center gap-2">
            <Clock size={14} />
            {t('settings.shiftTypes')}
          </h3>
          <Btn size="sm" onClick={openNewShift} icon={<Plus size={14} />}>{t('settings.addShift')}</Btn>
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
                    {s.start} {t('settings.dash')} {s.end}
                    {s.isSplit && s.start2 && ` ${t('settings.plus')} ${s.start2} {t('settings.dash')} {s.end2}`}
                    <span className="mx-1 opacity-20">{t('settings.separator')}</span> {shiftDurationHours(s)}{t('settings.hours')}
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
            {t('settings.holidays')}
          </h3>
          {isAdmin && <Btn size="sm" onClick={() => setHolidayModal(true)} icon={<Plus size={14} />}>{t('settings.addHoliday')}</Btn>}
        </div>
        
        <div className="space-y-3">
          {holidays.length === 0 && <p className="text-center py-4 text-[--text-muted] italic text-sm">{t('settings.noHolidays')}</p>}
          {holidays.map(h => (
            <div key={h.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 group">
              <div>
                <div className="text-sm font-bold text-[--text-primary]">{h.name}</div>
                <div className="text-[11px] text-[--text-muted] mt-0.5 flex items-center gap-2">
                  {formatDate(new Date(h.date))}
                  {h.isRecurring && <Badge color="var(--blue)">{t('settings.recurring')}</Badge>}
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => deleteHoliday(h.id)} className="p-2 text-[--text-muted] hover:text-[--rose] opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Modal open={shiftModal} onClose={() => setShiftModal(false)} title={editShift ? t('settings.editShift') : t('settings.newShift')}>
        <div className="flex flex-col gap-5">
          <Input label={t('settings.shiftName')} value={shiftForm.name} onChange={v => setShiftForm(f => ({ ...f, name: v }))} placeholder={t('settings.shiftNamePlaceholder')} required />
          
          <div className="pt-2">
            {shiftForm.isSplit && (
              <label className="text-[10px] font-bold text-[--blue] tracking-widest uppercase mb-2 block">{t('settings.firstPart')}</label>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Input label={shiftForm.isSplit ? t('settings.firstPartStart') : t('settings.start')} type="time" value={shiftForm.start} onChange={v => setShiftForm(f => ({ ...f, start: v }))} />
              <Input label={shiftForm.isSplit ? t('settings.firstPartEnd') : t('settings.end')} type="time" value={shiftForm.end} onChange={v => setShiftForm(f => ({ ...f, end: v }))} />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-[--text-primary]">{t('settings.splitShift')}</span>
              <button 
                onClick={() => setShiftForm(f => ({ ...f, isSplit: !f.isSplit }))}
                className={`w-11 h-6 rounded-full transition-all relative ${shiftForm.isSplit ? 'bg-[--blue]' : 'bg-[--border-bright]'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${shiftForm.isSplit ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            {shiftForm.isSplit && (
              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
                <Input label={t('settings.secondPartStart')} type="time" value={shiftForm.start2} onChange={v => setShiftForm(f => ({ ...f, start2: v }))} />
                <Input label={t('settings.secondPartEnd')} type="time" value={shiftForm.end2} onChange={v => setShiftForm(f => ({ ...f, end2: v }))} />
              </div>
            )}
          </div>
          <div>
            <label className="text-[10px] font-bold text-[--text-secondary] tracking-widest uppercase mb-3 block">{t('settings.shiftColor')}</label>
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
            <Btn variant="ghost" onClick={() => setShiftModal(false)}>{t('common.cancel')}</Btn>
            <Btn onClick={saveShift}>{editShift ? t('settings.saveChanges') : t('settings.addShift')}</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={holidayModal} onClose={() => setHolidayModal(false)} title={t('settings.newHoliday')}>
        <div className="flex flex-col gap-5">
          <Input label={t('settings.holidayName')} value={holidayForm.name} onChange={v => setHolidayForm(f => ({ ...f, name: v }))} placeholder={t('settings.holidayNamePlaceholder')} required />
          <Input label={t('settings.date')} type="date" value={holidayForm.date} onChange={v => setHolidayForm(f => ({ ...f, date: v }))} required />
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setHolidayForm(f => ({ ...f, isRecurring: !f.isRecurring }))}
              className={`w-11 h-6 rounded-full transition-all relative ${holidayForm.isRecurring ? 'bg-[--blue]' : 'bg-[--border-bright]'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${holidayForm.isRecurring ? 'left-6' : 'left-1'}`} />
            </button>
            <span className="text-sm text-[--text-secondary]">{t('settings.recurringYearly')}</span>
          </div>
          <div className="flex gap-3 justify-end mt-4">
            <Btn variant="ghost" onClick={() => setHolidayModal(false)}>{t('common.cancel')}</Btn>
            <Btn onClick={saveHoliday}>{t('settings.saveHoliday')}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
