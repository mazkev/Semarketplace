import { formatPrice } from '../utils'

export default function Dashboard({ products, transactions, onNavigate }) {
  const totalRevenue = transactions.reduce((s, t) => s + t.total, 0)
  const totalItems = transactions.reduce((s, t) => s + t.items.reduce((ss, i) => ss + i.qty, 0), 0)

  const stats = [
    { label: 'Total Products', value: products.length, icon: '📦', bg: 'bg-neoYellow', action: () => onNavigate('products') },
    { label: 'Total Orders', value: transactions.length, icon: '🧾', bg: 'bg-neoCyan', action: () => onNavigate('orders') },
    { label: 'Total Revenue', value: formatPrice(totalRevenue), icon: '💰', bg: 'bg-neoGreen', action: null },
    { label: 'Items Sold', value: totalItems, icon: '🛍️', bg: 'bg-neoPink', textWhite: true, action: null },
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

  const maxRevenue = Math.max(...dailyStats.map(d => d.revenue), 1000000)

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`${s.bg} border-3 border-black p-6 shadow-neo transition-all ${
              s.action ? 'cursor-pointer hover:-translate-y-1 hover:shadow-neo-md active:translate-x-1 active:translate-y-1 active:shadow-none' : ''
            }`}
            onClick={s.action || undefined}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl bg-white border-2 border-black w-12 h-12 flex items-center justify-center shadow-neo-sm">
                {s.icon}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5">
                KPI
              </span>
            </div>
            <div className={`text-2xl sm:text-3xl font-black tracking-tight leading-none mb-1 ${s.textWhite ? 'text-white' : 'text-black'}`}>
              {s.value}
            </div>
            <div className={`text-xs font-black uppercase tracking-wider ${s.textWhite ? 'text-white/90' : 'text-black/80'}`}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-neo-lg overflow-hidden flex flex-col">
          <div className="px-6 py-5 flex items-center justify-between border-b-4 border-black dark:border-white bg-neoCream dark:bg-zinc-800">
             <div className="flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">Revenue Growth (Last 7 Days)</h3>
             </div>
             <button 
               className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 bg-neoYellow hover:bg-yellow-300 text-black border-2 border-black shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all" 
               onClick={() => onNavigate('orders')}
             >
               View Orders ➔
             </button>
          </div>

          {/* Revenue Chart (DYNAMIC) */}
          <div className="p-6 sm:p-8 bg-white dark:bg-zinc-900 border-b-4 border-black dark:border-white">
            <div className="flex items-end justify-between h-44 gap-3 px-2">
              {dailyStats.map((d, i) => {
                const height = (d.revenue / maxRevenue) * 100
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full bg-neoCream dark:bg-zinc-800 border-2 border-black relative flex items-end justify-center h-full overflow-hidden shadow-neo-sm">
                      <div 
                        className="w-full bg-neoCyan border-t-2 border-black transition-all duration-700" 
                        style={{ height: `${Math.max(height, 8)}%` }}
                      >
                         {/* Hover Tooltip */}
                         <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-black text-white p-2.5 border-2 border-neoYellow shadow-neo opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 z-50 pointer-events-none whitespace-nowrap">
                            <div className="text-[8px] font-black uppercase tracking-widest text-neoYellow mb-0.5">{d.date}</div>
                            <div className="text-xs font-black">{formatPrice(d.revenue)}</div>
                            <div className="text-[9px] font-bold text-gray-300">{d.count} Transactions</div>
                         </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                       <span className="text-[10px] font-black text-black dark:text-white uppercase tracking-tighter">{d.label}</span>
                       {d.revenue > 0 && <span className="text-[8px] font-black text-neoGreen bg-black px-1 mt-0.5">+{Math.round((d.revenue/totalRevenue)*100)}%</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex-1 overflow-x-auto no-scrollbar">
            {recentOrders.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center">
                <div className="text-5xl mb-3 font-black">📭</div>
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider">No orders recorded yet</h4>
              </div>
            ) : (
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-neoYellow border-b-3 border-black text-black">
                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest border-r-2 border-black">Order ID</th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest border-r-2 border-black">Customer</th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest border-r-2 border-black">Units</th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest border-r-2 border-black">Revenue</th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 dark:divide-white/10 font-bold">
                  {recentOrders.map((t) => (
                    <tr key={t.id} className="hover:bg-yellow-50/60 dark:hover:bg-zinc-800/60 transition-colors">
                      <td className="px-6 py-3.5 border-r-2 border-black/10 dark:border-white/10">
                         <span className="text-[10px] font-black font-mono bg-neoCyan/20 border-2 border-black px-2 py-0.5 shadow-neo-sm text-black dark:text-white">{t.id}</span>
                      </td>
                      <td className="px-6 py-3.5 border-r-2 border-black/10 dark:border-white/10">
                        <div className="text-xs font-black text-black dark:text-white">{t.customerName || '—'}</div>
                      </td>
                      <td className="px-6 py-3.5 border-r-2 border-black/10 dark:border-white/10">
                        <div className="text-xs text-gray-600 dark:text-gray-400 font-bold">{t.items.reduce((s, i) => s + i.qty, 0)} Items</div>
                      </td>
                      <td className="px-6 py-3.5 border-r-2 border-black/10 dark:border-white/10">
                        <div className="text-sm font-black text-black dark:text-white tracking-tight">{formatPrice(t.total)}</div>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span className="px-2.5 py-1 bg-neoGreen text-black border-2 border-black text-[9px] font-black uppercase tracking-wider shadow-neo-sm">Paid</span>
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
           <div className="bg-neoPink border-4 border-black p-6 sm:p-8 text-white shadow-neo-lg relative overflow-hidden">
              <p className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 inline-block mb-3">
                INVENTORY TELEMETRY
              </p>
              <h2 className="text-2xl sm:text-3xl font-black mb-2 tracking-tight">Healthy Operations</h2>
              <p className="text-xs font-bold text-white/90 leading-relaxed">
                Active catalog sync confirmed. Monitor real-time low stock signals to prevent stockouts.
              </p>
           </div>

           {/* Low Stock Alert List */}
           <div className="bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-neo-lg p-6 flex-1">
             <div className="flex items-center justify-between pb-4 mb-4 border-b-3 border-black dark:border-white">
                <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-widest">Inventory Warnings</h3>
                <span className="bg-neoPink text-white border-2 border-black font-black text-[9px] uppercase px-2.5 py-1 shadow-neo-sm">
                  {products.filter(p => p.stock !== undefined && p.stock < 20).length} Alerts
                </span>
             </div>

             <div className="space-y-3">
                {products.filter(p => p.stock !== undefined && p.stock < 20).map((p) => (
                  <div key={p.id} className="p-3 bg-neoCream dark:bg-zinc-800 border-2 border-black shadow-neo-sm flex items-center justify-between cursor-pointer hover:bg-yellow-100 transition-colors" onClick={() => onNavigate('products')}>
                    <div className="min-w-0 pr-3">
                       <div className="text-xs font-black text-black dark:text-white truncate uppercase">{p.name}</div>
                       <div className="text-[9px] font-mono text-gray-500 font-bold mt-0.5">Ref: {p.id}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                       <span className="text-[10px] font-black bg-neoPink text-white border border-black px-2 py-0.5">{p.stock} Left</span>
                       <span className="text-sm font-black">→</span>
                    </div>
                  </div>
                ))}
                
                {products.filter(p => p.stock !== undefined && p.stock < 20).length === 0 && (
                  <div className="py-12 text-center">
                    <div className="text-4xl mb-2">🛡️</div>
                    <p className="text-xs font-black text-gray-500 uppercase tracking-wider">All Stock Levels Normal</p>
                  </div>
                )}
             </div>
           </div>
        </div>
      </div>
    </div>
  )
}
