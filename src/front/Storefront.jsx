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
    ? `Results for "${search}"`
    : activeCategory !== 'All'
    ? activeCategory
    : 'All Products')

  // Identify flash sale products explicitly flagged in back office
  const flashSaleProducts = products.filter(p => p.isFlashSale).slice(0, 8)

  return (
    <div className="py-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="container mx-auto px-4">
        {/* Main Banner Carousel */}
        {loading ? (
          <Skeleton type="banner" />
        ) : (
          !search && activeCategory === 'All' && !customTitle && <Banner />
        )}

        {/* Flash Sale Banner (SeMarketplace Style) */}
        {!loading && !search && activeCategory === 'All' && !customTitle && (
          <div className="mb-10 rounded-[32px] overflow-hidden bg-white dark:bg-slate-900 shadow-2xl shadow-indigo-500/10 border border-slate-100 dark:border-slate-800">
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-800 px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center text-4xl shadow-2xl">⚡</div>
                <div>
                   <h2 className="text-white text-2xl font-black tracking-tighter">SeMarketplace <span className="text-rose-400">Flash</span></h2>
                   <p className="text-indigo-100/60 text-[10px] font-black uppercase tracking-[0.3em]">Daily Limited Offers</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                   <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-white text-indigo-900 rounded-2xl flex items-center justify-center font-black text-xl shadow-xl">
                        {String(timeLeft.h).padStart(2, '0')}
                      </div>
                      <span className="text-[8px] font-black text-white/40 uppercase mt-1">Hrs</span>
                   </div>
                   <span className="text-white font-black text-xl mb-5">:</span>
                   <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-white text-indigo-900 rounded-2xl flex items-center justify-center font-black text-xl shadow-xl">
                        {String(timeLeft.m).padStart(2, '0')}
                      </div>
                      <span className="text-[8px] font-black text-white/40 uppercase mt-1">Min</span>
                   </div>
                   <span className="text-white font-black text-xl mb-5">:</span>
                   <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-white text-indigo-900 rounded-2xl flex items-center justify-center font-black text-xl shadow-xl">
                        {String(timeLeft.s).padStart(2, '0')}
                      </div>
                      <span className="text-[8px] font-black text-white/40 uppercase mt-1">Sec</span>
                   </div>
                </div>
                <button className="bg-white text-indigo-600 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-2xl hover:shadow-indigo-500/40">
                  Explore Now
                </button>
              </div>
            </div>

            {/* Flash Sale Mini Grid */}
            <div className="p-6 bg-white dark:bg-transparent overflow-x-auto no-scrollbar">
               <div className="flex gap-6 min-w-max">
                  {flashSaleProducts.map(p => (
                    <div 
                      key={p._id || p.id} 
                      className="w-36 sm:w-44 cursor-pointer group"
                      onClick={() => onSelectProduct(p)}
                    >
                       <div className="relative aspect-[4/5] rounded-[20px] overflow-hidden mb-3 bg-slate-50 dark:bg-slate-800">
                          <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.name} />
                          {p.originalPrice && p.price && (
                            <div className="absolute top-3 right-3 bg-rose-500 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-lg">
                              -{Math.round((1 - p.price / p.originalPrice) * 100)}%
                            </div>
                          )}
                       </div>
                       <div className="text-indigo-600 font-black text-base">{formatPrice(p.price)}</div>
                       <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${p.sold > 50 ? 'bg-rose-500' : 'bg-indigo-600'}`} 
                            style={{ width: `${Math.min(95, Math.max(20, (p.sold / (p.sold + (p.stock || 1))) * 100))}%` }} 
                          />
                       </div>
                       <div className="flex justify-between items-center mt-1.5">
                          <div className={`text-[8px] font-black uppercase tracking-widest ${p.sold > 50 ? 'text-rose-500' : 'text-slate-400'}`}>
                            {p.sold > 50 ? '🔥 Almost Sold Out' : `${p.sold} Reserved`}
                          </div>
                          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${p.sold > 50 ? 'bg-rose-500' : 'bg-indigo-400'}`}></div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {/* Categories Circle Grid */}
        {!loading && !search && activeCategory === 'All' && !customTitle && (
          <div className="mb-12">
            <div className="flex items-center gap-6 sm:gap-10 overflow-x-auto no-scrollbar scroll-smooth pb-4">
              {CATEGORIES.filter(c => c.id !== 'All').map(cat => (
                <div 
                  key={cat.id} 
                  className="flex flex-col items-center gap-4 cursor-pointer group min-w-[80px]"
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-slate-900 rounded-[28px] shadow-xl shadow-slate-200/50 dark:shadow-black/20 flex items-center justify-center text-3xl transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white border border-slate-50 dark:border-slate-800">
                    {cat.icon}
                  </div>
                  <div className="text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 uppercase tracking-widest text-center transition-colors">
                    {cat.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
             <div className="w-2 h-10 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200"></div>
             <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{title}</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{filteredAndSorted.length} Pieces Available</p>
             </div>
          </div>
          <div className="flex items-center gap-6 bg-white dark:bg-slate-900 p-2 px-6 rounded-[20px] shadow-xl shadow-slate-200/40 dark:shadow-black/20 border border-slate-50 dark:border-slate-800">
            <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>Sort:</span>
              <select 
                value={sort} 
                onChange={(e) => setSort(e.target.value)}
                className="bg-transparent font-black text-indigo-600 outline-none cursor-pointer"
              >
                <option value="newest">Latest Arrivals</option>
                <option value="price-low">Value: Low to High</option>
                <option value="price-high">Value: High to Low</option>
                <option value="rating">Most Exquisite</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <Skeleton type="card" count={12} />
        ) : filteredAndSorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in bg-white dark:bg-[#1A1A1A] rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm transition-colors">
            <div className="text-7xl mb-6 grayscale opacity-20">
              {products.length === 0 ? '🏪' : '🔍'}
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              {products.length === 0 ? 'Nothing Here Yet' : 'No Results Found'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
              {products.length === 0
                ? 'Check back later or add items to your wishlist to see them here!'
                : `We couldn't find any products matching "${search}". Try different keywords or browse categories.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {filteredAndSorted.map((p, i) => (
              <div 
                key={p._id || p.id} 
                className="animate-fade-in-up" 
                style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'both' }}
              >
                <ProductCard 
                  product={p} 
                  onAddToCart={onAddToCart} 
                  onClick={() => onSelectProduct(p)} 
                  wishlist={wishlist}
                  onToggleWishlist={onToggleWishlist}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


