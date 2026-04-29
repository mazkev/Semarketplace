import React, { useState, useEffect, useRef } from 'react'

export default function LiveChat({ user }) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const scrollRef = useRef(null)

  // Load messages from localStorage
  const loadMessages = () => {
    try {
      const allMessages = JSON.parse(localStorage.getItem('nex_chat_messages') || '[]')
      // Filter messages for this specific user
      const myMessages = allMessages.filter(m => m.userId === user._id)
      setMessages(myMessages)
    } catch (e) {
      setMessages([])
    }
  }

  useEffect(() => {
    loadMessages()
    // Listen for storage changes (replies from Admin)
    const handleStorage = (e) => {
      if (e.key === 'nex_chat_messages') loadMessages()
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [user._id])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isOpen])

  const handleSend = (e) => {
    e.preventDefault()
    if (!message.trim()) return

    const newMessage = {
      id: Date.now(),
      userId: user._id,
      userName: user.name,
      text: message,
      sender: 'customer',
      timestamp: new Date().toISOString()
    }

    const allMessages = JSON.parse(localStorage.getItem('nex_chat_messages') || '[]')
    const updated = [...allMessages, newMessage]
    localStorage.setItem('nex_chat_messages', JSON.stringify(updated))
    
    // Manually trigger local update since 'storage' event doesn't fire in the same tab
    loadMessages()
    setMessage('')
  }

  return (
    <div className="fixed bottom-8 right-8 z-[150] font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[380px] h-[550px] bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[32px] shadow-[0_30px_100px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden border border-white/20 animate-scale-in origin-bottom-right">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-6 text-white shrink-0">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shadow-xl border border-white/10">🛎️</div>
                   <div>
                      <h4 className="text-sm font-black uppercase tracking-widest">SeMarketplace</h4>
                      <div className="flex items-center gap-1.5 mt-1">
                         <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                         <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Concierge Active</span>
                      </div>
                   </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">✕</button>
             </div>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar scroll-smooth bg-slate-50/50 dark:bg-transparent"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                 <div className="text-4xl mb-4 grayscale opacity-20">👋</div>
                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                    Hello {user.name.split(' ')[0]}!<br/>How can we assist you today?
                 </p>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === 'customer' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-medium shadow-sm ${
                    m.sender === 'customer' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-tl-none'
                  }`}>
                    {m.text}
                    <div className={`text-[8px] mt-2 opacity-40 font-black uppercase ${m.sender === 'customer' ? 'text-right' : 'text-left'}`}>
                       {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div className="flex gap-3 bg-slate-50 dark:bg-slate-800 rounded-2xl p-2 focus-within:ring-2 ring-indigo-500/20 transition-all">
               <input 
                 type="text" 
                 placeholder="Describe your request…"
                 className="flex-1 bg-transparent px-4 py-2 text-xs outline-none text-slate-800 dark:text-white font-medium"
                 value={message}
                 onChange={e => setMessage(e.target.value)}
               />
               <button 
                 type="submit"
                 className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg"
               >
                 →
               </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-[24px] flex items-center justify-center text-2xl shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 group ${
          isOpen ? 'bg-slate-900 text-white rotate-90' : 'bg-indigo-600 text-white'
        }`}
      >
        <span className="group-hover:animate-bounce-slow">{isOpen ? '✕' : '💬'}</span>
        {!isOpen && (
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-950 animate-pulse">
            1
          </span>
        )}
      </button>
    </div>
  )
}
