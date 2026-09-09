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
      <div className="bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-neo-lg overflow-hidden">
        {/* Header/Filters */}
        <div className="px-6 py-5 border-b-4 border-black dark:border-white bg-neoCream dark:bg-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="w-11 h-11 bg-neoYellow border-2 border-black flex items-center justify-center text-xl shadow-neo-sm font-black">📦</div>
             <div>
                <h2 className="text-base font-black text-black dark:text-white uppercase tracking-wider leading-none">Catalog Inventory</h2>
                <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest">{products.length} Items Listed</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative group flex-1 md:w-64">
              <input
                id="product-search"
                className="w-full bg-white dark:bg-zinc-900 border-3 border-black text-black dark:text-white px-9 py-2.5 text-xs font-bold shadow-neo-sm outline-none transition-all placeholder:font-black placeholder:uppercase placeholder:text-gray-400 focus:translate-x-0.5 focus:translate-y-0.5 focus:shadow-none"
                type="text"
                placeholder="Product Lookup…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🔍</span>
            </div>
            <button 
              id="add-product-btn" 
              className="bg-neoYellow hover:bg-yellow-300 text-black border-3 border-black px-5 py-2.5 font-black text-xs uppercase tracking-wider shadow-neo active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2" 
              onClick={openAdd}
            >
              <span className="text-base leading-none">+</span> Create Product
            </button>
          </div>
        </div>

        {/* Table/Empty State */}
        <div className="overflow-x-auto no-scrollbar">
          {filtered.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center p-6">
              <div className="text-6xl mb-4 font-black">{search ? '🔍' : '📦'}</div>
              <h3 className="text-xl font-black text-black dark:text-white mb-2 uppercase tracking-tight">{search ? 'No Matches Found' : 'Catalog Empty'}</h3>
              <p className="text-xs font-bold text-gray-500 max-w-xs mx-auto leading-relaxed">{search ? 'Try adjusting your search filters to find what you need.' : 'Click the button above to populate your marketplace with high-quality products.'}</p>
            </div>
          ) : (
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-neoYellow border-b-3 border-black text-black">
                  <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest border-r-2 border-black">Asset</th>
                  <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest border-r-2 border-black">Description</th>
                  <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest border-r-2 border-black">Grouping</th>
                  <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest border-r-2 border-black">Valuation</th>
                  <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest border-r-2 border-black">Availability</th>
                  <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest border-r-2 border-black">Promo</th>
                  <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/10 dark:divide-white/10 font-bold">
                {filtered.map((p, idx) => (
                  <tr key={p._id} className="hover:bg-yellow-50/70 dark:hover:bg-zinc-800/60 transition-colors">
                    <td className="px-6 py-4 border-r-2 border-black/10 dark:border-white/10">
                      <div className="w-14 h-14 bg-white border-2 border-black shadow-neo-sm overflow-hidden p-0.5">
                        {p.image
                          ? <img 
                              src={p.image} 
                              alt={p.name} 
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&auto=format&fit=crop&q=80';
                              }}
                            />
                          : <div className="flex items-center justify-center h-full text-xl">📦</div>
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-[280px] border-r-2 border-black/10 dark:border-white/10">
                      <div className="text-xs font-black text-black dark:text-white truncate uppercase tracking-tight">{p.name}</div>
                      <div className="text-[10px] font-mono font-bold text-gray-500 mt-1">REF: {p._id}</div>
                    </td>
                    <td className="px-6 py-4 border-r-2 border-black/10 dark:border-white/10">
                      <span className="px-2.5 py-1 bg-neoCyan/20 text-black dark:text-white border-2 border-black text-[10px] font-black uppercase tracking-wider shadow-neo-sm">{p.category || '—'}</span>
                    </td>
                    <td className="px-6 py-4 border-r-2 border-black/10 dark:border-white/10">
                      <div className="text-sm font-black text-black dark:text-white tracking-tight">{formatPrice(p.price)}</div>
                      {p.originalPrice && <div className="text-[10px] text-gray-400 font-bold line-through">{formatPrice(p.originalPrice)}</div>}
                    </td>
                    <td className="px-6 py-4 border-r-2 border-black/10 dark:border-white/10">
                      {p.stock !== undefined ? (
                        <div className="flex flex-col gap-1.5 w-24">
                           <div className="flex justify-between items-center text-[10px] font-black uppercase">
                              <span className={p.stock < 20 ? 'text-neoPink' : 'text-gray-500'}>{p.stock < 20 ? 'CRITICAL' : 'STABLE'}</span>
                              <span className="text-black dark:text-white">{p.stock}</span>
                           </div>
                           <div className="h-2 bg-gray-200 dark:bg-zinc-700 border border-black overflow-hidden">
                              <div className={`h-full ${p.stock < 20 ? 'bg-neoPink' : 'bg-neoGreen'}`} style={{ width: `${Math.min(100, (p.stock / 100) * 100)}%` }} />
                           </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 border-r-2 border-black/10 dark:border-white/10">
                       {p.isFlashSale ? (
                         <span className="px-2 py-0.5 bg-neoPink text-white border-2 border-black text-[9px] font-black uppercase tracking-wider shadow-neo-sm">⚡ SALE</span>
                       ) : (
                         <span className="text-gray-400 text-[10px] font-black uppercase">Standard</span>
                       )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          id={`edit-${p._id}`} 
                          className="w-9 h-9 flex items-center justify-center bg-white dark:bg-zinc-800 border-2 border-black text-black dark:text-white shadow-neo-sm hover:bg-neoYellow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:scale-95 transition-all" 
                          onClick={() => openEdit(p)}
                          title="Modify Entry"
                        >
                          ✏️
                        </button>
                        <button 
                          id={`del-${p._id}`} 
                          className="w-9 h-9 flex items-center justify-center bg-white dark:bg-zinc-800 border-2 border-black text-black dark:text-white shadow-neo-sm hover:bg-neoPink hover:text-white hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:scale-95 transition-all" 
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
          <div className="fixed top-0 right-0 h-full w-full max-w-[520px] bg-white dark:bg-zinc-900 z-[201] border-l-4 border-black dark:border-white shadow-neo-xl flex flex-col animate-slide-in-right overflow-hidden" role="dialog">
            
            <div className="px-8 py-6 border-b-4 border-black dark:border-white flex items-center justify-between bg-neoYellow relative z-10">
              <div className="flex items-center gap-3">
                 <div className="w-11 h-11 bg-black text-white border-2 border-black flex items-center justify-center text-xl shadow-neo-sm font-black">
                   {editId ? '✏️' : '✨'}
                 </div>
                 <div>
                    <h2 className="text-lg font-black text-black uppercase tracking-tight leading-none">{editId ? 'Update Asset' : 'New Listing'}</h2>
                    <p className="text-[10px] font-bold text-black/80 uppercase tracking-wider mt-1">{editId ? 'Modify metadata & pricing' : 'Create new marketplace listing'}</p>
                 </div>
              </div>
              <button 
                className="w-9 h-9 bg-white border-2 border-black text-black font-black flex items-center justify-center shadow-neo-sm hover:bg-neoPink hover:text-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all" 
                onClick={() => setDrawerOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} noValidate className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-6 pb-32">
                
                {/* Visual Preview Section */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-black dark:text-white">Asset Preview</label>
                  <div className="relative aspect-video bg-neoCream dark:bg-zinc-800 border-3 border-black dark:border-white shadow-neo-sm flex flex-col items-center justify-center overflow-hidden">
                    {form.image ? (
                      <img 
                        src={form.image} 
                        alt="Asset Visualization" 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&auto=format&fit=crop&q=80';
                        }}
                      />
                    ) : (
                      <div className="text-center p-6 text-gray-500">
                         <div className="text-4xl mb-2">🖼️</div>
                         <p className="text-xs font-black uppercase tracking-wider">Preview Unavailable</p>
                         <p className="text-[10px] font-bold">Paste image URL below to preview</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-black dark:text-white">Product Name *</label>
                    <input 
                      id="form-name" 
                      className={`w-full px-4 py-3 bg-white dark:bg-zinc-800 border-3 border-black dark:border-white shadow-neo-sm outline-none transition-all text-xs font-bold ${
                        errors.name ? 'border-neoPink bg-red-50' : 'text-black dark:text-white'
                      }`}
                      placeholder="Input Product Name"
                      value={form.name} 
                      onChange={e => f('name', e.target.value)} 
                    />
                    {errors.name && <p className="text-[10px] text-neoPink font-black uppercase tracking-wider">{errors.name}</p>}
                  </div>

                  {/* Informative Description Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-black dark:text-white">Description</label>
                    <textarea 
                      id="form-description" 
                      className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-3 border-black dark:border-white shadow-neo-sm outline-none transition-all text-xs font-bold text-black dark:text-white min-h-[100px] resize-none"
                      placeholder="Highlight materials, tech specs, warranty..."
                      value={form.description} 
                      onChange={e => f('description', e.target.value)} 
                    />
                  </div>

                  {/* Promotion Toggle */}
                  <div className="bg-neoCream dark:bg-zinc-800 p-4 border-3 border-black dark:border-white shadow-neo-sm flex items-center justify-between">
                     <div>
                        <div className="text-xs font-black text-black dark:text-white uppercase tracking-wider">Flash Sale Deal</div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase mt-0.5">Feature this item in Lightning Deals</div>
                     </div>
                     <button 
                       type="button"
                       className={`w-14 h-8 border-2 border-black transition-all relative ${form.isFlashSale ? 'bg-neoGreen' : 'bg-gray-300'}`}
                       onClick={() => f('isFlashSale', !form.isFlashSale)}
                     >
                       <div className={`absolute top-0.5 w-6 h-6 bg-white border border-black transition-all shadow-sm ${form.isFlashSale ? 'left-7' : 'left-0.5'}`} />
                     </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-black dark:text-white">Price (IDR) *</label>
                      <input 
                        id="form-price" 
                        type="number" 
                        className={`w-full px-4 py-3 bg-white dark:bg-zinc-800 border-3 border-black dark:border-white shadow-neo-sm outline-none transition-all text-xs font-bold ${
                          errors.price ? 'border-neoPink bg-red-50' : 'text-black dark:text-white'
                        }`}
                        placeholder="0"
                        value={form.price} 
                        onChange={e => f('price', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-black dark:text-white">Original Price</label>
                      <input 
                        id="form-orig-price" 
                        type="number" 
                        className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-3 border-black dark:border-white shadow-neo-sm outline-none transition-all text-xs font-bold text-black dark:text-white"
                        placeholder="0"
                        value={form.originalPrice} 
                        onChange={e => f('originalPrice', e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-black dark:text-white">Category</label>
                    <select 
                      id="form-category" 
                      className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-3 border-black dark:border-white shadow-neo-sm outline-none transition-all text-xs font-bold text-black dark:text-white cursor-pointer"
                      value={form.category} 
                      onChange={e => f('category', e.target.value)}
                    >
                      {CATEGORIES.filter(c => c.id !== 'All').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-black dark:text-white">Stock Count</label>
                      <input id="form-stock" className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-3 border-black dark:border-white shadow-neo-sm outline-none text-xs font-bold text-black dark:text-white"
                        type="number" placeholder="0" value={form.stock} onChange={e => f('stock', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-black dark:text-white">Rating (0-5)</label>
                      <input id="form-rating" className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-3 border-black dark:border-white shadow-neo-sm outline-none text-xs font-bold text-black dark:text-white"
                        type="number" step="0.1" placeholder="4.8" value={form.rating} onChange={e => f('rating', e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-black dark:text-white">Image URL</label>
                    <input id="form-image" className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-3 border-black dark:border-white shadow-neo-sm outline-none text-xs font-mono font-bold text-black dark:text-white"
                      type="url" placeholder="https://images.unsplash.com/..." value={form.image} onChange={e => f('image', e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 w-full p-6 bg-white dark:bg-zinc-900 border-t-4 border-black dark:border-white z-20 flex gap-4 shadow-neo-lg">
                <button 
                  id="save-product-btn" 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 bg-neoYellow hover:bg-yellow-300 text-black border-3 border-black py-3.5 font-black text-xs uppercase tracking-wider shadow-neo hover:shadow-neo-md active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
                >
                  {saving ? 'Processing…' : (editId ? 'Commit Changes ➔' : 'Create Product ➔')}
                </button>
                <button 
                  type="button" 
                  className="px-6 py-3.5 bg-white dark:bg-zinc-800 text-black dark:text-white border-3 border-black font-black text-xs uppercase tracking-wider shadow-neo hover:bg-gray-100 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all" 
                  onClick={() => setDrawerOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
