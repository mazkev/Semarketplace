import { useState, useMemo, useEffect } from 'react'
import ProductCard from './ProductCard'
import Banner from './Banner'
import Skeleton from '../components/Skeleton'
import { CATEGORIES, formatPrice } from '../utils'

export default function Storefront({ 
  products, loading, onAddToCart, search, 
  activeCategory, setActiveCategory, onSelectProduct, 
  wishlist = [], onToggleWishlist, title: customTitle 
}) {
  const [sort, setSort] = useState('newest')
  const [timeLeft, setTimeLeft] = useState({ h: 2, m: 45, s: 12 })

  // Flash Sale Timer Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 }
        if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 }
        if (prev.h > 0) return { h: prev.h - 1, m: 59, s: 59 }
        return prev
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const filteredAndSorted = useMemo(() => {
    let result = products.filter(p => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
      const matchCat = customTitle || activeCategory === 'All' || p.category === activeCategory
      return matchSearch && matchCat
    })

    if (sort === 'price-low') result.sort((a, b) => a.price - b.price)
    if (sort === 'price-high') result.sort((a, b) => b.price - a.price)
    if (sort === 'rating') result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    
    return result
  }, [products, search, activeCategory, customTitle, sort])

  const title = customTitle || (search
    ? `SEARCH: "${search}"`
    : activeCategory !== 'All'
    ? activeCategory.toUpperCase()
    : 'EXPLORE CATALOG')

  const flashSaleProducts = products.filter(p => p.isFlashSale).slice(0, 8)

  return (
    <div className="py-8 min-h-screen select-none">
      <div className="container mx-auto px-4">
        {/* Main Banner */}
        {loading ? (
          <Skeleton type="banner" />
        ) : (
          !search && activeCategory === 'All' && !customTitle && <Banner />
        )}

        {/* Neo-Brutalist Flash Sale Box */}
        {!loading && !search && activeCategory === 'All' && !customTitle && (
          <div className="mb-12 rounded-3xl border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-neo-lg overflow-hidden">
            {/* Header Header Bar */}
            <div className="bg-neoYellow text-black border-b-4 border-black dark:border-white p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-black text-neoYellow border-3 border-black rounded-2xl flex items-center justify-center text-3xl shadow-neo-sm -rotate-3">
                  ⚡
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                      FLASH SALE DROP
                    </h2>
                    <span className="bg-neoPink text-white border-2 border-black px-2 py-0.5 text-xs font-black rounded rotate-1 shadow-neo-sm">
                      HOT
                    </span>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-800 mt-0.5">
                    LIMITED QUANTITIES • ONCE GONE, IT'S GONE
                  </p>
                </div>
              </div>

              {/* Countdown Digits */}
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-black text-white border-2 border-black rounded-xl font-black text-xl flex items-center justify-center shadow-neo-sm">
                    {String(timeLeft.h).padStart(2, '0')}
                  </div>
                  <span className="text-[9px] font-black uppercase mt-1">HRS</span>
                </div>
                <span className="font-black text-2xl mb-4">:</span>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-black text-white border-2 border-black rounded-xl font-black text-xl flex items-center justify-center shadow-neo-sm">
                    {String(timeLeft.m).padStart(2, '0')}
                  </div>
                  <span className="text-[9px] font-black uppercase mt-1">MIN</span>
                </div>
                <span className="font-black text-2xl mb-4">:</span>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-black text-white border-2 border-black rounded-xl font-black text-xl flex items-center justify-center shadow-neo-sm">
                    {String(timeLeft.s).padStart(2, '0')}
                  </div>
                  <span className="text-[9px] font-black uppercase mt-1">SEC</span>
                </div>
              </div>
            </div>

            {/* Flash Mini Catalog Row */}
            <div className="p-6 overflow-x-auto no-scrollbar bg-zinc-50 dark:bg-zinc-950">
              <div className="flex gap-5 min-w-max">
                {flashSaleProducts.map(p => (
                  <div 
                    key={p._id || p.id} 
                    className="w-40 sm:w-48 bg-white dark:bg-zinc-900 border-3 border-black dark:border-white rounded-2xl p-3 shadow-neo-sm hover:-translate-x-1 hover:-translate-y-1 hover:shadow-neo transition-all cursor-pointer group"
                    onClick={() => onSelectProduct(p)}
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-2 bg-zinc-100 dark:bg-zinc-800 border-2 border-black dark:border-white">
                      <img 
                        src={p.image} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                        alt={p.name} 
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&auto=format&fit=crop&q=80';
                        }}
                      />
                      {p.originalPrice && p.price && (
                        <div className="absolute top-2 right-2 bg-neoPink text-white text-[10px] font-black px-1.5 py-0.5 border border-black rounded shadow-neo-sm">
                          -{Math.round((1 - p.price / p.originalPrice) * 100)}%
                        </div>
                      )}
                    </div>
                    <div className="font-black text-sm text-black dark:text-white truncate uppercase">{p.name}</div>
                    <div className="font-black text-base text-black dark:text-white mt-0.5">{formatPrice(p.price)}</div>
                    
                    {/* Stock Bar */}
                    <div className="w-full h-2.5 bg-zinc-200 dark:bg-zinc-800 border border-black rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full bg-neoPink" 
                        style={{ width: `${Math.min(95, Math.max(25, (p.sold / (p.sold + (p.stock || 1))) * 100))}%` }} 
                      />
                    </div>
                    <div className="text-[9px] font-black uppercase text-zinc-500 mt-1">
                      {p.sold} BOUGHT ALREADY
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category Blocks Grid */}
        {!loading && !search && activeCategory === 'All' && !customTitle && (
          <div className="mb-12">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-3">
              {CATEGORIES.filter(c => c.id !== 'All').map((cat, idx) => {
                const colors = ['bg-neoYellow', 'bg-neoPink', 'bg-neoCyan', 'bg-neoGreen', 'bg-neoOrange', 'bg-purple-300']
                const cardColor = colors[idx % colors.length]
                return (
                  <div 
                    key={cat.id} 
                    className="flex flex-col items-center gap-2 cursor-pointer group min-w-[105px]"
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    <div className={`w-20 h-20 ${cardColor} border-3 border-black dark:border-white rounded-2xl shadow-neo-sm flex items-center justify-center text-3xl transition-all duration-200 group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:shadow-neo active:translate-x-0.5 active:translate-y-0.5 active:shadow-none`}>
                      {cat.icon}
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-black dark:text-white text-center">
                      {cat.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Section Header Bar & Sort Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 border-b-4 border-black dark:border-white pb-4" id="featured-catalog">
          <div className="flex items-center gap-3">
            <div className="w-5 h-8 bg-neoYellow border-2 border-black"></div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black dark:text-white">
                {title}
              </h2>
              <span className="text-xs font-black uppercase tracking-widest text-zinc-500">
                {filteredAndSorted.length} ITEMS READY TO ORDER
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border-3 border-black dark:border-white px-4 py-2 rounded-xl shadow-neo-sm">
            <span className="text-xs font-black uppercase tracking-wider text-black dark:text-white">SORT BY:</span>
            <select 
              value={sort} 
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent font-black text-xs uppercase outline-none cursor-pointer text-black dark:text-white"
            >
              <option value="newest" className="bg-white dark:bg-zinc-900 text-black dark:text-white">LATEST DROPS</option>
              <option value="price-low" className="bg-white dark:bg-zinc-900 text-black dark:text-white">PRICE: LOW TO HIGH</option>
              <option value="price-high" className="bg-white dark:bg-zinc-900 text-black dark:text-white">PRICE: HIGH TO LOW</option>
              <option value="rating" className="bg-white dark:bg-zinc-900 text-black dark:text-white">TOP RATED</option>
            </select>
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <Skeleton type="card" count={12} />
        ) : filteredAndSorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white dark:bg-zinc-900 border-4 border-black dark:border-white rounded-3xl shadow-neo-lg">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-black dark:text-white mb-2">
              NO MATCHING ITEMS
            </h3>
            <p className="text-sm font-bold text-zinc-500 max-w-sm">
              We couldn't find any products matching "{search}". Try searching another keyword or select All Categories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {filteredAndSorted.map((p) => (
              <ProductCard 
                key={p._id || p.id}
                product={p} 
                onAddToCart={onAddToCart} 
                onClick={() => onSelectProduct(p)} 
                wishlist={wishlist}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
