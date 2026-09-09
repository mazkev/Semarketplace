import React, { useState, useEffect, useRef } from 'react'

const AI_SUGGESTIONS = [
  '⚡ Rekomendasi Flash Sale',
  '🎟️ Kode Voucher Aktif',
  '🚚 Cek Info Ongkir',
  '📦 Lacak Pesanan Saya'
]

function getAIResponse(text, userName) {
  const lower = text.toLowerCase()
  if (lower.includes('voucher') || lower.includes('kupon') || lower.includes('diskon')) {
    return `🎉 Gunakan kode kupon **SEMARKET10** saat checkout untuk potongan 10% langsung di semua produk, atau **SAVE50** untuk diskon Rp 50.000!`
  }
  if (lower.includes('flash') || lower.includes('sale') || lower.includes('promo') || lower.includes('rekomendasi')) {
    return `⚡ Rekomendasi terpanas hari ini ada di bagian **Lightning Flash Deals** dengan diskon hingga 50%! Cek di beranda toko sekarang sebelum kehabisan!`
  }
  if (lower.includes('ongkir') || lower.includes('kirim') || lower.includes('shipping') || lower.includes('antar')) {
    return `🚚 Kabar baik! Saat ini SEMARKET memberikan **GRATIS ONGKIR 100% (Rp 0)** ke seluruh wilayah Indonesia dengan pengiriman ekspres kilat!`
  }
  if (lower.includes('order') || lower.includes('pesan') || lower.includes('lacak') || lower.includes('status')) {
    return `📦 Anda dapat mengecek detail dan status pesanan langsung di menu **My Orders** pada navigation bar atas. Klik tombol '📍 Track Order' untuk melihat live tracking!`
  }
  if (lower.includes('halo') || lower.includes('hai') || lower.includes('hi') || lower.includes('help') || lower.includes('bantuan')) {
    return `👋 Halo ${userName}! Saya adalah **SE-AI Shopping Assistant**. Ada produk atau penawaran promo yang bisa saya bantu carikan untuk Anda hari ini?`
  }
  return `🤖 Terima kasih atas pertanyaannya! Tim kurator SEMARKET siap membantu. Anda juga bisa mencoba kode promo **SEMARKET10** untuk diskon instan belanja Anda hari ini!`
}

export default function LiveChat({ user }) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
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
  }, [messages, isOpen, isTyping])

  const sendMsg = (text) => {
    if (!text.trim()) return

    const userMsg = {
      id: Date.now(),
      userId: user._id,
      userName: user.name,
      text: text,
      sender: 'customer',
      timestamp: new Date().toISOString()
    }

    const allMessages = JSON.parse(localStorage.getItem('nex_chat_messages') || '[]')
    const updated = [...allMessages, userMsg]
    localStorage.setItem('nex_chat_messages', JSON.stringify(updated))
    loadMessages()
    setMessage('')

    // Trigger AI response after short delay
    setIsTyping(true)
    setTimeout(() => {
      const replyText = getAIResponse(text, user.name.split(' ')[0])
      const botMsg = {
        id: Date.now() + 1,
        userId: user._id,
        userName: 'SE-AI Assistant',
        text: replyText,
        sender: 'assistant',
        timestamp: new Date().toISOString()
      }
      const curMessages = JSON.parse(localStorage.getItem('nex_chat_messages') || '[]')
      localStorage.setItem('nex_chat_messages', JSON.stringify([...curMessages, botMsg]))
      setIsTyping(false)
      loadMessages()
    }, 700)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMsg(message)
  }

  return (
    <div className="fixed bottom-6 right-6 z-[150] font-sans select-none">
      {/* AI Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[350px] sm:w-[400px] h-[540px] bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-neo-xl flex flex-col overflow-hidden animate-scale-in origin-bottom-right">
          {/* Neo Header */}
          <div className="bg-neoYellow border-b-4 border-black p-4 text-black shrink-0 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-black text-white border-2 border-black flex items-center justify-center text-2xl shadow-neo-sm font-black">
                  🤖
                </div>
                <div>
                   <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-black uppercase tracking-wider leading-none">SE-AI ASSISTANT</h4>
                      <span className="bg-neoPink text-white text-[9px] font-black px-1.5 py-0.2 border border-black shadow-neo-sm">
                        AI BOT
                      </span>
                   </div>
                   <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-2 h-2 bg-neoGreen border border-black animate-pulse"></div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-black/80">Neural Core Ready</span>
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

          {/* Quick AI Suggestions */}
          <div className="p-2.5 bg-neoCream dark:bg-zinc-800 border-b-3 border-black overflow-x-auto no-scrollbar flex gap-2 whitespace-nowrap">
            {AI_SUGGESTIONS.map(s => (
              <button
                key={s}
                className="px-2.5 py-1 bg-white dark:bg-zinc-900 border-2 border-black text-[10px] font-black uppercase tracking-wider shadow-neo-sm hover:bg-yellow-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                onClick={() => sendMsg(s)}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar scroll-smooth bg-white dark:bg-zinc-900"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                 <div className="text-5xl mb-3">🤖</div>
                 <div className="bg-neoYellow border-3 border-black p-4 shadow-neo text-xs font-black uppercase max-w-xs">
                    Halo {user.name.split(' ')[0]}!<br/>
                    Saya adalah <span className="underline decoration-2">SE-AI Assistant</span>.<br/>
                    Tanyakan apa saja seputar promo, produk, atau pesanan Anda!
                 </div>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.sender === 'customer'
                return (
                  <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 text-xs font-bold border-2 border-black shadow-neo-sm ${
                      isUser 
                        ? 'bg-neoCyan text-black' 
                        : 'bg-neoCream dark:bg-zinc-800 text-black dark:text-white'
                    }`}>
                      {!isUser && (
                        <div className="text-[9px] font-black uppercase text-neoPink mb-1 flex items-center gap-1">
                          <span>🤖 SE-AI</span>
                        </div>
                      )}
                      <div className="leading-relaxed whitespace-pre-wrap">{m.text}</div>
                      <div className={`text-[8px] mt-1.5 font-black uppercase opacity-60 ${isUser ? 'text-right' : 'text-left'}`}>
                         {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )
              })
            )}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-neoCream dark:bg-zinc-800 border-2 border-black p-2.5 shadow-neo-sm flex items-center gap-2">
                  <span className="text-sm animate-spin">⚡</span>
                  <span className="text-[10px] font-black uppercase text-gray-500">AI sedang mengetik…</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-3 bg-white dark:bg-zinc-900 border-t-3 border-black dark:border-white">
            <div className="flex gap-2">
               <input 
                 type="text" 
                 placeholder="Tanya AI seputar promo, ongkir, produk…"
                 className="flex-1 bg-neoCream dark:bg-zinc-800 border-2 border-black dark:border-white px-3 py-2 text-xs font-bold outline-none text-black dark:text-white shadow-neo-sm"
                 value={message}
                 onChange={e => setMessage(e.target.value)}
               />
               <button 
                 type="submit"
                 className="px-4 py-2 bg-neoYellow hover:bg-yellow-300 text-black border-2 border-black font-black text-xs uppercase shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1"
               >
                 <span>KIRIM</span>
                 <span>➔</span>
               </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating Launcher Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 bg-neoYellow hover:bg-yellow-300 border-3 border-black text-black shadow-neo active:translate-x-1 active:translate-y-1 active:shadow-none transition-all font-black group"
        title="Open AI Chat Assistant"
      >
        <span className="text-2xl group-hover:rotate-12 transition-transform">🤖</span>
        <span className="text-xs uppercase tracking-wider font-black hidden sm:inline">
          {isOpen ? 'TUTUP AI' : 'AI CHAT'}
        </span>
        {!isOpen && (
          <span className="w-2.5 h-2.5 bg-neoGreen border border-black animate-pulse rounded-full"></span>
        )}
      </button>
    </div>
  )
}
