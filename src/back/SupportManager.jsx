import React, { useState, useEffect, useRef } from 'react'
import { formatDate } from '../utils'

export default function SupportManager() {
  const [chats, setChats] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [reply, setReply] = useState('')
  const scrollRef = useRef(null)

  const loadAllMessages = () => {
    try {
      const allMessages = JSON.parse(localStorage.getItem('nex_chat_messages') || '[]')
      // Group messages by userId
      const groups = allMessages.reduce((acc, m) => {
        if (!acc[m.userId]) {
          acc[m.userId] = {
            userId: m.userId,
            userName: m.userName,
            messages: [],
            lastTime: m.timestamp
          }
        }
        acc[m.userId].messages.push(m)
        acc[m.userId].lastTime = m.timestamp
        return acc
      }, {})
      
      const sorted = Object.values(groups).sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime))
      setChats(sorted)
    } catch (e) {
      setChats([])
    }
  }

  useEffect(() => {
    loadAllMessages()
    const handleStorage = (e) => {
      if (e.key === 'nex_chat_messages') loadAllMessages()
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [selectedUser, chats])

  const handleReply = (e) => {
    e.preventDefault()
    if (!reply.trim() || !selectedUser) return

    const newMessage = {
      id: Date.now(),
      userId: selectedUser.userId,
      userName: selectedUser.userName,
      text: reply,
      sender: 'admin',
      timestamp: new Date().toISOString()
    }

    const allMessages = JSON.parse(localStorage.getItem('nex_chat_messages') || '[]')
    const updated = [...allMessages, newMessage]
    localStorage.setItem('nex_chat_messages', JSON.stringify(updated))
    
    loadAllMessages()
    setReply('')
  }

  const currentChat = selectedUser ? chats.find(c => c.userId === selectedUser.userId) : null

  return (
    <div className="flex gap-10 h-[calc(100vh-250px)] animate-fade-in">
      {/* User List */}
      <div className="w-80 flex flex-col gap-6">
         <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xl flex-1 flex flex-col">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800">
               <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Active Sessions</h3>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Real-time engagement</p>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
               {chats.length === 0 ? (
                 <div className="p-10 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No active chats</p>
                 </div>
               ) : (
                 chats.map(chat => (
                   <button
                     key={chat.userId}
                     onClick={() => setSelectedUser(chat)}
                     className={`w-full flex flex-col gap-2 p-5 rounded-2xl transition-all text-left group ${
                       selectedUser?.userId === chat.userId 
                         ? 'bg-indigo-600 shadow-xl shadow-indigo-500/20' 
                         : 'hover:bg-slate-50 dark:hover:bg-white/5'
                     }`}
                   >
                     <div className="flex justify-between items-center">
                        <span className={`text-[11px] font-black uppercase tracking-tight ${selectedUser?.userId === chat.userId ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                          {chat.userName}
                        </span>
                        <span className={`text-[8px] font-black ${selectedUser?.userId === chat.userId ? 'text-white/50' : 'text-slate-400'}`}>
                          {new Date(chat.lastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                     </div>
                     <p className={`text-[10px] truncate font-medium ${selectedUser?.userId === chat.userId ? 'text-white/70' : 'text-slate-400'}`}>
                        {chat.messages[chat.messages.length - 1].text}
                     </p>
                   </button>
                 ))
               )}
            </div>
         </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col overflow-hidden">
         {selectedUser ? (
           <>
             {/* Chat Header */}
             <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-5">
                   <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-xl text-indigo-600 font-black shadow-inner">
                      {selectedUser.userName[0].toUpperCase()}
                   </div>
                   <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">{selectedUser.userName}</h3>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Customer Session ID: {selectedUser.userId}</p>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Chat</span>
                </div>
             </div>

             {/* Messages */}
             <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-6 bg-slate-50/30 dark:bg-transparent no-scrollbar">
                {currentChat?.messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-xl">
                      <div className={`p-5 rounded-[24px] text-xs font-medium shadow-sm leading-relaxed ${
                        m.sender === 'admin' 
                          ? 'bg-slate-900 text-white rounded-tr-none' 
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-tl-none'
                      }`}>
                        {m.text}
                      </div>
                      <div className={`text-[8px] mt-2 font-black uppercase tracking-widest opacity-40 px-2 ${m.sender === 'admin' ? 'text-right' : 'text-left'}`}>
                         {m.sender === 'admin' ? 'Back Office' : m.userName} • {new Date(m.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
             </div>

             {/* Input */}
             <form onSubmit={handleReply} className="p-8 border-t border-slate-100 dark:border-slate-800">
                <div className="flex gap-4 bg-slate-50 dark:bg-slate-800 p-3 rounded-[24px] focus-within:ring-4 ring-indigo-500/10 transition-all border border-transparent focus-within:border-indigo-500/20">
                   <input 
                     type="text"
                     placeholder="Type official response…"
                     className="flex-1 bg-transparent px-5 py-3 text-sm outline-none text-slate-900 dark:text-white font-medium"
                     value={reply}
                     onChange={e => setReply(e.target.value)}
                   />
                   <button 
                     type="submit"
                     className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
                   >
                     Dispatch Reply
                   </button>
                </div>
             </form>
           </>
         ) : (
           <div className="flex-1 flex flex-col items-center justify-center text-center p-20 grayscale opacity-10">
              <div className="text-9xl mb-10">💬</div>
              <h3 className="text-3xl font-black uppercase tracking-tighter">Support Console</h3>
              <p className="text-sm font-medium mt-4">Select an active session from the left to begin engagement.</p>
           </div>
         )}
      </div>
    </div>
  )
}
