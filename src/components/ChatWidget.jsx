import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  MessageCircle, X, Send, User, Package,
  HelpCircle, ShieldCheck, ArrowRight, Bot, CheckCircle2,
  MessageSquare, Heart, RefreshCw, Headphones, History, Plus, ArrowLeft,
  Maximize2, Minimize2, ShoppingBag, Truck, Sparkles,
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

/** Start-screen shortcuts (first visit to the assistant). */
const QUICK_ACTIONS = [
  { icon: ShoppingBag, title: 'Browse products', hint: 'Bakes, mixes & prices', ask: 'What products do you have?' },
  { icon: Truck, title: 'Delivery & charges', hint: 'Time and shipping fees', ask: 'Delivery charges & time' },
  { icon: Package, title: 'Track my order', hint: 'Status & tracking', ask: 'Where is my order?' },
  { icon: Headphones, title: 'Talk to a person', hint: 'Live specialist', live: true },
];

const toDate = (ts) => {
  if (!ts) return null;
  const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d;
};
const fmtTime = (ts) => toDate(ts)?.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) || '';

const TEASER_KEY = 'alim_chat_teaser_seen';

const fmtDate = (ts) => {
  if (!ts) return '';
  const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const STATUS_META = {
  pending: { label: 'Waiting for a specialist', dot: 'bg-gold-light' },
  active: { label: 'Active now', dot: 'bg-leaf' },
};

/** Absolute site URL from the bot → in-app path (keeps navigation in the SPA). */
const toPath = (url) => {
  try { const u = new URL(url); return `${u.pathname}${u.hash}`; } catch { return url; }
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false); // desktop: large view
  const [teaser, setTeaser] = useState(false); // desktop greeting bubble, once per session

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
    setBotMessages((prev) => [...prev, { from: 'user', text: q, at: Date.now() }]);
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
      setBotMessages((prev) => [...prev, { from: 'bot', text: data.reply, products: data.products, links: data.links, suggestions: data.suggestions, handoff: data.handoff, at: Date.now() }]);
    } catch {
      setBotMessages((prev) => [...prev, { from: 'bot', text: "I couldn't reach our servers. Please try again in a moment.", handoff: true, at: Date.now() }]);
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
  const firstVisit = botMessages.length === 1;

  // Phones: full-screen view, so stop the page scrolling behind it.
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined' || window.innerWidth >= 640) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // Desktop: a small greeting next to the launcher, once per browser session.
  useEffect(() => {
    if (isOpen || typeof window === 'undefined' || window.innerWidth < 1024) return undefined;
    try { if (sessionStorage.getItem(TEASER_KEY)) return undefined; } catch { return undefined; }
    const t = setTimeout(() => setTeaser(true), 6000);
    return () => clearTimeout(t);
  }, [isOpen]);

  const dismissTeaser = () => {
    setTeaser(false);
    try { sessionStorage.setItem(TEASER_KEY, '1'); } catch { /* private mode */ }
  };
  const openChat = () => { dismissTeaser(); setIsOpen(true); };

  const inputCls = 'flex-1 h-11 rounded-full bg-cream/60 border border-hairline focus:bg-white focus:border-mulberry/40 focus:ring-4 focus:ring-mulberry/10 text-[14px] px-4 placeholder:text-ink-muted';
  const sendCls = 'h-11 w-11 rounded-full bg-mulberry hover:bg-mulberry-deep text-paper shrink-0 transition-colors disabled:opacity-50';
  const tabCls = (on) => `relative flex-1 h-8 rounded-full text-[12.5px] font-medium transition-colors ${on ? 'text-mulberry-deep' : 'text-paper/75 hover:text-paper'}`;
  const iconBtn = 'h-9 w-9 rounded-full bg-paper/10 hover:bg-paper/20 text-paper/85 hover:text-paper flex items-center justify-center transition-colors';

  const panelSize = expanded
    ? 'lg:w-[min(820px,calc(100vw-3rem))] lg:h-[calc(100dvh-3rem)]'
    : 'lg:w-[400px] lg:h-[min(680px,calc(100dvh-3rem))]';

  /* ── pieces ── */
  const quickActions = (compact) => (
    <div className={compact ? 'flex flex-col gap-1' : 'grid grid-cols-2 gap-2'}>
      {QUICK_ACTIONS.map((a) => {
        const Icon = a.icon;
        return (
          <button
            key={a.title}
            type="button"
            onClick={() => (a.live ? goLive() : askBot(a.ask))}
            className={compact
              ? 'group flex items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-white transition-colors'
              : 'group flex flex-col items-start gap-2 rounded-2xl bg-white border border-hairline p-3 text-left hover:border-mulberry/30 hover:shadow-[0_10px_24px_-16px_rgba(95,28,84,0.5)] transition-all'}
          >
            <span className="h-8 w-8 rounded-xl bg-mulberry-tint text-mulberry flex items-center justify-center shrink-0 group-hover:bg-mulberry group-hover:text-paper transition-colors">
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-ink leading-tight">{a.title}</span>
              <span className="block text-[11.5px] text-ink-muted leading-tight mt-0.5">{a.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );

  const stamp = (ts, align) => (ts ? <span className={`mt-1 px-1 text-[10.5px] text-ink-muted ${align}`}>{fmtTime(ts)}</span> : null);

  return (
    <div className="font-sans">
      {/* ——— BACKDROP (phones) ——— */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-backdrop"
            className="sm:hidden fixed inset-0 z-[9998] bg-night/45"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ——— DESKTOP GREETING ——— */}
      <AnimatePresence>
        {teaser && !isOpen && (
          <motion.div
            key="chat-teaser"
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="hidden lg:flex fixed z-[9999] right-16 top-1/2 -translate-y-1/2 w-[290px] items-start gap-3 rounded-2xl bg-paper p-3.5 pr-9 shadow-[0_20px_50px_-20px_rgba(43,11,51,0.45)] ring-1 ring-night/10"
          >
            <button type="button" onClick={openChat} className="absolute inset-0 rounded-2xl" aria-label="Open support chat" />
            <span className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-gold-light/40 shrink-0 bg-paper"><BotAvatar className="w-10 h-10" title="" /></span>
            <span className="min-w-0 pointer-events-none">
              <span className="block text-[13.5px] font-medium text-ink">Hi there! Need a hand?</span>
              <span className="block text-[12.5px] text-ink-soft leading-snug mt-0.5">Ask about our millet bakes, delivery or your order.</span>
            </span>
            <button type="button" onClick={dismissTeaser} aria-label="Dismiss" className="absolute right-2 top-2 h-7 w-7 rounded-full flex items-center justify-center text-ink-muted hover:bg-ink/5 hover:text-ink">
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ——— LAUNCHER ———
          Desktop: a slim tab on the right edge (mid-screen) so it never sits on
          page content. Phones/tablets: no floating button — "Chat" lives in the
          bottom navigation (MobileDock dispatches "open-support-chat"). */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="chat-tab"
            onClick={openChat}
            initial={{ x: 48 }} animate={{ x: 0 }} exit={{ x: 48 }}
            whileHover={{ x: -4 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="hidden lg:flex fixed z-[9999] right-0 top-1/2 -translate-y-1/2 flex-col items-center gap-2.5 rounded-l-2xl bg-mulberry text-paper pl-2.5 pr-2 py-4 shadow-[0_14px_30px_-12px_rgba(95,28,84,0.6)] ring-1 ring-white/15 hover:bg-mulberry-deep transition-colors outline-none focus-visible:ring-4 focus-visible:ring-gold-light/50"
            aria-label="Open support chat"
            aria-expanded={false}
          >
            <span className="relative">
              <MessageCircle className="h-5 w-5" strokeWidth={1.75} />
              <span aria-hidden="true" className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-gold-light ring-2 ring-mulberry" />
              {teaser && <span aria-hidden="true" className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-gold-light animate-ping" />}
            </span>
            <span className="text-[12.5px] font-medium tracking-wide [writing-mode:vertical-rl] rotate-180">Chat with us</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ——— PANEL ——— */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-panel"
            role="dialog"
            data-own-style=""
            aria-label="Alimenture support chat"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className={`fixed z-[9999] flex flex-col overflow-hidden bg-paper text-ink shadow-[0_30px_80px_-20px_rgba(43,11,51,0.45)] sm:ring-1 sm:ring-night/10
              inset-0 h-[100dvh]
              sm:inset-auto sm:right-6 sm:w-[400px] sm:rounded-[24px] sm:bottom-[calc(7.5rem+env(safe-area-inset-bottom))] sm:h-[min(600px,calc(100dvh-10rem))]
              lg:bottom-6 ${panelSize} lg:transition-[width,height] lg:duration-300`}
          >
            {/* — HEADER — */}
            <div className="relative shrink-0 overflow-hidden bg-mulberry-deep text-paper px-4 sm:px-5 pt-[calc(0.875rem+env(safe-area-inset-top))] sm:pt-4 pb-3.5">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(120% 140% at 100% 0%, rgba(248,168,48,0.22) 0%, transparent 55%), radial-gradient(90% 120% at 0% 100%, #7C276E 0%, transparent 60%)' }} />
              <div className="relative flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-11 w-11 shrink-0">
                    <div className="h-11 w-11 rounded-full ring-2 ring-gold-light/40 overflow-hidden bg-paper flex items-center justify-center">
                      {inLive ? <Headphones className="h-5 w-5 text-mulberry" strokeWidth={1.75} /> : <BotAvatar className="w-11 h-11" />}
                    </div>
                    <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-mulberry-deep ${headerStatus?.dot || 'bg-gold-light'}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-[16px] font-medium leading-tight tracking-[-0.01em] truncate">
                      {inLive ? 'Alimenture Support' : 'Alimenture Assistant'}
                    </h3>
                    <p className="mt-0.5 text-[12px] text-paper/70 truncate">
                      {headerStatus ? headerStatus.label : inLive ? 'Specialists reply in minutes' : 'Instant answers · 24/7'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {inLive && authed && myChats.length > 1 && (
                    <button onClick={() => setShowTicketList((v) => !v)} className={iconBtn} aria-label="My open tickets" title="My open tickets">
                      <History className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                  )}
                  <button onClick={() => setExpanded((v) => !v)} className={`${iconBtn} hidden lg:flex`} aria-label={expanded ? 'Smaller view' : 'Larger view'} title={expanded ? 'Smaller view' : 'Larger view'}>
                    {expanded ? <Minimize2 className="w-4 h-4" strokeWidth={1.75} /> : <Maximize2 className="w-4 h-4" strokeWidth={1.75} />}
                  </button>
                  <button onClick={() => setIsOpen(false)} className={iconBtn} aria-label="Close support chat">
                    <X className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                </div>
              </div>

              {/* assistant / live switch */}
              <div className="relative mt-3.5 flex gap-1 rounded-full bg-night/30 p-1" role="tablist" aria-label="Chat mode">
                {[{ id: 'bot', label: 'Assistant', icon: Sparkles }, { id: 'live', label: 'Live support', icon: Headphones }].map((t) => {
                  const on = (t.id === 'live') === inLive;
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => (t.id === 'bot' ? (setView('bot'), setShowTicketList(false)) : goLive())}
                      className={tabCls(on)}
                    >
                      {on && <motion.span layoutId="chat-tab" className="absolute inset-0 rounded-full bg-paper" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                      <span className="relative inline-flex items-center justify-center gap-1.5"><Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 min-h-0 flex">
              {/* — SIDE RAIL (large view) — */}
              {expanded && (
                <aside className="hidden lg:flex w-[240px] shrink-0 flex-col gap-5 border-r border-hairline bg-cream/50 p-4 overflow-y-auto">
                  <div>
                    <p className="px-2.5 text-[11px] uppercase tracking-[0.14em] text-ink-muted">Quick help</p>
                    <div className="mt-2">{quickActions(true)}</div>
                  </div>
                  {authed && myChats.length > 0 && (
                    <div>
                      <p className="px-2.5 text-[11px] uppercase tracking-[0.14em] text-ink-muted">Your open tickets</p>
                      <div className="mt-2 flex flex-col gap-1">
                        {myChats.map((c) => {
                          const meta = STATUS_META[c.status] || STATUS_META.pending;
                          return (
                            <button key={c.id} type="button" onClick={() => resumeChat(c.id)} className={`rounded-xl px-2.5 py-2 text-left transition-colors ${chatSession?.chatId === c.id ? 'bg-white ring-1 ring-mulberry/20' : 'hover:bg-white'}`}>
                              <span className="block text-[13px] text-ink truncate">{TYPE_LABEL[c.type] || 'General Query'}</span>
                              <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-ink-muted"><span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />{meta.label} · {fmtDate(c.updatedAt || c.createdAt)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="mt-auto rounded-2xl bg-white border border-hairline p-3.5 text-[12.5px] text-ink-soft leading-relaxed">
                    <p className="font-medium text-ink">Prefer to call?</p>
                    <a href="tel:+917358196132" className="block mt-1 text-mulberry hover:underline">+91 73581 96132</a>
                    <a href="mailto:alimentureindustries@gmail.com" className="block text-mulberry hover:underline">Email us</a>
                  </div>
                </aside>
              )}

              <div className="flex-1 min-w-0 flex flex-col">
                {/* — BODY — */}
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-cream/40 px-4 sm:px-5 py-4 flex flex-col">
                  {!inLive ? (
                    /* ——— ASSISTANT ——— */
                    <div className={`flex flex-col gap-3.5 ${expanded ? 'lg:max-w-[560px] lg:mx-auto lg:w-full' : ''}`}>
                      {notice && (
                        <div className="p-3 rounded-2xl bg-white border border-hairline flex items-center gap-2.5 text-[12.5px] text-ink-soft">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-mulberry" strokeWidth={1.75} /> {notice}
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
                            <div className={`px-3.5 py-2.5 rounded-[18px] text-[14px] leading-relaxed whitespace-pre-line ${
                              m.from === 'user' ? 'bg-mulberry text-paper rounded-br-md' : 'bg-white border border-hairline text-ink rounded-bl-md'
                            }`}>
                              {m.text}
                            </div>
                          </div>
                          {stamp(m.at, m.from === 'user' ? 'self-end' : '')}

                          {m.products?.length > 0 && (
                            <div className="mt-2 w-full flex flex-col gap-1.5">
                              {m.products.map((p) => (
                                <Link
                                  key={p.id}
                                  to={toPath(p.url)}
                                  onClick={() => setIsOpen(false)}
                                  className="flex items-center justify-between gap-3 p-2.5 pl-3 rounded-xl bg-white border border-hairline hover:border-mulberry/30 transition-colors"
                                >
                                  <span className="min-w-0">
                                    <span className="block text-[13px] font-medium text-ink truncate">{p.name}</span>
                                    <span className="block text-[11.5px] text-ink-muted truncate">
                                      {p.sizes?.length ? p.sizes.join(' / ') : ''}{p.inStock ? '' : ' · Sold out'}
                                    </span>
                                  </span>
                                  <span className="shrink-0 text-[13px] font-semibold text-mulberry">{p.from ? 'from ' : ''}₹{p.price}</span>
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
                                  className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-mulberry-tint text-mulberry text-[12px] font-medium hover:bg-mulberry hover:text-paper transition-colors"
                                >
                                  {l.label} <ArrowRight className="w-3 h-3" />
                                </Link>
                              ))}
                            </div>
                          )}

                          {m.handoff && (
                            <button
                              onClick={goLive}
                              className="mt-2 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-mulberry-deep text-paper text-[12px] font-medium hover:bg-night transition-colors"
                            >
                              <Headphones className="w-3.5 h-3.5" strokeWidth={1.75} /> Talk to a specialist
                            </button>
                          )}

                          {!firstVisit && i === botMessages.length - 1 && m.from === 'bot' && m.suggestions?.length > 0 && (
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                              {m.suggestions.map((s) => (
                                <button
                                  key={s}
                                  onClick={() => (s === 'Talk to a specialist' ? goLive() : askBot(s))}
                                  className="h-8 px-3 rounded-full bg-white border border-hairline text-[12px] text-ink-soft hover:border-mulberry/40 hover:text-mulberry transition-colors"
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      ))}

                      {firstVisit && !(expanded && typeof window !== 'undefined' && window.innerWidth >= 1024) && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="pl-9">
                          <p className="mb-2 text-[11.5px] text-ink-muted">Popular right now</p>
                          {quickActions(false)}
                          <button type="button" onClick={() => askBot('Is it maida free?')} className="mt-2 h-8 px-3 rounded-full bg-white border border-hairline text-[12px] text-ink-soft hover:border-mulberry/40 hover:text-mulberry transition-colors">
                            Is it maida free?
                          </button>
                        </motion.div>
                      )}

                      {botTyping && (
                        <div className="self-start flex items-end gap-2" aria-label="Assistant is typing">
                          <BotAvatar className="w-7 h-7 shrink-0" title="" />
                          <div className="px-3.5 py-3 rounded-[18px] rounded-bl-md bg-white border border-hairline flex gap-1">
                            {[0, 1, 2].map((d) => (
                              <motion.span key={d} className="w-1.5 h-1.5 rounded-full bg-mulberry/60" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: d * 0.15 }} />
                            ))}
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : showTicketList ? (
                    /* ——— OPEN TICKETS ——— */
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-display text-[15px] font-medium text-ink">Open tickets</h4>
                        <button onClick={() => { setChatSession(null); setMessages([]); setShowTicketList(false); }} className="inline-flex items-center gap-1 text-[12px] font-medium text-mulberry">
                          <Plus className="w-3.5 h-3.5" /> New
                        </button>
                      </div>
                      {myChats.map((c) => {
                        const meta = STATUS_META[c.status] || STATUS_META.pending;
                        return (
                          <button key={c.id} onClick={() => resumeChat(c.id)} className="text-left p-3.5 rounded-2xl bg-white border border-hairline hover:border-mulberry/30 transition-colors">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[13px] font-medium text-ink truncate">{TYPE_LABEL[c.type] || 'General Query'}</span>
                              <span className="text-[11.5px] text-ink-muted shrink-0">{fmtDate(c.updatedAt || c.createdAt)}</span>
                            </div>
                            <span className="flex items-center gap-1.5 mt-1.5">
                              <span className={`inline-block w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                              <span className="text-[11.5px] text-ink-muted">{meta.label}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : !chatSession ? (
                    /* ——— START A LIVE TICKET ——— */
                    <div className={`flex flex-col gap-4 ${expanded ? 'lg:max-w-[480px] lg:mx-auto lg:w-full' : ''}`}>
                      <div className="p-4 rounded-2xl bg-white border border-hairline flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-mulberry-tint flex items-center justify-center text-mulberry shrink-0">
                          <Headphones className="w-[18px] h-[18px]" strokeWidth={1.75} />
                        </div>
                        <div>
                          <h4 className="font-display text-[15px] font-medium text-ink">Chat with a specialist</h4>
                          <p className="text-[12.5px] text-ink-muted mt-0.5 leading-snug">
                            {authed ? 'Choose a topic to start your session. We usually reply within minutes.' : 'Sign in to start a support session.'}
                          </p>
                        </div>
                      </div>

                      {!authed ? (
                        <div className="flex flex-col items-center gap-3 py-4 text-center">
                          <ShieldCheck className="w-8 h-8 text-mulberry" strokeWidth={1.5} />
                          <p className="text-[13px] text-ink-soft leading-snug">Please sign in to chat with our support team.</p>
                          <Button type="button" onClick={() => { window.location.href = '/login'; }} className="w-full h-12 rounded-full bg-mulberry hover:bg-mulberry-deep text-paper font-medium text-[14px]">
                            Sign in
                          </Button>
                        </div>
                      ) : (
                        <form onSubmit={startChat} className="space-y-3">
                          <p className="text-[12px] text-ink-muted flex items-center gap-1.5 ml-1">
                            <HelpCircle className="w-3.5 h-3.5" strokeWidth={1.75} /> What can we help with?
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {INQUIRY_TYPES.map((item) => {
                              const IconComp = item.icon;
                              const isSelected = type === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => setType(item.id)}
                                  aria-pressed={isSelected}
                                  className={`px-3 h-12 rounded-xl text-left border transition-colors flex items-center gap-2.5 ${isSelected ? 'bg-mulberry-tint border-mulberry/30' : 'bg-white border-hairline hover:border-mulberry/20'}`}
                                >
                                  <span className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-mulberry text-paper' : 'bg-cream text-ink-muted'}`}>
                                    <IconComp className="w-3.5 h-3.5" strokeWidth={1.75} />
                                  </span>
                                  <span className={`text-[12.5px] leading-tight ${isSelected ? 'text-mulberry-deep font-medium' : 'text-ink-soft'}`}>{item.label}</span>
                                </button>
                              );
                            })}
                          </div>
                          <Button type="submit" disabled={loading} className="w-full h-12 rounded-full bg-mulberry hover:bg-mulberry-deep text-paper font-medium text-[14px] flex items-center justify-center gap-2">
                            {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Starting…</> : <>Start support session <ArrowRight className="w-4 h-4" /></>}
                          </Button>
                        </form>
                      )}
                    </div>
                  ) : (
                    /* ——— LIVE MESSAGES ——— */
                    <div className={`flex flex-col gap-3.5 ${expanded ? 'lg:max-w-[560px] lg:mx-auto lg:w-full' : ''}`}>
                      {messages.length === 0 && (
                        <div className="p-4 rounded-2xl bg-white border border-hairline flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-mulberry-tint flex items-center justify-center text-mulberry shrink-0">
                            <Bot className="w-4 h-4" strokeWidth={1.75} />
                          </div>
                          <p className="text-[12.5px] text-ink-soft leading-snug">
                            You&rsquo;re in the queue — a specialist will join shortly. Type your question below.
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
                            <span className="text-[11px] text-ink-muted mb-1 px-1">
                              {msg.senderName || (isUser ? 'You' : 'Support')}
                            </span>
                            <div className={`px-4 py-2.5 rounded-[18px] text-[14px] leading-relaxed ${isUser ? 'bg-mulberry text-paper rounded-br-md' : 'bg-white border border-hairline text-ink rounded-bl-md'}`}>
                              {msg.text}
                            </div>
                            {stamp(msg.timestamp || msg.createdAt, '')}
                          </motion.div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* — FOOTER — */}
                {!inLive ? (
                  <div className="shrink-0 bg-paper border-t border-hairline px-3.5 sm:px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-3">
                    <form onSubmit={(e) => { e.preventDefault(); askBot(botInput); }} className={`flex gap-2 ${expanded ? 'lg:max-w-[560px] lg:mx-auto' : ''}`}>
                      <Input
                        value={botInput}
                        onChange={(e) => setBotInput(e.target.value)}
                        placeholder="Ask about products, delivery…"
                        maxLength={500}
                        className={inputCls}
                      />
                      <Button type="submit" size="icon" disabled={botTyping || !botInput.trim()} aria-label="Send" className={sendCls}>
                        <Send className="w-4 h-4 ml-0.5" strokeWidth={1.75} />
                      </Button>
                    </form>
                    <p className="mt-2 text-center text-[11px] text-ink-muted">Instant answers from our assistant · switch to <button type="button" onClick={goLive} className="text-mulberry hover:underline">Live support</button> anytime</p>
                  </div>
                ) : chatSession && !showTicketList && (
                  <div className="shrink-0 bg-paper border-t border-hairline px-3.5 sm:px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-3 space-y-2">
                    <form onSubmit={sendMessage} className={`flex gap-2 ${expanded ? 'lg:max-w-[560px] lg:mx-auto' : ''}`}>
                      <Input
                        value={inputMsg}
                        onChange={(e) => setInputMsg(e.target.value)}
                        placeholder="Type your message…"
                        className={inputCls}
                      />
                      <Button type="submit" size="icon" disabled={!inputMsg.trim()} aria-label="Send" className={sendCls}>
                        <Send className="w-4 h-4 ml-0.5" strokeWidth={1.75} />
                      </Button>
                    </form>
                    <button onClick={closeTicket} className="w-full text-center text-[12px] text-ink-muted hover:text-mulberry transition-colors flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} /> Mark as resolved &amp; close ticket
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
