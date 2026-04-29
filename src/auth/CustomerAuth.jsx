import { useState } from 'react'
import { validateEmail } from '../utils'
import { apiFetch } from '../api'

function LoginForm({ onLogin, onSwitch, onBack, successMsg }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = {}
    if (!validateEmail(form.email)) errs.email = 'Enter a valid email address'
    if (!form.password) errs.password = 'Password is required'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const user = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(form)
      })
      
      onLogin(user)
    } catch (err) {
      setErrors({ general: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full">
      <div className="flex flex-col gap-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Welcome Back</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Sign in to your curator account</p>
        </div>

        {errors.general && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30 rounded-2xl px-5 py-4 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-3 font-bold animate-shake">
            ⚠️ {errors.general}
          </div>
        )}

        {successMsg && !errors.general && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl px-5 py-4 text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-3 font-bold leading-relaxed">
            ✓ {successMsg}
          </div>
        )}

        <div className="space-y-5">
          <div className="space-y-2">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <input 
              id="login-email" 
              className={`w-full px-6 py-4 text-sm bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl outline-none transition-all focus:ring-4 focus:ring-indigo-500/10 ${
                errors.email ? 'border-rose-400 bg-rose-50/30' : 'border-transparent focus:border-indigo-600 dark:text-white'
              }`}
              type="email" 
              placeholder="e.g. curator@semarketplace.com"
              value={form.email} 
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
            />
            {errors.email && <span className="text-[10px] text-rose-500 font-black px-1 uppercase tracking-widest">{errors.email}</span>}
          </div>

          <div className="space-y-2">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Key</label>
            <div className="relative group">
              <input 
                id="login-password" 
                className={`w-full px-6 py-4 text-sm bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl outline-none transition-all focus:ring-4 focus:ring-indigo-500/10 ${
                  errors.password ? 'border-rose-400 bg-rose-50/30' : 'border-transparent focus:border-indigo-600 dark:text-white'
                }`}
                type={showPw ? 'text' : 'password'} 
                placeholder="••••••••"
                value={form.password} 
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} 
              />
              <button 
                type="button" 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 p-2 transition-colors" 
                onClick={() => setShowPw(s => !s)}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <span className="text-[10px] text-rose-500 font-black px-1 uppercase tracking-widest">{errors.password}</span>}
          </div>
        </div>

        <button 
          id="customer-login-btn" 
          type="submit" 
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-50" 
          disabled={loading}
        >
          {loading ? '⏳ Synchronizing…' : 'Access Portal'}
        </button>

        <div className="relative py-2 flex items-center">
          <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
          <span className="flex-shrink mx-6 text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Identity Hub</span>
          <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
        </div>

        <div className="text-center text-[11px] font-bold text-slate-500">
          New to the Marketplace? <span id="go-register-link" className="text-indigo-600 font-black cursor-pointer hover:underline uppercase tracking-widest ml-1" onClick={onSwitch}>Create Account</span>
        </div>
      </div>
    </form>
  )
}

function RegisterForm({ onRegister, onSwitch }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = 'Full name must be at least 2 characters'
    if (!validateEmail(form.email)) errs.email = 'Enter a valid email address'
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const newUser = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.toLowerCase(),
          password: form.password
        })
      })
      onRegister(newUser)
    } catch (err) {
      setErrors({ general: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full">
      <div className="flex flex-col gap-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Join the Elite</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Become a member of SeMarketplace</p>
        </div>

        {errors.general && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30 rounded-2xl px-5 py-4 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-3 font-bold animate-shake">
            ⚠️ {errors.general}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
            <input 
              id="reg-name" 
              className={`w-full px-6 py-4 text-sm bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl outline-none transition-all focus:ring-4 focus:ring-indigo-500/10 ${
                errors.name ? 'border-rose-400 bg-rose-50/30' : 'border-transparent focus:border-indigo-600 dark:text-white'
              }`}
              type="text" 
              placeholder="e.g. John Doe"
              value={form.name} 
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
            />
            {errors.name && <span className="text-[10px] text-rose-500 font-black px-1 uppercase tracking-widest">{errors.name}</span>}
          </div>

          <div className="space-y-2">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Identification</label>
            <input 
              id="reg-email" 
              className={`w-full px-6 py-4 text-sm bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl outline-none transition-all focus:ring-4 focus:ring-indigo-500/10 ${
                errors.email ? 'border-rose-400 bg-rose-50/30' : 'border-transparent focus:border-indigo-600 dark:text-white'
              }`}
              type="email" 
              placeholder="curator@semarketplace.com"
              value={form.email} 
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
            />
            {errors.email && <span className="text-[10px] text-rose-500 font-black px-1 uppercase tracking-widest">{errors.email}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <input 
                id="reg-password" 
                className={`w-full px-6 py-4 text-sm bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl outline-none transition-all focus:ring-4 focus:ring-indigo-500/10 ${
                  errors.password ? 'border-rose-400 bg-rose-50/30' : 'border-transparent focus:border-indigo-600 dark:text-white'
                }`}
                type="password" 
                placeholder="••••••••"
                value={form.password} 
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} 
              />
              {errors.password && <span className="text-[10px] text-rose-500 font-black px-1 uppercase tracking-widest">{errors.password}</span>}
            </div>

            <div className="space-y-2">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm</label>
              <input 
                id="reg-confirm" 
                className={`w-full px-6 py-4 text-sm bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl outline-none transition-all focus:ring-4 focus:ring-indigo-500/10 ${
                  errors.confirm ? 'border-rose-400 bg-rose-50/30' : 'border-transparent focus:border-indigo-600 dark:text-white'
                }`}
                type="password" 
                placeholder="••••••••"
                value={form.confirm} 
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} 
              />
              {errors.confirm && <span className="text-[10px] text-rose-500 font-black px-1 uppercase tracking-widest">{errors.confirm}</span>}
            </div>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 font-medium leading-relaxed px-1">
          By continuing, you accept our <span className="text-indigo-600 font-black cursor-pointer">Protocol</span>, <span className="text-indigo-600 font-black cursor-pointer">Privacy Manifest</span> and <span className="text-indigo-600 font-black cursor-pointer">Cookie Policy</span>.
        </p>

        <button 
          id="customer-register-btn" 
          type="submit" 
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-50" 
          disabled={loading}
        >
          {loading ? '⏳ Enrollment In Progress…' : 'Finalize Account'}
        </button>

        <div className="text-center text-[11px] font-bold text-slate-500 pt-2">
          Part of the collective? <span id="go-login-link" className="text-indigo-600 font-black cursor-pointer hover:underline uppercase tracking-widest ml-1" onClick={onSwitch}>Log In</span>
        </div>
      </div>
    </form>
  )
}

export default function CustomerAuth({ onLogin, onBack }) {
  const [mode, setMode] = useState('login')
  const [successMsg, setSuccessMsg] = useState('')

  const handleLogin = user => onLogin(user)
  const handleRegister = user => {
    setSuccessMsg('Account created successfully. Please login.')
    setMode('login')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans overflow-hidden selection:bg-indigo-600 selection:text-white transition-colors duration-500">
      {/* Top Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 sticky top-0 z-[100] transition-colors">
        <div className="container mx-auto px-6 sm:px-10 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={onBack}>
            <div className="w-12 h-12 bg-indigo-600 rounded-[20px] flex items-center justify-center shadow-2xl shadow-indigo-200 dark:shadow-none group-hover:scale-110 transition-transform">
               <span className="text-2xl">📦</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Se<span className="text-indigo-600">Marketplace</span></span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1.5 ml-0.5">
                {mode === 'login' ? 'Authentication' : 'Registration'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <button className="text-slate-400 text-xs font-black uppercase tracking-widest hover:text-indigo-600 transition-colors hidden sm:block">Support</button>
            <button 
              id="header-mode-switch"
              className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-slate-200 dark:shadow-none"
              onClick={() => setMode(m => m === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? 'Join Us' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative">
        {/* Dynamic Background Elements */}
        <div className="absolute top-[10%] left-[5%] w-[40vw] h-[40vw] bg-indigo-600/5 rounded-full blur-[120px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-[5%] right-[5%] w-[30vw] h-[30vw] bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-20">
          
          {/* Content Section */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-xl animate-fade-in order-2 lg:order-1">
             <div className="hidden lg:block">
                <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-full mb-8 border border-indigo-100 dark:border-indigo-800/30">
                   <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>
                   <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Global Shopping Hub</span>
                </div>
                <h1 className="text-5xl lg:text-7xl font-black text-slate-900 dark:text-white mb-8 leading-[0.9] tracking-tighter uppercase">
                   Your Next <span className="text-indigo-600">Great Find</span> Starts Here.
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-md mb-10">
                   Access millions of premium products with exclusive daily offers and secure express delivery.
                </p>
                <div className="flex items-center gap-8">
                   <div className="flex -space-x-3">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-950 flex items-center justify-center text-xs shadow-lg">👤</div>
                      ))}
                   </div>
                   <div>
                      <div className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">5.2M+</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Active Curators</div>
                   </div>
                </div>
             </div>
          </div>

          {/* Form Card */}
          <div className="w-full max-w-lg order-1 lg:order-2 animate-scale-in">
             <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.08)] p-10 sm:p-14 border border-slate-100 dark:border-slate-800 relative z-20">
                {mode === 'login'
                  ? <LoginForm onLogin={handleLogin} onSwitch={() => setMode('register')} onBack={onBack} successMsg={successMsg} />
                  : <RegisterForm onRegister={handleRegister} onSwitch={() => setMode('login')} />
                }
             </div>
             {/* Decorative element behind card */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-gradient-to-br from-indigo-500/10 to-violet-500/10 blur-[60px] -z-10 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm py-10 text-center border-t border-slate-100 dark:border-slate-800">
        <p className="text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">
          &copy; 2026 SEMARKETPLACE • ALL RIGHTS RESERVED
        </p>
      </div>
    </div>
  )
}

