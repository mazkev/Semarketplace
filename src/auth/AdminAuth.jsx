import { useState } from 'react'
import { validateEmail } from '../utils'
import { apiFetch } from '../api'

function AdminLoginForm({ onLogin, onSwitch, onBack }) {
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
      const admin = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(form)
      })

      if (!admin.isAdmin) {
        throw new Error('Unauthorized Access: Admin privileges required')
      }

      onLogin(admin)
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
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">System Access</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Authorized Personnel Only</p>
        </div>

        {errors.general && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30 rounded-2xl px-5 py-4 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-3 font-bold animate-shake">
            ⚠️ {errors.general}
          </div>
        )}

        <div className="space-y-5">
          <div className="space-y-2">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Identity</label>
            <input 
              id="admin-login-email" 
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

          <div className="space-y-2">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Key</label>
            <div className="relative group">
              <input 
                id="admin-login-password" 
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
          id="admin-login-btn" 
          type="submit" 
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-50" 
          disabled={loading}
        >
          {loading ? '⏳ Verifying…' : 'Enter Dashboard'}
        </button>

        <div className="relative py-2 flex items-center">
          <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
          <span className="flex-shrink mx-6 text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Enrollment</span>
          <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
        </div>

        <div className="text-center text-[11px] font-bold text-slate-500">
          New administrator? <span id="go-admin-register-link" className="text-indigo-600 font-black cursor-pointer hover:underline uppercase tracking-widest ml-1" onClick={onSwitch}>Create Admin Account</span>
        </div>

        {onBack && (
          <div className="text-center pt-2">
            <span className="text-[9px] uppercase font-black text-slate-300 cursor-pointer hover:text-indigo-600 transition-colors tracking-tighter" onClick={onBack}>
              ← Return Home
            </span>
          </div>
        )}
      </div>
    </form>
  )
}

function AdminRegisterForm({ onRegister, onSwitch }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters'
    if (!validateEmail(form.email)) errs.email = 'Enter a valid email address'
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const newAdmin = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.toLowerCase(),
          password: form.password,
          isAdmin: true
        })
      })
      onRegister(newAdmin)
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
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Node Enrollment</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Secure Administrative Registration</p>
        </div>

        {errors.general && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30 rounded-2xl px-5 py-4 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-3 font-bold animate-shake">
            ⚠️ {errors.general}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Name</label>
              <input className={`w-full px-6 py-4 text-xs bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl outline-none transition-all ${errors.name ? 'border-rose-400' : 'border-transparent focus:border-indigo-600 dark:text-white'}`}
                placeholder="John Doe" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              {errors.name && <span className="text-[9px] text-rose-500 font-bold">{errors.name}</span>}
            </div>
             <div className="space-y-2">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Auth Email</label>
              <input className={`w-full px-6 py-4 text-xs bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl outline-none transition-all ${errors.email ? 'border-rose-400' : 'border-transparent focus:border-indigo-600 dark:text-white'}`}
                placeholder="admin@nexmart.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              {errors.email && <span className="text-[9px] text-rose-500 font-bold">{errors.email}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Master Pass</label>
              <input type="password" className={`w-full px-6 py-4 text-xs bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl outline-none transition-all ${errors.password ? 'border-rose-400' : 'border-transparent focus:border-indigo-600 dark:text-white'}`}
                placeholder="••••••••" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
              {errors.password && <span className="text-[9px] text-rose-500 font-bold">{errors.password}</span>}
            </div>
             <div className="space-y-2">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Verify</label>
              <input type="password" className={`w-full px-6 py-4 text-xs bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl outline-none transition-all ${errors.confirm ? 'border-rose-400' : 'border-transparent focus:border-indigo-600 dark:text-white'}`}
                placeholder="••••••••" value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} />
              {errors.confirm && <span className="text-[9px] text-rose-500 font-bold">{errors.confirm}</span>}
            </div>
          </div>
        </div>

        <button 
          id="admin-register-btn" 
          type="submit" 
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-50" 
          disabled={loading}
        >
          {loading ? '⏳ Validating Node…' : 'Initialize Authority'}
        </button>

        <div className="text-center text-[11px] font-bold text-slate-500">
          Enrolled already? <span id="go-admin-login-link" className="text-indigo-600 font-black cursor-pointer hover:underline uppercase tracking-widest ml-1" onClick={onSwitch}>Authorize Access</span>
        </div>
      </div>
    </form>
  )
}

export default function AdminAuth({ onLogin, onBack }) {
  const [mode, setMode] = useState('login')

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      <div className="flex-1 flex flex-col lg:flex-row shadow-2xl">
        
        {/* Left Branding Panel */}
        <div className="lg:w-1/2 p-12 lg:p-24 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-black to-[#050505] border-b lg:border-b-0 lg:border-r border-white/5 animate-fade-in relative overflow-hidden">
          {/* Animated Background Mesh */}
          <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
            <div className="absolute top-[-20%] left-[-20%] w-[120%] h-[120%] bg-indigo-600/10 rounded-full blur-[140px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-rose-500/5 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-6 cursor-pointer group" onClick={onBack}>
              <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500 border border-white/10 shadow-2xl">⚙️</div>
              <div>
                <h1 className="text-4xl font-black text-white leading-none tracking-tighter uppercase">Se<span className="text-indigo-600">Marketplace</span></h1>
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em] ml-1 mt-2 block">Control Console</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-20 lg:mt-0">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-600/10 rounded-full mb-8 border border-indigo-500/20">
               <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Enterprise Edition v2.4</span>
            </div>
            <h2 className="text-5xl sm:text-7xl font-black text-white mb-10 leading-[0.9] tracking-tighter uppercase">
               Master Your <span className="text-indigo-600">Empire</span> From One Hub.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-slate-400 text-xs font-black uppercase tracking-widest">
              <div className="flex items-center gap-4">
                <span className="w-2 h-2 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                Live Transactions
              </div>
              <div className="flex items-center gap-4">
                <span className="w-2 h-2 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                Global Logistics
              </div>
              <div className="flex items-center gap-4">
                <span className="w-2 h-2 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                Inventory Intel
              </div>
              <div className="flex items-center gap-4">
                <span className="w-2 h-2 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                Multi-Admin Mesh
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between mt-12 lg:mt-0">
             <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest shrink-0">STABLE CORE v2026.04</div>
             <div className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)] animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-white/5" />
                <div className="w-2 h-2 rounded-full bg-white/5" />
             </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="flex-1 bg-[#0F0F0F] flex items-center justify-center p-8 sm:p-24 relative animate-fade-in overflow-hidden">
          {/* Abstract background decorative element */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="w-full max-w-sm relative z-10 animate-scale-in">
             <div className="absolute top-[-100px] left-[-60px] text-white/5 text-[180px] font-black select-none pointer-events-none -z-10 tracking-tighter leading-none">OS</div>
            {mode === 'login'
              ? <AdminLoginForm onLogin={onLogin} onSwitch={() => setMode('register')} onBack={onBack} />
              : <AdminRegisterForm onRegister={onLogin} onSwitch={() => setMode('login')} />
            }
          </div>
        </div>
      </div>

      <div className="bg-black/80 py-6 text-center border-t border-white/5">
        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">
          &copy; 2026 SEMARKETPLACE • ALL RIGHTS RESERVED
        </p>
      </div>
    </div>
  )
}
