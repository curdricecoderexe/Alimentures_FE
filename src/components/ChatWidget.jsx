import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  MessageCircle, X, Send, User, Sparkles, Package,
  HelpCircle, ShieldCheck, ArrowRight, Bot, CheckCircle2,
  MessageSquare, Heart, RefreshCw, Headphones, History, Plus,
  Lock, Undo2
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

const TYPE_LABEL = { general: 'General Query', product: 'Product Support', order: 'Order & Delivery', person: 'Live Specialist' };

const QUICK_PROMPTS = [
  "Where is my order?",
  "Are your products 100% maida free?",
  "Which snack is best for toddlers?",
  "What payment options are available?"
];

const fmtDate = (ts) => {
  if (!ts) return '';
  const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const STATUS_META = {
  pending: { label: 'Waiting for a specialist', dot: 'bg-amber-500' },
  active: { label: 'Active now', dot: 'bg-emerald-500' },
  closed: { label: 'Ticket closed', dot: 'bg-gray-400' },
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatSession, setChatSession] = useState(null); // { chatId, name, email, status, type }
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  // Ticket tracking — solves the widget "forgetting" a chat once it's closed
  // or the page reloads: every ticket the customer has ever opened is fetched
  // and re-shown here instead of only living in this component's own state.
  const [myChats, setMyChats] = useState([]);
  const [chatsLoaded, setChatsLoaded] = useState(false);
  const [showTicketList, setShowTicketList] = useState(false);

  // Form states
  const [type, setType] = useState('general');
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState(() => !!localStorage.getItem('token'));

  // Re-check auth whenever the widget is opened
  useEffect(() => {
    if (isOpen) setAuthed(!!localStorage.getItem('token'));
  }, [isOpen]);

  // Other pages (e.g. "Chat with support" on Order Tracking) open this widget
  // via a custom event, since it's mounted once at the layout level.
  useEffect(() => {
    const handleOpenRequest = () => setIsOpen(true);
    window.addEventListener('open-support-chat', handleOpenRequest);
    return () => window.removeEventListener('open-support-chat', handleOpenRequest);
  }, []);

  // Warn before leaving an open (non-closed) session
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (chatSession && chatSession.status !== 'closed') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [chatSession]);

  const loadMyChats = async () => {
    const token = localStorage.getItem('token');
    if (!token) return [];
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/chat/my-chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMyChats(data.data || []);
        return data.data || [];
      }
    } catch (err) {
      console.error('Failed to load past tickets', err);
    }
    return [];
  };

  const resumeChat = async (chatId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/chat/session/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        setChatSession({
          chatId,
          name: localStorage.getItem('userName') || 'You',
          email: localStorage.getItem('userEmail') || '',
          status: data.data.status,
          type: data.data.type,
        });
        setShowTicketList(false);
      }
    } catch (err) {
      console.error('Failed to resume ticket', err);
    } finally {
      setLoading(false);
    }
  };

  // First time the widget is opened while logged in: pull the customer's
  // ticket history and auto-resume whichever one is still open, so closing
  // the modal (or reloading the page) never loses track of a conversation.
  useEffect(() => {
    if (!isOpen || !authed || chatsLoaded || chatSession) return;
    (async () => {
      setChatsLoaded(true);
      const chats = await loadMyChats();
      const openTicket = chats.find((c) => c.status !== 'closed');
      if (openTicket) {
        resumeChat(openTicket.id);
      } else if (chats.length > 0) {
        setShowTicketList(true);
      }
    })();
  }, [isOpen, authed, chatsLoaded, chatSession]);

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

      // Staff closing/reopening the ticket updates this widget live too.
      newSocket.on('chat_status', ({ status }) => {
        setChatSession((prev) => (prev ? { ...prev, status } : prev));
      });

      return () => {
        newSocket.disconnect();
      };
    }
    // Only reconnect when the chat ID changes — chatSession's other fields
    // (status, etc.) are updated by this same effect's own listeners.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatSession?.chatId]);

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
          status: 'pending',
          type,
        };
        setChatSession(session);
        setMessages([]);
        setShowTicketList(false);
        loadMyChats();
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
    if (!content.trim() || !socket || !chatSession || chatSession.status === 'closed') return;

    socket.emit('send_message', {
      chatId: chatSession.chatId,
      text: content
    });

    setInputMsg('');
  };

  const closeTicket = async () => {
    if (!chatSession) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/chat/${chatSession.chatId}/close`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setChatSession((prev) => (prev ? { ...prev, status: 'closed' } : prev));
        loadMyChats();
      }
    } catch (err) {
      console.error('Failed to close ticket', err);
    }
  };

  const reopenTicket = async (chatId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/chat/${chatId}/reopen`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        loadMyChats();
        resumeChat(chatId);
      }
    } catch (err) {
      console.error('Failed to reopen ticket', err);
    }
  };

  const startNewFromList = () => {
    setChatSession(null);
    setMessages([]);
    setShowTicketList(false);
  };

  const isClosed = chatSession?.status === 'closed';

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[9999] font-sans flex items-end justify-end">

      {/* ——— FLOATING TRIGGER LAUNCHER ——— */}
      <div className="flex items-center gap-3 relative z-10">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-berry text-white shadow-[0_8px_24px_rgba(190,18,60,0.35)] hover:shadow-[0_12px_32px_rgba(190,18,60,0.45)] flex items-center justify-center cursor-pointer transition-all duration-300 relative outline-none"
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
            className="w-[calc(100vw-2rem)] sm:w-[380px] max-h-[calc(100vh-90px)] bg-white rounded-[1.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-hairline flex flex-col overflow-hidden fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-[9999]"
          >
            {/* — HEADER — */}
            <div className="bg-[#221B1F] text-white px-5 py-4 flex items-center justify-between relative overflow-hidden shrink-0">

              {/* Subtle background ambient light */}
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-berry opacity-20 blur-3xl pointer-events-none" />

              <div className="flex items-center gap-3 relative z-10 min-w-0">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0 border border-white/5">
                  <Headphones className="w-4 h-4 text-berry-tint" />
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-display font-bold text-sm text-white tracking-tight leading-none truncate">Alimenture Support</h3>
                  </div>
                  <p className="text-[10px] font-medium text-ink-muted mt-1 flex items-center gap-1.5 truncate">
                    {chatSession ? (
                      <>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_META[chatSession.status]?.dot || 'bg-emerald-500'}`} />
                        {STATUS_META[chatSession.status]?.label || 'Active'}
                      </>
                    ) : (
                      <>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        Online • Replying in minutes
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 relative z-10 shrink-0">
                {authed && myChats.length > 0 && (
                  <button
                    onClick={() => { setShowTicketList((v) => !v); }}
                    className="h-7 w-7 rounded-full bg-white/5 hover:bg-white/15 text-ink-muted hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer outline-none border border-white/5"
                    aria-label="My tickets"
                    title="My tickets"
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7 rounded-full bg-white/5 hover:bg-white/15 text-ink-muted hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer outline-none border border-white/5"
                  aria-label="Close support chat"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* — BODY CONTENT — */}
            <div className={`bg-white p-5 flex flex-col relative overflow-y-auto ${chatSession && !showTicketList ? 'h-[400px]' : ''}`}>

              {showTicketList ? (
                /* ——— MY TICKETS LIST ——— */
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-ink font-display">My Tickets</h4>
                    <button
                      onClick={startNewFromList}
                      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-berry hover:text-berry-deep"
                    >
                      <Plus className="w-3 h-3" /> New
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {myChats.map((c) => {
                      const meta = STATUS_META[c.status] || STATUS_META.pending;
                      return (
                        <button
                          key={c.id}
                          onClick={() => resumeChat(c.id)}
                          className="text-left p-3 rounded-2xl border border-hairline hover:border-rose-200 hover:bg-cream transition-all"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-ink truncate">{TYPE_LABEL[c.type] || 'General Query'}</span>
                            <span className="text-[9px] font-bold text-ink-muted shrink-0">{fmtDate(c.updatedAt || c.createdAt)}</span>
                          </div>
                          <span className="flex items-center gap-1.5 mt-1.5">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                            <span className="text-[10px] font-medium text-ink-muted">{meta.label}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ) : !chatSession ? (
                /* PRE-CHAT REGISTRATION FORM — COMPACT FIT */
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col space-y-3 relative z-10"
                >
                  {/* Info Header */}
                  <div className="p-3 rounded-xl bg-cream border border-hairline flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-berry shrink-0 shadow-sm border border-hairline">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-ink font-display">Live Customer Support</h4>
                      <p className="text-[10px] text-ink-muted mt-0.5 leading-snug">
                        {authed ? 'Choose a topic to start your session.' : 'Sign in to start a support session.'}
                      </p>
                    </div>
                  </div>

                  {!authed ? (
                    <div className="flex flex-col items-center gap-3 py-4 text-center">
                      <ShieldCheck className="w-8 h-8 text-berry" />
                      <p className="text-xs text-ink-soft font-medium leading-snug">
                        Please sign in to your account to chat with our support team.
                      </p>
                      <Button
                        type="button"
                        onClick={() => { window.location.href = '/login'; }}
                        className="w-full h-11 rounded-full bg-berry hover:bg-berry-deep text-white font-bold text-xs uppercase tracking-wider"
                      >
                        Sign In
                      </Button>
                    </div>
                  ) : (
                  <form onSubmit={startChat} className="space-y-3 pt-1">

                    {/* Inquiry Type Cards Grid - Compact */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase text-ink-muted tracking-wider ml-1 flex items-center gap-1">
                        <HelpCircle className="w-2.5 h-2.5 text-ink-muted" /> Inquiry Type
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
                                  ? 'bg-berry-tint border-rose-200 shadow-sm shadow-rose-100/50'
                                  : 'bg-white border-hairline hover:border-hairline hover:bg-cream'
                              }`}
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-berry text-white' : 'bg-cream-deep text-ink-muted'}`}>
                                <IconComp className="w-3 h-3" />
                              </div>
                              <span className={`font-bold text-[10px] leading-tight truncate ${isSelected ? 'text-rose-900' : 'text-ink-soft'}`}>{item.label}</span>
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
                        className="w-full h-12 rounded-full bg-berry hover:bg-berry-deep text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-berry/20 flex items-center justify-center gap-2 transition-all cursor-pointer border-none outline-none"
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
                    <p className="text-[10px] text-ink-muted font-bold flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      Encrypted Support Session
                    </p>
                  </div>
                </motion.div>
              ) : (
                /* IN-CHAT MESSAGES STREAM */
                <div className="flex flex-col space-y-4">

                  <div className="text-center py-1.5 px-4 rounded-full bg-cream-deep self-center mb-2">
                    <p className="text-[10px] font-bold text-ink-muted">
                      Session Active: <span className="font-bold text-ink">{chatSession.name}</span>
                    </p>
                  </div>

                  {isClosed && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl bg-gray-50 border border-hairline flex items-center gap-3"
                    >
                      <div className="w-9 h-9 rounded-full bg-white border border-hairline flex items-center justify-center text-ink-muted shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-ink">This ticket is closed</p>
                        <p className="text-[10px] text-ink-muted">Reopen it if you need more help.</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => reopenTicket(chatSession.chatId)}
                        className="h-8 px-3 rounded-full bg-berry hover:bg-berry-deep text-white font-bold text-[10px] uppercase tracking-wider shrink-0 flex items-center gap-1"
                      >
                        <Undo2 className="w-3 h-3" /> Reopen
                      </Button>
                    </motion.div>
                  )}

                  {messages.length === 0 && !isClosed && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-5 rounded-2xl bg-cream border border-hairline space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white border border-hairline flex items-center justify-center text-berry shrink-0">
                          <Bot className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-ink font-display">Representative Connected</h4>
                          <p className="text-[11px] text-ink-muted leading-snug">Ask us anything about products, orders, or millets.</p>
                        </div>
                      </div>

                      {/* Quick Suggestions */}
                      <div className="space-y-2 pt-3 border-t border-hairline/60 mt-3">
                        <p className="text-[10px] font-bold uppercase text-ink-muted tracking-wider">Quick Suggestions:</p>
                        <div className="flex flex-col gap-2">
                          {QUICK_PROMPTS.map((prompt, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => sendMessage(null, prompt)}
                              className="text-left text-xs font-medium text-ink-soft bg-white hover:bg-berry-tint hover:text-berry border border-hairline hover:border-rose-200 px-3.5 py-2.5 rounded-xl transition-all outline-none cursor-pointer shadow-sm"
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
                        <span className="text-[9px] font-bold text-ink-muted uppercase tracking-widest mb-1 px-1">
                          {msg.senderName || (isUser ? 'You' : 'Support')}
                        </span>

                        <div
                          className={`px-4 py-3 rounded-[1.25rem] font-medium text-[13px] leading-relaxed shadow-sm ${
                            isUser
                              ? 'bg-berry text-white rounded-br-sm'
                              : 'bg-cream-deep text-ink rounded-bl-sm'
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
            {chatSession && !showTicketList && (
              isClosed ? (
                <div className="p-4 bg-white shrink-0 border-t border-hairline flex items-center justify-center gap-2 text-ink-muted">
                  <Lock className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold">Reopen this ticket to send a new message</span>
                </div>
              ) : (
                <div className="p-4 bg-white shrink-0 border-t border-hairline space-y-2.5">
                  <form onSubmit={sendMessage} className="flex gap-2.5">
                    <Input
                      value={inputMsg}
                      onChange={(e) => setInputMsg(e.target.value)}
                      placeholder="Type your query..."
                      className="flex-1 h-12 rounded-full bg-cream border border-hairline outline-none focus:outline-none focus:bg-white focus:border-berry-tint focus:ring-4 focus:ring-berry-tint font-medium text-[13px] text-ink placeholder:text-ink-muted transition-all px-4"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="h-12 w-12 rounded-full bg-berry hover:bg-berry-deep text-white shrink-0 shadow-lg shadow-berry/20 hover:scale-105 active:scale-95 transition-all cursor-pointer border-none outline-none"
                    >
                      <Send className="w-5 h-5 ml-0.5" />
                    </Button>
                  </form>
                  <button
                    type="button"
                    onClick={closeTicket}
                    className="w-full text-center text-[10px] font-bold uppercase tracking-wider text-ink-muted hover:text-berry transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Mark as resolved & close ticket
                  </button>
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
