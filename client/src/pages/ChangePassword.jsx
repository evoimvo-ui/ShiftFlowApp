import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Lock, RefreshCw, CheckCircle2 } from 'lucide-react'
import { Card, Btn, Input } from '../components/UI'
import { authApi } from '../api'

export default function ChangePasswordPage({ onPasswordChanged }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (form.newPassword !== form.confirmPassword) {
      setError(t('changePassword.mismatch'))
      return
    }

    setLoading(true)
    try {
      await authApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      })
      setSuccess(true)
      setTimeout(() => {
        onPasswordChanged()
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || t('changePassword.error', { error: err.message }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-surface)] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500 mb-4 border border-blue-500/20 shadow-2xl">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">{t('changePassword.title')}</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1 font-medium text-center">
            {t('changePassword.subtitle')}
          </p>
        </div>

        <Card className="p-8 shadow-2xl border-white/5 bg-white/[0.02] backdrop-blur-xl">
          {success ? (
            <div className="flex flex-col items-center py-8 gap-4 animate-in fade-in zoom-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                <CheckCircle2 size={40} />
              </div>
              <p className="text-emerald-400 font-bold text-center">
                {t('changePassword.success')}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="space-y-4">
                <Input 
                  label={t('changePassword.currentPassword')} 
                  type="password"
                  value={form.currentPassword} 
                  onChange={v => setForm(f => ({ ...f, currentPassword: v }))} 
                  placeholder="••••••••"
                  required
                />
                <Input 
                  label={t('changePassword.newPassword')} 
                  type="password"
                  value={form.newPassword} 
                  onChange={v => setForm(f => ({ ...f, newPassword: v }))} 
                  placeholder="••••••••"
                  required
                />
                <Input 
                  label={t('changePassword.confirmNewPassword')} 
                  type="password"
                  value={form.confirmPassword} 
                  onChange={v => setForm(f => ({ ...f, confirmPassword: v }))} 
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="text-[11px] font-bold text-rose-400 bg-rose-400/10 p-3 rounded-lg border border-rose-400/20 text-center">
                  {error}
                </div>
              )}

              <Btn 
                className="w-full justify-center py-3 mt-2" 
                disabled={loading}
                icon={loading ? <RefreshCw className="animate-spin" size={16} /> : null}
              >
                {loading ? t('common.loading') : t('changePassword.submit')}
              </Btn>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
