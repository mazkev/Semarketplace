import React from 'react'

export default function FrontFooter({ setPage }) {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 py-20 mt-20 transition-colors">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
             <div 
               className="flex items-center gap-3 cursor-pointer select-none group mb-6" 
               onClick={() => setPage('shop')}
             >
               <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                  <span className="text-xl text-white">📦</span>
               </div>
               <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">Se<span className="text-indigo-600">Marketplace</span></span>
             </div>
             <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xs">
                Your destination for unique treasures and premium objects. Crafted for those who appreciate the finer things in life.
             </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-8">Navigation</h4>
            <ul className="space-y-4">
              {['Shop All', 'Wishlist', 'My Orders', 'About Us'].map((link) => (
                <li key={link}>
                  <button 
                    onClick={() => setPage(link === 'My Orders' ? 'orders' : link === 'Wishlist' ? 'wishlist' : 'shop')}
                    className="text-slate-400 hover:text-indigo-600 text-sm font-bold transition-colors uppercase tracking-widest text-[11px]"
                  >
                    {link}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-8">Support</h4>
            <ul className="space-y-4">
              {['Help Center', 'Track Order', 'Sustainability', 'Membership'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-slate-400 hover:text-indigo-600 text-sm font-bold transition-colors uppercase tracking-widest text-[11px]">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-8">Stay Connected</h4>
            <p className="text-slate-400 text-xs font-medium mb-6">Join our newsletter for exclusive updates and early access to new drops.</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Email Address" 
                className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-xs outline-none focus:border-indigo-600 transition-all flex-1 text-slate-900 dark:text-white"
              />
              <button className="bg-slate-900 dark:bg-indigo-600 text-white px-6 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl">
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Copyright 2026 @mazkev
           </div>
           <div className="flex gap-8">
              <a href="#" className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors">Cookies</a>
              <a href="#/backOffice" className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">Admin Portal</a>
           </div>
           <div className="flex gap-4">
              {['𝕏', '📸', '📽️', '📍'].map(icon => (
                <a key={icon} href="#" className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                  {icon}
                </a>
              ))}
           </div>
        </div>
      </div>
    </footer>
  )
}
