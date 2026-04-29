import { useState } from 'react'
import { formatPrice, formatDate } from '../utils'

function OrderRow({ order, onDelete, onTrack }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[24px] shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-50 dark:border-slate-800 overflow-hidden mb-6 transition-all hover:-translate-y-1 hover:border-indigo-500/20 animate-fade-in-up">
      <div 
        className="p-6 sm:p-8 flex items-center justify-between cursor-pointer group" 
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex-1 min-w-0">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Order Identity</div>
          <div className="text-sm font-black text-slate-900 dark:text-white tracking-tighter truncate group-hover:text-indigo-600 transition-colors uppercase">{order._id || order.id}</div>
          <div className="text-[10px] text-slate-400 font-black mt-2 uppercase tracking-widest">{formatDate(order.date || order.timestamp || Date.now())}</div>
        </div>
        <div className="flex items-center gap-10">
          <div className="hidden sm:flex flex-col items-end gap-2">
             <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                order.status === 'Delivered' ? 'bg-green-50 text-green-600 border-green-100' : 
                order.status === 'Shipped' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                'bg-indigo-50 text-indigo-600 border-indigo-100'
             }`}>
                {order.status || 'Processing'}
             </div>
             <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Status Update</span>
          </div>
          <div className="text-right">
             <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Amount</div>
             <div className="text-xl font-black text-indigo-600 tracking-tighter">{formatPrice(order.total)}</div>
          </div>
          <div className="flex items-center gap-6">
            <button 
              className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
              onClick={(e) => { e.stopPropagation(); onDelete(order._id || order.id); }}
            >
              🗑️
            </button>
            <span className={`text-[10px] text-slate-300 transition-transform duration-500 ${open ? 'rotate-180' : ''}`}>▼</span>
          </div>
        </div>
      </div>

      {open && (
        <div className="px-6 pb-8 sm:px-8 sm:pb-10 border-t border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 animate-fade-in">
          <div className="flex justify-between items-center py-6">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Order Manifest</h4>
             <button 
               className="text-[9px] font-black text-white uppercase tracking-widest px-5 py-2.5 bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
               onClick={(e) => { e.stopPropagation(); onTrack(order); }}
             >
               📍 Track Order
             </button>
          </div>
          
          <div className="space-y-4 mb-8">
            {order.items.map(item => (
              <div key={item.productId || item.id} className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-xl shadow-inner">📦</div>
                   <div>
                      <div className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">{item.name}</div>
                      <div className="text-[10px] font-bold text-slate-400 mt-0.5">Quantity: {item.qty}</div>
                   </div>
                </div>
                <span className="text-sm font-black text-indigo-600">{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-6 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Total Order Value</span>
            <span className="text-2xl font-black text-indigo-600 tracking-tighter">{formatPrice(order.total)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function TrackingModal({ order, onClose }) {
  const steps = [
    { id: 'Processing', label: 'Order Processed', icon: '⚙️', desc: 'Your order is being prepared' },
    { id: 'Shipped', label: 'Shipped', icon: '🚚', desc: 'Your package is on the way' },
    { id: 'Delivered', label: 'Delivered', icon: '🏠', desc: 'Package has been received' }
  ]

  const currentIdx = steps.findIndex(s => s.id === order.status)
  
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-6 animate-fade-in" onClick={onClose}>
       <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-scale-in border border-slate-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
             <button className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all z-10" onClick={onClose}>✕</button>
             <h3 className="text-xl font-black uppercase tracking-tighter relative z-10">Live <span className="text-indigo-400">Tracking</span></h3>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 relative z-10">ID: {order._id || order.id}</p>
          </div>
          
          <div className="p-8">
             <div className="space-y-0">
                {steps.map((step, idx) => {
                  const isDone = idx <= currentIdx
                  const isCurrent = idx === currentIdx
                  const isLast = idx === steps.length - 1
                  
                  return (
                    <div key={step.id} className="flex gap-6 group relative">
                       <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-base z-10 transition-all duration-500 ${
                            isDone 
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300'
                          } ${isCurrent ? 'scale-110 ring-4 ring-indigo-500/10' : ''}`}>
                             {step.icon}
                          </div>
                          {!isLast && (
                            <div className={`w-0.5 h-12 my-1 rounded-full transition-colors duration-1000 ${
                              idx < currentIdx ? 'bg-indigo-600' : 'bg-slate-100 dark:bg-slate-800'
                            }`} />
                          )}
                       </div>

                       <div className={`flex-1 pb-10 ${!isDone ? 'opacity-40' : ''}`}>
                          <h5 className={`text-[11px] font-black uppercase tracking-[0.15em] mb-1 ${isCurrent ? 'text-indigo-600' : 'text-slate-900 dark:text-white'}`}>
                            {step.label}
                          </h5>
                          <p className="text-[10px] text-slate-400 font-bold leading-relaxed">{step.desc}</p>
                          
                          {isCurrent && (
                            <div className="mt-4 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                               <div className="flex gap-1">
                                 <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></span>
                                 <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                 <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.4s]"></span>
                               </div>
                               <span className="text-[9px] font-black uppercase tracking-widest">Active Status</span>
                            </div>
                          )}
                       </div>
                    </div>
                  )
                })}
             </div>
          </div>
          
          <div className="px-8 pb-8">
             <button 
               className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.98]"
               onClick={onClose}
             >
               Dismiss Tracker
             </button>
          </div>
       </div>
    </div>
  )
}

export default function MyOrders({ orders, onDelete }) {
  const [trackingOrder, setTrackingOrder] = useState(null)

  return (
    <div className="py-12 sm:py-20 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-end justify-between mb-12 border-b border-slate-200 dark:border-slate-800 pb-8">
          <div>
             <div className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-2">Purchase History</div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">My Orders</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">
              History of {orders.length} order{orders.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-4xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-800">📋</div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-black/20 p-20 flex flex-col items-center text-center animate-fade-in py-24">
             <div className="text-8xl mb-10 grayscale opacity-10">📦</div>
             <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter uppercase">No Orders Yet</h3>
             <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed font-medium">
                Your purchase history will appear here once you've secured your first selection from SeMarketplace.
             </p>
          </div>
        ) : (
          <div className="space-y-6">
            {[...orders].reverse().map(o => (
              <OrderRow 
                key={o._id || o.id} 
                order={o} 
                onDelete={onDelete} 
                onTrack={(order) => setTrackingOrder(order)} 
              />
            ))}
          </div>
        )}
      </div>

      {trackingOrder && (
        <TrackingModal 
          order={trackingOrder} 
          onClose={() => setTrackingOrder(null)} 
        />
      )}
    </div>
  )
}


