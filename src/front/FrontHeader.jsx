import { useState } from 'react'
import { CATEGORIES } from '../utils'
import { useLanguage } from '../i18n'

export default function FrontHeader({
  user, cartCount, onCartOpen, onLogout,
  search, setSearch, activeCategory, setActiveCategory,
  page, setPage, ordersCount,
  darkMode, setDarkMode, wishlistCount,
  onOpenAdmin
}) {
  const [dropOpen, setDropOpen] = useState(false)
  const isDark = Boolean(darkMode)
  const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const { lang, setLang, t } = useLanguage()

  return (
    <header className="sticky top-0 z-[100] bg-white dark:bg-zinc-950 border-b-4 border-black dark:border-white transition-colors select-none font-sans">
      {/* Neo Retro Marquee Ticker */}
      <div className="bg-neoYellow text-black border-b-3 border-black py-1.5 overflow-hidden font-black text-xs uppercase tracking-wider">
        <div className="animate-ticker flex gap-8 whitespace-nowrap">
          <span>{t('ticker1')}</span>
          <span>{t('ticker2')}</span>
          <span>{t('ticker3')}</span>
          <span>{t('ticker4')}</span>
          <span>{t('ticker1')}</span>
          <span>{t('ticker2')}</span>
          <span>{t('ticker3')}</span>
          <span>{t('ticker4')}</span>
        </div>
      </div>

      {/* Main Top Bar */}
      <div className="py-3 px-4 sm:px-6 container mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer group shrink-0" 
          onClick={() => setPage('shop')}
        >
          <div className="w-12 h-12 bg-neoPink border-3 border-black text-white flex items-center justify-center text-2xl shadow-neo group-hover:-rotate-3 group-hover:scale-105 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
            ⚡
          </div>
          <div className="leading-tight">
            <span className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-black dark:text-white">
              SE<span className="bg-neoYellow px-2 py-0.5 border-2 border-black text-black ml-1 shadow-neo-sm -rotate-1 inline-block">MARKET</span>
            </span>
            <span className="block text-[9px] font-black uppercase tracking-widest text-neoCyan bg-black px-1.5 py-0.2 mt-0.5 w-fit">
              NEO BRUTAL DECK
            </span>
          </div>
        </div>

        {/* Quick Nav Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-2">
          <button
            onClick={() => setPage('shop')}
            className={`px-3.5 py-2 border-2 border-black text-xs font-black uppercase tracking-wider transition-all shadow-neo-sm ${
              page === 'shop'
                ? 'bg-neoYellow text-black translate-x-0.5 translate-y-0.5 shadow-none'
                : 'bg-white dark:bg-zinc-800 text-black dark:text-white hover:bg-yellow-50'
            }`}
          >
            🏪 {t('store')}
          </button>
          <button
            onClick={() => setPage('orders')}
            className={`px-3.5 py-2 border-2 border-black text-xs font-black uppercase tracking-wider transition-all shadow-neo-sm ${
              page === 'orders'
                ? 'bg-neoYellow text-black translate-x-0.5 translate-y-0.5 shadow-none'
                : 'bg-white dark:bg-zinc-800 text-black dark:text-white hover:bg-yellow-50'
            }`}
          >
            🧾 {t('orders')} {ordersCount > 0 && `(${ordersCount})`}
          </button>
          <button
            onClick={() => setPage('wishlist')}
            className={`px-3.5 py-2 border-2 border-black text-xs font-black uppercase tracking-wider transition-all shadow-neo-sm ${
              page === 'wishlist'
                ? 'bg-neoYellow text-black translate-x-0.5 translate-y-0.5 shadow-none'
                : 'bg-white dark:bg-zinc-800 text-black dark:text-white hover:bg-yellow-50'
            }`}
          >
            ❤️ {t('wishlist')} {wishlistCount > 0 && `(${wishlistCount})`}
          </button>
        </nav>

        {/* Search Bar */}
        <div className="flex-1 max-w-md relative hidden md:flex items-center">
          <input
            id="header-search-input"
            type="text"
            className="w-full bg-neoCream dark:bg-zinc-900 border-3 border-black dark:border-white px-4 py-2 text-xs font-bold placeholder-gray-500 text-black dark:text-white shadow-neo-sm outline-none transition-all focus:bg-white focus:translate-x-0.5 focus:translate-y-0.5 focus:shadow-none"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage('shop') }}
          />
          <button 
            id="header-search-btn" 
            className="absolute right-1.5 px-3 py-1 bg-neoYellow hover:bg-yellow-300 text-black border-2 border-black font-black text-xs uppercase shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            onClick={() => setPage('shop')}
          >
            {t('searchBtn')}
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Language Switcher Button (ID / EN) */}
          <button
            id="lang-toggle-btn"
            className="h-11 px-3 bg-neoYellow hover:bg-yellow-300 border-3 border-black text-black font-black text-xs uppercase shadow-neo active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-1.5"
            onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
            title="Ubah Bahasa / Switch Language"
          >
            <span className="text-base">{lang === 'id' ? '🇮🇩' : '🇬🇧'}</span>
            <span className="font-black">{lang.toUpperCase()}</span>
          </button>

          {/* Wishlist Mobile */}
          <button
            id="wishlist-btn-mobile"
            className="lg:hidden relative w-10 h-10 border-2 border-black bg-white dark:bg-zinc-900 flex items-center justify-center text-lg shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            onClick={() => setPage('wishlist')}
            title="Wishlist"
          >
            ❤️
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-neoPink text-white border border-black text-[9px] font-black w-4 h-4 flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button
            id="cart-open-btn"
            className="relative flex items-center gap-2 px-3.5 h-11 bg-neoGreen text-black border-3 border-black shadow-neo font-black text-xs hover:bg-emerald-400 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
            onClick={onCartOpen}
          >
            <span className="text-lg">🛒</span>
            <span className="hidden sm:inline uppercase">{t('cart')}</span>
            {cartCount > 0 && (
              <span className="bg-black text-white border border-black text-[10px] font-black px-1.5 py-0.5 ml-0.5 shadow-neo-sm">
                {cartCount}
              </span>
            )}
          </button>

          {/* Dark Mode Toggle */}
          <button
            id="theme-toggle-btn"
            className="w-11 h-11 flex items-center justify-center bg-white dark:bg-zinc-900 border-3 border-black dark:border-white shadow-neo text-lg active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
            onClick={() => setDarkMode(!isDark)}
            title="Toggle theme"
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              id="user-menu-btn"
              className="flex items-center gap-2 p-1.5 bg-neoCyan border-3 border-black shadow-neo active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
              onClick={() => setDropOpen(o => !o)}
            >
              <div className="w-8 h-8 bg-black text-white border border-black flex items-center justify-center font-black text-xs">
                {initials}
              </div>
              <span className="hidden sm:inline font-black text-xs uppercase pr-1.5 text-black">
                {user.name.split(' ')[0]} ▾
              </span>
            </button>

            {dropOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropOpen(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-neo-xl z-50 overflow-hidden animate-scale-in">
                  <div className="p-4 bg-neoYellow text-black border-b-3 border-black">
                    <div className="inline-block bg-black text-white text-[9px] font-black px-1.5 py-0.2 mb-1">{t('member')}</div>
                    <div className="font-black text-sm uppercase leading-tight truncate">{user.name}</div>
                    <div className="text-[10px] font-bold text-black/80 truncate mt-0.5">{user.email}</div>
                  </div>
                  <div className="p-2 space-y-1.5">
                    <button 
                      id="view-orders-menu" 
                      className="w-full text-left flex items-center gap-2 px-3 py-2.5 text-xs font-black uppercase text-black dark:text-white border-2 border-black hover:bg-yellow-50 dark:hover:bg-zinc-800 shadow-neo-sm transition-all"
                      onClick={() => { setPage('orders'); setDropOpen(false) }}
                    >
                      📦 {t('orders')} ({ordersCount})
                    </button>
                    <button 
                      id="view-wishlist-menu" 
                      className="w-full text-left flex items-center gap-2 px-3 py-2.5 text-xs font-black uppercase text-black dark:text-white border-2 border-black hover:bg-yellow-50 dark:hover:bg-zinc-800 shadow-neo-sm transition-all"
                      onClick={() => { setPage('wishlist'); setDropOpen(false) }}
                    >
                      ❤️ {t('wishlist')} ({wishlistCount})
                    </button>
                    {onOpenAdmin && (
                      <button 
                        className="w-full text-left flex items-center gap-2 px-3 py-2.5 text-xs font-black uppercase text-black dark:text-white border-2 border-black bg-neoCyan/20 hover:bg-neoCyan shadow-neo-sm transition-all"
                        onClick={() => { setDropOpen(false); onOpenAdmin() }}
                      >
                        ⚙️ Back Office
                      </button>
                    )}
                    <button 
                      id="logout-customer-btn" 
                      className="w-full text-left flex items-center gap-2 px-3 py-2.5 text-xs font-black uppercase text-white bg-neoPink border-2 border-black shadow-neo-sm hover:bg-rose-500 transition-all mt-2"
                      onClick={() => { setDropOpen(false); onLogout() }}
                    >
                      🚪 {t('signOut')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative flex items-center">
          <input
            type="text"
            className="w-full bg-neoCream dark:bg-zinc-900 border-3 border-black text-xs font-bold px-3 py-2 text-black dark:text-white shadow-neo-sm outline-none"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage('shop') }}
          />
          <button 
            className="absolute right-1 px-2.5 py-1 bg-neoYellow border-2 border-black text-black text-[10px] font-black"
            onClick={() => setPage('shop')}
          >
            GO
          </button>
        </div>
      </div>

      {/* Category Navigation Bar (Neo Arcade Style) */}
      <div className="border-t-3 border-black dark:border-white bg-neoCream dark:bg-zinc-900 py-2.5 overflow-x-auto no-scrollbar">
        <div className="container mx-auto px-4 flex items-center gap-2 whitespace-nowrap">
          <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-1 shadow-neo-sm mr-1 shrink-0">
            {t('dept')}
          </span>
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                id={`cat-${cat.id.toLowerCase()}`}
                className={`px-3 py-1 text-xs font-black uppercase tracking-wider border-2 border-black shadow-neo-sm transition-all ${
                  active 
                    ? 'bg-neoYellow text-black -translate-y-0.5 shadow-neo' 
                    : 'bg-white dark:bg-zinc-800 text-black dark:text-white hover:bg-yellow-50'
                } active:translate-x-0.5 active:translate-y-0.5 active:shadow-none`}
                onClick={() => { setActiveCategory(cat.id); setPage('shop') }}
              >
                {cat.name}
              </button>
            )
          })}
        </div>
      </div>
    </header>
  )
}
