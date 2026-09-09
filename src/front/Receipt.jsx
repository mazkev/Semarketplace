import { formatPrice, formatDate } from '../utils'
import { useLanguage } from '../i18n'

export default function Receipt({ receipt, onClose, onViewOrders }) {
  const { t } = useLanguage()
  const count = receipt.items.reduce((s, i) => s + i.qty, 0)
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-fade-in font-sans select-none">
      <div className="bg-white dark:bg-zinc-900 border-4 border-black dark:border-white w-full max-w-md overflow-hidden shadow-neo-xl animate-scale-in">
        {/* Neo Header Section */}
        <div className="bg-neoYellow border-b-4 border-black dark:border-white p-6 text-center relative">
          <div className="w-14 h-14 bg-black text-white border-2 border-black flex items-center justify-center text-3xl mx-auto mb-3 shadow-neo-sm font-black">
            ✓
          </div>
          <div className="inline-block bg-black text-white px-3 py-0.5 font-black text-[10px] uppercase tracking-widest mb-1.5 shadow-neo-sm">
            TRANSACTION VERIFIED
          </div>
          <h2 className="text-2xl font-black text-black tracking-tighter uppercase leading-tight">{t('orderConfirmed')}</h2>
          <p className="text-black/80 font-black text-[10px] uppercase tracking-wider mt-1">{t('orderThanks')}</p>
        </div>

        <div className="p-6 space-y-5 bg-white dark:bg-zinc-900">
          {/* Order Meta Grid */}
          <div className="grid grid-cols-3 gap-2 bg-neoCream dark:bg-zinc-800 border-3 border-black dark:border-white p-3 shadow-neo-sm">
            <div className="text-center">
              <div className="text-[9px] font-black text-gray-500 uppercase tracking-wider">{t('orderNumber')}</div>
              <div className="text-[10px] font-black text-black dark:text-white truncate font-mono mt-0.5">{receipt._id || receipt.id}</div>
            </div>
            <div className="text-center border-x-2 border-black dark:border-white px-1">
              <div className="text-[9px] font-black text-gray-500 uppercase tracking-wider">{t('orderDate')}</div>
              <div className="text-[10px] font-black text-black dark:text-white uppercase mt-0.5">{formatDate(receipt.date || receipt.timestamp || Date.now())}</div>
            </div>
            <div className="text-center">
              <div className="text-[9px] font-black text-gray-500 uppercase tracking-wider">{t('orderItems')}</div>
              <div className="text-[10px] font-black text-black dark:text-white uppercase mt-0.5">{count} Units</div>
            </div>
          </div>

          {/* Item List Summary */}
          <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1 no-scrollbar">
            {receipt.items.map(item => (
              <div key={item.productId || item.id} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-zinc-800 border-2 border-black shadow-neo-sm">
                <div className="flex-1 pr-2">
                  <div className="text-xs font-black text-black dark:text-white uppercase tracking-tight line-clamp-1">{item.name}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase mt-0.5">Qty: {item.qty} &bull; {formatPrice(item.price)}</div>
                </div>
                <div className="text-xs font-black text-black dark:text-white bg-neoYellow border border-black px-2 py-0.5 shadow-neo-sm">
                  {formatPrice(item.price * item.qty)}
                </div>
              </div>
            ))}
          </div>

          {/* Calculations Box */}
          <div className="bg-neoCream dark:bg-zinc-800 p-4 border-3 border-black dark:border-white space-y-2 shadow-neo-sm text-xs font-bold text-gray-700 dark:text-gray-300">
             <div className="flex justify-between">
                <span className="uppercase">{t('subtotal')}</span>
                <span className="font-black text-black dark:text-white">{formatPrice(receipt.total)}</span>
             </div>
             <div className="flex justify-between items-center text-neoGreen font-black">
                <span className="uppercase">{t('shipping')}</span>
                <span className="bg-black text-white px-2 py-0.5 text-[9px] uppercase border border-black">{t('freeShipping')}</span>
             </div>
             <div className="pt-2.5 border-t-2 border-dashed border-black/30 dark:border-white/30 flex justify-between items-center">
                <span className="text-xs font-black text-black dark:text-white uppercase tracking-wider">{t('totalPaid')}</span>
                <span className="text-2xl font-black text-black dark:text-white tracking-tight">{formatPrice(receipt.total)}</span>
             </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button 
              id="view-orders-btn" 
              className="px-4 py-3 bg-white dark:bg-zinc-800 border-3 border-black text-black dark:text-white font-black text-xs uppercase tracking-wider shadow-neo hover:bg-yellow-50 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all text-center" 
              onClick={onViewOrders}
            >
              {t('myOrdersBtn')}
            </button>
            <button 
              id="continue-shopping-btn" 
              className="px-4 py-3 bg-neoGreen hover:bg-emerald-400 text-black border-3 border-black font-black text-xs uppercase tracking-wider shadow-neo active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all text-center" 
              onClick={onClose}
            >
              {t('finishShopping')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
