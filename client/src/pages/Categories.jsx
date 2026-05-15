import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Edit2, Trash2, Sun, Sunset, Moon } from 'lucide-react'
import { Card, Btn, Badge, Modal, Input } from '../components/UI'
import { categoryApi } from '../api'
import { CATEGORY_COLORS } from '../utils/helpers'

const ShiftIcon = ({ shift, size = 14 }) => {
  if (!shift) return null
  if (shift.icon === 'moon' || shift.id === 'night') return <Moon size={size} />
  if (shift.icon === 'sunset' || shift.id === 'afternoon') return <Sunset size={size} />
  return <Sun size={size} />
}

export default function CategoriesPage({ categories, setCategories, shiftTypes, workers, user }) {
  const { t } = useTranslation()
  const isAdmin = user?.role === 'admin'
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ 
    name: '', 
    color: CATEGORY_COLORS[0], 
    requiredPerShift: {},
    useWeekendWeights: false,
    requiredPerShiftWeekend: {},
    useHolidayWeights: false,
    requiredPerShiftHoliday: {}
  })

  if (!categories || !shiftTypes || !workers) return <div className="p-20 text-center text-[--text-muted]">{t('common.loading')}</div>

  const openNew = () => {
    const req = {}
    shiftTypes.forEach(s => req[s.id] = 1)
    setEditing(null); 
    setForm({ 
      name: '', 
      color: CATEGORY_COLORS[0], 
      requiredPerShift: req,
      useWeekendWeights: false,
      requiredPerShiftWeekend: { ...req },
      useHolidayWeights: false,
      requiredPerShiftHoliday: { ...req }
    }); 
    setModal(true)
  }
  const openEdit = c => { 
    setEditing(c.id); 
    setForm({ 
      name: c.name, 
      color: c.color, 
      requiredPerShift: { ...c.requiredPerShift },
      useWeekendWeights: c.useWeekendWeights || false,
      requiredPerShiftWeekend: { ...(c.requiredPerShiftWeekend || c.requiredPerShift) },
      useHolidayWeights: c.useHolidayWeights || false,
      requiredPerShiftHoliday: { ...(c.requiredPerShiftHoliday || c.requiredPerShift) }
    }); 
    setModal(true) 
  }

  const save = async () => {
    if (!form.name.trim()) return
    try {
      // Uvek uključi requiredPerShiftWeekend vrednosti, čak i kada useWeekendWeights nije uključen
      const formData = {
        ...form,
        requiredPerShiftWeekend: form.requiredPerShiftWeekend || {}
      }
      
      if (editing) {
        const res = await categoryApi.update(editing, formData)
        const updated = { ...res.data, id: res.data._id }
        setCategories(cs => cs.map(c => c.id === editing ? updated : c))
      } else {
        const res = await categoryApi.create(formData)
        const created = { ...res.data, id: res.data._id }
        setCategories(cs => [...cs, created])
      }
      setModal(false)
    } catch (err) {
      alert(t('categories.saveError', { error: err.message }))
    }
  }

  const remove = async id => {
    const count = workers.filter(w => (w.categoryIds || []).some(cid => String(cid.id || cid._id || cid) === String(id))).length
    if (count > 0 && !confirm(t('categories.deleteConfirm', { count }))) return
    try {
      await categoryApi.delete(id)
      setCategories(cs => cs.filter(c => c.id !== id))
    } catch (err) {
      alert(t('categories.deleteError', { error: err.message }))
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[--text-primary]">{t('categories.title')}</h1>
          <p className="text-[--text-muted] text-sm mt-1 font-medium">{t('categories.subtitle')}</p>
        </div>
        {isAdmin && <Btn onClick={openNew} icon={<Plus size={16} />}>{t('categories.new')}</Btn>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {categories.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white/5 rounded-3xl border-2 border-dashed border-[--border]">
            <p className="text-[--text-muted]">{t('categories.noCategories')}</p>
          </div>
        )}
        {categories.map(cat => {
          const catWorkers = workers.filter(w => (w.categoryIds || []).some(cid => String(cid.id || cid._id || cid) === String(cat.id)))
          return (
            <Card key={cat.id} className="relative border-l-4 group" style={{ borderLeftColor: cat.color }}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-lg" style={{ background: cat.color, boxShadow: `0 0 10px ${cat.color}66` }} />
                  <h3 className="text-lg font-bold text-[--text-primary] tracking-tight">{cat.name}</h3>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(cat)} className="p-1.5 text-[--text-muted] hover:text-[--text-primary] transition-colors"><Edit2 size={14} /></button>
                    <button onClick={() => remove(cat.id)} className="p-1.5 text-[--text-muted] hover:text-[--rose] transition-colors"><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
              
              <div className="text-xs font-semibold text-[--text-muted] mb-5 uppercase tracking-widest flex items-center gap-2">
                {t('categories.activeWorkers', { count: catWorkers.length })}
                {cat.useWeekendWeights && <Badge color="#f59e0b">{t('categories.weekendMode')}</Badge>}
                {cat.useHolidayWeights && <Badge color="#ef4444">{t('categories.holidayMode')}</Badge>}
              </div>
              
              <div className="space-y-2">
                {shiftTypes.map(s => (
                  <div key={s.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <ShiftIcon shift={s} size={14} className="text-[--text-muted]" />
                      <span className="text-sm font-medium text-[--text-secondary]">{s.name}</span>
                    </div>
                    <Badge color={s.color}>{t('categories.workersNeeded', { count: (cat.requiredPerShift || {})[s.id] || 0 })}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )
        })}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? t('categories.edit') : t('categories.new')}>
        <div className="flex flex-col gap-6">
          <Input label={t('categories.name')} value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder={t('categories.namePlaceholder')} required />
          
          <div>
            <label className="text-[10px] font-bold text-[--text-secondary] tracking-widest uppercase mb-3 block">{t('categories.color')}</label>
            <div className="flex flex-wrap gap-2.5">
              {CATEGORY_COLORS.map(c => (
                <button 
                  key={c} 
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-8 h-8 rounded-full transition-all border-4 ${form.color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="text-[10px] font-bold text-[--text-secondary] tracking-widest uppercase block">{t('categories.workersPerShift')}</label>
              <button 
                onClick={() => setForm(f => ({ ...f, useWeekendWeights: !f.useWeekendWeights }))}
                className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold transition-all ${form.useWeekendWeights ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-white/5 border-white/10 text-[--text-muted]'}`}
              >
                {form.useWeekendWeights ? t('categories.weekendModeActive') : t('categories.activateWeekendMode')}
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2.5">
                {form.useWeekendWeights && <div className="text-[9px] font-black uppercase tracking-widest text-[--text-muted] mb-1">{t('categories.standardDays')}</div>}
                {shiftTypes.map(s => (
                  <div key={s.id} className="flex justify-between items-center p-3.5 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <ShiftIcon shift={s} size={16} />
                      <div>
                        <div className="text-sm font-bold text-[--text-primary]">{s.name}</div>
                        <div className="text-[10px] font-mono text-[--text-muted] uppercase tracking-tight">{s.start} {t('categories.dash')} {s.end}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setForm(f => ({ ...f, requiredPerShift: { ...f.requiredPerShift, [s.id]: Math.max(0, (f.requiredPerShift[s.id] || 0) - 1) } }))}
                        className="w-8 h-8 rounded-lg bg-[--bg-card] border border-[--border] flex items-center justify-center text-lg hover:bg-white/5 transition-colors"
                      >{t('categories.minus')}</button>
                      <span className="font-mono text-base font-bold w-6 text-center">{(form.requiredPerShift || {})[s.id] || 0}</span>
                      <button 
                        onClick={() => setForm(f => ({ ...f, requiredPerShift: { ...f.requiredPerShift, [s.id]: (f.requiredPerShift[s.id] || 0) + 1 } }))}
                        className="w-8 h-8 rounded-lg bg-[--bg-card] border border-[--border] flex items-center justify-center text-lg hover:bg-white/5 transition-colors"
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>

              {form.useWeekendWeights && (
                <div className="space-y-2.5 pt-4 border-t border-white/5">
                  <div className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-1">{t('categories.weekend')}</div>
                  {shiftTypes.map(s => (
                    <div key={s.id} className="flex justify-between items-center p-3.5 bg-amber-500/5 rounded-xl border border-amber-500/10">
                      <div className="flex items-center gap-3">
                        <ShiftIcon shift={s} size={16} className="text-amber-400" />
                        <div>
                          <div className="text-sm font-bold text-amber-200">{s.name}</div>
                          <div className="text-[10px] font-mono text-amber-500/60 uppercase tracking-tight">{s.start} – {s.end}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setForm(f => ({ ...f, requiredPerShiftWeekend: { ...f.requiredPerShiftWeekend, [s.id]: Math.max(0, (f.requiredPerShiftWeekend[s.id] || 0) - 1) } }))}
                          className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-lg hover:bg-amber-500/20 transition-colors"
                        >{t('categories.minus')}</button>
                        <span className="font-mono text-base font-bold w-6 text-center text-amber-200">{(form.requiredPerShiftWeekend || {})[s.id] || 0}</span>
                        <button 
                          onClick={() => setForm(f => ({ ...f, requiredPerShiftWeekend: { ...f.requiredPerShiftWeekend, [s.id]: (f.requiredPerShiftWeekend[s.id] || 0) + 1 } }))}
                          className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-lg hover:bg-amber-500/20 transition-colors"
                        >{t('categories.plus')}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-[9px] font-black uppercase tracking-widest text-rose-500">{t('categories.holidayMode')}</div>
                  <button 
                    onClick={() => setForm(f => ({ ...f, useHolidayWeights: !f.useHolidayWeights }))}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold transition-all ${form.useHolidayWeights ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-white/5 border-white/10 text-[--text-muted]'}`}
                  >
                    {form.useHolidayWeights ? t('categories.holidayModeActive') : t('categories.activateHolidayMode')}
                  </button>
                </div>

                {form.useHolidayWeights && (
                  <div className="space-y-2.5">
                    {shiftTypes.map(s => (
                      <div key={s.id} className="flex justify-between items-center p-3.5 bg-rose-500/5 rounded-xl border border-rose-500/10">
                        <div className="flex items-center gap-3">
                          <ShiftIcon shift={s} size={16} className="text-rose-400" />
                          <div>
                            <div className="text-sm font-bold text-rose-200">{s.name}</div>
                            <div className="text-[10px] font-mono text-rose-500/60 uppercase tracking-tight">{s.start} – {s.end}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => setForm(f => ({ ...f, requiredPerShiftHoliday: { ...f.requiredPerShiftHoliday, [s.id]: Math.max(0, (f.requiredPerShiftHoliday[s.id] || 0) - 1) } }))}
                            className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-lg hover:bg-rose-500/20 transition-colors"
                          >{t('categories.minus')}</button>
                          <span className="font-mono text-base font-bold w-6 text-center text-rose-200">{(form.requiredPerShiftHoliday || {})[s.id] || 0}</span>
                          <button 
                            onClick={() => setForm(f => ({ ...f, requiredPerShiftHoliday: { ...f.requiredPerShiftHoliday, [s.id]: (f.requiredPerShiftHoliday[s.id] || 0) + 1 } }))}
                            className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-lg hover:bg-rose-500/20 transition-colors"
                          >{t('categories.plus')}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <Btn variant="ghost" onClick={() => setModal(false)}>{t('common.cancel')}</Btn>
            <Btn onClick={save} disabled={!form.name.trim()}>{editing ? t('categories.saveChanges') : t('categories.add')}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
