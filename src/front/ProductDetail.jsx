import { useState } from 'react'
import { formatPrice } from '../utils'

export default function ProductDetail({ 
  product, onBack, onAddToCart, wishlist = [], 
  onToggleWishlist, reviews = [], onSubmitReview, onDeleteReview, user 
}) {
  const [qty, setQty] = useState(1)

  if (!product) return null

  const handleAddCart = () => {
    for (let i = 0; i < qty; i++) {
      onAddToCart(product)
    }
  }

  const discountPct = product.originalPrice && product.originalPrice > product.price 
    ? Math.round((1 - product.price / product.originalPrice) * 100) 
    : 0

  return (
    <div className="min-h-screen py-8 select-none">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Back Button */}
        <button 
          className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-neoYellow text-black border-3 border-black rounded-xl font-black text-xs uppercase shadow-neo-sm hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
          onClick={onBack}
        >
          <span>←</span>
          <span>BACK TO CATALOG</span>
        </button>

        {/* Product Box */}
        <div className="bg-white dark:bg-zinc-900 border-4 border-black dark:border-white rounded-3xl shadow-neo-lg overflow-hidden grid grid-cols-1 lg:grid-cols-11">
          {/* Image Column */}
          <div className="lg:col-span-5 p-8 sm:p-12 bg-zinc-100 dark:bg-zinc-800/60 flex items-center justify-center relative border-b-4 lg:border-b-0 lg:border-r-4 border-black dark:border-white">
            <div className="relative w-full aspect-square max-w-md">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover rounded-2xl border-3 border-black dark:border-white shadow-neo"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&auto=format&fit=crop&q=80';
                }}
              />
              {discountPct > 0 && (
                <div className="absolute -top-3 -right-3 bg-neoPink text-white px-3 py-1.5 rounded-xl border-3 border-black font-black text-xs shadow-neo rotate-3 uppercase tracking-wider">
                  SAVE {discountPct}%
                </div>
              )}
            </div>
          </div>

          {/* Info Column */}
          <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="px-3 py-1 bg-neoCyan text-black border-2 border-black rounded-lg text-xs font-black uppercase tracking-wider shadow-neo-sm">
                {product.category}
              </span>
              <span className="px-3 py-1 bg-neoGreen text-black border-2 border-black rounded-lg text-xs font-black uppercase tracking-wider shadow-neo-sm">
                IN STOCK ({product.stock || 0})
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-black dark:text-white uppercase tracking-tight leading-tight mb-4">
              {product.name}
            </h1>
            
            {/* Social Proof */}
            <div className="flex items-center gap-4 text-xs font-black uppercase tracking-wider mb-6 text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-100 dark:bg-zinc-800 border-2 border-black dark:border-white rounded-lg shadow-neo-sm">
                <span className="text-amber-500 text-sm">★</span>
                <span className="text-black dark:text-white font-black">{product.rating || '4.8'}</span>
              </div>
              <span className="bg-zinc-100 dark:bg-zinc-800 border-2 border-black dark:border-white text-black dark:text-white px-2.5 py-1 rounded-lg shadow-neo-sm">
                {product.sold || 0} ITEMS ORDERED
              </span>
            </div>

            {/* Pricing Box */}
            <div className="bg-neoYellow/20 border-3 border-black dark:border-white rounded-2xl p-6 mb-6 shadow-neo-sm">
              {discountPct > 0 && (
                <div className="text-xs font-bold text-zinc-400 line-through mb-1">
                  ORIGINAL PRICE: {formatPrice(product.originalPrice)}
                </div>
              )}
              <div className="text-3xl sm:text-4xl font-black text-black dark:text-white tracking-tight">
                {formatPrice(product.price)}
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-wider mb-2">
                PRODUCT DETAILS & SPECS
              </h3>
              <p className="text-zinc-700 dark:text-zinc-300 text-sm font-semibold leading-relaxed">
                {product.description || "Crafted for performance and everyday durability. Authentic factory quality with full warranty protection."}
              </p>
            </div>

            {/* Quantity and Actions */}
            <div className="mt-auto space-y-4 pt-6 border-t-3 border-black dark:border-white">
              <div className="flex items-center gap-4">
                <span className="text-xs font-black uppercase tracking-wider text-black dark:text-white">QUANTITY:</span>
                <div className="flex items-center bg-white dark:bg-zinc-800 border-2 border-black dark:border-white rounded-xl shadow-neo-sm overflow-hidden">
                  <button 
                    className="w-9 h-9 flex items-center justify-center text-lg font-black text-black dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-30"
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-sm font-black text-black dark:text-white">
                    {qty}
                  </span>
                  <button 
                    className="w-9 h-9 flex items-center justify-center text-lg font-black text-black dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    onClick={() => setQty(q => Math.min(product.stock || 99, q + 1))}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button 
                  className="py-4 bg-neoYellow hover:bg-yellow-300 text-black border-3 border-black dark:border-white rounded-xl font-black text-xs uppercase tracking-wider shadow-neo active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                  onClick={handleAddCart}
                >
                  <span>🛒</span>
                  <span>ADD TO CART</span>
                </button>
                <button 
                  className="py-4 bg-neoGreen hover:bg-emerald-400 text-black border-3 border-black dark:border-white rounded-xl font-black text-xs uppercase tracking-wider shadow-neo active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                  onClick={() => { handleAddCart(); }}
                >
                  <span>⚡</span>
                  <span>ORDER DIRECTLY</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Guarantee Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
          <div className="p-5 bg-white dark:bg-zinc-900 border-3 border-black dark:border-white rounded-2xl shadow-neo-sm flex items-center gap-4">
            <span className="text-3xl">🛡️</span>
            <div>
              <div className="font-black text-xs uppercase tracking-wider text-black dark:text-white">100% AUTHENTIC</div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase">Verified Original Goods</div>
            </div>
          </div>
          <div className="p-5 bg-white dark:bg-zinc-900 border-3 border-black dark:border-white rounded-2xl shadow-neo-sm flex items-center gap-4">
            <span className="text-3xl">🚀</span>
            <div>
              <div className="font-black text-xs uppercase tracking-wider text-black dark:text-white">FAST DISPATCH</div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase">Dispatched within 24 Hours</div>
            </div>
          </div>
          <div className="p-5 bg-white dark:bg-zinc-900 border-3 border-black dark:border-white rounded-2xl shadow-neo-sm flex items-center gap-4">
            <span className="text-3xl">🔄</span>
            <div>
              <div className="font-black text-xs uppercase tracking-wider text-black dark:text-white">EASY RETURNS</div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase">30-Day Money Back Guarantee</div>
            </div>
          </div>
        </div>

        {/* Reviews Box */}
        <div className="mt-10 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white rounded-3xl shadow-neo-lg overflow-hidden">
          <div className="p-6 bg-neoCyan text-black border-b-4 border-black dark:border-white flex items-center justify-between">
            <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <span>💬</span> VERIFIED REVIEWS & RATINGS
            </h3>
            <span className="bg-black text-white px-2.5 py-1 text-xs font-black uppercase rounded shadow-neo-sm">
              {reviews.length} REVIEWS
            </span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
            {/* Form */}
            <div className="p-6 bg-zinc-50 dark:bg-zinc-950 border-b lg:border-b-0 lg:border-r-4 border-black dark:border-white">
              <h4 className="font-black text-xs uppercase tracking-wider text-black dark:text-white mb-4">
                LEAVE YOUR FEEDBACK
              </h4>
              <ReviewForm onSubmit={onSubmitReview} user={user} />
            </div>

            {/* List */}
            <div className="lg:col-span-2 p-6">
              {reviews.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <div className="text-5xl mb-3">📝</div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    No customer reviews yet. Be the first to share your thoughts!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev._id} className="p-4 bg-white dark:bg-zinc-800 border-2 border-black dark:border-white rounded-2xl shadow-neo-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-neoPink text-white border-2 border-black rounded-lg flex items-center justify-center font-black text-xs">
                            {rev.userName?.[0] || 'U'}
                          </div>
                          <div>
                            <div className="text-xs font-black text-black dark:text-white uppercase">{rev.userName}</div>
                            <div className="text-amber-500 text-xs">{'★'.repeat(rev.rating)}</div>
                          </div>
                        </div>
                        {rev.userName === user.name && (
                          <button 
                            className="text-xs p-1 hover:bg-rose-100 rounded text-rose-500"
                            onClick={() => onDeleteReview(rev._id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 pl-10">
                        {rev.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function ReviewForm({ onSubmit, user }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    onSubmit({
      userName: user.name,
      rating,
      comment
    })
    setComment('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[10px] font-black text-black dark:text-white uppercase tracking-wider mb-1.5">
          RATING SCORE
        </label>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map(num => (
            <button
              key={num}
              type="button"
              className={`w-9 h-9 border-2 border-black dark:border-white rounded-lg font-black text-sm flex items-center justify-center shadow-neo-sm transition-all ${
                num <= rating ? 'bg-neoYellow text-black' : 'bg-white dark:bg-zinc-800 text-zinc-400'
              }`}
              onClick={() => setRating(num)}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-black text-black dark:text-white uppercase tracking-wider mb-1.5">
          REVIEW NOTES
        </label>
        <textarea
          className="w-full bg-white dark:bg-zinc-900 border-2 border-black dark:border-white rounded-xl p-3 text-xs font-bold outline-none shadow-neo-sm min-h-[100px] resize-none text-black dark:text-white"
          placeholder="How was the quality, fit, or performance?"
          value={comment}
          onChange={e => setComment(e.target.value)}
          required
        />
      </div>
      <button
        type="submit"
        className="w-full py-3 bg-black hover:bg-zinc-800 text-white border-2 border-black dark:border-white rounded-xl font-black text-xs uppercase tracking-wider shadow-neo active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
      >
        SUBMIT REVIEW ★
      </button>
    </form>
  )
}
