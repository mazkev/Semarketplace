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
    <div className="flex bg-neoCream dark:bg-zinc-950 min-h-screen font-sans selection:bg-neoYellow selection:text-black">
      {/* Sidebar */}
      <aside className="w-72 bg-white dark:bg-zinc-900 border-r-4 border-black dark:border-white flex flex-col shrink-0 sticky top-0 h-screen z-50 shadow-neo-lg">
        <div className="p-6 border-b-4 border-black dark:border-white bg-neoYellow dark:bg-zinc-900">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-12 h-12 bg-black text-white border-2 border-black flex items-center justify-center text-2xl font-black shadow-neo-sm group-hover:rotate-6 transition-transform">⚙️</div>
            <div>
              <div className="text-xl font-black text-black dark:text-white tracking-tighter leading-none uppercase">SEMARKET</div>
              <div className="text-[10px] font-black text-black/70 dark:text-neoCyan uppercase tracking-widest mt-1">BACK OFFICE ⚡</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
          <div className="px-2 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">COMMAND DECK</div>
          {pages.map(p => (
            <button
              key={p.id}
              className={`w-full flex items-center gap-4 px-4 py-3 border-3 border-black text-xs font-black uppercase tracking-wider transition-all ${
                page === p.id 
                  ? 'bg-neoCyan text-black shadow-neo translate-x-1' 
                  : 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-neo-sm hover:translate-x-1 hover:shadow-neo hover:bg-yellow-50'
              }`}
              onClick={() => setPage(p.id)}
            >
              <span className="text-lg">
                {p.icon}
              </span>
              <span className="flex-1 text-left">{p.label}</span>
              {p.count !== undefined && (
                <span className={`px-2 py-0.5 border-2 border-black text-[10px] font-black shadow-neo-sm ${
                  page === p.id ? 'bg-neoYellow text-black' : 'bg-neoPink text-white'
                }`}>
                  {p.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-5 border-t-4 border-black dark:border-white bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-3 p-2.5 mb-4 bg-neoCream dark:bg-zinc-800 border-2 border-black shadow-neo-sm">
            <div className="w-10 h-10 bg-neoPink border-2 border-black flex items-center justify-center text-xs font-black text-white shadow-neo-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-black dark:text-white truncate uppercase tracking-tight">{admin.name}</div>
              <div className="text-[10px] text-gray-600 dark:text-gray-400 truncate font-bold">{admin.email}</div>
            </div>
          </div>
          <button 
            className="w-full py-3 bg-neoPink hover:bg-rose-500 text-white border-2 border-black text-[10px] font-black uppercase tracking-widest shadow-neo-sm hover:shadow-neo active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2" 
            onClick={onLogout}
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-20 bg-white dark:bg-zinc-900 border-b-4 border-black dark:border-white px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
             <div className="w-11 h-11 bg-neoYellow border-2 border-black flex items-center justify-center text-2xl shadow-neo-sm">
                {pages.find(p => p.id === page)?.icon}
             </div>
             <div>
                <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-tighter">
                  {pages.find(p => p.id === page)?.label}
                </h1>
                <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Admin Control System</p>
             </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="hidden md:flex items-center gap-2 bg-neoGreen/20 border-2 border-black px-3 py-1.5 shadow-neo-sm">
                <div className="w-2.5 h-2.5 bg-neoGreen border border-black animate-pulse"></div>
                <span className="text-[10px] font-black text-black dark:text-white uppercase tracking-wider">CORE ACTIVE</span>
             </div>
             <div className="hidden sm:block text-right">
                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">ADMINISTRATOR</div>
                <div className="text-xs font-black text-black dark:text-white uppercase tracking-tight mt-0.5">{admin.name}</div>
             </div>
             <button 
               onClick={onLogout}
               className="px-4 py-2 bg-white dark:bg-zinc-800 text-black dark:text-white border-2 border-black text-[10px] font-black uppercase tracking-wider shadow-neo-sm hover:bg-neoPink hover:text-white transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
             >
               Sign Out
             </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <div className="p-8 sm:p-10 max-w-[1700px] mx-auto animate-fade-in">
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


