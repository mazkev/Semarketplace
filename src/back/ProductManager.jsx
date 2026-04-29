import { useState } from 'react'
import { formatPrice, CATEGORIES } from '../utils'
import { apiFetch } from '../api'

const EMPTY_FORM = { name: '', price: '', originalPrice: '', image: '', category: 'Electronics', stock: '', rating: '', description: '', isFlashSale: false }

export default function ProductManager({ products, setProducts, showToast }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editId, setEditId]         = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [errors, setErrors]         = useState({})
  const [search, setSearch]         = useState('')
  const [saving, setSaving]         = useState(false)

  const f = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.price || isNaN(form.price) || +form.price <= 0) e.price = 'Enter a valid price'
    return e
  }

  const openAdd = () => {
    setEditId(null); setForm(EMPTY_FORM); setErrors({})
    setDrawerOpen(true)
  }

  const openEdit = p => {
    setEditId(p._id)
    setForm({
      name: p.name, 
      price: String(p.price),
      originalPrice: String(p.originalPrice || ''),
      image: p.image || '', 
      category: p.category || 'Electronics',
      stock: String(p.stock || ''), 
      rating: String(p.rating || ''),
      description: p.description || '',
      isFlashSale: !!p.isFlashSale
    })
    setErrors({})
    setDrawerOpen(true)
  }

  const handleSave = async e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        price: parseFloat(form.price),
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
        image: form.image.trim(),
        category: form.category,
        stock: form.stock ? parseInt(form.stock) : undefined,
        rating: form.rating ? parseFloat(form.rating) : undefined,
        description: form.description.trim(),
        isFlashSale: form.isFlashSale
      }

      if (editId) {
        const updated = await apiFetch(`/products/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        })
        setProducts(prev => prev.map(p => p._id === editId ? updated : p))
        showToast('Product updated!', 'success')
      } else {
        const newItem = await apiFetch('/products', {
          method: 'POST',
          body: JSON.stringify({ ...payload, sold: 0 })
        })
        setProducts(prev => [newItem, ...prev])
        showToast('Product created!', 'success')
      }
      setDrawerOpen(false)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async id => {
    if (!confirm('Are you sure you want to remove this product?')) return
    try {
      await apiFetch(`/products/${id}`, { method: 'DELETE' })
      setProducts(prev => prev.filter(p => p._id !== id))
      showToast('Product removed.', 'info')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-xl shadow-black/[0.03] border border-gray-100 overflow-hidden animate-fade-in">
        {/* Header/Filters */}
        <div className="px-8 py-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-shopeeLight rounded-xl flex items-center justify-center text-xl">📦</div>
             <div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Catalog Inventory</h2>
                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{products.length} Items Listed</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative group flex-1 md:w-64">
              <input
                id="product-search"
                className="w-full bg-gray-50 border border-transparent focus:border-shopee focus:bg-white px-10 py-3 rounded-xl text-xs font-medium outline-none transition-all placeholder:font-bold placeholder:uppercase placeholder:text-gray-300 placeholder:tracking-widest"
                type="text"
                placeholder="Product Lookup…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 grayscale opacity-30 text-sm">🔍</span>
            </div>
            <button 
              id="add-product-btn" 
              className="bg-shopee hover:bg-shopeeHover text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-shopee/20 transition-all flex items-center gap-2" 
              onClick={openAdd}
            >
              <span>+</span> Create Product
            </button>
          </div>
        </div>

        {/* Table/Empty State */}
        <div className="overflow-x-auto no-scrollbar">
          {filtered.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center grayscale opacity-30 text-center animate-fade-in">
              <div className="text-8xl mb-8 font-black">{search ? '🔍' : '📦'}</div>
              <h3 className="text-xl font-black text-gray-800 mb-2 uppercase tracking-tighter">{search ? 'No Matches Found' : 'Catalog Empty'}</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">{search ? 'Try adjusting your search filters to find what you need.' : 'Click the button above to populate your marketplace with high-quality products.'}</p>
            </div>
          ) : (
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Asset</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Grouping</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Valuation</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Availability</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Promo</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p, idx) => (
                  <tr key={p._id} className="hover:bg-gray-50/50 transition-colors group animate-fade-in" style={{ animationDelay: `${idx * 0.03}s` }}>
                    <td className="px-8 py-5">
                      <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden border border-gray-100 shadow-inner p-1 group-hover:scale-105 transition-transform">
                        {p.image
                          ? <img src={p.image} alt={p.name} className="w-full h-full object-cover rounded-lg" />
                          : <div className="flex items-center justify-center h-full text-xl grayscale opacity-30">📦</div>
                        }
                      </div>
                    </td>
                    <td className="px-6 py-5 max-w-[280px]">
                      <div className="text-xs font-black text-gray-900 truncate leading-none uppercase tracking-tight">{p.name}</div>
                      <div className="text-[10px] font-mono font-bold text-shopee mt-2 opacity-60">REF: {p._id}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-gray-200">{p.category || '—'}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-black text-gray-900 tracking-tighter">{formatPrice(p.price)}</div>
                      {p.originalPrice && <div className="text-[10px] text-gray-300 font-bold line-through mt-0.5">{formatPrice(p.originalPrice)}</div>}
                    </td>
                    <td className="px-6 py-5">
                      {p.stock !== undefined ? (
                        <div className="flex flex-col gap-1.5 w-24">
                           <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                              <span className={p.stock < 20 ? 'text-red-500' : 'text-gray-400'}>{p.stock < 20 ? 'Critical' : 'Stable'}</span>
                              <span className="text-gray-900">{p.stock}</span>
                           </div>
                           <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full ${p.stock < 20 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, (p.stock / 100) * 100)}%` }} />
                           </div>
                        </div>
                      ) : (
                        <span className="text-gray-200">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                       {p.isFlashSale ? (
                         <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-amber-100 animate-pulse">⚡ Flash Sale</span>
                       ) : (
                         <span className="text-gray-200 text-[8px] font-black uppercase tracking-widest">Regular</span>
                       )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          id={`edit-${p._id}`} 
                          className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-shopee hover:border-shopee hover:shadow-lg hover:shadow-shopee/10 transition-all" 
                          onClick={() => openEdit(p)}
                          title="Modify Entry"
                        >
                          ✏️
                        </button>
                        <button 
                          id={`del-${p._id}`} 
                          className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-red-500 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/10 transition-all" 
                          onClick={() => handleDelete(p._id)}
                          title="Purge Entry"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Form Drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] transition-opacity" onClick={() => setDrawerOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-[500px] bg-white z-[201] shadow-2xl flex flex-col animate-slide-in-right overflow-hidden" role="dialog">
            
            <div className="px-8 py-8 border-b border-gray-100 flex items-center justify-between bg-white relative z-10 shadow-sm">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-2xl shadow-xl">
                   {editId ? '✏️' : '✨'}
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter leading-none">{editId ? 'Update Asset' : 'New Listing'}</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{editId ? 'Modify metadata & pricing' : 'Create new marketplace listing'}</p>
                 </div>
              </div>
              <button className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors" onClick={() => setDrawerOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSave} noValidate className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8 pb-32">
                
                {/* Visual Preview Section */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Asset Visualization</label>
                  <div className="relative group aspect-video rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-shopee hover:bg-shopee/5">
                    {form.image ? (
                      <img src={form.image} alt="Asset Visualization" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                    ) : (
                      <div className="text-center p-10 opacity-30 group-hover:opacity-100 transition-opacity">
                         <div className="text-5xl mb-4 grayscale">🖼️</div>
                         <p className="text-xs font-black uppercase tracking-widest">Preview Unavailable</p>
                         <p className="text-[10px] mt-1 font-medium italic">Paste image URL below to visualize</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                       <p className="text-white text-[10px] font-black uppercase tracking-widest bg-black/60 px-4 py-2 rounded-full border border-white/20">Active Preview Module</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Identity & Branding *</label>
                    <input 
                      id="form-name" 
                      className={`w-full px-6 py-4 rounded-2xl bg-gray-50 border outline-none transition-all text-sm font-bold shadow-inner ${
                        errors.name ? 'border-red-400 bg-red-50/30' : 'border-gray-100 focus:border-gray-900 focus:bg-white focus:ring-4 focus:ring-gray-900/5'
                      }`}
                      placeholder="Input High-Level Product Designation"
                      value={form.name} 
                      onChange={e => f('name', e.target.value)} 
                    />
                    {errors.name && <p className="text-[10px] text-red-500 font-black px-4 animate-pulse">CRITICAL: {errors.name}</p>}
                  </div>

                  {/* Informative Description Field */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Informative Description</label>
                    <textarea 
                      id="form-description" 
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none transition-all text-xs font-medium shadow-inner focus:border-gray-900 focus:bg-white focus:ring-4 focus:ring-gray-900/5 min-h-[120px] resize-none"
                      placeholder="Provide an elite narrative for this product. Highlight materials, tech specs, and craftsmanship..."
                      value={form.description} 
                      onChange={e => f('description', e.target.value)} 
                    />
                  </div>

                  {/* Promotion Toggle */}
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center justify-between">
                     <div>
                        <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Flash Sale Promotion</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Feature this item in the Lightning Deals section</div>
                     </div>
                     <button 
                       type="button"
                       className={`w-14 h-8 rounded-full transition-all relative ${form.isFlashSale ? 'bg-amber-500' : 'bg-slate-200'}`}
                       onClick={() => f('isFlashSale', !form.isFlashSale)}
                     >
                       <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md ${form.isFlashSale ? 'left-7' : 'left-1'}`} />
                     </button>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Listing Price *</label>
                      <input 
                        id="form-price" 
                        type="number" 
                        className={`w-full px-6 py-4 rounded-2xl bg-gray-50 border outline-none transition-all text-sm font-bold shadow-inner ${
                          errors.price ? 'border-red-400 bg-red-50/30' : 'border-gray-100 focus:border-gray-900 focus:bg-white focus:ring-4 focus:ring-gray-900/5'
                        }`}
                        placeholder="0.00"
                        value={form.price} 
                        onChange={e => f('price', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2 opacity-60 focus-within:opacity-100 transition-opacity">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">MRSP / Cross-out</label>
                      <input 
                        id="form-orig-price" 
                        type="number" 
                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none transition-all text-sm font-bold shadow-inner focus:border-gray-900 focus:bg-white"
                        placeholder="0.00"
                        value={form.originalPrice} 
                        onChange={e => f('originalPrice', e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Classification Unit</label>
                    <select 
                      id="form-category" 
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none transition-all text-sm font-bold shadow-inner focus:border-gray-900 focus:bg-white appearance-none cursor-pointer"
                      value={form.category} 
                      onChange={e => f('category', e.target.value)}
                    >
                      {CATEGORIES.filter(c => c.id !== 'All').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Initial Stock</label>
                      <input id="form-stock" className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none transition-all text-sm font-bold shadow-inner focus:border-gray-900 focus:bg-white"
                        type="number" placeholder="0" value={form.stock} onChange={e => f('stock', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Base Rating</label>
                      <input id="form-rating" className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none transition-all text-sm font-bold shadow-inner focus:border-gray-900 focus:bg-white"
                        type="number" step="0.1" placeholder="4.5" value={form.rating} onChange={e => f('rating', e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Media Source Locator</label>
                    <input id="form-image" className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none transition-all text-xs font-mono font-bold tracking-tight shadow-inner focus:border-gray-900 focus:bg-white"
                      type="url" placeholder="https://cloud.cdn.com/product-image.webp" value={form.image} onChange={e => f('image', e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 w-full p-8 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-20 flex gap-4">
                <button 
                  id="save-product-btn" 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 bg-gray-900 text-white hover:bg-black py-4 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl transition-all hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] disabled:opacity-50"
                >
                  {saving ? 'Processing…' : (editId ? 'Commit Changes' : 'Initialize Asset')}
                </button>
                <button 
                  type="button" 
                  className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-black text-[12px] uppercase tracking-widest transition-all" 
                  onClick={() => setDrawerOpen(false)}
                >
                  Void
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}

