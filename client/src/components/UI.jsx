import React from 'react'
import { X } from 'lucide-react'

export const Btn = ({ children, onClick, variant = 'primary', size = 'md', disabled, className = '', icon }) => {
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
    >
      {icon && icon}
      {children}
    </button>
  )
}

export const Input = ({ label, value, onChange, type = 'text', placeholder, required, min, max, options, hint }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-[10px] font-bold text-[--text-secondary] tracking-widest uppercase">{label}{required && <span className="text-[--rose] ml-1">*</span>}</label>}
    {type === 'select' ? (
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-[--bg-elevated] border border-[--border-bright] rounded-lg px-3 py-2 text-[--text-primary] text-sm outline-none w-full focus:border-[--blue]"
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
        className="bg-[--bg-elevated] border border-[--border-bright] rounded-lg px-3 py-2 text-[--text-primary] text-sm outline-none w-full focus:border-[--blue]"
      />
    )}
    {hint && <span className="text-[11px] color-[--text-muted]">{hint}</span>}
  </div>
)

export const Badge = ({ children, color = '#3b82f6', size = 'sm' }) => (
  <span 
    className={`${size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-[12px]'} rounded-md font-bold whitespace-nowrap tracking-wide`}
    style={{
      background: color + '22',
      color: color,
      border: `1px solid ${color}44`,
    }}
  >
    {children}
  </span>
)

export const Card = ({ children, className = '', style = {} }) => (
  <div className={`bg-[--bg-card] border border-[--border] rounded-xl p-5 ${className}`} style={style}>
    {children}
  </div>
)

export const Modal = ({ open, onClose, title, children, width = 500 }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-[--bg-elevated] border border-[--border-bright] rounded-2xl p-7 w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200" style={{ maxWidth: width }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-[--text-primary] tracking-tight">{title}</h2>
          <button onClick={onClose} className="text-[--text-muted] hover:text-[--text-primary] transition-colors"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export const StatCard = ({ label, value, sub, icon, color = '#3b82f6' }) => (
  <Card className="relative overflow-hidden group">
    <div 
      className="absolute top-0 right-0 w-20 h-20 rounded-bl-[80px] transition-opacity duration-300 opacity-50 group-hover:opacity-100" 
      style={{ background: `radial-gradient(circle at top right, ${color}33, transparent)` }} 
    />
    <div className="flex justify-between items-start relative z-10">
      <div>
        <div className="text-[10px] text-[--text-muted] font-bold tracking-widest uppercase mb-2">{label}</div>
        <div className="text-3xl font-extrabold text-[--text-primary] leading-none">{value}</div>
        {sub && <div className="text-[12px] text-[--text-secondary] mt-1.5">{sub}</div>}
      </div>
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110" 
        style={{ background: `${color}22`, border: `1px solid ${color}44`, color }}
      >
        {icon}
      </div>
    </div>
  </Card>
)
