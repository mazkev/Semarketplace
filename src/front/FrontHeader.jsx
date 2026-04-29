import { useState } from 'react'
import { CATEGORIES } from '../utils'

export default function FrontHeader({
  user, cartCount, onCartOpen, onLogout,
  search, setSearch, activeCategory, setActiveCategory,
  page, setPage, ordersCount,
  darkMode, setDarkMode, wishlistCount
}) {
  const [dropOpen, setDropOpen] = useState(false)
  const isDark = Boolean(darkMode)
  const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)


  return (
    <header className="sticky top-0 z-[100] transition-colors">
      {/* Utility Bar (Minimalist Navbar) */}
      <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 py-2 hidden sm:block">
        <div className="container mx-auto px-4 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <div className="flex gap-6">
              <a href="#" className="hover:text-indigo-600 transition-colors">About Us</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Sustainability</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Membership</a>
            </div>
            <div className="flex gap-6 items-center">
              <span className="flex items-center gap-1.5"><span className="text-indigo-500">✦</span> SeMarketplace Rewards</span>
              <div className="w-px h-3 bg-slate-200 dark:bg-slate-800"></div>
              <a href="#" className="hover:text-indigo-600 transition-colors">Help Center</a>
              <button onClick={() => setPage('orders')} className="hover:text-indigo-600 transition-colors">Track My Order</button>
              <div className="w-px h-3 bg-slate-200 dark:bg-slate-800"></div>
              <button onClick={onLogout} className="text-rose-500 hover:text-rose-600 font-black transition-colors">Sign Out</button>
            </div>
          </div>
      </div>

      {/* Main Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800">
      {/* Top bar */}
      <div className="py-4">
        <div className="container mx-auto px-4 flex items-center">
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer select-none group mr-10" 
            onClick={() => setPage('shop')}
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
               <span className="text-xl text-white">📦</span>
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white hidden sm:block">Se<span className="text-indigo-600">Marketplace</span></span>
          </div>

          {/* Search */}
          <div className="flex-1 flex max-w-xl bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden min-w-0 transition-all border-2 border-transparent focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-900 group">
            <input
              id="header-search-input"
              type="text"
              className="flex-1 px-5 py-2.5 text-sm text-slate-800 dark:text-slate-100 bg-transparent outline-none placeholder-slate-400 min-w-0"
              placeholder="Search unique treasures..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage('shop') }}
            />
            <button 
              id="header-search-btn" 
              className="px-6 text-slate-400 group-focus-within:text-indigo-600 transition-colors flex items-center justify-center shrink-0"
              onClick={() => setPage('shop')}
            >
              🔍
            </button>
          </div>

          {/* Spacer to push actions to the right */}
          <div className="flex-1"></div>

          {/* Actions */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0 ml-6">
            {/* Wishlist */}
            <button
              id="wishlist-btn"
              className={`relative flex items-center gap-2 p-2 rounded-xl text-sm font-bold transition-all ${
                page === 'wishlist' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              onClick={() => setPage('wishlist')}
            >
              <span className="text-lg">❤️</span>
              {wishlistCount > 0 && (
                <span className="absolute top-0 right-0 bg-rose-500 text-white rounded-full text-[9px] font-black px-1.5 py-0.5 border-2 border-white dark:border-slate-900">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart */}
            <button
              id="cart-open-btn"
              className="relative flex items-center gap-2 p-2 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
              onClick={onCartOpen}
            >
              <span className="text-lg">🛒</span>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-indigo-600 text-white rounded-full text-[9px] font-black px-1.5 py-0.5 border-2 border-white dark:border-slate-900">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Theme Toggle */}
            <button
              id="theme-toggle-btn"
              className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200 transition-all shadow-sm"
              onClick={() => setDarkMode(!isDark)}
            >
              {isDark ? '☀️' : '🌙'}
            </button>


            {/* User menu */}
            <div className="relative">
              <button
                id="user-menu-btn"
                className="flex items-center gap-3 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white text-sm font-bold transition-all hover:ring-2 ring-indigo-500/20"
                onClick={() => setDropOpen(o => !o)}
              >
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-lg shadow-indigo-200/50">
                  {initials}
                </div>
                <span className="hidden md:inline">{user.name.split(' ')[0]}</span>
              </button>

              {dropOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropOpen(false)} />
                  <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden z-50 animate-scale-in origin-top-right border border-slate-100 dark:border-slate-800">
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50">
                      <div className="font-black text-sm text-slate-900 dark:text-white leading-tight">{user.name}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 truncate">{user.email}</div>
                    </div>
                    <div className="p-2">
                      <button 
                        id="view-orders-menu" 
                        className="w-full text-left flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        onClick={() => { setPage('orders'); setDropOpen(false) }}
                      >
                        📦 My Transactions
                      </button>
                      <button 
                        id="logout-customer-btn" 
                        className="w-full text-left flex items-center gap-3 px-4 py-3 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-colors mt-1"
                        onClick={() => { setDropOpen(false); onLogout() }}
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Category Nav */}
      <div className="bg-white/50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                id={`cat-${cat.id.toLowerCase()}`}
                className={`px-5 py-3.5 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-4 ${
                  activeCategory === cat.id 
                    ? 'text-indigo-600 border-indigo-600' 
                    : 'text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white'
                }`}
                onClick={() => { setActiveCategory(cat.id); setPage('shop') }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}

