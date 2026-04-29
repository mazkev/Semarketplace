import { formatPrice, formatDate } from '../utils'

export default function Receipt({ receipt, onClose, onViewOrders }) {
  const count = receipt.items.reduce((s, i) => s + i.qty, 0)
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-md overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.25)] animate-scale-in border border-white/20">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-8 text-center relative">
          <div className="absolute top-4 left-4 opacity-20 text-2xl">✦</div>
          <div className="absolute bottom-4 right-4 opacity-20 text-2xl">✧</div>
          
          <div className="w-16 h-16 bg-white/10 backdrop-blur-2xl rounded-[24px] flex items-center justify-center text-3xl mx-auto mb-4 shadow-2xl border border-white/20 animate-bounce-slow">
            ✅
          </div>
          <h2 className="text-2xl font-black text-white tracking-tighter mb-1 uppercase">Order Confirmed</h2>
          <p className="text-indigo-100/60 font-black text-[9px] uppercase tracking-[0.3em]">Thank you for choosing SeMarketplace</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Meta */}
          <div className="grid grid-cols-3 gap-4 border-y border-slate-50 dark:border-slate-800 py-4">
            <div className="text-center">
              <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Order #</div>
              <div className="text-[9px] font-black text-indigo-600 truncate uppercase">{receipt._id || receipt.id}</div>
            </div>
            <div className="text-center border-x border-slate-50 dark:border-slate-800 px-2">
              <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</div>
              <div className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{formatDate(receipt.date || receipt.timestamp || Date.now())}</div>

            </div>
            <div className="text-center">
              <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Items</div>
              <div className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{count} Units</div>
            </div>
          </div>

          {/* Item List Summary */}
          <div className="space-y-3 max-h-[140px] overflow-y-auto pr-2 no-scrollbar">
            {receipt.items.map(item => (
              <div key={item.productId || item.id} className="flex items-center justify-between group">
                <div className="flex-1">
                  <div className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight line-clamp-1">{item.name}</div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Qty: {item.qty} &bull; {formatPrice(item.price)}</div>
                </div>
                <div className="text-xs font-black text-indigo-600 ml-4 group-hover:scale-110 transition-transform">
                  {formatPrice(item.price * item.qty)}
                </div>
              </div>
            ))}
          </div>

          {/* Calculations */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[24px] p-5 space-y-3 border border-slate-100 dark:border-slate-800 shadow-inner">
             <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <span>Items Valuation</span>
                <span>{formatPrice(receipt.total)}</span>
             </div>
             <div className="flex justify-between text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                <span>Logistics</span>
                <span className="bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-lg">Complimentary</span>
             </div>
             <div className="pt-4 border-t border-slate-200 dark:border-slate-700 mt-2 flex justify-between items-center">
                <span className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Final Total</span>
                <span className="text-2xl font-black text-indigo-600 tracking-tighter">{formatPrice(receipt.total)}</span>
             </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              id="view-orders-btn" 
              className="px-6 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-indigo-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-lg shadow-indigo-500/5" 
              onClick={onViewOrders}
            >
              📋 My Orders
            </button>
            <button 
              id="continue-shopping-btn" 
              className="px-6 py-4 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all hover:-translate-y-1" 
              onClick={onClose}
            >
              Finish
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

