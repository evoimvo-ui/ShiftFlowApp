import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search, Edit2, Trash2, Users, UserCheck, ShieldAlert } from 'lucide-react'
import { Card, Btn, Badge, Modal, Input } from '../components/UI'
import { workerApi, authApi } from '../api'
import { isoDate } from '../utils/helpers'

export default function WorkersPage({ workers, setWorkers, categories, user }) {
  const { t } = useTranslation()
  const isAdmin = user?.role === 'admin'
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', categoryIds: [], phone: '', email: '', maxHoursPerWeek: 40 })
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')

  const openNew = () => { 
    setEditing(null); 
    setForm({ name: '', categoryIds: [], phone: '', email: '', maxHoursPerWeek: 40 }); 
    setModal(true) 
  }
  
  const openEdit = w => { 
    setEditing(w.id); 
    // Koristimo Set da izbjegnemo duplikate ID-ova pri inicijalizaciji forme
    const uniqueCatIds = [...new Set((w.categoryIds || []).map(c => String(c.id || c._id || c)))]
    setForm({ 
      name: w.name, 
      username: w.username || '',
      categoryIds: uniqueCatIds, 
      phone: w.phone || '', 
      email: w.email || '', 
      maxHoursPerWeek: w.maxHoursPerWeek || 40,
      weekendCycleStart: w.weekendCycleStart || null
    }); 
    setModal(true) 
  }

  const save = async () => {
    if (!form.name.trim() || form.categoryIds.length === 0) return
    try {
      if (editing) {
        const res = await workerApi.update(editing, form)
        const updated = { ...res.data, id: res.data._id }
        setWorkers(ws => ws.map(w => w.id === editing ? updated : w))
      } else {
        const res = await workerApi.create(form)
        const created = { ...res.data, id: res.data._id }
        setWorkers(ws => [...ws, created])
      }
      setModal(false)
    } catch (err) {
      console.error(err)
      alert(t('workers.saveError', { error: err.message }))
    }
  }

  const remove = async id => { 
    if (confirm(t('workers.deleteConfirm'))) {
      try {
        await workerApi.delete(id)
        setWorkers(ws => ws.filter(w => w.id !== id))
      } catch (err) {
        alert(t('workers.deleteError', { error: err.message }))
      }
    }
  }

  const deleteUserAccount = async (username) => {
    if (confirm(t('workers.deleteUserConfirm', { username }))) {
      try {
        await authApi.deleteUser(username)
        alert(t('workers.deleteUserSuccess'))
      } catch (err) {
        alert(t('workers.deleteUserError', { error: err.response?.data?.message || err.message }))
      }
    }
  }

  const filtered = workers.filter(w => {
    const matchSearch = w.name.toLowerCase().includes(search.toLowerCase())
    const wCats = (w.categoryIds || []).map(c => String(c.id || c._id || c))
    const matchCat = filterCat === 'all' || wCats.includes(String(filterCat))
    return matchSearch && matchCat
  })

  const toggleCategory = (catId) => {
    setForm(f => {
      const current = f.categoryIds || []
      const exists = current.some(id => String(id) === String(catId))
      if (exists) {
        return { ...f, categoryIds: current.filter(id => String(id) !== String(catId)) }
      } else {
        return { ...f, categoryIds: [...current, catId] }
      }
    })
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[--text-primary]">{t('workers.title')}</h1>
          <p className="text-[--text-muted] text-sm mt-1 font-medium">{t('workers.subtitle', { count: workers.length })}</p>
        </div>
        {isAdmin && <Btn onClick={openNew} icon={<Plus size={16} />}>{t('workers.add')}</Btn>}
      </div>

      <div className="flex gap-3 flex-wrap items-center bg-[--bg-card]/50 p-3 rounded-2xl border border-[--border]">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" />
          <input
            placeholder={t('workers.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[--bg-elevated] border border-[--border] rounded-xl pl-10 pr-4 py-2 text-sm text-[--text-primary] focus:border-[--blue] outline-none transition-all"
          />
        </div>
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="bg-[--bg-elevated] border border-[--border] rounded-xl px-4 py-2 text-sm text-[--text-primary] outline-none focus:border-[--blue]"
        >
          <option value="all">{t('workers.allCategories')}</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <Card className="p-0 overflow-hidden shadow-xl border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-[--border]">
                {[t('workers.name'), t('workers.category'), t('workers.maxHours'), t('workers.contact'), t('workers.actions')].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-[10px] font-bold text-[--text-muted] tracking-widest uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <Users size={48} />
                      <p className="text-sm font-medium">{workers.length === 0 ? t('workers.noWorkers') : t('workers.noResults')}</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((w) => {
                const uniqueIds = [...new Set((w.categoryIds || []).map(item => String(item.id || item._id || item)))]
                const wCats = uniqueIds.map(id => categories.find(c => String(c.id) === String(id))).filter(Boolean)
                const firstCat = wCats[0]
                return (
                  <tr key={w.id} className="hover:bg-blue-500/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2"
                          style={{ 
                            background: (firstCat?.color || '#3b82f6') + '22', 
                            borderColor: (firstCat?.color || '#3b82f6') + '44', 
                            color: firstCat?.color || '#3b82f6' 
                          }}
                        >
                          {w.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-sm text-[--text-primary]">{w.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {wCats.length > 0 ? wCats.map(cat => (
                          <Badge key={cat.id} color={cat.color}>{cat.name}</Badge>
                        )) : <span className="text-[--text-muted] text-xs">{t('workers.empty')}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-[--text-secondary]">
                      {w.maxHoursPerWeek}{t('workers.hours')}
                    </td>
                    <td className="px-6 py-4 text-xs text-[--text-muted] max-w-[150px] truncate">
                      {w.phone || w.email || t('workers.empty')}
                    </td>
                    <td className="px-6 py-4">
                      {isAdmin && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(w)} className="p-2 bg-[--bg-elevated] hover:bg-[--blue] hover:text-white rounded-lg text-[--text-muted] transition-all"><Edit2 size={14} /></button>
                          <button onClick={() => remove(w.id)} className="p-2 bg-[--bg-elevated] hover:bg-[--rose] hover:text-white rounded-lg text-[--text-muted] transition-all"><Trash2 size={14} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? t('workers.edit') : t('workers.new')}>
        <div className="flex flex-col gap-5">
          <Input label={t('workers.name')} value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder={t('workers.namePlaceholder')} required />
          
          <div>
            <label className="text-[10px] font-bold text-[--text-secondary] tracking-widest uppercase mb-3 block">{t('workers.selectCategories')}</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => {
                const isSelected = (form.categoryIds || []).some(id => String(id) === String(cat.id))
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                        : 'bg-white/5 border-white/10 text-[--text-muted] hover:bg-white/10'
                    }`}
                  >
                    {cat.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label={t('workers.phone')} value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder={t('workers.phonePlaceholder')} />
            <Input label={t('workers.email')} value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder={t('workers.emailPlaceholder')} />
          </div>
          <Input label={t('workers.maxHoursWeekly')} type="number" value={form.maxHoursPerWeek} onChange={v => setForm(f => ({ ...f, maxHoursPerWeek: v }))} min={1} max={60} hint={t('workers.maxHoursHint')} />
          
          <Input 
            label={t('workers.rotationStart')} 
            type="date" 
            value={form.weekendCycleStart ? isoDate(form.weekendCycleStart) : ''} 
            onChange={v => setForm(f => ({ ...f, weekendCycleStart: v }))} 
            hint={t('workers.rotationStartHint')} 
          />

          {editing && (
            <div className="mt-2 p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldAlert size={18} className="text-rose-500" />
                <div>
                  <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">{t('workers.securityZone')}</div>
                  <div className="text-xs text-[--text-muted]">{t('workers.securityZoneDescription')}</div>
                </div>
              </div>
              <Btn variant="danger" size="xs" onClick={() => deleteUserAccount(form.username || form.name)}>{t('workers.deleteAccount')}</Btn>
            </div>
          )}

          <div className="flex gap-3 justify-end mt-4">
            <Btn variant="ghost" onClick={() => setModal(false)}>{t('common.cancel')}</Btn>
            <Btn onClick={save} disabled={!form.name.trim() || (form.categoryIds || []).length === 0}>{editing ? t('workers.saveChanges') : t('workers.add')}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
