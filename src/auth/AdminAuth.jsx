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
      <div className="flex flex-col gap-6">
        <div>
          <div className="inline-block bg-neoYellow border-2 border-black px-3 py-1 font-black text-[10px] uppercase tracking-widest shadow-neo-sm mb-3">
            RESTRICTED AREA ⚡
          </div>
          <h2 className="text-3xl font-black text-black dark:text-white uppercase tracking-tighter">System Access</h2>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Authorized Personnel Only</p>
        </div>

        {errors.general && (
          <div className="bg-neoPink border-3 border-black text-white px-5 py-3 text-xs font-black shadow-neo flex items-center gap-3">
            <span>⚠️</span>
            <span>{errors.general}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-black dark:text-white">Admin Identity</label>
            <input 
              id="admin-login-email" 
              className={`w-full px-4 py-3.5 text-sm font-bold bg-white dark:bg-zinc-900 border-3 border-black dark:border-white shadow-neo-sm outline-none transition-all focus:translate-x-0.5 focus:translate-y-0.5 focus:shadow-none ${
                errors.email ? 'border-neoPink bg-red-50 dark:bg-red-950/20' : 'text-black dark:text-white'
              }`}
              type="email" 
              placeholder="curator@semarketplace.com"
              value={form.email} 
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
            />
            {errors.email && <span className="text-[11px] text-neoPink font-black uppercase tracking-wider block mt-1">{errors.email}</span>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-black dark:text-white">Security Key</label>
            <div className="relative">
              <input 
                id="admin-login-password" 
                className={`w-full px-4 py-3.5 text-sm font-bold bg-white dark:bg-zinc-900 border-3 border-black dark:border-white shadow-neo-sm outline-none transition-all focus:translate-x-0.5 focus:translate-y-0.5 focus:shadow-none pr-12 ${
                  errors.password ? 'border-neoPink bg-red-50 dark:bg-red-950/20' : 'text-black dark:text-white'
                }`}
                type={showPw ? 'text' : 'password'} 
                placeholder="••••••••"
                value={form.password} 
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} 
              />
              <button 
                type="button" 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black dark:text-white font-bold p-1 hover:scale-110 transition-transform" 
                onClick={() => setShowPw(s => !s)}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <span className="text-[11px] text-neoPink font-black uppercase tracking-wider block mt-1">{errors.password}</span>}
          </div>
        </div>

        <button 
          id="admin-login-btn" 
          type="submit" 
          className="w-full bg-neoYellow hover:bg-yellow-300 text-black border-3 border-black py-4 font-black text-sm uppercase tracking-wider shadow-neo hover:-translate-y-0.5 hover:shadow-neo-md active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50" 
          disabled={loading}
        >
          {loading ? '⏳ Verifying…' : 'Enter Dashboard ➔'}
        </button>

        <div className="relative py-2 flex items-center">
          <div className="flex-grow border-t-2 border-black dark:border-zinc-700"></div>
          <span className="flex-shrink mx-4 text-[10px] font-black uppercase tracking-widest text-gray-500">ENROLLMENT</span>
          <div className="flex-grow border-t-2 border-black dark:border-zinc-700"></div>
        </div>

        <div className="text-center text-xs font-bold text-gray-600 dark:text-gray-300">
          New administrator? <span id="go-admin-register-link" className="text-black dark:text-white font-black underline decoration-2 cursor-pointer uppercase tracking-wider ml-1 hover:text-neoPink" onClick={onSwitch}>Create Admin Account</span>
        </div>

        {onBack && (
          <div className="text-center pt-2">
            <span className="text-xs uppercase font-black text-gray-500 dark:text-gray-400 cursor-pointer hover:text-black dark:hover:text-white transition-colors tracking-wider" onClick={onBack}>
              ← Return to Storefront
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
      <div className="flex flex-col gap-6">
        <div>
          <div className="inline-block bg-neoCyan border-2 border-black px-3 py-1 font-black text-[10px] uppercase tracking-widest shadow-neo-sm mb-3 text-black">
            PROVISIONING 🔑
          </div>
          <h2 className="text-3xl font-black text-black dark:text-white uppercase tracking-tighter">Node Enrollment</h2>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Secure Administrative Registration</p>
        </div>

        {errors.general && (
          <div className="bg-neoPink border-3 border-black text-white px-5 py-3 text-xs font-black shadow-neo flex items-center gap-3">
            <span>⚠️</span>
            <span>{errors.general}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-black dark:text-white">Legal Name</label>
              <input 
                className={`w-full px-4 py-3 text-xs font-bold bg-white dark:bg-zinc-900 border-3 border-black dark:border-white shadow-neo-sm outline-none transition-all ${errors.name ? 'border-neoPink bg-red-50' : 'text-black dark:text-white'}`}
                placeholder="John Doe" 
                value={form.name} 
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} 
              />
              {errors.name && <span className="text-[10px] text-neoPink font-black uppercase">{errors.name}</span>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-black dark:text-white">Auth Email</label>
              <input 
                className={`w-full px-4 py-3 text-xs font-bold bg-white dark:bg-zinc-900 border-3 border-black dark:border-white shadow-neo-sm outline-none transition-all ${errors.email ? 'border-neoPink bg-red-50' : 'text-black dark:text-white'}`}
                placeholder="admin@semarketplace.com" 
                value={form.email} 
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} 
              />
              {errors.email && <span className="text-[10px] text-neoPink font-black uppercase">{errors.email}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-black dark:text-white">Master Pass</label>
              <input 
                type="password" 
                className={`w-full px-4 py-3 text-xs font-bold bg-white dark:bg-zinc-900 border-3 border-black dark:border-white shadow-neo-sm outline-none transition-all ${errors.password ? 'border-neoPink bg-red-50' : 'text-black dark:text-white'}`}
                placeholder="••••••••" 
                value={form.password} 
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} 
              />
              {errors.password && <span className="text-[10px] text-neoPink font-black uppercase">{errors.password}</span>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-black dark:text-white">Verify Pass</label>
              <input 
                type="password" 
                className={`w-full px-4 py-3 text-xs font-bold bg-white dark:bg-zinc-900 border-3 border-black dark:border-white shadow-neo-sm outline-none transition-all ${errors.confirm ? 'border-neoPink bg-red-50' : 'text-black dark:text-white'}`}
                placeholder="••••••••" 
                value={form.confirm} 
                onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} 
              />
              {errors.confirm && <span className="text-[10px] text-neoPink font-black uppercase">{errors.confirm}</span>}
            </div>
          </div>
        </div>

        <button 
          id="admin-register-btn" 
          type="submit" 
          className="w-full bg-neoGreen hover:bg-emerald-400 text-black border-3 border-black py-4 font-black text-sm uppercase tracking-wider shadow-neo hover:-translate-y-0.5 hover:shadow-neo-md active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50" 
          disabled={loading}
        >
          {loading ? '⏳ Validating Node…' : 'Initialize Authority ➔'}
        </button>

        <div className="text-center text-xs font-bold text-gray-600 dark:text-gray-300">
          Enrolled already? <span id="go-admin-login-link" className="text-black dark:text-white font-black underline decoration-2 cursor-pointer uppercase tracking-wider ml-1 hover:text-neoPink" onClick={onSwitch}>Authorize Access</span>
        </div>
      </div>
    </form>
  )
}

export default function AdminAuth({ onLogin, onBack }) {
  const [mode, setMode] = useState('login')

  return (
    <div className="min-h-screen bg-neoCream dark:bg-zinc-950 flex flex-col font-sans selection:bg-neoYellow selection:text-black">
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* Left Neo Branding Panel */}
        <div className="lg:w-1/2 p-8 sm:p-14 lg:p-20 flex flex-col justify-between bg-neoDark text-white border-b-4 lg:border-b-0 lg:border-r-4 border-black relative overflow-hidden">
          {/* Subtle Grid pattern overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-4 cursor-pointer group bg-black border-3 border-white p-4 shadow-neo-lg" onClick={onBack}>
              <div className="w-12 h-12 bg-neoYellow text-black border-2 border-black flex items-center justify-center text-2xl font-black shadow-neo-sm group-hover:rotate-6 transition-transform">⚙️</div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-none tracking-tighter uppercase">SE<span className="text-neoYellow">MARKET</span></h1>
                <span className="text-[10px] font-black text-neoCyan uppercase tracking-widest mt-1 block">CONTROL DECK v2.4</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 my-12 lg:my-0">
            <div className="inline-block bg-neoPink text-white border-2 border-black px-4 py-1.5 font-black text-xs uppercase tracking-widest shadow-neo-sm mb-6 -rotate-1">
              ★ SYSTEM CONTROLLER
            </div>
            <h2 className="text-4xl sm:text-6xl font-black text-white mb-8 leading-[0.95] tracking-tighter uppercase">
              Command Your <span className="bg-neoYellow text-black px-2 inline-block -rotate-1 border-2 border-black">Empire</span> Like A Boss.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-black/60 border-2 border-white/40 p-4 shadow-neo-sm flex items-center gap-3">
                <span className="w-3 h-3 bg-neoGreen border border-black shadow-neo-sm inline-block shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider text-white">Live Transactions</span>
              </div>
              <div className="bg-black/60 border-2 border-white/40 p-4 shadow-neo-sm flex items-center gap-3">
                <span className="w-3 h-3 bg-neoCyan border border-black shadow-neo-sm inline-block shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider text-white">Stock Telemetry</span>
              </div>
              <div className="bg-black/60 border-2 border-white/40 p-4 shadow-neo-sm flex items-center gap-3">
                <span className="w-3 h-3 bg-neoYellow border border-black shadow-neo-sm inline-block shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider text-white">Dynamic Pricing</span>
              </div>
              <div className="bg-black/60 border-2 border-white/40 p-4 shadow-neo-sm flex items-center gap-3">
                <span className="w-3 h-3 bg-neoPink border border-black shadow-neo-sm inline-block shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider text-white">Instant Deployment</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between pt-6 border-t-2 border-white/20">
             <div className="text-[11px] font-black uppercase tracking-widest text-gray-400">STABLE CORE v2026.04</div>
             <div className="flex gap-2">
                <div className="w-3 h-3 border-2 border-black bg-neoGreen shadow-neo-sm" />
                <div className="w-3 h-3 border-2 border-black bg-neoYellow shadow-neo-sm" />
                <div className="w-3 h-3 border-2 border-black bg-neoPink shadow-neo-sm" />
             </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="flex-1 bg-neoCream dark:bg-zinc-900 flex items-center justify-center p-8 sm:p-16 lg:p-24 relative">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 border-4 border-black dark:border-white p-8 sm:p-10 shadow-neo-xl relative z-10">
            {mode === 'login'
              ? <AdminLoginForm onLogin={onLogin} onSwitch={() => setMode('register')} onBack={onBack} />
              : <AdminRegisterForm onRegister={onLogin} onSwitch={() => setMode('login')} />
            }
          </div>
        </div>
      </div>

      <div className="bg-black py-4 text-center border-t-4 border-black text-white">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-neoYellow">
          &copy; 2026 SEMARKETPLACE • NEURON ENGINE READY
        </p>
      </div>
    </div>
  )
}
