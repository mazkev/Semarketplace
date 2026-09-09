import React from 'react'

export default function FrontFooter({ setPage }) {
  return (
    <footer className="border-t-4 border-black dark:border-white bg-neoCream dark:bg-zinc-950 mt-20 font-sans select-none">
      {/* Top Banner Marquee */}
      <div className="bg-black text-neoYellow border-b-3 border-black py-2 overflow-hidden font-black text-xs uppercase tracking-widest">
        <div className="animate-ticker flex gap-8 whitespace-nowrap">
          <span>★ 100% SECURE CHECKOUT</span>
          <span>⚡ INSTANT COURIER DISPATCH</span>
          <span>★ FREE SHIPPING ACROSS INDONESIA</span>
          <span>⚡ 24/7 DEDICATED SUPPORT</span>
          <span>★ 100% SECURE CHECKOUT</span>
          <span>⚡ INSTANT COURIER DISPATCH</span>
          <span>★ FREE SHIPPING ACROSS INDONESIA</span>
          <span>⚡ 24/7 DEDICATED SUPPORT</span>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-14 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="space-y-4">
             <div 
               className="inline-flex items-center gap-3 cursor-pointer mb-2 bg-neoYellow border-3 border-black px-4 py-2.5 shadow-neo hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all" 
               onClick={() => setPage('shop')}
             >
               <span className="text-2xl">⚡</span>
               <span className="text-2xl font-black tracking-tighter uppercase text-black">SE-MARKET</span>
             </div>
             <p className="text-gray-700 dark:text-gray-300 text-xs font-bold leading-relaxed">
               The premier high-velocity Neo-Brutalist marketplace. Direct deals, verified quality goods, and lightning-fast fulfillment.
             </p>
             <div className="flex flex-wrap gap-2 pt-2">
                <span className="bg-neoPink text-white border-2 border-black px-2.5 py-0.5 text-[9px] font-black uppercase shadow-neo-sm">
                  ★ ORIGINAL
                </span>
                <span className="bg-neoCyan text-black border-2 border-black px-2.5 py-0.5 text-[9px] font-black uppercase shadow-neo-sm">
                  ⚡ FAST DISPATCH
                </span>
             </div>
          </div>

          {/* Navigation */}
          <div>
            <div className="inline-block bg-neoYellow border-2 border-black px-2.5 py-1 text-xs font-black uppercase tracking-wider shadow-neo-sm mb-4 text-black">
              EXPLORE
            </div>
            <ul className="space-y-2">
              {[
                { label: 'Storefront Catalog', target: 'shop' },
                { label: 'Flash Sale Deals', target: 'shop' },
                { label: 'My Order History', target: 'orders' },
                { label: 'Saved Wishlist', target: 'wishlist' }
              ].map((item) => (
                <li key={item.label}>
                  <button 
                    onClick={() => setPage(item.target)}
                    className="text-xs font-black uppercase tracking-wider text-black dark:text-white hover:text-neoPink dark:hover:text-neoYellow hover:translate-x-1 transition-all flex items-center gap-1.5"
                  >
                    <span>➔</span>
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Payment Badges */}
          <div>
            <div className="inline-block bg-neoCyan border-2 border-black px-2.5 py-1 text-xs font-black uppercase tracking-wider shadow-neo-sm mb-4 text-black">
              PAYMENT NODES
            </div>
            <p className="text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-3">
              Encrypted settlements supported via instant banking &amp; QRIS:
            </p>
            <div className="grid grid-cols-3 gap-2">
              {['BCA', 'MANDIRI', 'BNI', 'BRI', 'QRIS', 'GOPAY'].map(method => (
                <div key={method} className="bg-white dark:bg-zinc-800 border-2 border-black py-1.5 text-center font-black text-[10px] uppercase shadow-neo-sm text-black dark:text-white">
                  {method}
                </div>
              ))}
            </div>
          </div>

          {/* Newsletter Box */}
          <div className="bg-white dark:bg-zinc-900 border-3 border-black dark:border-white p-5 shadow-neo">
            <div className="inline-block bg-neoGreen text-black border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-neo-sm mb-2">
              VIP DROPS
            </div>
            <h4 className="text-xs font-black text-black dark:text-white uppercase tracking-wider mb-1">
              Secret Vouchers
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-[11px] font-bold mb-3">
              Subscribe to unlock flash sale codes &amp; 20% off coupons.
            </p>
            <form onSubmit={e => { e.preventDefault(); alert('Subscribed to SE-MARKET Drops!') }} className="space-y-2">
              <input 
                type="email" 
                placeholder="YOUR EMAIL" 
                required
                className="w-full bg-neoCream dark:bg-zinc-800 border-2 border-black dark:border-white px-3 py-2 text-xs font-bold outline-none text-black dark:text-white shadow-neo-sm"
              />
              <button 
                type="submit"
                className="w-full bg-neoYellow hover:bg-yellow-300 text-black border-2 border-black py-2 font-black text-xs uppercase tracking-wider shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
              >
                UNLOCK DEALS ➔
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t-3 border-black dark:border-white flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="text-xs font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-neoGreen border border-black inline-block"></span>
              <span>&copy; 2026 SEMARKETPLACE • ALL RIGHTS RESERVED</span>
           </div>
           
           <div className="flex gap-4">
              <button onClick={() => setPage('shop')} className="text-xs font-black uppercase tracking-wider text-black dark:text-white hover:underline">Home</button>
              <button onClick={() => setPage('orders')} className="text-xs font-black uppercase tracking-wider text-black dark:text-white hover:underline">Orders</button>
              <a href="#/backOffice" className="text-xs font-black uppercase tracking-wider text-neoPink hover:underline">Admin Console</a>
           </div>

           <div className="flex gap-2">
              {['𝕏', '📸', '📽️', '📍'].map(icon => (
                <a 
                  key={icon} 
                  href="#" 
                  className="w-9 h-9 bg-white dark:bg-zinc-800 border-2 border-black text-black dark:text-white flex items-center justify-center text-sm shadow-neo-sm hover:bg-neoYellow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:scale-95 transition-all"
                >
                  {icon}
                </a>
              ))}
           </div>
        </div>
      </div>
    </footer>
  )
}
