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
    <header className="sticky top-0 z-[100] bg-white dark:bg-zinc-950 border-b-4 border-black dark:border-white transition-colors select-none">
      {/* Neo Marquee Ticker */}
      <div className="bg-neoYellow text-black border-b-2 border-black py-1 overflow-hidden font-black text-[11px] uppercase tracking-wider">
        <div className="animate-ticker flex gap-8">
          <span>⚡ FLASH DEALS 50% OFF TODAY</span>
          <span>✦ FREE SHIPPING ALL OVER INDONESIA</span>
          <span>⚡ NEUBRUTALISM MARKETPLACE V2</span>
          <span>✦ 100% AUTHENTIC GUARANTEE</span>
          <span>⚡ FLASH DEALS 50% OFF TODAY</span>
          <span>✦ FREE SHIPPING ALL OVER INDONESIA</span>
          <span>⚡ NEUBRUTALISM MARKETPLACE V2</span>
          <span>✦ 100% AUTHENTIC GUARANTEE</span>
        </div>
      </div>

      {/* Main Top Bar */}
      <div className="py-3 px-4 container mx-auto flex items-center gap-4">
        {/* Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer group shrink-0" 
          onClick={() => setPage('shop')}
        >
          <div className="w-11 h-11 bg-neoPink border-3 border-black dark:border-white rounded-xl flex items-center justify-center shadow-neo-sm group-hover:-rotate-3 group-hover:scale-105 transition-all">
            <span className="text-xl">⚡</span>
          </div>
          <div className="hidden sm:block leading-tight">
            <span className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">
              SE<span className="bg-neoYellow px-1.5 py-0.5 border-2 border-black dark:border-white text-black ml-1 shadow-neo-sm -rotate-1 inline-block">MARKET</span>
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl relative flex items-center">
          <input
            id="header-search-input"
            type="text"
            className="w-full bg-white dark:bg-zinc-900 border-3 border-black dark:border-white rounded-xl px-4 py-2.5 text-sm font-bold placeholder-zinc-400 text-black dark:text-white shadow-neo-sm focus:shadow-neo focus:bg-yellow-50/20 transition-all outline-none"
            placeholder="Search kicks, tech, accessories..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage('shop') }}
          />
          <button 
            id="header-search-btn" 
            className="absolute right-2 px-3 py-1 bg-neoYellow hover:bg-yellow-300 border-2 border-black dark:border-white rounded-lg font-black text-xs shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            onClick={() => setPage('shop')}
          >
            SEARCH 🔍
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 ml-auto">
          {/* Wishlist Button */}
          <button
            id="wishlist-btn"
            className={`relative flex items-center justify-center w-10 h-10 border-2 border-black dark:border-white rounded-xl shadow-neo-sm font-black transition-all ${
              page === 'wishlist' ? 'bg-neoPink text-white' : 'bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-zinc-100'
            } active:translate-x-0.5 active:translate-y-0.5 active:shadow-none`}
            onClick={() => setPage('wishlist')}
            title="Wishlist"
          >
            <span className="text-lg">❤️</span>
            {wishlistCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-neoYellow text-black border-2 border-black rounded-full text-[10px] font-black w-5 h-5 flex items-center justify-center shadow-neo-sm">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button
            id="cart-open-btn"
            className="relative flex items-center gap-1.5 px-3 h-10 bg-neoCyan text-black border-2 border-black dark:border-white rounded-xl shadow-neo-sm font-black text-xs hover:bg-cyan-300 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            onClick={onCartOpen}
          >
            <span className="text-base">🛒</span>
            <span className="hidden sm:inline">CART</span>
            {cartCount > 0 && (
              <span className="bg-neoPink text-white border-2 border-black rounded-md text-[10px] font-black px-1.5 py-0.2 shadow-neo-sm ml-0.5">
                {cartCount}
              </span>
            )}
          </button>

          {/* Dark Mode Toggle */}
          <button
            id="theme-toggle-btn"
            className="w-10 h-10 flex items-center justify-center bg-white dark:bg-zinc-900 border-2 border-black dark:border-white rounded-xl shadow-neo-sm text-base active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            onClick={() => setDarkMode(!isDark)}
            title="Toggle theme"
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              id="user-menu-btn"
              className="flex items-center gap-2 p-1 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white rounded-xl shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
              onClick={() => setDropOpen(o => !o)}
            >
              <div className="w-8 h-8 bg-neoPurple border-2 border-black dark:border-white text-white rounded-lg flex items-center justify-center font-black text-xs">
                {initials}
              </div>
              <span className="hidden md:inline font-black text-xs uppercase pr-2 text-black dark:text-white">
                {user.name.split(' ')[0]}
              </span>
            </button>

            {dropOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropOpen(false)} />
                <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-zinc-900 border-3 border-black dark:border-white rounded-2xl shadow-neo-lg z-50 overflow-hidden animate-scale-in">
                  <div className="p-4 bg-neoYellow text-black border-b-3 border-black">
                    <div className="font-black text-sm uppercase leading-tight truncate">{user.name}</div>
                    <div className="text-[10px] font-bold text-zinc-700 uppercase mt-0.5 truncate">{user.email}</div>
                  </div>
                  <div className="p-2 space-y-1">
                    <button 
                      id="view-orders-menu" 
                      className="w-full text-left flex items-center gap-2 px-3 py-2.5 text-xs font-black uppercase text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                      onClick={() => { setPage('orders'); setDropOpen(false) }}
                    >
                      📦 My Transactions
                    </button>
                    <button 
                      id="logout-customer-btn" 
                      className="w-full text-left flex items-center gap-2 px-3 py-2.5 text-xs font-black uppercase text-neoPink hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors border-t-2 border-dashed border-zinc-200 dark:border-zinc-700 pt-2"
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

      {/* Category Pills Bar */}
      <div className="border-t-2 border-black/10 dark:border-white/10 bg-zinc-50/80 dark:bg-zinc-900/50 py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            {CATEGORIES.map(cat => {
              const active = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  id={`cat-${cat.id.toLowerCase()}`}
                  className={`px-3.5 py-1.5 text-xs font-black uppercase tracking-wider whitespace-nowrap rounded-xl border-2 border-black dark:border-white transition-all ${
                    active 
                      ? 'bg-neoYellow text-black shadow-neo-sm -translate-y-0.5 font-black' 
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-yellow-50 dark:hover:bg-zinc-700'
                  }`}
                  onClick={() => { setActiveCategory(cat.id); setPage('shop') }}
                >
                  {cat.name}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </header>
  )
}
