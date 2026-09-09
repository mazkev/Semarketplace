import React from 'react'

export default function FrontFooter({ setPage }) {
  return (
    <footer className="bg-white dark:bg-zinc-900 border-t-4 border-black dark:border-white py-16 mt-16 font-sans">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
             <div 
               className="inline-flex items-center gap-3 cursor-pointer select-none mb-4 bg-neoYellow border-3 border-black px-3.5 py-2 shadow-neo hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all" 
               onClick={() => setPage('shop')}
             >
               <span className="text-2xl">🛍️</span>
               <span className="text-xl font-black tracking-tighter uppercase text-black">SE-MARKET</span>
             </div>
             <p className="text-gray-600 dark:text-gray-400 text-xs font-bold leading-relaxed max-w-xs mt-2">
                Premium high-velocity marketplace. Crafted with bold Neo-Brutalism aesthetics and instant checkout experience.
             </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-black text-black dark:text-white uppercase tracking-widest mb-4 pb-2 border-b-2 border-black dark:border-white inline-block">
              Navigation
            </h4>
            <ul className="space-y-2.5">
              {['Shop All', 'Wishlist', 'My Orders', 'About Us'].map((link) => (
                <li key={link}>
                  <button 
                    onClick={() => setPage(link === 'My Orders' ? 'orders' : link === 'Wishlist' ? 'wishlist' : 'shop')}
                    className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:underline decoration-2 text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    ➔ {link}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-black text-black dark:text-white uppercase tracking-widest mb-4 pb-2 border-b-2 border-black dark:border-white inline-block">
              Assistance
            </h4>
            <ul className="space-y-2.5">
              {['Help Center', 'Track Order', 'Return Policy', 'Security Info'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:underline decoration-2 text-xs font-bold uppercase tracking-wider transition-colors">
                    ➔ {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-xs font-black text-black dark:text-white uppercase tracking-widest mb-4 pb-2 border-b-2 border-black dark:border-white inline-block">
              Newsletter
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-xs font-bold mb-4">Get flash drops and secret discount codes directly.</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="YOUR EMAIL" 
                className="bg-neoCream dark:bg-zinc-800 border-2 border-black dark:border-white px-3 py-2 text-xs font-bold outline-none flex-1 text-black dark:text-white shadow-neo-sm placeholder:font-black placeholder:uppercase placeholder:text-gray-400"
              />
              <button className="bg-neoYellow hover:bg-yellow-300 text-black border-2 border-black px-4 font-black text-xs uppercase tracking-wider shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
                JOIN
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t-3 border-black dark:border-white flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="text-[11px] font-black uppercase tracking-wider text-black dark:text-white">
              &copy; 2026 SEMARKETPLACE • ALL RIGHTS RESERVED
           </div>
           <div className="flex gap-6">
              <a href="#" className="text-[10px] font-black uppercase tracking-wider hover:underline text-gray-500 hover:text-black dark:hover:text-white">Privacy</a>
              <a href="#" className="text-[10px] font-black uppercase tracking-wider hover:underline text-gray-500 hover:text-black dark:hover:text-white">Terms</a>
              <a href="#/backOffice" className="text-[10px] font-black uppercase tracking-wider text-neoPink hover:underline">Admin Console</a>
           </div>
           <div className="flex gap-2">
              {['𝕏', '📸', '📽️', '📍'].map(icon => (
                <a key={icon} href="#" className="w-8 h-8 bg-white dark:bg-zinc-800 border-2 border-black text-black dark:text-white flex items-center justify-center text-sm shadow-neo-sm hover:bg-neoYellow active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
                  {icon}
                </a>
              ))}
           </div>
        </div>
      </div>
    </footer>
  )
}
