import { useState, useEffect } from 'react'
import { apiFetch } from '../api'
import { formatPrice } from '../utils'

export default function CustomerManager({ showToast }) {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [inspecting, setInspecting] = useState(null)
  const [editing, setEditing] = useState(null)
  const [customerOrders, setCustomerOrders] = useState([])

  const fetchData = async () => {
    try {
      const data = await apiFetch('/analytics/overview')
      setCustomers(data.customerInsights || [])
    } catch (err) {
      showToast('Failed to load customer data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleVIP = async (c) => {
    try {
      const updated = await apiFetch(`/users/${c._id}`, {
        method: 'PUT',
        body: JSON.stringify({ isVIP: !c.isVIP, manualVIP: !c.isVIP })
      })
      setCustomers(prev => prev.map(u => u._id === c._id ? { ...u, ...updated } : u))
      showToast(c.isVIP ? 'VIP status revoked' : 'Promoted to VIP!', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDelete = async (id) => {
    if (id === 'u1') return showToast('Cannot delete system administrator', 'error')
    if (!confirm('Permanently remove this customer and their data?')) return
    try {
      await apiFetch(`/users/${id}`, { method: 'DELETE' })
      setCustomers(prev => prev.filter(u => u._id !== id))
      showToast('Customer purged.', 'info')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        name: editing.name,
        email: editing.email,
        role: editing.role,
        isAdmin: editing.role === 'Admin'
      }
      const updated = await apiFetch(`/users/${editing._id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
      setCustomers(prev => prev.map(u => u._id === editing._id ? { ...u, ...updated } : u))
      showToast('Member profile updated', 'success')
      setEditing(null)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const openInspect = async (c) => {
    setInspecting(c)
    try {
      const allOrders = await apiFetch('/orders')
      const filtered = allOrders.filter(o => o.customerId === c._id || o.customerEmail === c.email)
      setCustomerOrders(filtered)
    } catch (err) {
      showToast('Failed to load history', 'error')
    }
  }

  useEffect(() => { fetchData() }, [])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Customer Relations</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Lifecycle monitoring & VIP identification</p>
        </div>
        <div className="bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
           <div className="text-right">
              <div className="text-sm font-black text-indigo-600 leading-none">{customers.length}</div>
              <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Users</div>
           </div>
           <div className="w-px h-6 bg-slate-100 dark:bg-slate-800"></div>
           <div className="text-right">
              <div className="text-sm font-black text-amber-500 leading-none">{customers.filter(c => c.isVIP).length}</div>
              <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">VIP Elite</div>
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
        <table className="w-full text-left whitespace-nowrap">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized User</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Role</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transactions</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lifetime Value</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {customers.map((c, idx) => (
              <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                <td className="px-8 py-5">
                   <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-inner ${c.isVIP ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                         {c.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                         <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{c.name}</div>
                         <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{c.email}</div>
                      </div>
                   </div>
                </td>
                <td className="px-6 py-5">
                   <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                     c.role === 'Admin' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                     c.role === 'Support' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                     'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                   }`}>
                     {c.role || 'Customer'}
                   </span>
                </td>
                <td className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400">{c.orderCount || 0} Orders</td>
                <td className="px-6 py-5">
                   <div className="text-sm font-black text-slate-900 dark:text-white tracking-tighter">{formatPrice(c.totalSpent || 0)}</div>
                </td>
                <td className="px-8 py-5 text-right">
                   <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => setEditing(c)}
                        className="w-8 h-8 flex items-center justify-center bg-indigo-50 text-indigo-500 rounded-lg hover:bg-indigo-500 hover:text-white transition-all"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => openInspect(c)}
                        className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-black transition-all"
                      >
                        👁️
                      </button>
                      <button 
                        onClick={() => handleDelete(c._id)}
                        className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"
                      >
                        🗑️
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      {editing && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" onClick={() => setEditing(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 z-[201] rounded-[32px] shadow-2xl overflow-hidden animate-scale-in">
             <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Edit Member Identity</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Modify access level & credentials</p>
             </div>
             <form onSubmit={handleUpdateUser} className="p-8 space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Display Name</label>
                   <input 
                     className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-3 text-xs font-bold focus:border-indigo-500 outline-none transition-all"
                     value={editing.name}
                     onChange={e => setEditing({...editing, name: e.target.value})}
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                   <input 
                     className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-3 text-xs font-bold focus:border-indigo-500 outline-none transition-all"
                     value={editing.email}
                     onChange={e => setEditing({...editing, email: e.target.value})}
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Security Role</label>
                   <select 
                     className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-3 text-xs font-bold focus:border-indigo-500 outline-none transition-all appearance-none"
                     value={editing.role || 'Customer'}
                     onChange={e => setEditing({...editing, role: e.target.value})}
                   >
                     <option value="Customer">Standard Customer</option>
                     <option value="Support">Support Staff</option>
                     <option value="Admin">System Administrator</option>
                   </select>
                </div>
                <div className="pt-4 flex gap-3">
                   <button 
                    type="button"
                    onClick={() => setEditing(null)}
                    className="flex-1 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all border border-slate-100 dark:border-slate-800"
                   >
                     Cancel
                   </button>
                   <button 
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all"
                   >
                     Save Changes
                   </button>
                </div>
             </form>
          </div>
        </>
      )}

      {/* Inspection Drawer */}
      {inspecting && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" onClick={() => setInspecting(null)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-[500px] bg-slate-50 dark:bg-slate-950 z-[201] shadow-2xl flex flex-col animate-slide-in-right overflow-hidden">
             <div className="p-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20">👤</div>
                   <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">{inspecting.name}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Transaction History</p>
                   </div>
                </div>
                <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => setInspecting(null)}>✕</button>
             </div>

             <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {customerOrders.length === 0 ? (
                  <div className="py-20 text-center opacity-30">
                     <div className="text-5xl mb-4">🛒</div>
                     <p className="text-xs font-black uppercase tracking-widest">No order records found</p>
                  </div>
                ) : (
                  customerOrders.map(o => (
                    <div key={o._id || o.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                       <div className="flex justify-between items-start">
                          <div>
                             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</div>
                             <div className="text-xs font-black text-slate-900 dark:text-white mt-1 uppercase">{o._id || o.id}</div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                            o.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'
                          }`}>
                            {o.status}
                          </div>
                       </div>
                       <div className="flex justify-between items-end border-t border-slate-50 dark:border-slate-800 pt-4">
                          <div>
                             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Value</div>
                             <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">{formatPrice(o.total)}</div>
                          </div>
                          <div className="text-[9px] font-bold text-slate-400">{new Date(o.timestamp).toLocaleDateString()}</div>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        </>
      )}
    </div>
  )
}
