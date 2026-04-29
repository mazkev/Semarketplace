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

  if (loading || !data) return <div className="py-20 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Aggregating Intel...</div>

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Executive Insights</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Global performance metrics & intelligence</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Sellers Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Velocity Leaders (Top 5)</h3>
              <span className="text-xl">🏆</span>
           </div>
           <div className="space-y-6">
              {data.topSellers.map((s, idx) => (
                <div key={s.name} className="space-y-2">
                   <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-tight">
                      <span className="text-slate-900 dark:text-white">{s.name}</span>
                      <span className="text-indigo-600">{s.qty} units</span>
                   </div>
                   <div className="w-full h-3 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-1000 ease-out" 
                        style={{ width: `${(s.qty / data.topSellers[0].qty) * 100}%`, transitionDelay: `${idx * 100}ms` }}
                      />
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Saturation</h3>
              <span className="text-xl">📊</span>
           </div>
           <div className="flex flex-wrap gap-4">
              {Object.entries(data.categoryDistribution).map(([cat, count]) => (
                <div key={cat} className="flex-1 min-w-[140px] bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                   <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{cat}</div>
                   <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{count}</div>
                   <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Active SKUs</div>
                </div>
              ))}
           </div>
        </div>

        {/* Financial Pulse */}
        <div className="lg:col-span-2 bg-slate-900 dark:bg-black p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full"></div>
           <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
              <div>
                 <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-4">Consolidated Revenue</p>
                 <h4 className="text-4xl font-black tracking-tighter text-indigo-400">{formatPrice(data.summary.totalRevenue)}</h4>
                 <div className="mt-4 flex items-center gap-2 justify-center md:justify-start">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Real-time Settlement</span>
                 </div>
              </div>
              <div className="w-px h-20 bg-white/5 hidden md:block self-center"></div>
              <div>
                 <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-4">Market Traction</p>
                 <h4 className="text-4xl font-black tracking-tighter">{data.summary.orderCount} <span className="text-xl text-white/40">Orders</span></h4>
                 <p className="text-[9px] font-medium text-white/40 mt-4 leading-relaxed italic">"Store velocity is 12% higher than previous quarter projections."</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
