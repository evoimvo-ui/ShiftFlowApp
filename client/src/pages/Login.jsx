import React, { useState, useEffect } from 'react'
import { Lock, User as UserIcon, RefreshCw, Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Btn, Card, Input } from '../components/UI'
import LanguageSelector from '../components/LanguageSelector'
import { authApi } from '../api'

export default function LoginPage({ onLogin }) {
  const { t } = useTranslation()
  const [isLogin, setIsLogin] = useState(true)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [regType, setRegType] = useState('admin') // 'admin' ili 'worker'
  const [form, setForm] = useState({ username: '', password: '', organizationName: '', email: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    let timer
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(c => c - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [resendCooldown])

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
        const res = await authApi.register({ ...form, role: regType })
        
        if (res.data.requireVerification) {
          setIsVerifying(true)
          setSuccess(t('login.verificationSent', { email: form.email }))
        } else {
          setSuccess(regType === 'admin' 
            ? t('login.registerSuccessAdmin') 
            : t('login.registerSuccessWorker')
          )
          setIsLogin(true)
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || t('login.serverUnavailable'))
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authApi.verifyEmail({ email: form.email, code: verificationCode })
      setSuccess(t('login.verificationSuccess'))
      setIsVerifying(false)
      setIsLogin(true)
      setForm(f => ({ ...f, password: '' })) // Clear password for security
    } catch (err) {
      setError(err.response?.data?.message || t('login.verificationError'))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setLoading(true)
    setError('')
    try {
      await authApi.resendVerification({ email: form.email })
      setSuccess(t('login.resendSuccess'))
      setResendCooldown(60)
    } catch (err) {
      setError(err.response?.data?.message || t('login.resendError'))
    } finally {
      setLoading(false)
    }
  }

  const startDemo = () => {
    const demoUser = { username: 'Gost', role: 'admin', isDemo: true }
    localStorage.setItem('sf_user', JSON.stringify(demoUser))
    onLogin(demoUser)
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[var(--bg-surface)] flex items-center justify-center p-4 relative">
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500 mb-4 border border-blue-500/20 shadow-2xl">
              <Lock size={32} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">{t('login.verificationTitle')}</h1>
            <p className="text-[var(--text-muted)] text-sm mt-1 font-medium text-center px-6">
              {t('login.verificationSubtitle', { email: form.email })}
            </p>
          </div>

          <Card className="p-8 shadow-2xl border-white/5 bg-white/[0.02] backdrop-blur-xl">
            <form onSubmit={handleVerify} className="flex flex-col gap-5">
              <Input 
                label={t('login.verificationCode')} 
                value={verificationCode} 
                onChange={v => setVerificationCode(v.replace(/\D/g, '').slice(0, 6))} 
                placeholder="123456"
                className="text-center text-2xl tracking-[0.5em] font-mono"
                required
              />

              {error && <div className="text-[11px] font-bold text-rose-400 bg-rose-400/10 p-3 rounded-lg border border-rose-400/20 text-center">{error}</div>}
              {success && <div className="text-[11px] font-bold text-emerald-400 bg-emerald-400/10 p-3 rounded-lg border border-emerald-400/20 text-center">{success}</div>}

              <Btn 
                className="w-full justify-center py-3 mt-2" 
                disabled={loading || verificationCode.length !== 6}
                icon={loading ? <RefreshCw className="animate-spin" size={16} /> : null}
              >
                {loading ? t('common.loading') : t('login.verifyButton')}
              </Btn>

              <button 
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || loading}
                className={`text-xs font-medium text-center transition-colors ${resendCooldown > 0 ? 'text-[var(--text-muted)] cursor-not-allowed' : 'text-blue-400 hover:text-blue-300'}`}
              >
                {resendCooldown > 0 
                  ? t('login.resendCooldown', { seconds: resendCooldown }) 
                  : t('login.resendButton')}
              </button>

              <button 
                type="button"
                onClick={() => setIsVerifying(false)}
                className="text-xs text-[var(--text-muted)] hover:text-white transition-colors font-medium text-center"
              >
                {t('common.back')}
              </button>
            </form>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-surface)] flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full scale-110"></div>
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center border border-white/10 relative z-10 shadow-2xl">
              <img src="/SFicon-512.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">{t('login.title')}</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1 font-medium">
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
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${regType === 'admin' ? 'bg-blue-600 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}
              >
                {t('login.newCompany')}
              </button>
              <button 
                type="button"
                onClick={() => setRegType('worker')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${regType === 'worker' ? 'bg-blue-600 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}
              >
                {t('login.joinWorker')}
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="space-y-4">
              {!isLogin && (
                <>
                  <Input 
                    label={regType === 'admin' ? t('login.companyName') : t('login.companyNameWorker')} 
                    value={form.organizationName} 
                    name="organizationName"
                    id="organizationName"
                    onChange={v => setForm(f => ({ ...f, organizationName: v }))} 
                    placeholder={t('login.companyNamePlaceholder')}
                    hint={regType === 'worker' ? t('login.companyNameHint') : ""}
                  />
                  {regType === 'admin' && (
                    <Input 
                      label={t('workers.email')} 
                      value={form.email} 
                      name="email"
                      id="email"
                      type="email"
                      onChange={v => setForm(f => ({ ...f, email: v }))} 
                      placeholder={t('workers.emailPlaceholder')}
                      required
                    />
                  )}
                </>
              )}
              <Input 
                label={t('login.username')} 
                value={form.username} 
                name="username"
                id="username"
                onChange={v => setForm(f => ({ ...f, username: v }))} 
                placeholder={t('login.usernamePlaceholder')}
              />
              <Input 
                label={t('login.password')} 
                type="password" 
                name="password"
                id="password"
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
              className="text-xs text-[var(--text-muted)] hover:text-white transition-colors font-medium text-center"
            >
              {isLogin ? t('login.noAccount') : t('login.hasAccount')}
            </button>

            {/* Pricing Section */}
            <div className="text-center space-y-1 opacity-50 mt-1">
              <p className="text-[10px] text-[var(--text-muted)] font-medium">
                {t('login.pricingTrial')}
              </p>
              <p className="text-[9px] text-[var(--text-muted)] font-medium">
                {t('login.pricingPlans')}
              </p>
            </div>

            <div className="relative my-2 mt-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className="bg-[var(--bg-surface)] px-2 text-[var(--text-muted)]">{t('common.or')}</span></div>
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
        
        <p className="text-center mt-8 text-[10px] text-[var(--text-muted)] uppercase tracking-[0.2em] font-bold opacity-50">
          {t('login.copyright')}
        </p>

        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 opacity-40 hover:opacity-100 transition-opacity">
          <a href="https://ei-apps.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[9px] text-[var(--text-muted)] hover:text-white transition-colors uppercase font-bold tracking-wider">{t('login.privacyPolicy')}</a>
          <a href="https://ei-apps.com/tos" target="_blank" rel="noopener noreferrer" className="text-[9px] text-[var(--text-muted)] hover:text-white transition-colors uppercase font-bold tracking-wider">{t('login.tos')}</a>
          <a href="https://ei-apps.com/dpa" target="_blank" rel="noopener noreferrer" className="text-[9px] text-[var(--text-muted)] hover:text-white transition-colors uppercase font-bold tracking-wider">{t('login.dpa')}</a>
          <a href="https://ei-apps.com/refund-policy" target="_blank" rel="noopener noreferrer" className="text-[9px] text-[var(--text-muted)] hover:text-white transition-colors uppercase font-bold tracking-wider">{t('login.refundPolicy')}</a>
          <a href="mailto:info@ei-apps.com" className="text-[9px] text-[var(--text-muted)] hover:text-white transition-colors uppercase font-bold tracking-wider">{t('login.contact')}</a>
        </div>
      </div>
    </div>
  )
}
