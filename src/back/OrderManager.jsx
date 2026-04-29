import { useState } from 'react'
import { formatPrice, formatDate } from '../utils'

export default function OrderManager({ transactions, onUpdateStatus }) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)

  const filtered = [...transactions]
    .filter(t =>
      (t._id || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.customerName || '').toLowerCase().includes(search.toLowerCase())
    )

  const totalRevenue = transactions.reduce((s, t) => s + t.total, 0)

  return (
    <div className="space-y-8">
      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-black/[0.02] border border-gray-100 flex items-center gap-6 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-bl-full z-0 group-hover:scale-110 transition-transform" />
           <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-2xl shadow-inner relative z-10">🧾</div>
           <div className="relative z-10">
              <div className="text-3xl font-black text-gray-900 tracking-tighter leading-none mb-1">{transactions.length}</div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Ledger Entries</div>
           </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-black/[0.02] border border-gray-100 flex items-center gap-6 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-shopee/5 rounded-bl-full z-0 group-hover:scale-110 transition-transform" />
           <div className="w-14 h-14 rounded-2xl bg-shopeeLight flex items-center justify-center text-2xl shadow-inner relative z-10">💰</div>
           <div className="relative z-10">
              <div className="text-3xl font-black text-shopee tracking-tighter leading-none mb-1">{formatPrice(totalRevenue)}</div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Gross Accumulated Revenue</div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-black/[0.03] border border-gray-100 overflow-hidden animate-fade-in">
        {/* Header/Lookup */}
        <div className="px-8 py-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-xl shadow-lg">🧾</div>
              <div>
                 <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Transaction Log</h2>
                 <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Enterprise Ledger Management</p>
              </div>
           </div>
           
           <div className="relative group md:w-80">
              <input
                id="order-search"
                className="w-full bg-gray-50 border border-transparent focus:border-gray-900 focus:bg-white px-10 py-3 rounded-xl text-xs font-medium outline-none transition-all placeholder:font-bold placeholder:uppercase placeholder:text-gray-300 placeholder:tracking-widest"
                type="text"
                placeholder="Search By ID / Customer…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 grayscale opacity-30 text-sm">🔍</span>
           </div>
        </div>

        {/* Table/Empty State */}
        <div className="overflow-x-auto no-scrollbar">
          {filtered.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center grayscale opacity-30 text-center animate-fade-in">
              <div className="text-8xl mb-8 font-black">📭</div>
              <h3 className="text-xl font-black text-gray-800 mb-2 uppercase tracking-tighter">{search ? 'No Records Found' : 'Ledger Inactive'}</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">{search ? 'Adjust your lookup parameters to locate specific transactions.' : 'Sales records will populate here automatically upon customer checkout.'}</p>
            </div>
          ) : (
            <table className="w-full text-left whitespace-nowrap border-separate border-spacing-0">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Trace ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Authorized Customer</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Timestamp</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Volume</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Settlement</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Status</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Expansion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((t, idx) => (
                  <>
                    <tr key={t._id} className={`hover:bg-gray-50/50 transition-colors animate-fade-in ${expanded === t._id ? 'bg-gray-50/50' : ''}`} style={{ animationDelay: `${idx * 0.03}s` }}>
                      <td className="px-8 py-5">
                         <span className="text-[10px] font-black font-mono text-shopee bg-shopeeLight px-2 py-1 rounded-md">{t._id}</span>
                      </td>
                      <td className="px-6 py-5 text-xs font-black text-gray-900 uppercase tracking-tight">{t.customerName || '—'}</td>
                      <td className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formatDate(t.timestamp)}</td>
                      <td className="px-6 py-5 text-xs font-bold text-gray-600">{t.items.reduce((s,i) => s+i.qty, 0)} Units</td>
                      <td className="px-6 py-5 text-sm font-black text-gray-900 tracking-tighter">{formatPrice(t.total)}</td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm transition-colors ${
                          t.status === 'Delivered' ? 'bg-green-50 text-green-600 border-green-100 shadow-green-200/50' :
                          t.status === 'Shipped' ? 'bg-blue-50 text-blue-600 border-blue-100 shadow-blue-200/50' :
                          'bg-orange-50 text-orange-600 border-orange-100 shadow-orange-200/50'
                        }`}>
                          {t.status || 'Processing'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          id={`expand-order-${t._id}`}
                          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                            expanded === t._id 
                              ? 'bg-shopee text-white shadow-lg shadow-shopee/20' 
                              : 'bg-white border border-gray-100 text-gray-400 hover:text-gray-900 hover:border-gray-900'
                          }`}
                          onClick={() => setExpanded(expanded === t._id ? null : t._id)}
                        >
                          {expanded === t._id ? 'Omit Details' : 'View Manifest'}
                        </button>
                      </td>
                    </tr>
                    {expanded === t._id && (
                      <tr key={`${t._id}-detail`} className="animate-fade-in-up">
                        <td colSpan={7} className="px-8 py-6 bg-gray-50/80 border-y border-gray-100">
                          <div className="bg-white rounded-3xl p-8 shadow-inner border border-gray-100 max-w-2xl mx-auto space-y-6">
                             <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Manifest Breakdown</h4>
                                <span className="text-[10px] font-mono font-bold text-gray-300"># {t._id}</span>
                             </div>
                             
                             <div className="space-y-4">
                                {t.items.map(item => (
                                  <div key={item.id} className="flex justify-between items-center group">
                                     <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-xs opacity-40">📦</div>
                                        <div>
                                           <div className="text-xs font-bold text-gray-800 group-hover:text-shopee transition-colors">{item.name}</div>
                                           <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Volume: {item.qty} &bull; Unit: {formatPrice(item.price)}</div>
                                        </div>
                                     </div>
                                     <span className="text-sm font-black text-gray-900 tracking-tighter">{formatPrice(item.price * item.qty)}</span>
                                  </div>
                                ))}
                             </div>

                             <div className="pt-6 border-t border-gray-900 flex justify-between items-center">
                                <div className="flex flex-col">
                                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Consolidated Settlement</span>
                                   <span className="text-[9px] text-green-500 font-bold uppercase tracking-[0.2em] mt-1">Secured via Semarketplace Gateway</span>
                                </div>
                                <span className="text-2xl font-black text-shopee tracking-tighter">{formatPrice(t.total)}</span>
                             </div>

                             <div className="pt-6 border-t border-gray-100 flex flex-col gap-4">
                                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fulfillment Control</h4>
                                 <div className="flex flex-wrap gap-3">
                                    {['Processing', 'Shipped', 'Delivered'].map(status => (
                                      <button
                                        key={status}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                          t.status === status 
                                            ? 'bg-shopee text-white border-shopee shadow-lg shadow-shopee/20' 
                                            : 'bg-white border-gray-100 text-gray-400 hover:border-gray-900 hover:text-gray-900'
                                        }`}
                                        onClick={() => onUpdateStatus?.(t._id || t.id, status)}
                                      >
                                        {status === 'Processing' && '⚙️ '}
                                        {status === 'Shipped' && '🚚 '}
                                        {status === 'Delivered' && '✅ '}
                                        Mark as {status}
                                      </button>
                                    ))}
                                 </div>
                              </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

