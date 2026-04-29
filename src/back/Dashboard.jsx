import { formatPrice } from '../utils'

export default function Dashboard({ products, transactions, onNavigate }) {
  const totalRevenue = transactions.reduce((s, t) => s + t.total, 0)
  const totalItems = transactions.reduce((s, t) => s + t.items.reduce((ss, i) => ss + i.qty, 0), 0)

  const stats = [
    { label: 'Total Products', value: products.length, icon: '📦', color: 'orange', action: () => onNavigate('products'), gradient: 'from-orange-500 to-amber-500' },
    { label: 'Total Orders', value: transactions.length, icon: '🧾', color: 'green', action: () => onNavigate('orders'), gradient: 'from-emerald-500 to-teal-500' },
    { label: 'Total Revenue', value: formatPrice(totalRevenue), icon: '💰', color: 'red', action: null, gradient: 'from-rose-500 to-shopee' },
    { label: 'Items Sold', value: totalItems, icon: '🛍️', color: 'blue', action: null, gradient: 'from-blue-500 to-indigo-500' },
  ]

  const recentOrders = [...transactions].reverse().slice(0, 5)

  // --- DYNAMIC CHART CALCULATION ---
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  }).reverse()

  const dailyStats = last7Days.map(dateStr => {
    const dayTransactions = transactions.filter(t => {
      const tDate = new Date(t.timestamp || t.date).toISOString().split('T')[0]
      return tDate === dateStr
    })
    const revenue = dayTransactions.reduce((s, t) => s + t.total, 0)
    return {
      date: dateStr,
      revenue,
      count: dayTransactions.length,
      label: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' })
    }
  })

  const maxRevenue = Math.max(...dailyStats.map(d => d.revenue), 1000000) // At least 1jt for scaling

  return (
    <div className="space-y-10">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-1">
        {stats.map((s, idx) => (
          <div
            key={s.label}
            className={`relative overflow-hidden p-6 rounded-2xl shadow-xl transition-all duration-300 group ${
              s.action ? 'cursor-pointer hover:-translate-y-2' : ''
            }`}
            onClick={s.action || undefined}
          >
            {/* Background Gradient Layer */}
            <div className="absolute inset-0 bg-white group-hover:bg-gray-50 dark:bg-gray-900/50 dark:group-hover:bg-gray-900 transition-colors z-0" />
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${s.gradient} opacity-[0.03] rounded-bl-full z-0`} />
            
            <div className="relative z-10">
               <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-xl shadow-lg shadow-black/10 text-white mb-4 transform group-hover:rotate-12 transition-transform`}>
                 {s.icon}
               </div>
               <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter leading-none mb-1">{s.value}</div>
               <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-xl shadow-black/[0.03] border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
          <div className="px-8 py-6 flex items-center justify-between border-b border-gray-50 dark:border-gray-800">
             <div className="flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Revenue Growth</h3>
             </div>
             <button className="text-[10px] font-black text-shopee uppercase tracking-widest hover:underline px-4 py-2 bg-shopeeLight dark:bg-shopee/10 rounded-full transition-colors" onClick={() => onNavigate('orders')}>
               View Full Ledger
             </button>
          </div>

          {/* Revenue Chart (DYNAMIC) */}
          <div className="px-8 py-10 bg-gray-50/30 dark:bg-black/10 border-b border-gray-50 dark:border-gray-800">
            <div className="flex items-end justify-between h-40 gap-2 px-2">
              {dailyStats.map((d, i) => {
                const height = (d.revenue / maxRevenue) * 100
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-3 group">
                    <div className="w-full bg-shopee/5 dark:bg-white/5 rounded-t-xl relative flex items-end justify-center h-full overflow-hidden">
                      {/* Comparison Goal Line (Simulated) */}
                      <div className="absolute bottom-1/2 left-0 right-0 border-t border-dashed border-gray-200 dark:border-gray-700 z-0" />
                      
                      <div 
                        className="w-full bg-gradient-to-t from-shopee to-shopeeHover rounded-t-xl transition-all duration-1000 ease-out group-hover:brightness-110 z-10" 
                        style={{ height: `${Math.max(height, 5)}%`, transitionDelay: `${i * 50}ms` }}
                      >
                         {/* Hover Tooltip */}
                         <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gray-900 text-white p-3 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 z-50 pointer-events-none">
                            <div className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">{d.date}</div>
                            <div className="text-xs font-black whitespace-nowrap">{formatPrice(d.revenue)}</div>
                            <div className="text-[9px] font-bold text-shopeeLight mt-0.5">{d.count} Transactions</div>
                         </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                       <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tighter">{d.label}</span>
                       {d.revenue > 0 && <span className="text-[8px] font-black text-green-500 mt-0.5">+{Math.round((d.revenue/totalRevenue)*100)}%</span>}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-8 flex items-center justify-center gap-8">
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-md bg-shopee shadow-sm"></div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Real Revenue</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-md border border-dashed border-gray-300 dark:border-gray-600"></div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Threshold</span>
               </div>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto no-scrollbar">
            {recentOrders.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center">
                <div className="text-6xl grayscale opacity-20 mb-4 font-black">📭</div>
                <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">No orders found</h4>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-black/20">
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantity</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Revenue</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {recentOrders.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                      <td className="px-8 py-4 whitespace-nowrap">
                         <span className="text-[10px] font-black font-mono text-shopee bg-shopeeLight dark:bg-shopee/10 px-2 py-0.5 rounded-md">{t.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-200">{t.customerName || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-500 font-medium">{t.items.reduce((s, i) => s + i.qty, 0)} Units</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-black text-gray-900 dark:text-white tracking-tighter">{formatPrice(t.total)}</div>
                      </td>
                      <td className="px-8 py-4">
                        <span className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-100 dark:border-green-800/30">Paid</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Product stock alert Panel */}
        <div className="flex flex-col gap-6">
           {/* Summary Tooltip */}
           <div className="bg-gradient-to-br from-gray-900 to-black dark:from-black dark:to-gray-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-[-10%] right-[-10%] text-white/5 text-9xl font-black rotate-12 group-hover:rotate-0 transition-transform duration-700">🛒</div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-4">Inventory Pulse</p>
              <h2 className="text-3xl font-black mb-2 tracking-tighter">Healthy Store</h2>
              <p className="text-xs text-white/60 font-medium leading-relaxed">Your store maintains an active inventory. Keep an eye on low stock alerts below.</p>
           </div>

           {/* Low Stock Alert List */}
           <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-xl shadow-black/[0.03] border border-gray-100 dark:border-gray-800 p-8 flex-1">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inventory Warnings</h3>
                <span className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 font-black text-[9px] uppercase px-2 py-1 rounded-full border border-red-100 dark:border-red-800/30">
                  {products.filter(p => p.stock !== undefined && p.stock < 20).length} Alerts
                </span>
             </div>

             <div className="space-y-4">
                {products.filter(p => p.stock !== undefined && p.stock < 20).map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between group cursor-pointer animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }} onClick={() => onNavigate('products')}>
                    <div className="min-w-0 pr-4">
                       <div className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate leading-tight group-hover:text-shopee transition-colors">{p.name}</div>
                       <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Ref: {p.id}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                       <div className="text-right">
                          <div className="text-[10px] font-black text-red-600">{p.stock} Left</div>
                          <div className="w-16 h-1 bg-gray-100 dark:bg-gray-800 rounded-full mt-1 overflow-hidden">
                             <div className="bg-red-500 h-full" style={{ width: `${(p.stock / 20) * 100}%` }} />
                          </div>
                       </div>
                       <span className="text-[10px] text-gray-200 group-hover:text-shopee group-hover:translate-x-1 transition-all">→</span>
                    </div>
                  </div>
                ))}
                
                {products.filter(p => p.stock !== undefined && p.stock < 20).length === 0 && (
                  <div className="py-10 text-center">
                    <div className="text-4xl mb-3 opacity-20">🛡️</div>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">All Stock Levels Normal</p>
                  </div>
                )}
             </div>
           </div>
        </div>
      </div>
    </div>
  )
}

