import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  MessageCircle, X, Send, User, ChevronDown, Sparkles, Package,
  HelpCircle, ShieldCheck, ArrowRight, Bot, Clock, CheckCircle2,
  MessageSquare, Heart, RefreshCw, Headphones
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { motion, AnimatePresence } from 'framer-motion';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://alimenture.onrender.com';

const INQUIRY_TYPES = [
  { id: 'general', label: 'General Query', icon: MessageSquare },
  { id: 'product', label: 'Product Support', icon: Heart },
  { id: 'order', label: 'Order & Delivery', icon: Package },
  { id: 'person', label: 'Live Specialist', icon: User }
];

const QUICK_PROMPTS = [
  "Where is my order?",
  "Are your products 100% maida free?",
  "Which snack is best for toddlers?",
  "What payment options are available?"
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatSession, setChatSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  // Form states
  const [type, setType] = useState('general');
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState(() => !!localStorage.getItem('token'));

  // Re-check auth whenever the widget is opened
  useEffect(() => {
    if (isOpen) setAuthed(!!localStorage.getItem('token'));
  }, [isOpen]);

  // Warn before leaving active session
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (chatSession) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [chatSession]);

  // Socket Connection
  useEffect(() => {
    if (chatSession && chatSession.chatId) {
      const token = localStorage.getItem('token');
      const newSocket = io(SOCKET_URL, { auth: { token } });
      setSocket(newSocket);
      newSocket.on('connect_error', (err) => {
        console.error('Chat connection failed:', err.message);
      });

      newSocket.emit('join_chat', chatSession.chatId);

      newSocket.on('receive_message', (msg) => {
        setMessages((prev) => [...prev, msg]);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [chatSession]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startChat = async (e) => {
    if (e) e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/chat/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ type })
      });
      const data = await res.json();
      if (data.success) {
        const session = {
          chatId: data.chatId,
          name: localStorage.getItem('userName') || 'You',
          email: localStorage.getItem('userEmail') || '',
        };
        setChatSession(session);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = (e, textToSend = null) => {
    if (e) e.preventDefault();
    const content = textToSend || inputMsg;
    if (!content.trim() || !socket || !chatSession) return;

    socket.emit('send_message', {
      chatId: chatSession.chatId,
      text: content
    });

    setInputMsg('');
  };

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[9999] font-sans flex items-end justify-end">

      {/* ——— FLOATING TRIGGER LAUNCHER ——— */}
      <div className="flex items-center gap-3 relative z-10">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-rose-700 text-white shadow-[0_8px_24px_rgba(190,18,60,0.35)] hover:shadow-[0_12px_32px_rgba(190,18,60,0.45)] flex items-center justify-center cursor-pointer transition-all duration-300 relative outline-none"
          aria-label="Toggle support chat"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Online green indicator dot */}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-[18px] w-[18px] sm:h-5 sm:w-5">
              <span className="relative inline-flex rounded-full h-full w-full bg-[#00D084] border-[2.5px] border-white shadow-sm" />
            </span>
          )}
        </motion.button>
      </div>

      {/* ——— CHAT WINDOW POPUP CONTAINER ——— */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="w-[calc(100vw-2rem)] sm:w-[380px] max-h-[calc(100vh-90px)] bg-white rounded-[1.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col overflow-hidden fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-[9999]"
          >
            {/* — HEADER — */}
            <div className="bg-[#0a0806] text-white px-5 py-4 flex items-center justify-between relative overflow-hidden shrink-0">
              
              {/* Subtle background ambient light */}
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-rose-600 opacity-20 blur-3xl pointer-events-none" />

              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0 border border-white/5">
                  <Headphones className="w-4 h-4 text-rose-300" />
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-display font-bold text-sm text-white tracking-tight leading-none">Alimenture Support</h3>
                  </div>
                  <p className="text-[10px] font-medium text-gray-400 mt-1 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    Online • Replying in minutes
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="h-7 w-7 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center transition-all relative z-10 active:scale-95 cursor-pointer outline-none border border-white/5"
                aria-label="Close support chat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* — BODY CONTENT — */}
            <div className={`bg-white p-5 flex flex-col relative overflow-y-auto ${chatSession ? 'h-[400px]' : ''}`}>
              
              {!chatSession ? (
                /* PRE-CHAT REGISTRATION FORM — COMPACT FIT */
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col space-y-3 relative z-10"
                >
                  {/* Info Header */}
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-rose-700 shrink-0 shadow-sm border border-gray-100">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-gray-900 font-display">Live Customer Support</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                        {authed ? 'Choose a topic to start your session.' : 'Sign in to start a support session.'}
                      </p>
                    </div>
                  </div>

                  {!authed ? (
                    <div className="flex flex-col items-center gap-3 py-4 text-center">
                      <ShieldCheck className="w-8 h-8 text-rose-700" />
                      <p className="text-xs text-gray-600 font-medium leading-snug">
                        Please sign in to your account to chat with our support team.
                      </p>
                      <Button
                        type="button"
                        onClick={() => { window.location.href = '/login'; }}
                        className="w-full h-11 rounded-full bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs uppercase tracking-wider"
                      >
                        Sign In
                      </Button>
                    </div>
                  ) : (
                  <form onSubmit={startChat} className="space-y-3 pt-1">

                    {/* Inquiry Type Cards Grid - Compact */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase text-gray-400 tracking-wider ml-1 flex items-center gap-1">
                        <HelpCircle className="w-2.5 h-2.5 text-gray-400" /> Inquiry Type
                      </label>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {INQUIRY_TYPES.map((item) => {
                          const IconComp = item.icon;
                          const isSelected = type === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setType(item.id)}
                              className={`px-3 h-10 rounded-xl text-left border outline-none transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                                isSelected
                                  ? 'bg-rose-50 border-rose-200 shadow-sm shadow-rose-100/50'
                                  : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-rose-700 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                <IconComp className="w-3 h-3" />
                              </div>
                              <span className={`font-bold text-[10px] leading-tight truncate ${isSelected ? 'text-rose-900' : 'text-gray-600'}`}>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="pt-2">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 rounded-full bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-700/20 flex items-center justify-center gap-2 transition-all cursor-pointer border-none outline-none"
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Starting Session...</span>
                          </div>
                        ) : (
                          <>
                            <span>Start Support Session</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </form>
                  )}

                  {/* Trust Footer note */}
                  <div className="pt-2 text-center">
                    <p className="text-[10px] text-gray-400 font-bold flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      Encrypted Support Session
                    </p>
                  </div>
                </motion.div>
              ) : (
                /* IN-CHAT MESSAGES STREAM */
                <div className="flex flex-col space-y-4">

                  <div className="text-center py-1.5 px-4 rounded-full bg-gray-100 self-center mb-2">
                    <p className="text-[10px] font-bold text-gray-500">
                      Session Active: <span className="font-bold text-gray-900">{chatSession.name}</span>
                    </p>
                  </div>

                  {messages.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-rose-700 shrink-0">
                          <Bot className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-gray-900 font-display">Representative Connected</h4>
                          <p className="text-[11px] text-gray-500 leading-snug">Ask us anything about products, orders, or millets.</p>
                        </div>
                      </div>

                      {/* Quick Suggestions */}
                      <div className="space-y-2 pt-3 border-t border-gray-200/60 mt-3">
                        <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Quick Suggestions:</p>
                        <div className="flex flex-col gap-2">
                          {QUICK_PROMPTS.map((prompt, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => sendMessage(null, prompt)}
                              className="text-left text-xs font-medium text-gray-600 bg-white hover:bg-rose-50 hover:text-rose-700 border border-gray-100 hover:border-rose-200 px-3.5 py-2.5 rounded-xl transition-all outline-none cursor-pointer shadow-sm"
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Messages */}
                  {messages.map((msg, idx) => {
                    const isUser = msg.senderType === 'user';
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        key={idx}
                        className={`flex flex-col max-w-[85%] ${isUser ? 'self-end items-end' : 'self-start items-start'}`}
                      >
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 px-1">
                          {msg.senderName || (isUser ? 'You' : 'Support')}
                        </span>
                        
                        <div
                          className={`px-4 py-3 rounded-[1.25rem] font-medium text-[13px] leading-relaxed shadow-sm ${
                            isUser
                              ? 'bg-rose-700 text-white rounded-br-sm'
                              : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </motion.div>
                    );
                  })}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* — FOOTER INPUT — */}
            {chatSession && (
              <div className="p-4 bg-white shrink-0 border-t border-gray-100">
                <form onSubmit={sendMessage} className="flex gap-2.5">
                  <Input
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    placeholder="Type your query..."
                    className="flex-1 h-12 rounded-full bg-gray-50 border border-gray-200 outline-none focus:outline-none focus:bg-white focus:border-rose-300 focus:ring-4 focus:ring-rose-50 font-medium text-[13px] text-gray-900 placeholder:text-gray-400 transition-all px-4"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-rose-700 hover:bg-rose-800 text-white shrink-0 shadow-lg shadow-rose-700/20 hover:scale-105 active:scale-95 transition-all cursor-pointer border-none outline-none"
                  >
                    <Send className="w-5 h-5 ml-0.5" />
                  </Button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
