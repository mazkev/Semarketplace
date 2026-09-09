import { useState, useEffect } from 'react'
import { apiFetch } from '../api'
import { formatPrice } from '../utils'

export default function Analytics({ showToast }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiFetch('/analytics/overview')
        setData(res)
      } catch (err) {
        showToast('Failed to load analytics', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading || !data) return (
    <div className="py-20 text-center">
      <div className="inline-block bg-neoYellow border-3 border-black px-6 py-3 font-black text-xs uppercase tracking-widest shadow-neo animate-bounce">
        AGGREGATING INTEL... 📊
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-block bg-neoCyan border-2 border-black px-3 py-1 font-black text-[10px] uppercase tracking-widest shadow-neo-sm mb-2">
            TELEMETRY & METRICS
          </div>
          <h2 className="text-3xl font-black text-black dark:text-white tracking-tighter uppercase">Executive Insights</h2>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Real-time marketplace velocity & transaction volume</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Sellers Bar Chart */}
        <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 border-4 border-black dark:border-white shadow-neo-lg">
           <div className="flex items-center justify-between pb-4 mb-6 border-b-3 border-black dark:border-white">
              <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-widest">Velocity Leaders (Top 5)</h3>
              <span className="text-2xl bg-neoYellow border-2 border-black w-10 h-10 flex items-center justify-center shadow-neo-sm">🏆</span>
           </div>
           <div className="space-y-5">
              {data.topSellers.map((s, idx) => (
                <div key={s.name} className="space-y-1.5">
                   <div className="flex justify-between items-center text-xs font-black uppercase tracking-tight">
                      <span className="text-black dark:text-white truncate max-w-[240px]">{s.name}</span>
                      <span className="bg-neoYellow border-2 border-black px-2 py-0.5 text-[10px] shadow-neo-sm shrink-0">{s.qty} units</span>
                   </div>
                   <div className="w-full h-4 bg-gray-100 dark:bg-zinc-800 border-2 border-black overflow-hidden shadow-neo-sm">
                      <div 
                        className="h-full bg-neoCyan border-r-2 border-black transition-all duration-700" 
                        style={{ width: `${(s.qty / data.topSellers[0].qty) * 100}%` }}
                      />
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 border-4 border-black dark:border-white shadow-neo-lg">
           <div className="flex items-center justify-between pb-4 mb-6 border-b-3 border-black dark:border-white">
              <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-widest">Inventory Saturation</h3>
              <span className="text-2xl bg-neoPink text-white border-2 border-black w-10 h-10 flex items-center justify-center shadow-neo-sm">📊</span>
           </div>
           <div className="grid grid-cols-2 gap-4">
              {Object.entries(data.categoryDistribution).map(([cat, count], i) => (
                <div key={cat} className={`p-4 border-3 border-black shadow-neo-sm ${i % 3 === 0 ? 'bg-neoCream dark:bg-zinc-800' : i % 3 === 1 ? 'bg-neoYellow/20 dark:bg-zinc-800' : 'bg-neoCyan/20 dark:bg-zinc-800'}`}>
                   <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 mb-1">{cat}</div>
                   <div className="text-3xl font-black text-black dark:text-white tracking-tight">{count}</div>
                   <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Active SKUs</div>
                </div>
              ))}
           </div>
        </div>

        {/* Financial Pulse */}
        <div className="lg:col-span-2 bg-neoYellow border-4 border-black p-8 sm:p-10 text-black shadow-neo-xl">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                 <div className="inline-block bg-black text-white px-3 py-1 font-black text-[10px] uppercase tracking-widest mb-3">
                   FINANCIAL METRIC
                 </div>
                 <p className="text-xs font-black uppercase tracking-widest text-black/70 mb-1">Total Accumulated Revenue</p>
                 <h4 className="text-4xl sm:text-5xl font-black tracking-tight">{formatPrice(data.summary.totalRevenue)}</h4>
                 <div className="mt-4 flex items-center gap-2">
                    <span className="w-3 h-3 bg-neoGreen border-2 border-black animate-pulse"></span>
                    <span className="text-[11px] font-black uppercase tracking-wider">Live Settlement Engine Verified</span>
                 </div>
              </div>
              <div className="bg-white border-3 border-black p-6 shadow-neo">
                 <div className="inline-block bg-neoPink text-white px-2.5 py-0.5 font-black text-[10px] uppercase tracking-widest border border-black mb-2">
                   MARKET TRACTION
                 </div>
                 <h4 className="text-3xl font-black tracking-tight">{data.summary.orderCount} <span className="text-lg text-gray-500 uppercase">Completed Orders</span></h4>
                 <p className="text-xs font-bold text-gray-600 mt-2 leading-relaxed">
                   "Marketplace velocity is running steady with zero downtime detected on the distributed node."
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
