import { useState, useEffect, useCallback } from 'react'
import { formatPrice } from '../utils'
import { apiFetch } from '../api'

export default function ProductDetail({ 
  product, onBack, onAddToCart, wishlist = [], 
  onToggleWishlist, reviews = [], onSubmitReview, onDeleteReview, user,
  onSelectStore
}) {
  const [qty, setQty] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState(product?.variants?.[0] || '')
  const [groupBuys, setGroupBuys] = useState([])
  const [loadingGb, setLoadingGb] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [activeTeam, setActiveTeam] = useState(null)
  const [isGbActionLoading, setIsGbActionLoading] = useState(false)

  useEffect(() => {
    setSelectedVariant(product?.variants?.[0] || '')
  }, [product])

  const groupPrice = product?.groupPrice || Math.round((product?.price || 0) * 0.75)
  const groupDiscountPct = product?.price ? Math.round((1 - groupPrice / product.price) * 100) : 25

  const fetchGroupBuys = useCallback(async () => {
    if (!product?._id && !product?.id) return
    try {
      setLoadingGb(true)
      const prodId = product._id || product.id
      const data = await apiFetch(`/group-buys?productId=${prodId}`)
      if (Array.isArray(data)) {
        setGroupBuys(data.filter(g => g.status === 'open'))
      }
    } catch (err) {
      console.error('Failed to fetch group buys', err)
    } finally {
      setLoadingGb(false)
    }
  }, [product])

  useEffect(() => {
    fetchGroupBuys()
  }, [fetchGroupBuys])

  if (!product) return null

  const handleAddCart = () => {
    for (let i = 0; i < qty; i++) {
      onAddToCart({ ...product, variant: selectedVariant, isGroupBuy: false })
    }
  }

  const handleJoinTeam = async (team) => {
    try {
      setIsGbActionLoading(true)
      const teamId = team._id || team.id
      const updatedTeam = await apiFetch(`/group-buys/${teamId}/join`, {
        method: 'POST'
      })
      for (let i = 0; i < qty; i++) {
        onAddToCart({
          ...product,
          price: groupPrice,
          groupPrice: groupPrice,
          isGroupBuy: true,
          groupBuyId: teamId,
          variant: selectedVariant
        })
      }
      setActiveTeam(updatedTeam || team)
      setShareModalOpen(true)
      fetchGroupBuys()
    } catch (err) {
      alert(err.message || 'Gagal bergabung dengan tim beli bareng')
    } finally {
      setIsGbActionLoading(false)
    }
  }

  const handleStartGroupBuy = async () => {
    try {
      setIsGbActionLoading(true)
      const newTeam = await apiFetch('/group-buys', {
        method: 'POST',
        body: JSON.stringify({
          productId: product._id || product.id,
          productName: product.name,
          productImage: product.image,
          regularPrice: product.price,
          groupPrice: groupPrice,
          requiredMembers: 2
        })
      })
      for (let i = 0; i < qty; i++) {
        onAddToCart({
          ...product,
          price: groupPrice,
          groupPrice: groupPrice,
          isGroupBuy: true,
          groupBuyId: newTeam._id || newTeam.id,
          variant: selectedVariant
        })
      }
      setActiveTeam(newTeam)
      setShareModalOpen(true)
      fetchGroupBuys()
    } catch (err) {
      alert(err.message || 'Gagal memulai tim beli bareng')
    } finally {
      setIsGbActionLoading(false)
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
              <span className="px-3 py-1 bg-neoPink text-white border-2 border-black rounded-lg text-xs font-black uppercase tracking-wider shadow-neo-sm flex items-center gap-1 animate-pulse">
                <span>👥</span> BELI BARENG HEMAT {groupDiscountPct}%
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

            {/* Store Information Box */}
            <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-zinc-800/80 border-2 border-black dark:border-white rounded-xl mb-6 shadow-neo-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neoYellow border-2 border-black rounded-lg flex items-center justify-center text-xl shadow-neo-sm">
                  🏪
                </div>
                <div>
                  <div className="font-black text-xs uppercase text-black dark:text-white flex items-center gap-1.5">
                    <span>{product.storeName || 'SE-MARKET Official Store'}</span>
                    <span className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded font-black">PRO</span>
                  </div>
                  <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                    Penjual Terverifikasi • Pengiriman Cepat
                  </div>
                </div>
              </div>
              {onSelectStore && (
                <button
                  type="button"
                  onClick={() => onSelectStore(product.storeId || product.storeSlug || 'semarket-official')}
                  className="px-3 py-1.5 bg-white dark:bg-zinc-900 border-2 border-black text-xs font-black uppercase rounded-lg shadow-neo-sm hover:bg-yellow-50 active:translate-x-0.5 active:translate-y-0.5 transition-all text-black dark:text-white"
                >
                  Kunjungi Toko →
                </button>
              )}
            </div>

            {/* Dual Pricing Box (Beli Sendiri vs Beli Bareng ala Pinduoduo) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {/* Option A: Beli Sendiri */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 border-3 border-black dark:border-white rounded-2xl shadow-neo-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Beli Satuan
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">
                      Regular
                    </span>
                  </div>
                  {discountPct > 0 && (
                    <div className="text-[11px] font-bold text-zinc-400 line-through">
                      {formatPrice(product.originalPrice)}
                    </div>
                  )}
                  <div className="text-2xl font-black text-black dark:text-white tracking-tight">
                    {formatPrice(product.price)}
                  </div>
                </div>
                <div className="text-[10px] font-bold text-zinc-500 mt-2">
                  Pengiriman langsung tanpa menunggu tim
                </div>
              </div>

              {/* Option B: Beli Bareng */}
              <div className="p-4 bg-neoPink/10 dark:bg-pink-950/40 border-3 border-neoPink rounded-2xl shadow-neo flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-neoPink text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-bl-lg shadow-sm">
                  HEMAT {groupDiscountPct}%
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-black uppercase tracking-wider text-neoPink">
                      👥 Beli Bareng (Tim 2 Org)
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-zinc-400 line-through">
                    {formatPrice(product.price)}
                  </div>
                  <div className="text-2xl font-black text-neoPink tracking-tight">
                    {formatPrice(groupPrice)}
                  </div>
                </div>
                <div className="text-[10px] font-black text-black dark:text-white mt-2 flex items-center gap-1">
                  <span>🔥</span> Ajak 1 teman / gabung tim aktif
                </div>
              </div>
            </div>

            {/* Open Teams Widget (Pinduoduo Live Open Teams) */}
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-zinc-800/80 border-3 border-black dark:border-white rounded-2xl shadow-neo-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">👥</span>
                  <span className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
                    TIM BELI BARENG AKTIF ({groupBuys.length})
                  </span>
                </div>
                <span className="text-[10px] font-black text-zinc-500 uppercase">
                  SLOT TERBATAS
                </span>
              </div>

              {loadingGb ? (
                <div className="text-xs font-bold text-zinc-400 py-3 text-center">
                  Memuat tim aktif...
                </div>
              ) : groupBuys.length === 0 ? (
                <div className="p-3 bg-white dark:bg-zinc-900 border-2 border-dashed border-black/40 dark:border-white/40 rounded-xl text-center">
                  <div className="text-xs font-black text-black dark:text-white uppercase mb-0.5">
                    Belum ada tim terbuka untuk produk ini
                  </div>
                  <div className="text-[10px] font-bold text-zinc-500">
                    Jadilah Ketua Tim pertama dengan menekan tombol &ldquo;Beli Bareng&rdquo; di bawah!
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {groupBuys.map((team) => {
                    const remainingSlots = Math.max(1, (team.requiredMembers || 2) - (team.currentMembers || 1))
                    return (
                      <div 
                        key={team._id || team.id}
                        className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white rounded-xl shadow-neo-sm gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {team.hostAvatar ? (
                            <img 
                              src={team.hostAvatar} 
                              alt={team.hostName} 
                              className="w-8 h-8 rounded-full border border-black object-cover shrink-0" 
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-neoPink text-white font-black text-xs flex items-center justify-center border border-black shrink-0">
                              {team.hostName?.[0] || 'U'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-black text-black dark:text-white uppercase truncate">
                              {team.hostName}
                            </div>
                            <div className="text-[10px] font-bold text-rose-500 dark:text-rose-400">
                              Kurang {remainingSlots} orang lagi!
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right hidden sm:block">
                            <div className="text-[10px] font-bold text-zinc-500">Berakhir dlm</div>
                            <div className="text-[10px] font-black text-black dark:text-white">23 Jam</div>
                          </div>
                          <button
                            type="button"
                            disabled={isGbActionLoading}
                            onClick={() => handleJoinTeam(team)}
                            className="px-3 py-1.5 bg-neoPink hover:bg-pink-500 text-white border-2 border-black rounded-lg text-xs font-black uppercase shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
                          >
                            Gabung Tim →
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-wider mb-2">
                PRODUCT DETAILS & SPECS
              </h3>
              <p className="text-zinc-700 dark:text-zinc-300 text-sm font-semibold leading-relaxed">
                {product.description || "Crafted for performance and everyday durability. Authentic factory quality with full warranty protection."}
              </p>
            </div>

            {/* Product Variants (Size / Color) */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-6 p-4 bg-yellow-50/50 dark:bg-zinc-800/50 border-2 border-black dark:border-white rounded-2xl">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-1.5">
                    <span>🏷️</span> PILIH VARIAN / UKURAN:
                  </span>
                  {selectedVariant && (
                    <span className="text-xs font-black uppercase text-neoPink bg-pink-100 dark:bg-pink-950 px-2 py-0.5 rounded border border-neoPink">
                      Terpilih: {selectedVariant}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => {
                    const isSelected = selectedVariant === v
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all select-none ${
                          isSelected
                            ? 'bg-neoYellow text-black border-3 border-black shadow-neo-sm font-black -translate-x-0.5 -translate-y-0.5'
                            : 'bg-white dark:bg-zinc-800 text-black dark:text-white border-2 border-black dark:border-white font-bold hover:bg-yellow-50 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {v}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantity and Dual Actions (Beli Sendiri vs Beli Bareng) */}
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

              {/* Dual Purchase Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Button 1: Regular Buy */}
                <button 
                  className="py-3.5 px-4 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-black dark:text-white border-3 border-black dark:border-white rounded-xl font-black text-xs uppercase tracking-wider shadow-neo active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex flex-col items-center justify-center"
                  onClick={handleAddCart}
                >
                  <span className="flex items-center gap-1.5">
                    <span>🛒</span>
                    <span>BELI SENDIRI</span>
                  </span>
                  <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                    {formatPrice(product.price * qty)}
                  </span>
                </button>

                {/* Button 2: Team Buy (Beli Bareng) */}
                <button 
                  disabled={isGbActionLoading}
                  className="py-3.5 px-4 bg-neoPink hover:bg-pink-500 text-white border-3 border-black dark:border-white rounded-xl font-black text-xs uppercase tracking-wider shadow-neo active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex flex-col items-center justify-center"
                  onClick={handleStartGroupBuy}
                >
                  <span className="flex items-center gap-1.5">
                    <span>👥</span>
                    <span>BUAT TIM BELI BARENG</span>
                  </span>
                  <span className="text-[11px] font-black text-yellow-200">
                    HEMAT 25% • {formatPrice(groupPrice * qty)}
                  </span>
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
                  {reviews.map((rev) => {
                    const reviewKey = rev._id || rev.id;
                    const canDelete = Boolean(
                      user && (
                        (rev.userId && rev.userId === user._id) ||
                        (rev.userName && rev.userName === user.name) ||
                        user.isAdmin ||
                        user.role === 'Admin'
                      )
                    );
                    return (
                      <div key={reviewKey} className="p-4 bg-white dark:bg-zinc-800 border-2 border-black dark:border-white rounded-2xl shadow-neo-sm">
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
                          {canDelete && (
                            <button 
                              className="text-xs p-1 hover:bg-rose-100 rounded text-rose-500"
                              onClick={() => onDeleteReview(reviewKey)}
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
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Share Group Buy Modal */}
      <ShareGroupBuyModal 
        isOpen={shareModalOpen} 
        onClose={() => setShareModalOpen(false)} 
        team={activeTeam} 
        product={product} 
        groupPrice={groupPrice} 
      />
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

function ShareGroupBuyModal({ isOpen, onClose, team, product, groupPrice }) {
  const [copied, setCopied] = useState(false)
  if (!isOpen || !team) return null

  const shareUrl = `${window.location.origin}?gb=${team._id || team.id}&p=${product._id || product.id}`
  const remainingSlots = Math.max(1, (team.requiredMembers || 2) - (team.currentMembers || 1))

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsApp = () => {
    const text = `Hai! Yuk beli bareng produk "${product.name}" di SeMarketplace cuma ${formatPrice(groupPrice)} (Hemat 25%)! Klik link ini untuk gabung tim: ${shareUrl}`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 border-4 border-black dark:border-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-neo-xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-2 border-black dark:border-white font-black text-sm flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all text-black dark:text-white"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-neoPink text-white border-3 border-black flex items-center justify-center text-2xl shadow-neo-sm shrink-0">
            👥
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-yellow-200 dark:bg-yellow-400 text-black px-2 py-0.5 rounded border border-black">
              BELI BARENG AKTIF
            </span>
            <h3 className="text-lg sm:text-xl font-black text-black dark:text-white uppercase tracking-tight">
              Ajak Teman & Selesaikan Tim!
            </h3>
          </div>
        </div>

        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-5 leading-relaxed">
          Pesanan Beli Bareng Anda telah dimasukkan ke keranjang dengan potongan harga hemat 25%! Tim Anda butuh <strong className="text-rose-500 font-black">{remainingSlots} orang lagi</strong> agar pesanan diproses.
        </p>

        {/* Product mini card */}
        <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/80 border-2 border-black dark:border-white rounded-xl mb-5">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-12 h-12 rounded-lg object-cover border border-black shrink-0" 
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&auto=format&fit=crop&q=80';
            }}
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-black text-black dark:text-white uppercase truncate">
              {product.name}
            </div>
            <div className="text-xs font-black text-neoPink flex items-center gap-2">
              <span>{formatPrice(groupPrice)}</span>
              <span className="text-[10px] text-zinc-400 line-through font-normal">{formatPrice(product.price)}</span>
            </div>
          </div>
        </div>

        {/* Share link input */}
        <div className="mb-4">
          <label className="block text-[10px] font-black text-black dark:text-white uppercase tracking-wider mb-1.5">
            LINK UNDANGAN TIM:
          </label>
          <div className="flex gap-2">
            <input 
              type="text" 
              readOnly 
              value={shareUrl}
              className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-2 border-black dark:border-white rounded-xl px-3 py-2 text-xs font-bold text-black dark:text-white outline-none select-all"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 bg-neoYellow hover:bg-yellow-300 text-black border-2 border-black rounded-xl font-black text-xs uppercase shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all shrink-0"
            >
              {copied ? '✓ TERSALIN' : '📋 SALIN'}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleWhatsApp}
            className="w-full py-3 bg-[#25D366] hover:bg-[#20ba59] text-white border-2 border-black rounded-xl font-black text-xs uppercase tracking-wider shadow-neo active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <span>💬</span>
            <span>BAGIKAN KE WHATSAPP</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-black hover:bg-zinc-800 text-white border-2 border-black dark:border-white rounded-xl font-black text-xs uppercase tracking-wider shadow-neo active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            LANJUT KE KERANJANG BELANJA →
          </button>
        </div>
      </div>
    </div>
  )
}

