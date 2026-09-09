import { useState } from 'react'
import { formatPrice, formatDate } from '../utils'

function OrderRow({ order, onDelete, onTrack }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white dark:bg-zinc-900 border-3 border-black dark:border-white shadow-neo mb-5 overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-neo-md">
      <div 
        className="p-5 sm:p-6 flex items-center justify-between cursor-pointer select-none bg-neoCream/40 dark:bg-zinc-800/40" 
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex-1 min-w-0 pr-4">
          <div className="inline-block bg-neoYellow border border-black px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-neo-sm mb-1.5 text-black">
            ORDER ENTRY
          </div>
          <div className="text-sm sm:text-base font-black text-black dark:text-white tracking-tight truncate font-mono uppercase">{order._id || order.id}</div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mt-1 uppercase">{formatDate(order.date || order.timestamp || Date.now())}</div>
        </div>
        <div className="flex items-center gap-6 sm:gap-8">
          <div className="hidden sm:flex flex-col items-end gap-1">
             <div className={`px-2.5 py-0.5 border-2 border-black text-[9px] font-black uppercase tracking-wider shadow-neo-sm ${
                order.status === 'Delivered' ? 'bg-neoGreen text-black' : 
                order.status === 'Shipped' ? 'bg-neoCyan text-black' : 
                'bg-neoYellow text-black'
             }`}>
                {order.status || 'Processing'}
             </div>
             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">STATUS</span>
          </div>
          <div className="text-right">
             <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">TOTAL</div>
             <div className="text-base sm:text-lg font-black text-black dark:text-white tracking-tight">{formatPrice(order.total)}</div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              className="w-9 h-9 flex items-center justify-center bg-white dark:bg-zinc-800 border-2 border-black text-black dark:text-white shadow-neo-sm hover:bg-neoPink hover:text-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
              onClick={(e) => { e.stopPropagation(); onDelete(order._id || order.id); }}
              title="Delete Order"
            >
              🗑️
            </button>
            <span className={`w-8 h-8 flex items-center justify-center bg-black text-white text-xs font-black transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>▼</span>
          </div>
        </div>
      </div>

      {open && (
        <div className="p-5 sm:p-6 border-t-3 border-black dark:border-white bg-white dark:bg-zinc-900 animate-fade-in">
          <div className="flex justify-between items-center pb-4 mb-4 border-b-2 border-black/10 dark:border-white/10">
             <h4 className="text-xs font-black uppercase tracking-wider text-black dark:text-white">Order Items Manifest</h4>
             <button 
               className="text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 bg-neoCyan text-black border-2 border-black shadow-neo-sm hover:bg-cyan-300 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
               onClick={(e) => { e.stopPropagation(); onTrack(order); }}
             >
               📍 Track Order
             </button>
          </div>
          
          <div className="space-y-2.5 mb-5">
            {order.items.map(item => (
              <div key={item.productId || item.id} className="flex items-center justify-between bg-neoCream dark:bg-zinc-800 p-3 border-2 border-black shadow-neo-sm">
                <div className="flex items-center gap-3">
                   <div className="w-9 h-9 bg-white dark:bg-zinc-700 border border-black flex items-center justify-center text-base font-black">📦</div>
                   <div>
                      <div className="text-xs font-black text-black dark:text-white uppercase tracking-tight">{item.name}</div>
                      <div className="text-[10px] font-bold text-gray-500 mt-0.5">Quantity: {item.qty}</div>
                   </div>
                </div>
                <span className="text-xs font-black text-black dark:text-white bg-neoYellow border border-black px-2 py-0.5 shadow-neo-sm">{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-3 border-t-2 border-dashed border-black/20 dark:border-white/20">
            <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Total Value</span>
            <span className="text-xl font-black text-black dark:text-white tracking-tight">{formatPrice(order.total)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function TrackingModal({ order, onClose }) {
  const steps = [
    { id: 'Processing', label: 'Order Processed', icon: '⚙️', desc: 'Order verified and packaging' },
    { id: 'Shipped', label: 'Shipped', icon: '🚚', desc: 'Package in courier transit' },
    { id: 'Delivered', label: 'Delivered', icon: '🏠', desc: 'Package received safely' }
  ]

  const currentIdx = steps.findIndex(s => s.id === order.status)
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-fade-in font-sans" onClick={onClose}>
       <div className="bg-white dark:bg-zinc-900 border-4 border-black dark:border-white w-full max-w-md overflow-hidden shadow-neo-xl animate-scale-in" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="bg-neoYellow border-b-4 border-black dark:border-white p-6 relative">
             <button 
               className="absolute top-5 right-5 w-8 h-8 bg-white border-2 border-black text-black font-black flex items-center justify-center shadow-neo-sm hover:bg-neoPink hover:text-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all" 
               onClick={onClose}
             >
               ✕
             </button>
             <div className="inline-block bg-black text-white px-2 py-0.5 font-black text-[9px] uppercase tracking-widest mb-1.5">
               TRACKING CONSOLE
             </div>
             <h3 className="text-xl font-black uppercase tracking-tight text-black">Live Logistics Track</h3>
             <p className="text-xs font-mono font-bold text-black/80 mt-0.5">ID: {order._id || order.id}</p>
          </div>
          
          <div className="p-6">
             <div className="space-y-4">
                {steps.map((step, idx) => {
                  const isDone = idx <= currentIdx
                  const isCurrent = idx === currentIdx
                  
                  return (
                    <div key={step.id} className="flex gap-4 items-start">
                       <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 border-2 border-black flex items-center justify-center text-lg shadow-neo-sm ${
                            isDone 
                              ? 'bg-neoGreen text-black font-black' 
                              : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'
                          } ${isCurrent ? 'ring-2 ring-black dark:ring-white scale-105' : ''}`}>
                             {step.icon}
                          </div>
                          {idx < steps.length - 1 && (
                            <div className={`w-1 h-8 my-1 border-r-2 border-black ${idx < currentIdx ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-zinc-800'}`} />
                          )}
                       </div>

                       <div className={`flex-1 pt-1 ${!isDone ? 'opacity-40' : ''}`}>
                          <h5 className="text-xs font-black uppercase tracking-wider text-black dark:text-white mb-0.5">
                            {step.label}
                          </h5>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold leading-relaxed">{step.desc}</p>
                       </div>
                    </div>
                  )
                })}
             </div>
          </div>
          
          <div className="p-6 pt-0">
             <button 
               className="w-full bg-black text-white border-3 border-black py-3 font-black text-xs uppercase tracking-wider shadow-neo hover:bg-zinc-800 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
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
    <div className="py-10 sm:py-16 bg-neoCream dark:bg-zinc-950 min-h-screen font-sans">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-8 pb-6 border-b-4 border-black dark:border-white">
          <div>
            <div className="inline-block bg-neoPink text-white border-2 border-black px-2.5 py-0.5 font-black text-[10px] uppercase tracking-widest shadow-neo-sm mb-2 -rotate-1">
              LEDGER ARCHIVE
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-black dark:text-white tracking-tight uppercase">My Orders</h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">
              History of {orders.length} order{orders.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="w-14 h-14 bg-neoYellow border-3 border-black flex items-center justify-center text-3xl shadow-neo font-black">📋</div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-neo-lg p-12 sm:p-16 flex flex-col items-center text-center">
             <div className="text-7xl mb-6">📦</div>
             <h3 className="text-2xl font-black text-black dark:text-white mb-2 tracking-tight uppercase">No Orders Recorded</h3>
             <p className="text-xs font-bold text-gray-500 max-w-sm mx-auto leading-relaxed">
                Your purchases will appear here after your first checkout from SE-MARKET.
             </p>
          </div>
        ) : (
          <div className="space-y-4">
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
