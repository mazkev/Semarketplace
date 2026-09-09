import React, { useState } from 'react'
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
    <div className="space-y-8 font-sans">
      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-neoCyan border-3 border-black p-6 shadow-neo flex items-center gap-5">
           <div className="w-12 h-12 bg-white border-2 border-black flex items-center justify-center text-2xl shadow-neo-sm font-black">🧾</div>
           <div>
              <div className="text-3xl font-black text-black tracking-tight leading-none mb-1">{transactions.length}</div>
              <div className="text-xs font-black text-black/80 uppercase tracking-wider leading-none">Total Ledger Entries</div>
           </div>
        </div>
        
        <div className="bg-neoGreen border-3 border-black p-6 shadow-neo flex items-center gap-5">
           <div className="w-12 h-12 bg-white border-2 border-black flex items-center justify-center text-2xl shadow-neo-sm font-black">💰</div>
           <div>
              <div className="text-3xl font-black text-black tracking-tight leading-none mb-1">{formatPrice(totalRevenue)}</div>
              <div className="text-xs font-black text-black/80 uppercase tracking-wider leading-none">Gross Accumulated Revenue</div>
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-neo-lg overflow-hidden animate-fade-in">
        {/* Header/Lookup */}
        <div className="px-6 py-5 border-b-4 border-black dark:border-white bg-neoCream dark:bg-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neoYellow border-2 border-black flex items-center justify-center text-xl shadow-neo-sm font-black">🧾</div>
              <div>
                 <h2 className="text-base font-black text-black dark:text-white uppercase tracking-wider leading-none">Transaction Log</h2>
                 <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest">Enterprise Ledger Management</p>
              </div>
           </div>
           
           <div className="relative group md:w-80">
              <input
                id="order-search"
                className="w-full bg-white dark:bg-zinc-900 border-3 border-black text-black dark:text-white px-9 py-2.5 text-xs font-bold shadow-neo-sm outline-none transition-all placeholder:font-black placeholder:uppercase placeholder:text-gray-400 focus:translate-x-0.5 focus:translate-y-0.5 focus:shadow-none"
                type="text"
                placeholder="Search By ID / Customer…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🔍</span>
           </div>
        </div>

        {/* Table/Empty State */}
        <div className="overflow-x-auto no-scrollbar">
          {filtered.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center p-6">
              <div className="text-6xl mb-4 font-black">📭</div>
              <h3 className="text-xl font-black text-black dark:text-white mb-2 uppercase tracking-tight">{search ? 'No Records Found' : 'Ledger Inactive'}</h3>
              <p className="text-xs font-bold text-gray-500 max-w-xs mx-auto leading-relaxed">{search ? 'Adjust your lookup parameters to locate specific transactions.' : 'Sales records will populate here automatically upon customer checkout.'}</p>
            </div>
          ) : (
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-neoYellow border-b-3 border-black text-black">
                  <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest border-r-2 border-black">Trace ID</th>
                  <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest border-r-2 border-black">Customer</th>
                  <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest border-r-2 border-black">Timestamp</th>
                  <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest border-r-2 border-black">Volume</th>
                  <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest border-r-2 border-black">Settlement</th>
                  <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest border-r-2 border-black">Status</th>
                  <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-right">Expansion</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/10 dark:divide-white/10 font-bold">
                {filtered.map((t, idx) => (
                  <React.Fragment key={t._id || t.id || idx}>
                    <tr className="hover:bg-yellow-50/60 dark:hover:bg-zinc-800/60 transition-colors">
                      <td className="px-6 py-4 border-r-2 border-black/10 dark:border-white/10">
                         <span className="text-[10px] font-black font-mono bg-neoCyan/20 border-2 border-black px-2 py-0.5 shadow-neo-sm text-black dark:text-white">{t._id || t.id}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-black dark:text-white uppercase tracking-tight border-r-2 border-black/10 dark:border-white/10">{t.customerName || '—'}</td>
                      <td className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase border-r-2 border-black/10 dark:border-white/10">{formatDate(t.timestamp || t.date)}</td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-600 dark:text-gray-400 border-r-2 border-black/10 dark:border-white/10">{t.items.reduce((s,i) => s+i.qty, 0)} Units</td>
                      <td className="px-6 py-4 text-sm font-black text-black dark:text-white tracking-tight border-r-2 border-black/10 dark:border-white/10">{formatPrice(t.total)}</td>
                      <td className="px-6 py-4 border-r-2 border-black/10 dark:border-white/10">
                        <span className={`px-2.5 py-0.5 border-2 border-black text-[9px] font-black uppercase tracking-wider shadow-neo-sm ${
                          t.status === 'Delivered' ? 'bg-neoGreen text-black' :
                          t.status === 'Shipped' ? 'bg-neoCyan text-black' :
                          'bg-neoYellow text-black'
                        }`}>
                          {t.status || 'Processing'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          id={`expand-order-${t._id || t.id}`}
                          className={`px-3 py-1.5 border-2 border-black text-[10px] font-black uppercase tracking-wider shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all ${
                            expanded === (t._id || t.id) 
                              ? 'bg-black text-white' 
                              : 'bg-white dark:bg-zinc-800 text-black dark:text-white hover:bg-neoYellow'
                          }`}
                          onClick={() => setExpanded(expanded === (t._id || t.id) ? null : (t._id || t.id))}
                        >
                          {expanded === (t._id || t.id) ? 'Hide' : 'Manifest ➔'}
                        </button>
                      </td>
                    </tr>
                    {expanded === (t._id || t.id) && (
                      <tr className="bg-neoCream/50 dark:bg-zinc-800/50">
                        <td colSpan={7} className="px-6 py-5 border-b-2 border-black/20 dark:border-white/20">
                          <div className="bg-white dark:bg-zinc-900 border-3 border-black dark:border-white p-6 shadow-neo max-w-2xl mx-auto space-y-4">
                             <div className="flex items-center justify-between border-b-2 border-black dark:border-white pb-3">
                                <h4 className="text-xs font-black uppercase tracking-wider text-black dark:text-white">Manifest Items Breakdown</h4>
                                <span className="text-[10px] font-mono font-bold bg-neoYellow border border-black px-2 py-0.5">REF: {t._id || t.id}</span>
                             </div>
                             
                             <div className="space-y-2">
                                {t.items.map((item, i) => (
                                  <div key={item.id || i} className="flex justify-between items-center p-2.5 bg-neoCream dark:bg-zinc-800 border border-black shadow-neo-sm">
                                     <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white dark:bg-zinc-700 border border-black flex items-center justify-center text-xs">📦</div>
                                        <div>
                                           <div className="text-xs font-black text-black dark:text-white uppercase">{item.name}</div>
                                           <div className="text-[10px] font-bold text-gray-500 uppercase">Qty: {item.qty} &bull; Unit: {formatPrice(item.price)}</div>
                                        </div>
                                     </div>
                                     <span className="text-xs font-black text-black dark:text-white bg-neoYellow border border-black px-2 py-0.5">{formatPrice(item.price * item.qty)}</span>
                                  </div>
                                ))}
                             </div>

                             <div className="pt-3 border-t-2 border-black dark:border-white flex justify-between items-center">
                                <div>
                                   <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">Total Settlement</span>
                                   <span className="text-[9px] text-neoGreen bg-black px-1.5 py-0.5 font-bold uppercase tracking-wider block mt-0.5">SE-MARKET GATEWAY</span>
                                </div>
                                <span className="text-2xl font-black text-black dark:text-white tracking-tight">{formatPrice(t.total)}</span>
                             </div>

                             <div className="pt-4 border-t-2 border-dashed border-black/20 dark:border-white/20 flex flex-col gap-2">
                                 <h4 className="text-[10px] font-black text-black dark:text-white uppercase tracking-widest">Update Order Status:</h4>
                                 <div className="flex flex-wrap gap-2">
                                    {['Processing', 'Shipped', 'Delivered'].map(status => (
                                      <button
                                        key={status}
                                        className={`px-3 py-1.5 border-2 border-black text-[10px] font-black uppercase tracking-wider shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all ${
                                          t.status === status 
                                            ? 'bg-neoGreen text-black font-black' 
                                            : 'bg-white dark:bg-zinc-800 text-black dark:text-white hover:bg-yellow-50'
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
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
