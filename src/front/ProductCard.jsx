import { useState } from 'react'
import { formatPrice } from '../utils'

function StarRating({ rating }) {
  const full = Math.floor(rating)
  const stars = Array.from({ length: 5 }, (_, i) => i < full ? '★' : '☆').join('')
  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 dark:bg-slate-800 rounded-full">
      <span className="text-[10px] text-amber-500">{stars}</span>
      <span className="text-[9px] font-black text-slate-400">{rating}</span>
    </div>
  )
}

function PromoBadge({ price, originalPrice, isFlashSale }) {
  if (isFlashSale) {
    return (
      <div className="absolute top-4 left-4 bg-indigo-600 text-white text-[9px] font-black px-2.5 py-1.5 rounded-xl shadow-xl shadow-indigo-500/40 z-10 uppercase tracking-widest animate-pulse flex items-center gap-1.5 border border-white/20">
        <span className="text-amber-400">⚡</span> FLASH
      </div>
    )
  }
  if (!originalPrice || originalPrice <= price || isNaN(originalPrice)) return null
  const pct = Math.round((1 - price / originalPrice) * 100)
  if (isNaN(pct) || pct <= 0) return null
  return (
    <div className="absolute top-4 left-4 bg-rose-500 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-lg z-10 uppercase tracking-widest">
      {pct}% OFF
    </div>
  )
}

export default function ProductCard({ product, onAddToCart, onClick, wishlist = [], onToggleWishlist }) {
  const [added, setAdded] = useState(false)
  const isFav = wishlist.some(i => i._id === product._id)

  const handleAdd = e => {
    e.stopPropagation()
    onAddToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  const handleToggleFav = e => {
    e.stopPropagation()
    onToggleWishlist(product)
  }

  return (
    <div 
      className="group bg-white dark:bg-slate-900 rounded-[24px] shadow-xl shadow-slate-200/50 dark:shadow-black/20 hover:-translate-y-2 transition-all duration-500 cursor-pointer flex flex-col h-full overflow-hidden border border-transparent hover:border-indigo-500/10" 
      onClick={onClick}
    >
      {/* Image Wrap */}
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-50 dark:bg-slate-800 m-2 rounded-[20px]">
        {product.image
          ? (
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              loading="lazy" 
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&auto=format&fit=crop&q=80';
              }}
            />
          )
          : (
            <div className="w-full h-full flex items-center justify-center text-5xl opacity-10">📦</div>
          )
        }
        <PromoBadge price={product.price} originalPrice={product.originalPrice} isFlashSale={product.isFlashSale} />
        
        {/* Wishlist Button */}
        <button 
          className={`absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-xl z-20 transition-all hover:scale-110 active:scale-90 ${
            isFav ? 'text-rose-500' : 'text-slate-300'
          }`}
          onClick={handleToggleFav}
        >
          {isFav ? '❤️' : '🤍'}
        </button>

        {/* Quick Add Button (Floating) */}
        <button
          className={`absolute bottom-3 right-3 w-10 h-10 rounded-xl flex items-center justify-center shadow-xl transition-all duration-300 translate-y-12 group-hover:translate-y-0 ${
            added ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
          onClick={handleAdd}
        >
          {added ? '✓' : '🛒'}
        </button>
      </div>


      {/* Body */}
      <div className="p-4 pt-2 flex flex-col flex-1 gap-2">
        <div className="flex items-center justify-between">
           <StarRating rating={product.rating || 0} />
           <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
             {product.sold || 0} Sold
           </span>
        </div>

        <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight h-10 line-clamp-2 group-hover:text-indigo-600 transition-colors mt-1">
          {product.name}
        </div>

        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="flex flex-col">
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[10px] text-slate-400 line-through mb-0.5">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            <span className="text-lg font-black text-indigo-600 tracking-tighter">
              {formatPrice(product.price)}
            </span>
          </div>
          
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 dark:border-slate-800 px-2 py-1 rounded-lg">
             Premium
          </div>
        </div>
      </div>

    </div>
  )
}

