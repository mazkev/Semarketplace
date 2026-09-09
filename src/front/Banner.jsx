import { useState, useEffect } from 'react'

const BANNERS = [
  { 
    id: 1, 
    tag: '⚡ FLASH SEASON 2026', 
    title: 'THE RETRO STREETWEAR DROP', 
    subtitle: 'High contrast curated wardrobe & accessories. Bold, tactile, and unapologetic.', 
    bg: 'bg-neoYellow', 
    textColor: 'text-black',
    accentBadge: 'bg-neoPink text-white',
    badgeText: '50% OFF TODAY',
    icon: '👟'
  },
  { 
    id: 2, 
    tag: '💎 CYBER TECH EDITIONS', 
    title: 'AUDIO & HARDWARE ESSENTIALS', 
    subtitle: 'Lightning fast storage, noise-canceling gear, and next-gen desk accessories.', 
    bg: 'bg-neoCyan', 
    textColor: 'text-black',
    accentBadge: 'bg-neoYellow text-black',
    badgeText: 'FREE ON-SITE DELIVERY',
    icon: '🎧'
  },
  { 
    id: 3, 
    tag: '✨ POP ART LUXURY', 
    title: 'ICONIC JEWELERY & GOODS', 
    subtitle: 'Crafted statement rings, solid precious accessories, and handcrafted lifestyle collectibles.', 
    bg: 'bg-neoPink', 
    textColor: 'text-white',
    accentBadge: 'bg-neoYellow text-black',
    badgeText: '100% AUTHENTIC',
    icon: '💍'
  },
]

export default function Banner() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % BANNERS.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [])

  const b = BANNERS[current]

  return (
    <div className="relative w-full rounded-3xl border-4 border-black dark:border-white shadow-neo-lg overflow-hidden mb-10 select-none transition-all">
      <div className={`p-8 sm:p-12 md:p-16 ${b.bg} min-h-[300px] sm:min-h-[360px] flex items-center justify-between relative`}>
        {/* Decorative Grid Stripes */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_2px,transparent_2px)] [background-size:16px_16px] pointer-events-none"></div>

        {/* Content Box */}
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="bg-black text-white px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg border-2 border-black dark:border-white shadow-neo-sm">
              {b.tag}
            </span>
            <span className={`${b.accentBadge} px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg border-2 border-black -rotate-2 shadow-neo-sm`}>
              {b.badgeText}
            </span>
          </div>

          <h2 className={`text-3xl sm:text-5xl md:text-6xl font-black ${b.textColor} tracking-tight mb-4 uppercase leading-[0.95]`}>
            {b.title}
          </h2>

          <p className={`text-sm sm:text-base font-bold ${b.textColor} opacity-90 mb-8 max-w-xl leading-relaxed`}>
            {b.subtitle}
          </p>

          <a 
            href="#featured-catalog"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-black hover:bg-zinc-800 text-white border-3 border-black dark:border-white rounded-xl font-black text-sm uppercase tracking-wider shadow-neo hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
          >
            <span>SHOP COLLECTION</span>
            <span className="text-neoYellow">→</span>
          </a>
        </div>

        {/* Big Icon Showcase (Desktop) */}
        <div className="hidden lg:flex flex-col items-center justify-center w-56 h-56 bg-white border-4 border-black rounded-3xl rotate-6 shadow-neo-md shrink-0">
          <span className="text-8xl hover:scale-110 transition-transform cursor-pointer">{b.icon}</span>
          <span className="text-xs font-black uppercase tracking-widest text-black mt-2 bg-neoYellow px-2 py-0.5 border-2 border-black rounded">
            HOT ITEM
          </span>
        </div>

        {/* Controls and Pagers */}
        <div className="absolute right-6 bottom-6 flex items-center gap-3 z-20">
          <button 
            className="w-10 h-10 bg-white text-black border-2 border-black rounded-xl font-black text-base shadow-neo-sm hover:bg-yellow-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center"
            onClick={() => setCurrent(prev => (prev - 1 + BANNERS.length) % BANNERS.length)}
            title="Previous banner"
          >
            ←
          </button>
          <button 
            className="w-10 h-10 bg-white text-black border-2 border-black rounded-xl font-black text-base shadow-neo-sm hover:bg-yellow-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center"
            onClick={() => setCurrent(prev => (prev + 1) % BANNERS.length)}
            title="Next banner"
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}
