/**
 * @fileoverview SubhaLagna v2.3.0 — Real-Time Premium Chat
 * @description   Full-featured chat UI with glassmorphism, real-time sync,
 *                and optimized mobile flows.
 *                v2.0.0 changes:
 *                  - Enhanced glassmorphism layout
 *                  - Unified icon system
 *                  - Improved typing indicator visibility
 *                  - Fixed Participant naming logic
 */

import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext }  from '../context/AuthContext';
import { ChatContext }  from '../context/ChatContext';
import { getConversations, getMessages, markConversationRead } from '../services/chatService';
import { API_BASE_URL } from '../config';

// ── Icons ────────────────────────────────────────────────────────────────────
const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { 
    messages, setMessages, joinConversation, 
    sendSocketMessage, sendTyping, stopTyping, 
    typingUser, isConnected 
  } = useContext(ChatContext);

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(!conversationId);

  const scrollRef = useRef(null);
  const typingTimeout = useRef(null);

  // Load conversations
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingConvos(true);
        const list = await getConversations();
        setConversations(list);
        if (conversationId) {
          const found = list.find(c => c._id === conversationId);
          if (found) openConversation(found);
        }
      } catch (err) {
        console.error("Chat Error:", err);
      } finally {
        setLoadingConvos(false);
      }
    };
    load();
  }, [conversationId]);

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = async (conv) => {
    setActiveConversation(conv);
    setIsSidebarOpen(false);
    setLoadingMessages(true);
    setMessages([]); // clear old
    
    try {
      const { data } = await getMessages(conv._id);
      setMessages(data);
      joinConversation(conv._id);
      await markConversationRead(conv._id);
      
      setConversations(prev => 
        prev.map(c => c._id === conv._id ? { ...c, unreadCount: 0 } : c)
      );
      
      if (window.innerWidth < 768) setIsSidebarOpen(false);
      navigate(`/chat/${conv._id}`, { replace: true });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleTyping = (e) => {
    setInputText(e.target.value);
    if (!activeConversation) return;
    
    sendTyping(activeConversation._id);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      stopTyping(activeConversation._id);
    }, 2000);
  };

  const handleSend = (e) => {
    e.preventDefault();
    const content = inputText.trim();
    if (!content || !activeConversation) return;

    sendSocketMessage(activeConversation._id, content);
    
    // Local optimistic update
    const tempMsg = {
      _id: `temp-${Date.now()}`,
      content,
      sender: { _id: user._id, name: user.name },
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    
    setInputText('');
    stopTyping(activeConversation._id);
  };

  const getPartnerData = (conv) => {
    const partner = conv.participants?.find(p => p._id !== user?._id);
    return {
      name: conv.otherProfile?.name || partner?.name || 'Match',
      photo: conv.otherProfile?.profilePhoto || '/placeholder-profile.png'
    };
  };

  return (
    <div className="flex h-[80vh] bg-white/60 backdrop-blur-2xl rounded-[3rem] border border-rose-100 shadow-2xl shadow-rose-200/20 overflow-hidden animate-fade-in relative z-10">
      
      {/* ── Left Sidebar (Conversations) ── */}
      <aside className={`w-full md:w-96 flex flex-col border-r border-rose-50 bg-white/40 ${isSidebarOpen ? 'flex' : 'hidden md:flex'}`}>
        <div className="p-8 border-b border-rose-50 flex items-center justify-between">
           <h2 className="text-2xl font-serif font-bold text-gray-800">Messages</h2>
           <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-gray-300'}`} title={isConnected ? 'Connected' : 'Disconnected'} />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
           {loadingConvos ? (
             <div className="animate-pulse space-y-4 p-4">
               {[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl" />)}
             </div>
           ) : conversations.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-10 text-center text-gray-400">
               <div className="text-5xl mb-4">💌</div>
               <p className="font-bold text-gray-700">No chats yet</p>
               <p className="text-xs">Profiles you connect with will appear here.</p>
             </div>
           ) : (
             conversations.map(conv => {
               const partner = getPartnerData(conv);
               const isActive = activeConversation?._id === conv._id;
               return (
                 <button 
                   key={conv._id} 
                   onClick={() => openConversation(conv)}
                   className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all ${isActive ? 'bg-rose-500 text-white shadow-xl shadow-rose-200' : 'hover:bg-rose-50'}`}
                 >
                    <img src={partner.photo} className="w-14 h-14 rounded-2xl object-cover bg-gray-100" alt="" />
                    <div className="flex-1 text-left min-w-0">
                       <div className="flex justify-between items-center mb-1">
                          <p className={`font-bold truncate ${isActive ? 'text-white' : 'text-gray-800'}`}>{partner.name}</p>
                          {conv.unreadCount > 0 && !isActive && (
                            <span className="w-5 h-5 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">{conv.unreadCount}</span>
                          )}
                       </div>
                       <p className={`text-xs truncate ${isActive ? 'text-rose-100' : 'text-gray-400'}`}>{conv.lastMessage || 'Click to start chatting'}</p>
                    </div>
                 </button>
               )
             })
           )}
        </div>
      </aside>

      {/* ── Main Chat Thread ── */}
      <section className={`flex-1 flex flex-col bg-slate-50/30 ${isSidebarOpen ? 'hidden md:flex' : 'flex'}`}>
        {activeConversation ? (
          <>
            {/* Thread Header */}
            <header className="p-6 bg-white/70 backdrop-blur-md border-b border-rose-50 flex items-center gap-4">
               <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-rose-500 hover:bg-rose-50 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
               </button>
               <img src={getPartnerData(activeConversation).photo} className="w-12 h-12 rounded-2xl object-cover" alt="" />
               <div>
                  <h3 className="font-bold text-gray-800">{getPartnerData(activeConversation).name}</h3>
                  {typingUser ? (
                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest animate-pulse">Typing...</p>
                  ) : (
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active Now</p>
                  )}
               </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-pattern-subtle">
               {loadingMessages ? (
                 <div className="space-y-4">
                   {[1,2,3].map(i => <div key={i} className={`h-12 w-48 rounded-2xl animate-pulse ${i % 2 === 0 ? 'bg-gray-100 self-end' : 'bg-gray-200'}`} />)}
                 </div>
               ) : messages.map((msg, i) => {
                 const isOwn = msg.sender?._id === user?._id || msg.sender === user?._id;
                 return (
                   <div key={msg._id || i} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-5 py-3 rounded-[1.5rem] shadow-sm text-sm leading-relaxed ${isOwn ? 'bg-gradient-to-br from-rose-500 to-pink-500 text-white rounded-br-md shadow-rose-200' : 'bg-white text-gray-700 rounded-bl-md border border-rose-50'}`}>
                        {msg.content}
                        <div className={`text-[9px] mt-1 text-right opacity-60 ${isOwn ? 'text-white' : 'text-gray-400'}`}>
                           {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                   </div>
                 )
               })}
               <div ref={scrollRef} />
            </div>

            {/* Input Bar */}
            <footer className="p-6 bg-white/70 border-t border-rose-50">
               <form onSubmit={handleSend} className="flex gap-3">
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={handleTyping}
                    placeholder="Type a premium message..."
                    className="flex-1 bg-slate-100/50 border border-transparent focus:border-rose-200 focus:bg-white rounded-2xl px-6 py-4 text-sm outline-none transition-all"
                  />
                  <button 
                    type="submit" 
                    disabled={!inputText.trim()}
                    className="p-4 bg-gradient-to-r from-rose-600 to-pink-500 text-white rounded-2xl shadow-xl shadow-rose-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
                  >
                     <SendIcon />
                  </button>
               </form>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
             <div className="w-24 h-24 bg-rose-50 rounded-[2rem] flex items-center justify-center text-5xl mb-6 shadow-inner ring-8 ring-white">💬</div>
             <h3 className="text-2xl font-serif font-bold text-gray-800 mb-2">Private Secure Chat</h3>
             <p className="text-gray-400 max-w-sm text-sm">Select a match to start your private conversation. All messages are encrypted for your security.</p>
          </div>
        )}
      </section>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #fee2e2; border-radius: 10px; }
        .bg-pattern-subtle {
          background-image: radial-gradient(#fff1f2 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
};

export default Chat;
