import { useState, useEffect, lazy, Suspense } from 'react'
import './index.css'

import { useLocalStorage } from './hooks'
import { DEFAULT_ADMINS } from './utils'
import { LanguageProvider } from './i18n'

// Code-split dynamic routes for optimal initial bundle size
const CustomerAuth = lazy(() => import('./auth/CustomerAuth'))
const AdminAuth    = lazy(() => import('./auth/AdminAuth'))
const FrontApp     = lazy(() => import('./front/FrontApp'))
const BackApp      = lazy(() => import('./back/BackApp'))

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-neoCream dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="bg-neoYellow text-black border-4 border-black dark:border-white p-6 rounded-2xl shadow-neo-xl flex items-center gap-4 animate-bounce">
        <span className="text-3xl">⚡</span>
        <div>
          <div className="font-black text-sm uppercase tracking-widest">SEMARKETPLACE</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-black/80">Loading module...</div>
        </div>
      </div>
    </div>
  )
}

// Ensure the default admin always exists in localStorage
function ensureAdmins() {
  try {
    const stored = JSON.parse(localStorage.getItem('nex_admins') || 'null')
    if (!stored || stored.length === 0) {
      localStorage.setItem('nex_admins', JSON.stringify(DEFAULT_ADMINS))
    }
  } catch {}
}
ensureAdmins()

function AppContent() {
  const [path, setPath] = useState(window.location.hash || '#/')
  const [customerSession, setCustomerSession]   = useLocalStorage('nex_customer_session', null)
  const [adminSession, setAdminSession]         = useLocalStorage('nex_admin_session', null)
  const [darkMode, setDarkMode]                 = useLocalStorage('nex_dark_mode', false)

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [darkMode])

  useEffect(() => {
    const handleLocation = () => setPath(window.location.hash || '#/')
    window.addEventListener('hashchange', handleLocation)
    return () => window.removeEventListener('hashchange', handleLocation)
  }, [])

  const navigate = (newPath) => {
    const hashPath = newPath.startsWith('#') ? newPath : `#${newPath}`
    window.location.hash = hashPath
    setPath(hashPath)
  }

  // --- ADMIN ROUTE ---
  if (path.startsWith('#/backOffice')) {
    if (adminSession) {
      return (
        <Suspense fallback={<LoadingFallback />}>
          <BackApp 
            admin={adminSession} 
            onLogout={() => setAdminSession(null)} 
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />
        </Suspense>
      )
    }
    return (
      <Suspense fallback={<LoadingFallback />}>
        <AdminAuth 
          onLogin={(admin) => setAdminSession(admin)} 
          onBack={() => navigate('#/')} 
        />
      </Suspense>
    )
  }

  // --- CUSTOMER ROUTE (Home, /) ---
  if (customerSession) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <FrontApp 
          user={customerSession} 
          onLogout={() => setCustomerSession(null)} 
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <CustomerAuth 
        onLogin={(user) => setCustomerSession(user)} 
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    </Suspense>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}

