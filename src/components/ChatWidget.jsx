import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  MessageCircle, X, Send, User, Package,
  HelpCircle, ShieldCheck, ArrowRight, Bot, CheckCircle2,
  MessageSquare, Heart, RefreshCw, Headphones, History, Plus, ArrowLeft,
} from 'lucide-react';
import BotAvatar from './BotAvatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { motion, AnimatePresence } from 'framer-motion';

const API = import.meta.env.VITE_API_URL;
const SOCKET_URL = API?.replace('/api', '') || 'https://alimenture.onrender.com';

const INQUIRY_TYPES = [
  { id: 'general', label: 'General Query', icon: MessageSquare },
  { id: 'product', label: 'Product Support', icon: Heart },
  { id: 'order', label: 'Order & Delivery', icon: Package },
  { id: 'person', label: 'Live Specialist', icon: User }
];

const TYPE_LABEL = { general: 'General Query', product: 'Product Support', order: 'Order & Delivery', person: 'Live Specialist' };

const BOT_SUGGESTIONS = [
  'What products do you have?',
  'Delivery charges & time',
  'Is it maida free?',
  'Where is my order?',
];

const BOT_GREETING = {
  from: 'bot',
  text: "Hi! I'm the Alimenture assistant. Ask me about our products, prices, ingredients, delivery, payments, returns or your order.",
  suggestions: BOT_SUGGESTIONS,
};

const fmtDate = (ts) => {
  if (!ts) return '';
  const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const STATUS_META = {
  pending: { label: 'Waiting for a specialist', dot: 'bg-amber-500' },
  active: { label: 'Active now', dot: 'bg-emerald-500' },
};

/** Absolute site URL from the bot → in-app path (keeps navigation in the SPA). */
const toPath = (url) => {
  try { const u = new URL(url); return `${u.pathname}${u.hash}`; } catch { return url; }
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  // ── FAQ assistant (default view; works without signing in) ──
  const [botMessages, setBotMessages] = useState([BOT_GREETING]);
  const [botInput, setBotInput] = useState('');
  const [botTyping, setBotTyping] = useState(false);
  const [notice, setNotice] = useState(''); // e.g. "Your ticket was closed"

  // ── Live specialist tickets ──
  const [view, setView] = useState('bot'); // 'bot' | 'live'
  const [chatSession, setChatSession] = useState(null); // { chatId, name, status, type }
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [socket, setSocket] = useState(null);
  const [myChats, setMyChats] = useState([]); // open tickets only (closed ones are not shown)
  const [chatsLoaded, setChatsLoaded] = useState(false);
  const [showTicketList, setShowTicketList] = useState(false);
  const [type, setType] = useState('general');
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState(() => !!localStorage.getItem('token'));
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) setAuthed(!!localStorage.getItem('token'));
  }, [isOpen]);

  // Other pages (e.g. "Chat with support" on Order Tracking) open this widget.
  useEffect(() => {
    const handleOpenRequest = () => setIsOpen(true);
    window.addEventListener('open-support-chat', handleOpenRequest);
    return () => window.removeEventListener('open-support-chat', handleOpenRequest);
  }, []);

  const loadMyChats = async () => {
    const token = localStorage.getItem('token');
    if (!token) return [];
    try {
      const res = await fetch(`${API}/chat/my-chats`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setMyChats(data.data || []);
        return data.data || [];
      }
    } catch (err) {
      console.error('Failed to load tickets', err);
    }
    return [];
  };

  /** A closed or deleted ticket disappears for the customer: back to the assistant. */
  const endTicket = (message) => {
    setChatSession(null);
    setMessages([]);
    setShowTicketList(false);
    setView('bot');
    setNotice(message);
    setMyChats((prev) => prev.filter((c) => c.id !== chatSession?.chatId));
  };

  const resumeChat = async (chatId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/chat/session/${chatId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success && data.data.status !== 'closed') {
        setMessages(data.messages || []);
        setChatSession({ chatId, name: localStorage.getItem('userName') || 'You', status: data.data.status, type: data.data.type });
        setShowTicketList(false);
        setView('live');
      } else {
        loadMyChats();
      }
    } catch (err) {
      console.error('Failed to resume ticket', err);
    } finally {
      setLoading(false);
    }
  };

  // First open while signed in: resume a still-open ticket if there is one.
  useEffect(() => {
    if (!isOpen || !authed || chatsLoaded || chatSession) return;
    (async () => {
      setChatsLoaded(true);
      const chats = await loadMyChats();
      if (chats[0]) resumeChat(chats[0].id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, authed, chatsLoaded, chatSession]);

  // Live socket for the current ticket.
  useEffect(() => {
    if (!chatSession?.chatId) return undefined;
    const token = localStorage.getItem('token');
    const newSocket = io(SOCKET_URL, { auth: { token }, withCredentials: true }); // session cookie authenticates
    setSocket(newSocket);
    newSocket.on('connect_error', (err) => console.error('Chat connection failed:', err.message));
    newSocket.emit('join_chat', chatSession.chatId);
    newSocket.on('receive_message', (msg) => setMessages((prev) => [...prev, msg]));
    newSocket.on('chat_status', ({ status }) => {
      if (status === 'closed') endTicket('Your support ticket was closed. Thanks for chatting with us!');
      else if (status === 'deleted') endTicket('This conversation has ended.');
      else setChatSession((prev) => (prev ? { ...prev, status } : prev));
    });
    return () => newSocket.disconnect();
    // Reconnect only when the ticket changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatSession?.chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, botMessages, botTyping, view]);

  // ── assistant ──
  const askBot = async (text) => {
    const q = String(text || '').trim();
    if (!q || botTyping) return;
    setNotice('');
    setBotMessages((prev) => [...prev, { from: 'user', text: q }]);
    setBotInput('');
    setBotTyping(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/chat/bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message: q }),
      });
      const json = await res.json().catch(() => ({}));
      const data = json.data || { reply: json.error || "Sorry, I couldn't answer that right now.", handoff: true };
      setBotMessages((prev) => [...prev, { from: 'bot', text: data.reply, products: data.products, links: data.links, suggestions: data.suggestions, handoff: data.handoff }]);
    } catch {
      setBotMessages((prev) => [...prev, { from: 'bot', text: "I couldn't reach our servers. Please try again in a moment.", handoff: true }]);
    } finally {
      setBotTyping(false);
    }
  };

  const goLive = () => {
    setNotice('');
    setView('live');
    if (chatSession) return;
    if (myChats[0]) resumeChat(myChats[0].id);
  };

  // ── live ticket ──
  const startChat = async (e) => {
    if (e) e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login'; return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/chat/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.success) {
        setChatSession({ chatId: data.chatId, name: localStorage.getItem('userName') || 'You', status: 'pending', type });
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

  const sendMessage = (e) => {
    if (e) e.preventDefault();
    if (!inputMsg.trim() || !socket || !chatSession) return;
    socket.emit('send_message', { chatId: chatSession.chatId, text: inputMsg });
    setInputMsg('');
  };

  const closeTicket = async () => {
    if (!chatSession) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/chat/${chatSession.chatId}/close`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) endTicket('Ticket closed. Glad we could help!');
    } catch (err) {
      console.error('Failed to close ticket', err);
    }
  };

  const inLive = view === 'live';
  const headerStatus = inLive && chatSession ? STATUS_META[chatSession.status] : null;

  return (
    <div className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] right-4 sm:right-6 lg:bottom-6 z-[9999] font-sans flex items-end justify-end">

      {/* ——— LAUNCHER ——— */}
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
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <X className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
              </motion.div>
            ) : (
              <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2} />
              </motion.div>
            )}
          </AnimatePresence>
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-[18px] w-[18px] sm:h-5 sm:w-5">
              <span className="relative inline-flex rounded-full h-full w-full bg-[#00D084] border-[2.5px] border-white shadow-sm" />
            </span>
          )}
        </motion.button>
      </div>

      {/* ——— WINDOW ——— */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="w-[calc(100vw-2rem)] sm:w-[380px] max-h-[calc(100vh-190px)] lg:max-h-[calc(100vh-110px)] bg-white rounded-[1.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-hairline flex flex-col overflow-hidden fixed bottom-[calc(11rem+env(safe-area-inset-bottom))] right-4 sm:right-6 lg:bottom-24 z-[9999]"
          >
            {/* — HEADER — */}
            <div className="bg-[#221B1F] text-white px-4 py-3.5 flex items-center justify-between relative overflow-hidden shrink-0">
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-berry opacity-20 blur-3xl pointer-events-none" />
              <div className="flex items-center gap-3 relative z-10 min-w-0">
                {inLive ? (
                  <button
                    onClick={() => { setView('bot'); setShowTicketList(false); }}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0 border border-white/5 transition-colors"
                    aria-label="Back to assistant"
                    title="Back to assistant"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="w-10 h-10 rounded-full ring-2 ring-white/15 shrink-0 overflow-hidden">
                    <BotAvatar className="w-10 h-10" />
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <h3 className="font-display font-bold text-sm text-white tracking-tight leading-none truncate">
                    {inLive ? 'Alimenture Support' : 'Alimenture Assistant'}
                  </h3>
                  <p className="text-[10px] font-medium text-white/60 mt-1 flex items-center gap-1.5 truncate">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${headerStatus?.dot || 'bg-emerald-500'}`} />
                    {headerStatus ? headerStatus.label : inLive ? 'Specialists reply in minutes' : 'Instant answers · 24/7'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 relative z-10 shrink-0">
                {inLive && authed && myChats.length > 1 && (
                  <button
                    onClick={() => setShowTicketList((v) => !v)}
                    className="h-7 w-7 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white flex items-center justify-center transition-all border border-white/5"
                    aria-label="My open tickets"
                    title="My open tickets"
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white flex items-center justify-center transition-all border border-white/5"
                  aria-label="Close support chat"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* — BODY — */}
            <div className={`bg-white p-4 flex flex-col relative overflow-y-auto ${!inLive || (chatSession && !showTicketList) ? 'h-[420px]' : ''}`}>
              {!inLive ? (
                /* ——— ASSISTANT ——— */
                <div className="flex flex-col gap-3">
                  {notice && (
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-2.5 text-[11.5px] font-semibold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 shrink-0" /> {notice}
                    </div>
                  )}
                  {botMessages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      className={`flex flex-col max-w-[88%] ${m.from === 'user' ? 'self-end items-end' : 'self-start items-start [&>*:not(:first-child)]:ml-9'}`}
                    >
                      <div className="flex items-end gap-2">
                        {m.from === 'bot' && <BotAvatar className="w-7 h-7 shrink-0" title="" />}
                        <div className={`px-3.5 py-2.5 rounded-[1.1rem] text-[13px] leading-relaxed font-medium whitespace-pre-line ${
                          m.from === 'user' ? 'bg-berry text-white rounded-br-sm' : 'bg-cream border border-hairline text-ink rounded-bl-sm'
                        }`}>
                          {m.text}
                        </div>
                      </div>

                      {m.products?.length > 0 && (
                        <div className="mt-2 w-full flex flex-col gap-1.5">
                          {m.products.map((p) => (
                            <Link
                              key={p.id}
                              to={toPath(p.url)}
                              onClick={() => setIsOpen(false)}
                              className="flex items-center justify-between gap-3 p-2.5 pl-3 rounded-xl bg-white border border-hairline hover:border-berry/40 transition-colors"
                            >
                              <span className="min-w-0">
                                <span className="block text-[12.5px] font-bold text-ink truncate">{p.name}</span>
                                <span className="block text-[10.5px] text-ink-muted truncate">
                                  {p.sizes?.length ? p.sizes.join(' / ') : ''}{p.inStock ? '' : ' · Sold out'}
                                </span>
                              </span>
                              <span className="shrink-0 text-[12.5px] font-extrabold text-berry">{p.from ? 'from ' : ''}₹{p.price}</span>
                            </Link>
                          ))}
                        </div>
                      )}

                      {m.links?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {m.links.map((l) => (
                            <Link
                              key={l.url}
                              to={toPath(l.url)}
                              onClick={() => setIsOpen(false)}
                              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-berry/10 text-berry text-[10.5px] font-bold hover:bg-berry hover:text-white transition-colors"
                            >
                              {l.label} <ArrowRight className="w-3 h-3" />
                            </Link>
                          ))}
                        </div>
                      )}

                      {m.handoff && (
                        <button
                          onClick={goLive}
                          className="mt-2 inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#221B1F] text-white text-[10.5px] font-bold uppercase tracking-wider hover:bg-black transition-colors"
                        >
                          <Headphones className="w-3.5 h-3.5" /> Talk to a specialist
                        </button>
                      )}

                      {i === botMessages.length - 1 && m.from === 'bot' && m.suggestions?.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {m.suggestions.map((s) => (
                            <button
                              key={s}
                              onClick={() => (s === 'Talk to a specialist' ? goLive() : askBot(s))}
                              className="h-8 px-3 rounded-full bg-white border border-hairline text-[11px] font-semibold text-ink-soft hover:border-berry/40 hover:text-berry transition-colors"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {botTyping && (
                    <div className="self-start flex items-end gap-2" aria-label="Assistant is typing">
                      <BotAvatar className="w-7 h-7 shrink-0" title="" />
                      <div className="px-3.5 py-3 rounded-[1.1rem] rounded-bl-sm bg-cream border border-hairline flex gap-1">
                        {[0, 1, 2].map((d) => (
                          <motion.span key={d} className="w-1.5 h-1.5 rounded-full bg-ink-muted" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: d * 0.15 }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              ) : showTicketList ? (
                /* ——— OPEN TICKETS ——— */
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-ink font-display">Open tickets</h4>
                    <button onClick={() => { setChatSession(null); setMessages([]); setShowTicketList(false); }} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-berry">
                      <Plus className="w-3 h-3" /> New
                    </button>
                  </div>
                  {myChats.map((c) => {
                    const meta = STATUS_META[c.status] || STATUS_META.pending;
                    return (
                      <button key={c.id} onClick={() => resumeChat(c.id)} className="text-left p-3 rounded-2xl border border-hairline hover:border-rose-200 hover:bg-cream transition-all">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-ink truncate">{TYPE_LABEL[c.type] || 'General Query'}</span>
                          <span className="text-[10.5px] font-bold text-ink-muted shrink-0">{fmtDate(c.updatedAt || c.createdAt)}</span>
                        </div>
                        <span className="flex items-center gap-1.5 mt-1.5">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                          <span className="text-[10px] font-medium text-ink-muted">{meta.label}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : !chatSession ? (
                /* ——— START A LIVE TICKET ——— */
                <div className="flex flex-col space-y-3">
                  <div className="p-3 rounded-xl bg-cream border border-hairline flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-berry shrink-0 shadow-sm border border-hairline">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-ink font-display">Chat with a specialist</h4>
                      <p className="text-[10px] text-ink-muted mt-0.5 leading-snug">
                        {authed ? 'Choose a topic to start your session.' : 'Sign in to start a support session.'}
                      </p>
                    </div>
                  </div>

                  {!authed ? (
                    <div className="flex flex-col items-center gap-3 py-4 text-center">
                      <ShieldCheck className="w-8 h-8 text-berry" />
                      <p className="text-xs text-ink-soft font-medium leading-snug">Please sign in to chat with our support team.</p>
                      <Button type="button" onClick={() => { window.location.href = '/login'; }} className="w-full h-11 rounded-full bg-berry hover:bg-berry-deep text-white font-bold text-xs uppercase tracking-wider">
                        Sign In
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={startChat} className="space-y-3 pt-1">
                      <label className="text-[10.5px] font-bold uppercase text-ink-muted tracking-wider ml-1 flex items-center gap-1">
                        <HelpCircle className="w-2.5 h-2.5" /> Inquiry Type
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
                              className={`px-3 h-10 rounded-xl text-left border transition-all flex items-center gap-2 ${isSelected ? 'bg-berry-tint border-rose-200' : 'bg-white border-hairline hover:bg-cream'}`}
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-berry text-white' : 'bg-cream-deep text-ink-muted'}`}>
                                <IconComp className="w-3 h-3" />
                              </div>
                              <span className={`font-bold text-[10px] leading-tight truncate ${isSelected ? 'text-rose-900' : 'text-ink-soft'}`}>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <Button type="submit" disabled={loading} className="w-full h-12 rounded-full bg-berry hover:bg-berry-deep text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                        {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Starting…</> : <>Start Support Session <ArrowRight className="w-4 h-4" /></>}
                      </Button>
                    </form>
                  )}
                </div>
              ) : (
                /* ——— LIVE MESSAGES ——— */
                <div className="flex flex-col space-y-4">
                  {messages.length === 0 && (
                    <div className="p-4 rounded-2xl bg-cream border border-hairline flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white border border-hairline flex items-center justify-center text-berry shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <p className="text-[11.5px] text-ink-soft leading-snug">
                        You're in the queue — a specialist will join shortly. Type your question below.
                      </p>
                    </div>
                  )}
                  {messages.map((msg, idx) => {
                    const isUser = msg.senderType === 'user';
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={idx}
                        className={`flex flex-col max-w-[85%] ${isUser ? 'self-end items-end' : 'self-start items-start'}`}
                      >
                        <span className="text-[10.5px] font-bold text-ink-muted uppercase tracking-widest mb-1 px-1">
                          {msg.senderName || (isUser ? 'You' : 'Support')}
                        </span>
                        <div className={`px-4 py-3 rounded-[1.25rem] font-medium text-[13px] leading-relaxed shadow-sm ${isUser ? 'bg-berry text-white rounded-br-sm' : 'bg-cream-deep text-ink rounded-bl-sm'}`}>
                          {msg.text}
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* — FOOTER — */}
            {!inLive ? (
              <div className="p-3.5 bg-white shrink-0 border-t border-hairline space-y-2">
                <form onSubmit={(e) => { e.preventDefault(); askBot(botInput); }} className="flex gap-2">
                  <Input
                    value={botInput}
                    onChange={(e) => setBotInput(e.target.value)}
                    placeholder="Ask about products, delivery…"
                    maxLength={500}
                    className="flex-1 h-11 rounded-full bg-cream border border-hairline focus:bg-white focus:border-berry-tint focus:ring-4 focus:ring-berry-tint font-medium text-[13px] px-4"
                  />
                  <Button type="submit" size="icon" disabled={botTyping} aria-label="Send" className="h-11 w-11 rounded-full bg-berry hover:bg-berry-deep text-white shrink-0">
                    <Send className="w-4 h-4 ml-0.5" />
                  </Button>
                </form>
                <button onClick={goLive} className="w-full text-center text-[10px] font-bold uppercase tracking-wider text-ink-muted hover:text-berry transition-colors flex items-center justify-center gap-1.5">
                  <Headphones className="w-3 h-3" /> {chatSession || myChats.length ? 'Back to your open ticket' : 'Talk to a specialist'}
                </button>
              </div>
            ) : chatSession && !showTicketList && (
              <div className="p-3.5 bg-white shrink-0 border-t border-hairline space-y-2">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <Input
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    placeholder="Type your message…"
                    className="flex-1 h-11 rounded-full bg-cream border border-hairline focus:bg-white focus:border-berry-tint focus:ring-4 focus:ring-berry-tint font-medium text-[13px] px-4"
                  />
                  <Button type="submit" size="icon" aria-label="Send" className="h-11 w-11 rounded-full bg-berry hover:bg-berry-deep text-white shrink-0">
                    <Send className="w-4 h-4 ml-0.5" />
                  </Button>
                </form>
                <button onClick={closeTicket} className="w-full text-center text-[10px] font-bold uppercase tracking-wider text-ink-muted hover:text-berry transition-colors flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" /> Mark as resolved &amp; close ticket
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
