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
      const myMessages = allMessages.filter(m => m.userId === user._id)
      setMessages(myMessages)
    } catch (e) {
      setMessages([])
    }
  }

  useEffect(() => {
    loadMessages()
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
    
    loadMessages()
    setMessage('')
  }

  return (
    <div className="fixed bottom-6 right-6 z-[150] font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[360px] sm:w-[380px] h-[520px] bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-neo-xl flex flex-col overflow-hidden animate-scale-in origin-bottom-right">
          {/* Neo Header */}
          <div className="bg-neoYellow border-b-4 border-black p-4 text-black shrink-0 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black text-white border-2 border-black flex items-center justify-center text-xl shadow-neo-sm">🛎️</div>
                <div>
                   <h4 className="text-sm font-black uppercase tracking-wider leading-none">SE-MARKET</h4>
                   <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-2 h-2 bg-neoGreen border border-black animate-pulse"></div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-black/80">Support Active</span>
                   </div>
                </div>
             </div>
             <button 
               onClick={() => setIsOpen(false)} 
               className="w-8 h-8 bg-white border-2 border-black text-black font-black flex items-center justify-center shadow-neo-sm hover:bg-neoPink hover:text-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
             >
               ✕
             </button>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar scroll-smooth bg-neoCream/30 dark:bg-zinc-900"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                 <div className="text-4xl mb-3">👋</div>
                 <div className="bg-neoYellow border-2 border-black p-3 shadow-neo-sm text-xs font-black uppercase">
                    Hello {user.name.split(' ')[0]}!<br/>How can we assist you today?
                 </div>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 text-xs font-bold border-2 border-black shadow-neo-sm ${
                    m.sender === 'customer' 
                      ? 'bg-neoCyan text-black' 
                      : 'bg-white dark:bg-zinc-800 text-black dark:text-white'
                  }`}>
                    {m.text}
                    <div className={`text-[8px] mt-1.5 font-black uppercase opacity-60 ${m.sender === 'customer' ? 'text-right' : 'text-left'}`}>
                       {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-white dark:bg-zinc-900 border-t-3 border-black dark:border-white">
            <div className="flex gap-2">
               <input 
                 type="text" 
                 placeholder="Type your message…"
                 className="flex-1 bg-neoCream dark:bg-zinc-800 border-2 border-black dark:border-white px-3 py-2 text-xs font-bold outline-none text-black dark:text-white shadow-neo-sm"
                 value={message}
                 onChange={e => setMessage(e.target.value)}
               />
               <button 
                 type="submit"
                 className="w-10 h-10 bg-neoYellow hover:bg-yellow-300 text-black border-2 border-black font-black flex items-center justify-center shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
               >
                 ➔
               </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-neoYellow hover:bg-yellow-300 border-3 border-black text-black flex items-center justify-center text-2xl shadow-neo active:translate-x-1 active:translate-y-1 active:shadow-none transition-all relative font-black"
        title="Live Support"
      >
        <span>{isOpen ? '✕' : '💬'}</span>
        {!isOpen && (
          <span className="absolute -top-2 -right-2 w-5 h-5 bg-neoPink text-white text-[10px] font-black flex items-center justify-center border-2 border-black shadow-neo-sm">
            !
          </span>
        )}
      </button>
    </div>
  )
}
