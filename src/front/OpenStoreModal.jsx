import { useState } from 'react'
import { apiFetch } from '../api'

export default function OpenStoreModal({ isOpen, onClose, onStoreCreated, showToast }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('Jakarta')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (name.trim().length < 3) {
      setError('Nama toko minimal 3 karakter')
      return
    }

    setLoading(true)
    try {
      const store = await apiFetch('/stores', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          city: city.trim()
        })
      })
      showToast?.('🎉 Selamat! Toko Anda berhasil dibuka. Selamat berjualan!', 'success')
      onStoreCreated?.(store)
      onClose()
    } catch (err) {
      setError(err.message || 'Gagal membuka toko')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-neo-2xl rounded-2xl overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-neoYellow text-black px-6 py-4 border-b-4 border-black flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🏪</span>
            <div>
              <h2 className="font-black text-lg uppercase tracking-tight">Buka Toko Gratis</h2>
              <p className="text-xs font-bold text-black/80">Mulai jualan produk Anda di SE-MARKET hari ini!</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="w-8 h-8 bg-black text-white hover:bg-neoPink font-black rounded-lg border-2 border-black flex items-center justify-center shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all text-sm"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-black dark:text-white">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-950/50 border-2 border-red-500 rounded-xl text-red-600 dark:text-red-400 font-bold text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-1">
              Nama Toko <span className="text-red-500">*</span>
            </label>
            <input 
              type="text"
              required
              placeholder="Contoh: Berkah Gadget Store"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border-3 border-black dark:border-white rounded-xl font-bold text-sm shadow-neo-sm focus:outline-none focus:bg-yellow-50 dark:focus:bg-zinc-700 transition-colors"
            />
            {slug && (
              <p className="mt-1 text-[11px] font-bold text-gray-500 dark:text-gray-400">
                Link etalase toko: <span className="text-neoPink font-mono">semarket.com/store/{slug}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-1">
              Kota Asal Pengiriman <span className="text-red-500">*</span>
            </label>
            <input 
              type="text"
              required
              placeholder="Contoh: Jakarta Pusat, Bandung, Surabaya"
              value={city}
              onChange={e => setCity(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border-3 border-black dark:border-white rounded-xl font-bold text-sm shadow-neo-sm focus:outline-none focus:bg-yellow-50 dark:focus:bg-zinc-700 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-1">
              Slogan / Deskripsi Singkat Toko
            </label>
            <textarea 
              rows={3}
              placeholder="Ceritakan produk apa yang Anda jual dan komitmen kualitas toko Anda..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-800 border-3 border-black dark:border-white rounded-xl font-bold text-sm shadow-neo-sm focus:outline-none focus:bg-yellow-50 dark:focus:bg-zinc-700 transition-colors resize-none"
            />
          </div>

          <div className="p-3 bg-yellow-50 dark:bg-zinc-800 border-2 border-black dark:border-zinc-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300">
            <span className="font-black text-black dark:text-white">💡 Keuntungan Buka Toko:</span>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
              <li>Bebas biaya pendaftaran (100% Gratis).</li>
              <li>Akses langsung ke **Seller Center** untuk upload dan kelola produk.</li>
              <li>Etalase publik eksklusif dengan link toko sendiri.</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 border-2 border-black dark:border-white rounded-xl font-black text-xs uppercase hover:bg-gray-100 dark:hover:bg-zinc-800 shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2.5 bg-neoGreen hover:bg-emerald-400 text-black border-3 border-black rounded-xl font-black text-xs uppercase tracking-wider shadow-neo active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2"
            >
              <span>{loading ? '⏳' : '🚀'}</span>
              <span>{loading ? 'Membuka Toko...' : 'Buka Toko Sekarang'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
