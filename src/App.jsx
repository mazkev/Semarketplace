import { useState, useEffect } from 'react'
import './index.css'

import { useLocalStorage } from './hooks'
import { DEFAULT_ADMINS } from './utils'

import CustomerAuth from './auth/CustomerAuth'
import AdminAuth    from './auth/AdminAuth'
import FrontApp     from './front/FrontApp'
import BackApp      from './back/BackApp'

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

export default function App() {
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
    // Ensure newPath starts with #
    const hashPath = newPath.startsWith('#') ? newPath : `#${newPath}`
    window.location.hash = hashPath
    setPath(hashPath)
  }


  // --- ADMIN ROUTE ---
  if (path.startsWith('#/backOffice')) {
    if (adminSession) {
      return (
        <BackApp 
          admin={adminSession} 
          onLogout={() => setAdminSession(null)} 
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
      )
    }
    return (
      <AdminAuth 
        onLogin={(admin) => setAdminSession(admin)} 
        onBack={() => navigate('#/')} 
      />
    )
  }

  // --- CUSTOMER ROUTE (Home, /) ---
  if (customerSession) {
    return (
      <FrontApp 
        user={customerSession} 
        onLogout={() => setCustomerSession(null)} 
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    )
  }

  return (
    <CustomerAuth 
      onLogin={(user) => setCustomerSession(user)} 
      darkMode={darkMode}
      setDarkMode={setDarkMode}
    />
  )
}

