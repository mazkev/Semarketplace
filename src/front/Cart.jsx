import { useState } from 'react'
import { formatPrice } from '../utils'

export default function Cart({ cart, onClose, onQtyChange, onRemove, onCheckout, appliedCoupon, onApplyCoupon }) {
  const [couponCode, setCouponCode] = useState('')
  const [couponError, setCouponError] = useState('')

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const count = cart.reduce((s, i) => s + i.qty, 0)

  let discount = 0
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      const factor = appliedCoupon.value > 1 ? appliedCoupon.value / 100 : appliedCoupon.value
      discount = subtotal * factor
    }
    else if (appliedCoupon.type === 'fixed') discount = appliedCoupon.value
  }

  const tax = (subtotal - discount) * 0.1
  const total = Math.max(0, subtotal - discount + tax)

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
      <div className="fixed inset-0 bg-black/60 z-[200] transition-opacity" onClick={onClose} />
      <div 
        className="fixed top-0 right-0 h-full w-full max-w-[450px] bg-white dark:bg-zinc-900 z-[201] border-l-4 border-black dark:border-white shadow-neo-xl flex flex-col select-none"
        role="dialog" 
        aria-label="Your Cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-neoYellow text-black border-b-4 border-black dark:border-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-neoYellow border-2 border-black rounded-xl flex items-center justify-center text-xl shadow-neo-sm -rotate-3">
              🛒
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight leading-none">YOUR CART</h2>
              <span className="text-[10px] font-black uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded mt-1 inline-block">
                {count} ITEMS TOTAL
              </span>
            </div>
          </div>
          <button 
            id="cart-close-btn" 
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-black border-2 border-black shadow-neo-sm font-black text-base hover:bg-zinc-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all" 
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Free Shipping Notice */}
        {cart.length > 0 && (
          <div className="px-5 py-2.5 bg-neoCyan text-black border-b-3 border-black font-black text-xs uppercase tracking-wider flex items-center justify-between">
            <span>⚡ FREE NATIONWIDE SHIPPING</span>
            <span className="bg-black text-white px-1.5 py-0.5 rounded text-[10px]">ACTIVE</span>
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="text-7xl mb-4">🛒</div>
              <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tight mb-2">
                YOUR CART IS EMPTY
              </h3>
              <p className="text-xs font-bold text-zinc-500 max-w-xs mb-6">
                Discover trending electronics, fashion, and streetwear items now.
              </p>
              <button 
                className="px-6 py-3 bg-neoYellow text-black border-3 border-black rounded-xl font-black text-xs uppercase tracking-wider shadow-neo active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                onClick={onClose}
              >
                START SHOPPING →
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div 
                key={item._id} 
                className="flex gap-4 p-3.5 bg-white dark:bg-zinc-900 border-3 border-black dark:border-white rounded-2xl shadow-neo-sm"
              >
                <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden shrink-0 border-2 border-black dark:border-white">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&auto=format&fit=crop&q=80';
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-2xl">📦</div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-black text-black dark:text-white line-clamp-1 uppercase tracking-tight">
                      {item.name}
                    </div>
                    <div className="text-sm font-black text-black dark:text-white mt-0.5">
                      {formatPrice(item.price)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    {/* Stepper */}
                    <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 border-2 border-black dark:border-white rounded-lg overflow-hidden">
                      <button 
                        id={`qty-dec-${item._id}`} 
                        className="w-7 h-7 flex items-center justify-center text-sm font-black text-black dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors" 
                        onClick={() => onQtyChange(item._id, item.qty - 1)}
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-xs font-black text-black dark:text-white">
                        {item.qty}
                      </span>
                      <button 
                        id={`qty-inc-${item._id}`} 
                        className="w-7 h-7 flex items-center justify-center text-sm font-black text-black dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors" 
                        onClick={() => onQtyChange(item._id, item.qty + 1)}
                      >
                        +
                      </button>
                    </div>

                    {/* Delete */}
                    <button 
                      id={`remove-${item._id}`} 
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-800 hover:bg-neoPink hover:text-white text-black dark:text-white border-2 border-black dark:border-white rounded-lg shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all text-xs" 
                      onClick={() => onRemove(item._id)}
                      title="Remove Item"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Promo Voucher Section */}
        {cart.length > 0 && (
          <div className="p-4 border-t-3 border-black dark:border-white bg-zinc-50 dark:bg-zinc-950">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-black dark:text-white">
                PROMO COUPON VOUCHER
              </label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-neoGreen text-black border-2 border-black rounded-xl p-3 shadow-neo-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎟️</span>
                    <div>
                      <div className="text-xs font-black uppercase tracking-tight">{appliedCoupon.code} APPLIED</div>
                      <div className="text-[10px] font-bold text-zinc-700">{appliedCoupon.description}</div>
                    </div>
                  </div>
                  <button 
                    className="bg-black text-white px-2 py-1 text-[10px] font-black uppercase rounded shadow-neo-sm"
                    onClick={() => onApplyCoupon(null)}
                  >
                    REMOVE
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="E.G. WELCOME10"
                    className="flex-1 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white rounded-xl px-3 py-2 text-xs uppercase font-black tracking-wider outline-none shadow-neo-sm text-black dark:text-white"
                    value={couponCode}
                    onChange={e => { setCouponCode(e.target.value); setCouponError('') }}
                  />
                  <button 
                    className="bg-neoYellow hover:bg-yellow-300 text-black border-2 border-black rounded-xl px-4 font-black text-xs uppercase shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                    onClick={handleApplyCoupon}
                  >
                    APPLY
                  </button>
                </div>
              )}
              {couponError && <p className="text-[10px] text-rose-500 font-black uppercase tracking-wider mt-0.5">{couponError}</p>}
            </div>
          </div>
        )}

        {/* Total & Checkout Section */}
        {cart.length > 0 && (
          <div className="p-5 border-t-4 border-black dark:border-white bg-white dark:bg-zinc-900 space-y-4">
            <div className="space-y-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between">
                <span>SUBTOTAL</span>
                <span className="font-black text-black dark:text-white">{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-neoPink font-black">
                  <span>DISCOUNT</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>ESTIMATED TAX (10%)</span>
                <span className="font-black text-black dark:text-white">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-neoGreen font-black">
                <span>SHIPPING</span>
                <span>FREE (RP 0)</span>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-black/20 dark:border-white/20 pt-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">TOTAL PAYABLE</span>
                <span className="text-2xl font-black text-black dark:text-white tracking-tight">{formatPrice(total)}</span>
              </div>
              <span className="bg-neoYellow text-black border-2 border-black px-2 py-0.5 rounded text-[10px] font-black uppercase shadow-neo-sm">
                INSTANT PROCESS
              </span>
            </div>
            
            <button 
              id="checkout-btn" 
              className="w-full py-4 bg-neoGreen hover:bg-emerald-400 text-black border-3 border-black dark:border-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-neo hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2" 
              onClick={onCheckout}
            >
              <span>CHECKOUT ORDER NOW</span>
              <span className="text-lg">→</span>
            </button>
          </div>
        )}
      </div>
    </>
  )
}
