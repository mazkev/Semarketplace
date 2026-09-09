import { useState } from 'react'
import { apiFetch } from '../api'

function LoginForm({ onLogin, onSwitch, onBack, successMsg }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.email) errs.email = 'Email is required'
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
    <form onSubmit={handleSubmit} noValidate className="w-full select-none">
      <div className="flex flex-col gap-6">
        <div>
          <div className="inline-block bg-neoYellow border-2 border-black text-black text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-neo-sm -rotate-1 mb-2">
            MEMBER PORTAL
          </div>
          <h2 className="text-3xl font-black text-black dark:text-white uppercase tracking-tight">
            SIGN IN
          </h2>
          <p className="text-xs font-bold text-zinc-500 uppercase mt-1">
            Access your curated orders and wishlist
          </p>
        </div>

        {errors.general && (
          <div className="bg-neoPink text-white border-3 border-black rounded-xl px-4 py-3 text-xs font-black shadow-neo-sm -rotate-1">
            ⚠️ {errors.general}
          </div>
        )}

        {successMsg && !errors.general && (
          <div className="bg-neoGreen text-black border-3 border-black rounded-xl px-4 py-3 text-xs font-black shadow-neo-sm rotate-1">
            ✓ {successMsg}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-white mb-1.5">
              EMAIL ADDRESS
            </label>
            <input 
              id="login-email" 
              className="neo-input"
              type="email" 
              placeholder="user@example.com"
              value={form.email} 
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
            />
            {errors.email && <span className="text-[10px] text-rose-500 font-black uppercase tracking-wider mt-1 block">{errors.email}</span>}
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-white mb-1.5">
              PASSWORD
            </label>
            <div className="relative">
              <input 
                id="login-password" 
                className="neo-input pr-12"
                type={showPw ? 'text' : 'password'} 
                placeholder="••••••••"
                value={form.password} 
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} 
              />
              <button 
                type="button" 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm p-1" 
                onClick={() => setShowPw(s => !s)}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <span className="text-[10px] text-rose-500 font-black uppercase tracking-wider mt-1 block">{errors.password}</span>}
          </div>
        </div>

        <button 
          id="customer-login-btn" 
          type="submit" 
          className="w-full py-4 bg-neoYellow hover:bg-yellow-300 text-black border-3 border-black dark:border-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-neo active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50" 
          disabled={loading}
        >
          {loading ? 'AUTHENTICATING…' : 'ENTER MARKETPLACE →'}
        </button>

        <div className="text-center text-xs font-bold text-zinc-600 dark:text-zinc-400 pt-2 border-t-2 border-dashed border-zinc-200 dark:border-zinc-800">
          New shopper?{' '}
          <span 
            id="go-register-link" 
            className="text-black dark:text-white underline font-black cursor-pointer hover:text-neoPink uppercase" 
            onClick={onSwitch}
          >
            Create an account
          </span>
        </div>
      </div>
    </form>
  )
}

function RegisterForm({ onRegister, onSwitch }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = 'Full name is required'
    if (!form.email) errs.email = 'Email is required'
    if (!form.password) errs.password = 'Password is required'
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const newUser = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          isAdmin: false
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
    <form onSubmit={handleSubmit} noValidate className="w-full select-none">
      <div className="flex flex-col gap-6">
        <div>
          <div className="inline-block bg-neoGreen border-2 border-black text-black text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-neo-sm rotate-1 mb-2">
            NEW MEMBER
          </div>
          <h2 className="text-3xl font-black text-black dark:text-white uppercase tracking-tight">
            REGISTER
          </h2>
          <p className="text-xs font-bold text-zinc-500 uppercase mt-1">
            Join the community for exclusive flash sales
          </p>
        </div>

        {errors.general && (
          <div className="bg-neoPink text-white border-3 border-black rounded-xl px-4 py-3 text-xs font-black shadow-neo-sm -rotate-1">
            ⚠️ {errors.general}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-white mb-1.5">
              FULL NAME
            </label>
            <input 
              className="neo-input"
              type="text" 
              placeholder="e.g. Kevin Pratama"
              value={form.name} 
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
            />
            {errors.name && <span className="text-[10px] text-rose-500 font-black uppercase tracking-wider mt-1 block">{errors.name}</span>}
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-white mb-1.5">
              EMAIL ADDRESS
            </label>
            <input 
              className="neo-input"
              type="email" 
              placeholder="user@example.com"
              value={form.email} 
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
            />
            {errors.email && <span className="text-[10px] text-rose-500 font-black uppercase tracking-wider mt-1 block">{errors.email}</span>}
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-white mb-1.5">
              PASSWORD
            </label>
            <input 
              className="neo-input"
              type="password" 
              placeholder="••••••••"
              value={form.password} 
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} 
            />
            {errors.password && <span className="text-[10px] text-rose-500 font-black uppercase tracking-wider mt-1 block">{errors.password}</span>}
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-white mb-1.5">
              CONFIRM PASSWORD
            </label>
            <input 
              className="neo-input"
              type="password" 
              placeholder="••••••••"
              value={form.confirm} 
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} 
            />
            {errors.confirm && <span className="text-[10px] text-rose-500 font-black uppercase tracking-wider mt-1 block">{errors.confirm}</span>}
          </div>
        </div>

        <button 
          id="customer-register-btn" 
          type="submit" 
          className="w-full py-4 bg-neoGreen hover:bg-emerald-400 text-black border-3 border-black dark:border-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-neo active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50" 
          disabled={loading}
        >
          {loading ? 'CREATING ACCOUNT…' : 'CREATE ACCOUNT →'}
        </button>

        <div className="text-center text-xs font-bold text-zinc-600 dark:text-zinc-400 pt-2 border-t-2 border-dashed border-zinc-200 dark:border-zinc-800">
          Already have an account?{' '}
          <span 
            id="go-login-link" 
            className="text-black dark:text-white underline font-black cursor-pointer hover:text-neoPink uppercase" 
            onClick={onSwitch}
          >
            Sign in
          </span>
        </div>
      </div>
    </form>
  )
}

export default function CustomerAuth({ onLogin, onBack }) {
  const [mode, setMode] = useState('login')
  const [successMsg, setSuccessMsg] = useState('')

  const handleLogin = user => onLogin(user)
  const handleRegister = () => {
    setSuccessMsg('Account created successfully! Please sign in.')
    setMode('login')
  }

  return (
    <div className="min-h-screen flex flex-col select-none">
      {/* Top Header */}
      <div className="bg-white dark:bg-zinc-900 border-b-4 border-black dark:border-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
            <div className="w-10 h-10 bg-neoPink border-2 border-black dark:border-white rounded-xl flex items-center justify-center font-black text-xl shadow-neo-sm">
              ⚡
            </div>
            <span className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">
              SE<span className="bg-neoYellow px-1.5 py-0.5 border-2 border-black ml-1 text-black">MARKET</span>
            </span>
          </div>

          <button 
            id="header-mode-switch"
            className="px-5 py-2 bg-neoYellow hover:bg-yellow-300 text-black border-2 border-black dark:border-white text-xs font-black uppercase tracking-wider rounded-xl shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            onClick={() => setMode(m => m === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'REGISTER' : 'LOGIN'}
          </button>
        </div>
      </div>

      {/* Main Body Card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border-4 border-black dark:border-white rounded-3xl p-8 sm:p-10 shadow-neo-lg">
          {mode === 'login'
            ? <LoginForm onLogin={handleLogin} onSwitch={() => setMode('register')} onBack={onBack} successMsg={successMsg} />
            : <RegisterForm onRegister={handleRegister} onSwitch={() => setMode('login')} />
          }
        </div>
      </div>
    </div>
  )
}
