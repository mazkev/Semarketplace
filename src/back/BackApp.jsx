import { useState, useEffect } from 'react'
import { useToast } from '../hooks'
import { apiFetch } from '../api'

import Dashboard      from './Dashboard'
import ProductManager  from './ProductManager'
import OrderManager    from './OrderManager'
import SupportManager  from './SupportManager'
import CouponManager   from './CouponManager'
import CustomerManager from './CustomerManager'
import Analytics       from './Analytics'
import Toast           from '../components/Toast'

export default function BackApp({ admin, onLogout, transactions: propTransactions, onUpdateOrderStatus }) {
  const [products, setProducts]         = useState([])
  const [page, setPage]                 = useState('dashboard')
  const [toasts, setToasts]             = useState([])
  const showToast = useToast(setToasts)

  // Sync transactions from props if provided, otherwise fetch
  const [transactions, setTransactions] = useState(propTransactions || [])
  
  useEffect(() => {
    if (propTransactions) {
      setTransactions(propTransactions)
    }
  }, [propTransactions])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodData = await apiFetch('/products')
        setProducts(prodData)
        if (!propTransactions) {
          const txnData = await apiFetch('/orders')
          setTransactions(txnData)
        }
      } catch (err) {
        showToast(err.message, 'error')
      }
    }
    fetchData()
  }, [showToast, propTransactions])

  const initials = admin.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const pages = [
    { id: 'dashboard', label: 'Overview', icon: '📊' },
    { id: 'analytics', label: 'Intelligence', icon: '📈' },
    { id: 'products',  label: 'Inventory', icon: '📦' },
    { id: 'orders',    label: 'Orders',    icon: '🧾', count: transactions.length },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'coupons',   label: 'Promotions', icon: '🎫' },
    { id: 'support',   label: 'Live Support', icon: '💬' },
  ]

  const handleUpdateProducts = async (newProducts) => {
    setProducts(newProducts)
  }

  const handleUpdateStatus = async (orderId, status) => {
    if (onUpdateOrderStatus) {
      onUpdateOrderStatus(orderId, status)
      return
    }

    try {
      // Standalone update logic
      setTransactions(prev => prev.map(t => (t._id || t.id) === orderId ? { ...t, status } : t))
      await apiFetch(`/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      })
      showToast(`Order status updated to ${status}`, 'info')
    } catch (err) {
      showToast('Failed to update status', 'error')
    }
  }

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen font-sans selection:bg-indigo-600 selection:text-white">
      {/* Sidebar */}
      <aside className="w-80 bg-slate-900 flex flex-col shrink-0 sticky top-0 h-screen z-50 shadow-[20px_0_50px_rgba(0,0,0,0.1)]">
        <div className="p-10 pb-12">
          <div className="flex items-center gap-4 cursor-pointer group">
            <div className="w-14 h-14 bg-white/5 rounded-[20px] flex items-center justify-center text-3xl group-hover:bg-indigo-600 transition-all duration-500 shadow-2xl border border-white/5">⚙️</div>
            <div>
              <div className="text-xl font-black text-white tracking-tighter leading-none uppercase">SeMarketplace</div>
              <div className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em] mt-2 opacity-80">Back Office</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-2">
          <div className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Master Control</div>
          {pages.map(p => (
            <button
              key={p.id}
              className={`w-full flex items-center gap-5 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all group ${
                page === p.id 
                  ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40 transform translate-x-2' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
              onClick={() => setPage(p.id)}
            >
              <span className={`text-xl transition-all duration-500 group-hover:scale-125 ${page === p.id ? 'opacity-100' : 'opacity-30'}`}>
                {p.icon}
              </span>
              <span className="flex-1 text-left">{p.label}</span>
              {p.count !== undefined && (
                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black ${
                  page === p.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-500'
                }`}>
                  {p.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-5 p-3 mb-8 bg-white/5 rounded-[24px] border border-white/5">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-700 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-2xl shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-white truncate leading-tight uppercase tracking-tight">{admin.name}</div>
              <div className="text-[9px] text-slate-500 truncate mt-1 font-bold">{admin.email}</div>
            </div>
          </div>
          <button 
            className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-rose-600 text-white text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group" 
            onClick={onLogout}
          >
            <span className="group-hover:animate-pulse">🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-24 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 px-10 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-5 animate-fade-in">
             <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-slate-100 dark:border-slate-800">
                {pages.find(p => p.id === page)?.icon}
             </div>
             <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                  {pages.find(p => p.id === page)?.label}
                </h1>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">SeMarketplace Suite</p>
             </div>
          </div>
          <div className="flex items-center gap-8">
             <div className="hidden md:flex flex-col text-right">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Status</span>
                <div className="flex items-center gap-2 justify-end mt-1">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                   <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Active &amp; Encrypted</span>
                </div>
             </div>
             <div className="w-px h-10 bg-slate-100 dark:bg-slate-800 mx-2"></div>
             <div className="hidden sm:block text-right mr-4">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Privileged Access</div>
                <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight mt-1">{admin.name}</div>
             </div>
             <button 
               onClick={onLogout}
               className="px-5 py-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-500 hover:text-white transition-all border border-rose-100 dark:border-rose-900/50"
             >
               Sign Out
             </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <div className="p-10 sm:p-14 max-w-[1800px] mx-auto animate-fade-in">
            {page === 'dashboard' && (
              <Dashboard
                products={products}
                transactions={transactions}
                onNavigate={setPage}
              />
            )}
            {page === 'analytics' && (
              <Analytics showToast={showToast} />
            )}
            {page === 'products' && (
              <ProductManager
                products={products}
                setProducts={handleUpdateProducts}
                showToast={showToast}
              />
            )}
            {page === 'orders' && (
              <OrderManager 
                transactions={transactions} 
                onUpdateStatus={handleUpdateStatus} 
              />
            )}
            {page === 'customers' && (
              <CustomerManager showToast={showToast} />
            )}
            {page === 'coupons' && (
              <CouponManager showToast={showToast} />
            )}
            {page === 'support' && (
              <SupportManager />
            )}
          </div>
        </main>
      </div>

      <Toast toasts={toasts} />
    </div>
  )
}


