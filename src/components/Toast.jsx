export default function Toast({ toasts }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4">
      {toasts.map(t => (
        <div 
          key={t.id} 
          className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl animate-slide-in-bottom border backdrop-blur-md ${
            t.type === 'success' 
              ? 'bg-green-50/95 border-green-200 text-green-900' 
              : t.type === 'error' 
                ? 'bg-red-50/95 border-red-200 text-red-900' 
                : 'bg-white/95 border-gray-200 text-gray-900'
          }`}
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg bg-white/50 shadow-inner">
            {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}
          </div>
          <span className="text-sm font-black tracking-tight leading-tight">{t.msg}</span>
        </div>
      ))}
    </div>
  )
}

