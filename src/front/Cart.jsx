import { useState } from 'react'
import { formatPrice, COUPONS } from '../utils'

export default function Cart({ cart, onClose, onQtyChange, onRemove, onCheckout, appliedCoupon, onApplyCoupon }) {
  const [couponCode, setCouponCode] = useState('')
  const [couponError, setCouponError] = useState('')

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const count = cart.reduce((s, i) => s + i.qty, 0)

  let discount = 0
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      // Handle both decimal (0.1) and integer (10) percentage formats
      const factor = appliedCoupon.value > 1 ? appliedCoupon.value / 100 : appliedCoupon.value
      discount = subtotal * factor
    }
    else if (appliedCoupon.type === 'fixed') discount = appliedCoupon.value
  }

  const tax = (subtotal - discount) * 0.1
  const total = subtotal - discount + tax

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase()
    if (!code) return
    try {
      setCouponError('')
      await onApplyCoupon(code)
      setCouponCode('')
    } catch (err) {
      setCouponError(err.message || 'Invalid coupon code')
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] transition-opacity animate-fade-in" onClick={onClose} />
      <div 
        className="fixed top-0 right-0 h-full w-full max-w-[420px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl z-[201] shadow-2xl flex flex-col animate-slide-in-right border-l border-slate-100/50 dark:border-slate-800/50"
        role="dialog" 
        aria-label="Your Cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-white/20 dark:bg-transparent sticky top-0 z-10">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-indigo-200">🛒</div>
             <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter uppercase">Your Cart</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{count} Items Selected</p>
             </div>
          </div>
          <button 
            id="cart-close-btn" 
            className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-slate-400 hover:text-slate-900 dark:hover:text-white" 
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Priority Handling Progress */}
        {cart.length > 0 && (
          <div className="px-6 py-4 bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100/30 dark:border-indigo-800/20">
            <div className="flex items-center justify-between text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mb-2">
              <span>✧ Priority White-Glove Delivery</span>
              <span>Enabled</span>
            </div>
            <div className="h-1 w-full bg-indigo-100 dark:bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full w-full bg-indigo-600 animate-pulse" />
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-6">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-12 text-center animate-fade-in py-20">
              <div className="text-8xl mb-8 grayscale opacity-10">🛒</div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter uppercase">Your cart is empty</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">Find your next favorite item in our SeMarketplace collections.</p>
              <button 
                className="mt-10 px-10 py-4 bg-indigo-600 text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-500/30 hover:scale-105 transition-all"
                onClick={onClose}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="px-6 space-y-6">
              {cart.map((item, idx) => (
                <div 
                  key={item._id} 
                  className="flex gap-5 p-4 bg-white dark:bg-slate-800/40 rounded-[24px] border border-slate-50 dark:border-slate-800/50 hover:border-indigo-500/20 hover:shadow-2xl shadow-slate-200/40 transition-all group animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'both' }}
                >
                  <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-2xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-700">
                    {item.image
                      ? <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      : <div className="flex items-center justify-center h-full text-2xl opacity-10">💎</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div>
                      <div className="text-[13px] font-black text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.name}</div>
                      <div className="text-[15px] font-black text-indigo-600 mt-1 tracking-tighter">{formatPrice(item.price)}</div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                       <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-xl p-1 shadow-inner border border-slate-100 dark:border-slate-800">
                        <button 
                          id={`qty-dec-${item._id}`} 
                          className="w-8 h-8 flex items-center justify-center text-lg font-black text-slate-300 hover:text-indigo-600 transition-colors" 
                          onClick={() => onQtyChange(item._id, item.qty - 1)}
                        >
                          −
                        </button>
                        <span className="w-10 text-center text-xs font-black text-slate-900 dark:text-white">{item.qty}</span>
                        <button 
                          id={`qty-inc-${item._id}`} 
                          className="w-8 h-8 flex items-center justify-center text-lg font-black text-slate-300 hover:text-indigo-600 transition-colors" 
                          onClick={() => onQtyChange(item._id, item.qty + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button 
                        id={`remove-${item._id}`} 
                        className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all" 
                        onClick={() => onRemove(item._id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Voucher Input Section */}
        {cart.length > 0 && (
          <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
            <div className="flex flex-col gap-3">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Promo Code</label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-indigo-600 text-white rounded-2xl px-5 py-4 animate-scale-in shadow-xl shadow-indigo-500/20">
                  <div className="flex items-center gap-4">
                    <span className="text-xl">🎟️</span>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest">{appliedCoupon.code} Applied</div>
                      <div className="text-[9px] text-white/70 font-medium">{appliedCoupon.description}</div>
                    </div>
                  </div>
                  <button 
                    className="text-white hover:text-rose-200 font-black text-[10px] uppercase tracking-widest underline underline-offset-4"
                    onClick={() => onApplyCoupon(null)}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <input 
                    type="text"
                    placeholder="Enter Code…"
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3 text-[11px] uppercase font-black tracking-widest outline-none focus:border-indigo-600 transition-all shadow-sm"
                    value={couponCode}
                    onChange={e => { setCouponCode(e.target.value); setCouponError('') }}
                  />
                  <button 
                    className="bg-slate-900 dark:bg-indigo-600 text-white px-6 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl"
                    onClick={handleApplyCoupon}
                  >
                    Apply
                  </button>
                </div>
              )}
              {couponError && <p className="text-[9px] text-rose-500 font-black mt-1 px-1 uppercase tracking-widest">{couponError}</p>}
            </div>
          </div>
        )}

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-8 border-t border-slate-100/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl space-y-6 shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
            <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[10px] font-black text-rose-500 uppercase tracking-widest animate-fade-in">
                  <span>Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Estimated Tax (10%)</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                <span>Shipping</span>
                <span className="bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg">Complimentary</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Total Amount</span>
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{formatPrice(total)}</span>
              </div>
            </div>
            
            <button 
              id="checkout-btn" 
              className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-800 text-white py-5 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/40 transition-all hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] flex items-center justify-center gap-3" 
              onClick={onCheckout}
            >
              <span>Secure Checkout</span>
              <span className="text-xl">→</span>
            </button>
            <div className="flex items-center justify-center gap-4 text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">
               <span>Secure Payment</span>
               <div className="w-1 h-1 rounded-full bg-slate-200"></div>
               <span>SeMarketplace Guarantee</span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
