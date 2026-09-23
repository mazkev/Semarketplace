import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '../api'
import { formatPrice, CATEGORIES } from '../utils'

export default function SellerCenter({ store, onBack, onViewPublicStore, showToast }) {
  const [activeTab, setActiveTab] = useState('products') // 'products', 'orders', 'settings'
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // Product Add/Edit Modal
  const [prodModalOpen, setProdModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    category: "Men's clothing",
    price: '',
    originalPrice: '',
    stock: '',
    image: '',
    description: '',
    isFlashSale: false
  })
  const [savingProd, setSavingProd] = useState(false)

  // Store Settings Form
  const [storeForm, setStoreForm] = useState({
    name: store?.name || '',
    description: store?.description || '',
    city: store?.city || '',
    logo: store?.logo || '',
    banner: store?.banner || ''
  })
  const [savingStore, setSavingStore] = useState(false)

  const fetchSellerData = useCallback(async () => {
    setLoading(true)
    try {
      const [prodsData, ordersData] = await Promise.all([
        apiFetch('/seller/products'),
        apiFetch('/seller/orders').catch(() => [])
      ])
      setProducts(Array.isArray(prodsData) ? prodsData : [])
      setOrders(Array.isArray(ordersData) ? ordersData : [])
    } catch (err) {
      showToast?.(err.message || 'Gagal memuat data Seller Center', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchSellerData()
  }, [fetchSellerData])

  const openAddModal = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      category: CATEGORIES[1] || "Men's clothing",
      price: '',
      originalPrice: '',
      stock: '10',
      image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80',
      description: '',
      isFlashSale: false
    })
    setProdModalOpen(true)
  }

  const openEditModal = (prod) => {
    setEditingProduct(prod)
    setFormData({
      name: prod.name,
      category: prod.category || "Men's clothing",
      price: String(prod.price),
      originalPrice: prod.originalPrice ? String(prod.originalPrice) : '',
      stock: String(prod.stock),
      image: prod.image,
      description: prod.description || '',
      isFlashSale: Boolean(prod.isFlashSale)
    })
    setProdModalOpen(true)
  }

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    setSavingProd(true)
    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : parseFloat(formData.price),
        stock: parseInt(formData.stock, 10) || 0,
        image: formData.image.trim(),
        description: formData.description.trim(),
        isFlashSale: formData.isFlashSale
      }

      if (editingProduct) {
        const updated = await apiFetch(`/seller/products/${editingProduct._id || editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        })
        setProducts(prev => prev.map(p => (p._id || p.id) === (editingProduct._id || editingProduct.id) ? updated : p))
        showToast?.('Produk berhasil diperbarui!', 'success')
      } else {
        const created = await apiFetch('/seller/products', {
          method: 'POST',
          body: JSON.stringify(payload)
        })
        setProducts(prev => [created, ...prev])
        showToast?.('Produk baru berhasil ditambahkan!', 'success')
      }
      setProdModalOpen(false)
    } catch (err) {
      showToast?.(err.message || 'Gagal menyimpan produk', 'error')
    } finally {
      setSavingProd(false)
    }
  }

  const handleDeleteProduct = async (prodId, prodName) => {
    if (!confirm(`Hapus produk "${prodName}" dari toko Anda?`)) return
    try {
      await apiFetch(`/seller/products/${prodId}`, { method: 'DELETE' })
      setProducts(prev => prev.filter(p => (p._id || p.id) !== prodId))
      showToast?.(`Produk "${prodName}" telah dihapus`, 'info')
    } catch (err) {
      showToast?.(err.message || 'Gagal menghapus produk', 'error')
    }
  }

  const handleUpdateStoreSettings = async (e) => {
    e.preventDefault()
    setSavingStore(true)
    try {
      await apiFetch('/stores/my-store', {
        method: 'PUT',
        body: JSON.stringify(storeForm)
      })
      showToast?.('Informasi toko berhasil disimpan!', 'success')
    } catch (err) {
      showToast?.(err.message || 'Gagal menyimpan pengaturan toko', 'error')
    } finally {
      setSavingStore(false)
    }
  }

  const totalOmzet = orders.reduce((sum, o) => sum + (o.storeTotal || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-black dark:text-white transition-colors pb-16">
      {/* Top Banner / Navigation */}
      <div className="bg-neoYellow text-black border-b-4 border-black p-4 sm:p-6 shadow-neo-sm">
        <div className="container mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-black text-white rounded-2xl border-3 border-black overflow-hidden flex items-center justify-center text-3xl shadow-neo-sm shrink-0">
              {store?.logo ? (
                <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                '🏪'
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">{store?.name || 'Toko Saya'}</h1>
                <span className="px-2 py-0.5 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-md">
                  ✓ VERIFIED SELLER
                </span>
              </div>
              <p className="text-xs font-bold text-black/80 flex items-center gap-2 mt-0.5">
                <span>📍 {store?.city || 'Indonesia'}</span>
                <span>•</span>
                <span>Link: <span className="font-mono underline">/store/{store?.slug}</span></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-auto">
            <button
              onClick={() => onViewPublicStore?.(store?.slug || store?.id)}
              className="px-3.5 py-2 bg-white text-black border-2 border-black rounded-xl font-black text-xs uppercase shadow-neo-sm hover:bg-yellow-50 active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              👁️ Lihat Etalase Publik
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-black text-white border-2 border-black rounded-xl font-black text-xs uppercase shadow-neo-sm hover:bg-zinc-800 active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              ← Kembali Belanja
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 pt-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-white dark:bg-zinc-900 border-3 border-black dark:border-white rounded-2xl shadow-neo">
            <div className="text-xs font-black uppercase text-gray-500 dark:text-gray-400">Total Produk Toko</div>
            <div className="text-3xl font-black mt-1 text-neoPink">{products.length}</div>
            <div className="text-[11px] font-bold text-gray-400 mt-1">Aktif di etalase Anda</div>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900 border-3 border-black dark:border-white rounded-2xl shadow-neo">
            <div className="text-xs font-black uppercase text-gray-500 dark:text-gray-400">Pesanan Masuk</div>
            <div className="text-3xl font-black mt-1 text-neoCyan">{orders.length}</div>
            <div className="text-[11px] font-bold text-gray-400 mt-1">Transaksi produk toko Anda</div>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900 border-3 border-black dark:border-white rounded-2xl shadow-neo">
            <div className="text-xs font-black uppercase text-gray-500 dark:text-gray-400">Total Estimasi Penjualan</div>
            <div className="text-2xl sm:text-3xl font-black mt-1 text-neoGreen">{formatPrice(totalOmzet)}</div>
            <div className="text-[11px] font-bold text-gray-400 mt-1">Dari pesanan terkonfirmasi</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b-3 border-black dark:border-white gap-2 mb-6">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-5 py-2.5 font-black text-xs uppercase tracking-wider border-t-3 border-x-3 border-black dark:border-white rounded-t-xl transition-all ${
              activeTab === 'products'
                ? 'bg-neoYellow text-black shadow-neo-sm translate-y-[3px]'
                : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100'
            }`}
          >
            📦 Produk Toko ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-2.5 font-black text-xs uppercase tracking-wider border-t-3 border-x-3 border-black dark:border-white rounded-t-xl transition-all ${
              activeTab === 'orders'
                ? 'bg-neoCyan text-black shadow-neo-sm translate-y-[3px]'
                : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100'
            }`}
          >
            🛍️ Pesanan Masuk ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-5 py-2.5 font-black text-xs uppercase tracking-wider border-t-3 border-x-3 border-black dark:border-white rounded-t-xl transition-all ${
              activeTab === 'settings'
                ? 'bg-neoPink text-white shadow-neo-sm translate-y-[3px]'
                : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100'
            }`}
          >
            ⚙️ Profil & Toko
          </button>
        </div>

        {/* TAB 1: PRODUCTS */}
        {activeTab === 'products' && (
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="font-black text-lg uppercase tracking-tight">Katalog Produk Toko Anda</h2>
              <button
                onClick={openAddModal}
                className="px-4 py-2 bg-neoGreen text-black border-3 border-black rounded-xl font-black text-xs uppercase tracking-wider shadow-neo hover:bg-emerald-400 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5"
              >
                <span>➕</span> Tambah Produk Baru
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center font-black text-sm text-gray-500 animate-pulse">
                Memuat produk toko...
              </div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-zinc-900 border-3 border-black dark:border-white rounded-2xl shadow-neo">
                <div className="text-4xl mb-2">📦</div>
                <h3 className="font-black text-base uppercase">Belum ada produk di toko Anda</h3>
                <p className="text-xs font-bold text-gray-500 mt-1 mb-4">Mulai tambahkan produk pertama Anda sekarang untuk menarik pembeli!</p>
                <button
                  onClick={openAddModal}
                  className="px-5 py-2.5 bg-neoYellow text-black border-3 border-black rounded-xl font-black text-xs uppercase shadow-neo hover:bg-yellow-300"
                >
                  ➕ Tambah Produk Pertama
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map(p => (
                  <div 
                    key={p._id || p.id} 
                    className="bg-white dark:bg-zinc-900 border-3 border-black dark:border-white rounded-2xl overflow-hidden shadow-neo flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-44 w-full bg-gray-100 dark:bg-zinc-800 relative border-b-2 border-black">
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        {p.isFlashSale && (
                          <span className="absolute top-2 left-2 bg-neoYellow text-black border-2 border-black text-[9px] font-black px-2 py-0.5 rounded shadow-neo-sm">
                            ⚡ FLASH SALE
                          </span>
                        )}
                        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          Stok: {p.stock}
                        </span>
                      </div>
                      <div className="p-3">
                        <span className="text-[10px] font-black uppercase text-neoPink bg-pink-100 dark:bg-pink-950 px-2 py-0.5 rounded border border-neoPink">
                          {p.category}
                        </span>
                        <h4 className="font-black text-xs uppercase tracking-tight mt-1.5 line-clamp-2">{p.name}</h4>
                        <div className="text-sm font-black text-black dark:text-white mt-2">
                          {formatPrice(p.price)}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 pt-0 flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(p)}
                        className="flex-1 py-1.5 bg-neoCyan text-black border-2 border-black rounded-lg font-black text-[11px] uppercase shadow-neo-sm hover:bg-cyan-300 active:translate-x-0.5 active:translate-y-0.5"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p._id || p.id, p.name)}
                        className="py-1.5 px-3 bg-neoPink text-white border-2 border-black rounded-lg font-black text-[11px] uppercase shadow-neo-sm hover:bg-rose-500 active:translate-x-0.5 active:translate-y-0.5"
                        title="Hapus Produk"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ORDERS */}
        {activeTab === 'orders' && (
          <div>
            <h2 className="font-black text-lg uppercase tracking-tight mb-4">Daftar Pesanan Produk Toko Anda</h2>

            {orders.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-zinc-900 border-3 border-black dark:border-white rounded-2xl shadow-neo">
                <div className="text-4xl mb-2">🛍️</div>
                <h3 className="font-black text-base uppercase">Belum ada pesanan masuk</h3>
                <p className="text-xs font-bold text-gray-500 mt-1">Saat pelanggan membeli produk Anda, rincian pesanannya akan tampil di sini.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(o => (
                  <div 
                    key={o._id || o.id}
                    className="p-4 bg-white dark:bg-zinc-900 border-3 border-black dark:border-white rounded-2xl shadow-neo"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-gray-200 dark:border-zinc-800 pb-2 mb-3">
                      <div>
                        <span className="text-xs font-black uppercase text-gray-500">ID Pesanan: #{o._id || o.id}</span>
                        <div className="text-xs font-bold text-black dark:text-white mt-0.5">
                          👤 Pembeli: {o.customerName} ({o.customerEmail})
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 bg-neoYellow text-black border-2 border-black font-black text-[10px] uppercase rounded-md shadow-neo-sm">
                          {o.status}
                        </span>
                        <div className="text-[10px] font-bold text-gray-400 mt-1">{new Date(o.timestamp).toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      {o.items?.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs font-bold">
                          <span>📦 {it.name} <span className="text-gray-500">x{it.qty}</span></span>
                          <span>{formatPrice(it.price * it.qty)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t-2 border-gray-100 dark:border-zinc-800 font-black text-sm">
                      <span>Total Pesanan Toko:</span>
                      <span className="text-neoGreen">{formatPrice(o.storeTotal)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-white dark:bg-zinc-900 border-3 border-black dark:border-white rounded-2xl shadow-neo p-6">
            <h2 className="font-black text-lg uppercase tracking-tight mb-4">Pengaturan Profil Toko</h2>
            <form onSubmit={handleUpdateStoreSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Nama Toko</label>
                <input
                  type="text"
                  required
                  value={storeForm.name}
                  onChange={e => setStoreForm({ ...storeForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border-2 border-black dark:border-white rounded-xl font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Kota Asal Pengiriman</label>
                <input
                  type="text"
                  required
                  value={storeForm.city}
                  onChange={e => setStoreForm({ ...storeForm, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border-2 border-black dark:border-white rounded-xl font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Deskripsi / Bio Toko</label>
                <textarea
                  rows={3}
                  value={storeForm.description}
                  onChange={e => setStoreForm({ ...storeForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-800 border-2 border-black dark:border-white rounded-xl font-bold text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">URL Logo Toko</label>
                <input
                  type="url"
                  value={storeForm.logo}
                  onChange={e => setStoreForm({ ...storeForm, logo: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border-2 border-black dark:border-white rounded-xl font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">URL Banner Toko</label>
                <input
                  type="url"
                  value={storeForm.banner}
                  onChange={e => setStoreForm({ ...storeForm, banner: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border-2 border-black dark:border-white rounded-xl font-bold text-sm"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingStore}
                  className="px-6 py-2.5 bg-neoGreen text-black border-3 border-black rounded-xl font-black text-xs uppercase shadow-neo hover:bg-emerald-400 active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  {savingStore ? 'Menyimpan...' : '💾 Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Modal Add/Edit Product */}
      {prodModalOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border-4 border-black dark:border-white rounded-2xl shadow-neo-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
            <div className="bg-neoYellow text-black px-6 py-4 border-b-4 border-black flex items-center justify-between shrink-0">
              <h3 className="font-black text-base uppercase tracking-tight">
                {editingProduct ? '✏️ Edit Produk Toko' : '➕ Tambah Produk Baru'}
              </h3>
              <button 
                onClick={() => setProdModalOpen(false)}
                className="w-8 h-8 bg-black text-white hover:bg-neoPink font-black rounded-lg border-2 border-black flex items-center justify-center shadow-neo-sm text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-3 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Nama Produk *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sepatu Sneaker Original"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border-2 border-black dark:border-white rounded-xl font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border-2 border-black dark:border-white rounded-xl font-bold text-sm"
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase mb-1">Stok *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border-2 border-black dark:border-white rounded-xl font-bold text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Harga Jual (Rp) *</label>
                  <input
                    type="number"
                    min="1000"
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border-2 border-black dark:border-white rounded-xl font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase mb-1">Harga Coret (Opsional)</label>
                  <input
                    type="number"
                    min="1000"
                    value={formData.originalPrice}
                    onChange={e => setFormData({ ...formData, originalPrice: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border-2 border-black dark:border-white rounded-xl font-bold text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">URL Gambar Produk</label>
                <input
                  type="url"
                  required
                  value={formData.image}
                  onChange={e => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border-2 border-black dark:border-white rounded-xl font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Deskripsi Produk</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border-2 border-black dark:border-white rounded-xl font-bold text-sm resize-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs pt-1">
                <input
                  type="checkbox"
                  checked={formData.isFlashSale}
                  onChange={e => setFormData({ ...formData, isFlashSale: e.target.checked })}
                  className="w-4 h-4 accent-neoYellow border-2 border-black"
                />
                <span>⚡ Tandai sebagai Produk Flash Sale</span>
              </label>

              <div className="pt-3 flex items-center justify-end gap-2 border-t-2 border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setProdModalOpen(false)}
                  className="px-4 py-2 border-2 border-black dark:border-white rounded-xl font-black text-xs uppercase"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingProd}
                  className="px-5 py-2 bg-neoGreen text-black border-2 border-black rounded-xl font-black text-xs uppercase shadow-neo hover:bg-emerald-400"
                >
                  {savingProd ? 'Menyimpan...' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
