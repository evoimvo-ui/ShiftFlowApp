import React, { useState } from 'react'
import { Zap, Lock, User as UserIcon, RefreshCw, Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Btn, Card, Input } from '../components/UI'
import LanguageSelector from '../components/LanguageSelector'
import { authApi } from '../api'

export default function LoginPage({ onLogin }) {
  const { t } = useTranslation()
  const [isLogin, setIsLogin] = useState(true)
  const [regType, setRegType] = useState('admin') // 'admin' ili 'worker'
  const [form, setForm] = useState({ username: '', password: '', organizationName: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      if (isLogin) {
        // Pokušaj prijave na pravi server
        const res = await authApi.login({ username: form.username, password: form.password })
        localStorage.setItem('sf_token', res.data.token)
        localStorage.setItem('sf_user', JSON.stringify(res.data.user))
        onLogin(res.data.user)
      } else {
        // Registracija organizacije i admina ILI radnika
        await authApi.register({ ...form, role: regType })
        setSuccess(regType === 'admin' 
          ? t('login.registerSuccessAdmin') 
          : t('login.registerSuccessWorker')
        )
        setIsLogin(true)
      }
    } catch (err) {
      setError(err.response?.data?.message || t('login.serverUnavailable'))
    } finally {
      setLoading(false)
    }
  }

  const startDemo = () => {
    const demoUser = { username: 'Gost', role: 'admin', isDemo: true }
    localStorage.setItem('sf_user', JSON.stringify(demoUser))
    onLogin(demoUser)
  }

  return (
    <div className="min-h-screen bg-[--bg-surface] flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 shadow-xl shadow-blue-500/20">
            <Zap size={32} color="white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">{t('login.title')}</h1>
          <p className="text-[--text-muted] text-sm mt-1 font-medium">
            {isLogin 
              ? t('login.subtitle') 
              : regType === 'admin' 
                ? t('login.subtitleRegisterAdmin') 
                : t('login.subtitleRegisterWorker')
            }
          </p>
        </div>

        <Card className="p-8 shadow-2xl border-white/5 bg-white/[0.02] backdrop-blur-xl">
          {!isLogin && (
            <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl border border-white/5">
              <button 
                type="button"
                onClick={() => setRegType('admin')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${regType === 'admin' ? 'bg-blue-600 text-white shadow-lg' : 'text-[--text-muted] hover:text-white'}`}
              >
                {t('login.newCompany')}
              </button>
              <button 
                type="button"
                onClick={() => setRegType('worker')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${regType === 'worker' ? 'bg-blue-600 text-white shadow-lg' : 'text-[--text-muted] hover:text-white'}`}
              >
                {t('login.joinWorker')}
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="space-y-4">
              {!isLogin && (
                <Input 
                  label={regType === 'admin' ? t('login.companyName') : t('login.companyNameWorker')} 
                  value={form.organizationName} 
                  onChange={v => setForm(f => ({ ...f, organizationName: v }))} 
                  placeholder={t('login.companyNamePlaceholder')}
                  hint={regType === 'worker' ? t('login.companyNameHint') : ""}
                />
              )}
              <Input 
                label={t('login.username')} 
                value={form.username} 
                onChange={v => setForm(f => ({ ...f, username: v }))} 
                placeholder={t('login.usernamePlaceholder')}
              />
              <Input 
                label={t('login.password')} 
                type="password" 
                value={form.password} 
                onChange={v => setForm(f => ({ ...f, password: v }))} 
                placeholder={t('login.passwordPlaceholder')}
              />
            </div>

            {error && <div className="text-[11px] font-bold text-rose-400 bg-rose-400/10 p-3 rounded-lg border border-rose-400/20 text-center">{error}</div>}
            {success && <div className="text-[11px] font-bold text-emerald-400 bg-emerald-400/10 p-3 rounded-lg border border-emerald-400/20 text-center">{success}</div>}

            <Btn 
              className="w-full justify-center py-3 mt-2" 
              disabled={loading}
              icon={loading ? <RefreshCw className="animate-spin" size={16} /> : null}
            >
              {loading ? (isLogin ? t('login.loggingIn') : t('login.registering')) : (isLogin ? t('login.loginButton') : t('login.registerButton'))}
            </Btn>

            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-[--text-muted] hover:text-white transition-colors font-medium text-center"
            >
              {isLogin ? t('login.noAccount') : t('login.hasAccount')}
            </button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className="bg-[#1e293b] px-2 text-[--text-muted]">{t('common.or')}</span></div>
            </div>

            <Btn 
              type="button"
              variant="outline"
              className="w-full justify-center border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
              onClick={startDemo}
              icon={<Play size={14} />}
            >
              {t('login.startDemo')}
            </Btn>
          </form>
        </Card>
        
        <p className="text-center mt-8 text-[10px] text-[--text-muted] uppercase tracking-[0.2em] font-bold opacity-50">
          {t('login.copyright')}
        </p>
      </div>
    </div>
  )
}
