import { useState } from 'react'
import { formatPrice } from '../utils'

function StarRating({ rating }) {
  const full = Math.floor(rating)
  const stars = '★'.repeat(Math.min(5, Math.max(1, full)))
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 dark:bg-zinc-800 border-2 border-black dark:border-white rounded-lg shadow-neo-sm">
      <span className="text-xs text-amber-500">{stars}</span>
      <span className="text-[10px] font-black text-black dark:text-white">{rating}</span>
    </div>
  )
}

function PromoBadge({ price, originalPrice, isFlashSale }) {
  if (isFlashSale) {
    return (
      <div className="absolute top-3 left-3 bg-neoYellow text-black border-2 border-black text-[10px] font-black px-2.5 py-1 rounded-lg shadow-neo-sm -rotate-3 z-10 uppercase tracking-wider flex items-center gap-1">
        <span>⚡</span> FLASH SALE
      </div>
    )
  }
  if (!originalPrice || originalPrice <= price || isNaN(originalPrice)) return null
  const pct = Math.round((1 - price / originalPrice) * 100)
  if (isNaN(pct) || pct <= 0) return null
  return (
    <div className="absolute top-3 left-3 bg-neoPink text-white border-2 border-black text-[10px] font-black px-2 py-0.5 rounded-lg shadow-neo-sm rotate-2 z-10 uppercase tracking-wider">
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
    setTimeout(() => setAdded(false), 1200)
  }

  const handleToggleFav = e => {
    e.stopPropagation()
    onToggleWishlist(product)
  }

  return (
    <div 
      className="group bg-white dark:bg-zinc-900 border-3 border-black dark:border-white rounded-2xl shadow-neo hover:-translate-x-1 hover:-translate-y-1 hover:shadow-neo-lg transition-all duration-200 cursor-pointer flex flex-col h-full overflow-hidden select-none" 
      onClick={onClick}
    >
      {/* Image Area */}
      <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-b-3 border-black dark:border-white">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
            loading="lazy" 
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&auto=format&fit=crop&q=80';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">📦</div>
        )}

        <PromoBadge price={product.price} originalPrice={product.originalPrice} isFlashSale={product.isFlashSale} />
        
        {/* Wishlist Heart Button */}
        <button 
          className={`absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-xl border-2 border-black dark:border-white shadow-neo-sm z-20 transition-all hover:scale-110 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
            isFav ? 'bg-neoPink text-white' : 'bg-white dark:bg-zinc-900 text-black dark:text-white'
          }`}
          onClick={handleToggleFav}
          title={isFav ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {isFav ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Card Info Body */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="flex items-center justify-between">
          <StarRating rating={product.rating || 0} />
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 border-2 border-black dark:border-white rounded-md text-black dark:text-white">
            {product.sold || 0} SOLD
          </span>
        </div>

        <div className="text-sm font-black text-black dark:text-white uppercase tracking-tight leading-snug line-clamp-2 h-10 group-hover:text-neoPink transition-colors">
          {product.name}
        </div>

        <div className="mt-auto pt-2">
          {product.originalPrice && product.originalPrice > product.price && (
            <div className="text-[11px] font-bold text-zinc-400 line-through">
              {formatPrice(product.originalPrice)}
            </div>
          )}
          <div className="text-lg font-black text-black dark:text-white tracking-tight">
            {formatPrice(product.price)}
          </div>

          {/* Neo Add To Cart Button */}
          <button
            className={`w-full mt-3 py-2 px-3 border-2 border-black dark:border-white rounded-xl font-black text-xs uppercase tracking-wider shadow-neo-sm flex items-center justify-center gap-1.5 transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
              added 
                ? 'bg-neoGreen text-black' 
                : 'bg-neoYellow hover:bg-yellow-300 text-black'
            }`}
            onClick={handleAdd}
          >
            <span>{added ? '✓' : '🛒'}</span>
            <span>{added ? 'ADDED TO CART!' : 'ADD TO CART'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
