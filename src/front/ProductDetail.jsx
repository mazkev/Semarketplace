import { useState } from 'react'
import { formatPrice } from '../utils'

export default function ProductDetail({ 
  product, onBack, onAddToCart, wishlist = [], 
  onToggleWishlist, reviews = [], onSubmitReview, onDeleteReview, user 
}) {
  const [qty, setQty] = useState(1)

  if (!product) return null

  const handleAddCart = () => {
    for(let i=0; i<qty; i++) {
        onAddToCart(product)
    }
  }

  const discountPct = product.originalPrice && product.originalPrice > product.price 
    ? Math.round((1 - product.price / product.originalPrice) * 100) 
    : 0

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8 sm:py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Breadcrumb */}
        <div 
          className="flex items-center gap-3 mb-8 cursor-pointer text-slate-400 hover:text-indigo-600 transition-all group font-black text-[10px] uppercase tracking-widest"
          onClick={onBack}
        >
          <span className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center group-hover:-translate-x-1 transition-transform">←</span> 
          Back to Curated Gallery
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-11 gap-0 border border-slate-100 dark:border-slate-800">
          {/* Image Section */}
          <div className="lg:col-span-5 p-10 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-center relative">
            <div className="relative group w-full aspect-square max-w-md animate-scale-in">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal transform transition-transform duration-700 group-hover:scale-110"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&auto=format&fit=crop&q=80';
                }}
              />
              {discountPct > 0 && (
                <div className="absolute top-0 right-0 bg-rose-500 text-white px-4 py-2 rounded-2xl font-black text-xs shadow-xl animate-pulse uppercase tracking-widest">
                  -{discountPct}% Aura Deal
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="lg:col-span-6 p-10 sm:p-14 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
               <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-800/30">
                 {product.category}
               </span>
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">In Stock</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-none tracking-tighter mb-6">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest mb-10 text-slate-400">
              <div className="flex items-center gap-2 pr-6 border-r border-slate-100 dark:border-slate-800">
                <span className="text-amber-500 text-base">★</span>
                <span className="text-slate-900 dark:text-white text-sm">
                  {reviews.length > 0 
                    ? ((reviews.reduce((s, r) => s + r.rating, 0) + (product.rating || 0)) / (reviews.length + 1)).toFixed(1)
                    : (product.rating || '0.0')}
                </span>
              </div>
              <div className="pr-6 border-r border-slate-100 dark:border-slate-800">
                <span className="text-slate-900 dark:text-white text-sm mr-2">{reviews.length}</span> Reviews
              </div>
              <div>
                <span className="text-slate-900 dark:text-white text-sm mr-2">{product.sold || 0}</span> Reserved
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[24px] p-8 mb-10 border border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                {discountPct > 0 && (
                  <span className="text-sm text-slate-400 line-through font-bold">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
                <div className="flex items-center gap-6">
                  <span className="text-4xl sm:text-5xl font-black text-indigo-600 tracking-tighter">
                    {formatPrice(product.price)}
                  </span>
                  {discountPct > 0 && (
                    <span className="bg-rose-500 text-white text-[9px] font-black px-3 py-1.5 rounded-xl shadow-lg uppercase tracking-widest leading-none">
                      Aura Exclusive
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Informative Description Section */}
            <div className="mb-10 animate-fade-in">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Product Narrative</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-medium">
                {product.description || "This premium selection embodies the pinnacle of design and functionality, curated specifically for the modern lifestyle. Experience the perfect blend of aesthetic appeal and durable craftsmanship."}
              </p>
            </div>

            <div className="space-y-10 mt-auto pt-10 border-t border-slate-50 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-12">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Quantity Select</span>
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden w-fit p-1 shadow-inner">
                  <button 
                    className="w-10 h-10 flex items-center justify-center text-xl font-black text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all disabled:opacity-20"
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                  >
                    &minus;
                  </button>
                  <input 
                    className="w-14 text-center text-lg font-black text-slate-900 dark:text-white outline-none bg-transparent"
                    type="text" 
                    value={qty} 
                    readOnly 
                  />
                  <button 
                    className="w-10 h-10 flex items-center justify-center text-xl font-black text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all disabled:opacity-20"
                    onClick={() => setQty(q => Math.min(product.stock || 99, q + 1))}
                    disabled={qty >= (product.stock || 99)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  className="px-8 py-5 bg-white dark:bg-slate-800 text-indigo-600 border border-slate-100 dark:border-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all duration-500 shadow-xl shadow-indigo-500/5 hover:shadow-indigo-500/30"
                  onClick={handleAddCart}
                >
                  🛒 Add To Collection
                </button>
                <button 
                  className="px-8 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all duration-500 shadow-2xl shadow-indigo-500/30 transform hover:-translate-y-1 active:translate-y-0"
                  onClick={() => { handleAddCart(); }}
                >
                  💎 Express Checkout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid Below */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-12">
          <div className="flex items-center gap-6 p-8 bg-white dark:bg-slate-900 rounded-[24px] shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-50 dark:border-slate-800">
            <span className="text-4xl grayscale group-hover:grayscale-0 transition-all">🛡️</span>
            <div>
              <div className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest">Aura Protected</div>
              <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Premium Security</div>
            </div>
          </div>
          <div className="flex items-center gap-6 p-8 bg-white dark:bg-slate-900 rounded-[24px] shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-50 dark:border-slate-800">
            <span className="text-4xl">🚚</span>
            <div>
              <div className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest">Priority Delivery</div>
              <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Swift & Secure</div>
            </div>
          </div>
          <div className="flex items-center gap-6 p-8 bg-white dark:bg-slate-900 rounded-[24px] shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-50 dark:border-slate-800">
            <span className="text-4xl">🔄</span>
            <div>
              <div className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest">Easy Exchange</div>
              <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Hassle-Free Returns</div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
              <span>💬</span> Customer Reviews
            </h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
            {/* Submit Review Form */}
            <div className="p-8 bg-gray-50/50 border-b lg:border-b-0 lg:border-r border-gray-100">
              <h4 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                Write a Review
              </h4>
              <ReviewForm onSubmit={onSubmitReview} user={user} />
            </div>

            {/* Review List */}
            <div className="lg:col-span-2 p-8">
              {reviews.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center">
                  <div className="text-6xl mb-4 grayscale opacity-20">📝</div>
                  <p className="text-gray-400 font-medium">No reviews yet. Be the first to review this product!</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {reviews.map((rev, i) => (
                    <div key={rev._id} className="animate-fade-in group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-shopee/10 text-shopee flex items-center justify-center font-bold text-sm">
                            {rev.userName?.[0] || 'U'}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">{rev.userName}</div>
                            <div className="flex items-center gap-2">
                              <div className="text-yellow-500 text-xs">
                                {'★'.repeat(rev.rating)}{'☆'.repeat(5-rev.rating)}
                              </div>
                              <span className="text-[10px] text-gray-400 font-medium">
                                {new Date(rev.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        {rev.userName === user.name && (
                          <button 
                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            onClick={() => onDeleteReview(rev._id)}
                            title="Delete review"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed pl-13">
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
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(num => (
            <button
              key={num}
              type="button"
              className={`text-2xl transition-all ${num <= rating ? 'text-yellow-500 scale-110' : 'text-gray-200 hover:text-yellow-200'}`}
              onClick={() => setRating(num)}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Your Comment</label>
        <textarea
          className="w-full bg-white border border-gray-200 rounded-lg p-4 text-sm outline-none focus:border-shopee transition-colors min-h-[120px] resize-none shadow-sm"
          placeholder="Share your experience with this product..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-gray-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-[0.98]"
      >
        Post Review
      </button>
    </form>
  )
}

