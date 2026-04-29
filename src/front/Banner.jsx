import { useState, useEffect } from 'react'

const BANNERS = [
  { id: 1, title: 'Summer Collection', subtitle: 'Elevate your aesthetic', gradient: 'from-indigo-600 to-violet-700' },
  { id: 2, title: 'Premium Objects', subtitle: 'Crafted for perfection', gradient: 'from-slate-800 to-slate-900' },
  { id: 3, title: 'Elite Marketplace', subtitle: 'The new standard of quality', gradient: 'from-rose-500 to-indigo-600' },
]

export default function Banner() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % BANNERS.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative w-full h-[180px] sm:h-[280px] md:h-[380px] lg:h-[440px] rounded-[32px] overflow-hidden mb-12 shadow-2xl shadow-indigo-500/10 group">
      <div 
        className="flex transition-transform duration-1000 cubic-bezier(0.4, 0, 0.2, 1) h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {BANNERS.map((b) => (
          <div key={b.id} className={`min-w-full h-full relative bg-gradient-to-br ${b.gradient} flex items-center px-12 sm:px-20`}>
            {/* Abstract Decorative Element */}
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[140%] bg-white/5 rounded-full blur-3xl rotate-12"></div>
            
            <div className="relative z-10 max-w-2xl animate-fade-in">
               <span className="text-white/40 text-[10px] sm:text-xs font-black uppercase tracking-[0.4em] mb-4 block">New Arrivals</span>
               <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter mb-4 leading-none">
                 {b.title}
               </h2>
               <p className="text-white/60 text-sm sm:text-lg font-medium mb-8 max-w-md">
                 {b.subtitle}
               </p>
               <button className="bg-white text-slate-900 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-110 transition-transform shadow-2xl">
                 Shop Collection
               </button>
            </div>

            {/* Visual Element Placeholder */}
            <div className="absolute right-20 top-1/2 -translate-y-1/2 hidden lg:flex items-center justify-center w-64 h-64 bg-white/10 backdrop-blur-2xl rounded-[40px] rotate-12 border border-white/20 shadow-2xl">
               <span className="text-7xl group-hover:scale-110 transition-transform duration-700">📦</span>
            </div>
          </div>
        ))}
      </div>

      {/* Indicators */}
      <div className="absolute bottom-8 left-12 flex gap-3">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              current === i ? 'bg-white w-10' : 'bg-white/20 w-3 hover:bg-white/40'
            }`}
            onClick={() => setCurrent(i)}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="absolute right-12 bottom-8 flex gap-3">
         <button 
           className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/10 hover:bg-white/20 transition-all flex items-center justify-center"
           onClick={() => setCurrent(prev => (prev - 1 + BANNERS.length) % BANNERS.length)}
         >
           ←
         </button>
         <button 
           className="w-12 h-12 rounded-2xl bg-white text-slate-900 shadow-2xl hover:scale-110 transition-all flex items-center justify-center"
           onClick={() => setCurrent(prev => (prev + 1) % BANNERS.length)}
         >
           →
         </button>
      </div>
    </div>
  )
}
