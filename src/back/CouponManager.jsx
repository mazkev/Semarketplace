import { useState, useEffect } from 'react'
import { apiFetch } from '../api'
import { formatPrice } from '../utils'

export default function CouponManager({ showToast }) {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState(null) // NEW: Tracking ID for inline confirmation
  const [newCoupon, setNewCoupon] = useState({ code: '', type: 'percentage', value: 0, active: true })

  const fetchCoupons = async () => {
    try {
      const data = await apiFetch('/coupons')
      setCoupons(data)
    } catch (err) {
      showToast('Failed to fetch coupons', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCoupons() }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      await apiFetch('/coupons', { method: 'POST', body: JSON.stringify(newCoupon) })
      showToast('Coupon created successfully', 'success')
      setShowForm(false)
      setNewCoupon({ code: '', type: 'percentage', value: 0, active: true })
      fetchCoupons()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDelete = async (id) => {
    try {
      await apiFetch(`/coupons/${id}`, { method: 'DELETE' })
      showToast('Coupon deleted successfully', 'info')
      setDeletingId(null)
      fetchCoupons()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Promotional Engine</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage discounts and seasonal offers</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all"
        >
          {showForm ? 'Cancel Operation' : 'Generate New Coupon'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl animate-fade-in space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coupon Code</label>
              <input 
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-widest outline-none focus:ring-2 ring-indigo-500 transition-all"
                placeholder="E.G. SUMMER20"
                value={newCoupon.code}
                onChange={e => setNewCoupon({...newCoupon, code: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Discount Type</label>
              <select 
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-indigo-500 transition-all"
                value={newCoupon.type}
                onChange={e => setNewCoupon({...newCoupon, type: e.target.value})}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (IDR)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Value</label>
              <input 
                type="number"
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-indigo-500 transition-all"
                value={newCoupon.value}
                onChange={e => setNewCoupon({...newCoupon, value: parseInt(e.target.value)})}
                required
              />
            </div>
          </div>
          <button className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-indigo-600 transition-colors">
            Deploy Promotion
          </button>
        </form>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Code</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Value</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {coupons.map((c, idx) => {
              const id = c._id || c.id;
              const isConfirming = deletingId === id;

              return (
                <tr key={id || idx} className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors animate-fade-in ${isConfirming ? 'bg-rose-50/50 dark:bg-rose-900/10' : ''}`} style={{ animationDelay: `${idx * 0.05}s` }}>
                  <td className="px-8 py-5">
                    <span className="text-[11px] font-black font-mono text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-lg uppercase tracking-widest">{c.code}</span>
                  </td>
                  <td className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{c.type}</td>
                  <td className="px-6 py-5 text-sm font-black text-slate-900 dark:text-white">
                    {c.type === 'percentage' ? `${c.value}%` : formatPrice(c.value)}
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${c.active ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                      {c.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    {isConfirming ? (
                      <div className="flex items-center justify-end gap-3 animate-scale-in">
                        <button 
                          onClick={() => setDeletingId(null)}
                          className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleDelete(id)}
                          className="bg-rose-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20"
                        >
                          Confirm Delete
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setDeletingId(id)}
                        className="p-2 text-slate-400 hover:text-rose-500 transition-all hover:scale-125"
                        title="Delete Coupon"
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {coupons.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center">
                  <div className="text-4xl mb-4 grayscale opacity-20">🎫</div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No promotions currently active</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
