import { useState, useEffect } from 'react'
import { apiFetch } from '../api'
import ProductCard from './ProductCard'

export default function StoreProfile({ slug, onBack, onAddToCart, onSelectProduct, wishlist, onToggleWishlist }) {
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError('')

    Promise.all([
      apiFetch(`/stores/${slug}`),
      apiFetch(`/stores/${slug}/products`)
    ])
      .then(([storeData, prodsData]) => {
        setStore(storeData)
        setProducts(Array.isArray(prodsData) ? prodsData : [])
      })
      .catch(err => {
        setError(err.message || 'Toko tidak ditemukan')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [slug])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin text-4xl mb-3">⏳</div>
        <p className="font-black text-sm uppercase tracking-wider text-gray-500">Memuat profil toko...</p>
      </div>
    )
  }

  if (error || !store) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-3">🏪❌</div>
        <h2 className="font-black text-xl uppercase mb-2">Toko Tidak Ditemukan</h2>
        <p className="text-xs font-bold text-gray-500 mb-6">{error || 'Toko yang Anda cari mungkin sudah ditutup atau tidak aktif.'}</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-neoYellow text-black border-3 border-black rounded-xl font-black text-xs uppercase shadow-neo hover:bg-yellow-300"
        >
          ← Kembali ke Toko
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 text-black dark:text-white">
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-4 px-3.5 py-1.5 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white rounded-xl font-black text-xs uppercase shadow-neo-sm hover:bg-yellow-50 active:translate-x-0.5 active:translate-y-0.5 transition-all inline-flex items-center gap-1.5"
      >
        <span>←</span> Kembali Belanja
      </button>

      {/* Store Banner & Info Box */}
      <div className="bg-white dark:bg-zinc-900 border-4 border-black dark:border-white rounded-2xl overflow-hidden shadow-neo-xl mb-8">
        <div className="h-44 sm:h-56 w-full relative bg-neoYellow border-b-4 border-black">
          {store.banner ? (
            <img src={store.banner} alt={store.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-neoYellow via-neoPink to-neoCyan" />
          )}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="p-6 relative pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-4">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white dark:bg-zinc-900 border-4 border-black rounded-2xl overflow-hidden shadow-neo shrink-0 relative z-10 flex items-center justify-center text-4xl">
                {store.logo ? (
                  <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                ) : (
                  '🏪'
                )}
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">{store.name}</h1>
                  {store.isVerified && (
                    <span className="px-2 py-0.5 bg-neoGreen text-black border-2 border-black text-[10px] font-black uppercase tracking-widest rounded-md shadow-neo-sm">
                      ✓ OFFICIAL SELLER
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-2">
                  <span>📍 {store.city || 'Indonesia'}</span>
                  <span>•</span>
                  <span>📦 {products.length} Produk</span>
                </p>
              </div>
            </div>
          </div>

          {store.description && (
            <div className="p-3.5 bg-gray-50 dark:bg-zinc-800 border-2 border-black dark:border-zinc-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300">
              {store.description}
            </div>
          )}
        </div>
      </div>

      {/* Catalog Title */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-black text-xl uppercase tracking-tight">Etalase Produk ({products.length})</h2>
          <p className="text-xs font-bold text-gray-500">Semua produk yang dijual oleh {store.name}</p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-zinc-900 border-3 border-black dark:border-white rounded-2xl shadow-neo">
          <div className="text-4xl mb-2">📦</div>
          <h3 className="font-black text-base uppercase">Toko ini belum menambahkan produk</h3>
          <p className="text-xs font-bold text-gray-500 mt-1">Silakan kembali lagi nanti untuk melihat produk terbaru dari toko ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(p => (
            <ProductCard
              key={p._id || p.id}
              product={p}
              onAddToCart={onAddToCart}
              onClick={() => onSelectProduct?.(p)}
              wishlist={wishlist}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      )}
    </div>
  )
}
