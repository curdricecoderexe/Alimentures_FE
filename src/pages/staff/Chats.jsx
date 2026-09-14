import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Send, MessageSquare, UserCircle2, Mail, Phone, CalendarDays, ShoppingBag, MapPin, CreditCard, Banknote, CheckCheck } from 'lucide-react';
import { io } from 'socket.io-client';
import { authenticatedFetch, API_BASE } from '../../lib/api';

const SOCKET_URL = API_BASE.replace(/\/api\/?$/, '');

const initials = (name) => (name || 'GU').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

const fmtDate = (ts) => {
  if (!ts) return '—';
  const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtTime = (ts) => {
  if (!ts) return '';
  const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const toDate = (ts) => (ts?._seconds ? new Date(ts._seconds * 1000) : ts ? new Date(ts) : new Date());
const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const dayLabel = (ts) => {
  const d = toDate(ts);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (isSameDay(d, today)) return 'Today';
  if (isSameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Groups a flat message list into { dateLabel, items } buckets by calendar day. */
const groupByDay = (messages) => {
  const groups = [];
  messages.forEach((msg) => {
    const label = dayLabel(msg.timestamp);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(msg);
    else groups.push({ label, items: [msg] });
  });
  return groups;
};

/** WhatsApp-style speech-bubble tail via clip-path, colored to blend with the bubble. */
function BubbleTail({ side, color }) {
  const isOut = side === 'right';
  return (
    <span
      className="absolute bottom-0 w-2 h-3.5"
      style={{
        [isOut ? 'right' : 'left']: -7,
        background: color,
        clipPath: isOut ? 'polygon(0 0, 0 100%, 100% 100%)' : 'polygon(100% 0, 100% 100%, 0 100%)',
      }}
    />
  );
}

const STATUS_STYLE = {
  delivered: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  out_for_delivery: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  shipped: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  packed: 'bg-purple-50 text-purple-600 border-purple-100',
  processing: 'bg-amber-50 text-amber-600 border-amber-100',
  pending: 'bg-blue-50 text-blue-600 border-blue-100',
};

const ONGOING_STATUSES = ['pending', 'payment_pending', 'payment_successful_no_stock', 'processing', 'packed', 'shipped', 'out_for_delivery'];

const paymentInfo = (order) => {
  const pm = order?.customerInfo?.paymentMethod;
  if (pm === 'cod') return { tag: 'COD', label: 'Cash on Delivery' };
  if (pm === 'razorpay') return { tag: 'ONLINE', label: order?.paymentDetails?.method ? `Online · ${order.paymentDetails.method}` : 'Online (Razorpay)' };
  return { tag: (pm || '—').toUpperCase(), label: pm || 'Unknown' };
};

function OrderCard({ order }) {
  const pay = paymentInfo(order);
  const ci = order.customerInfo || {};
  return (
    <div className="p-3.5 rounded-2xl border border-gray-100 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-[#E83D6E] uppercase tracking-wider truncate">#{order.id.slice(-6).toUpperCase()}</p>
          <p className="text-[10px] text-gray-400 font-medium">{fmtDate(order.createdAt)}</p>
        </div>
        <div className="text-right shrink-0 flex flex-col items-end gap-1">
          <span className="text-sm font-bold text-gray-900">₹{order.totalAmount || order.total || 0}</span>
          <Badge variant="outline" className={`text-[8.5px] font-bold px-1.5 py-0 border ${STATUS_STYLE[(order.status || '').toLowerCase()] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
            {(order.status || '').replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 border border-gray-100 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
          {ci.paymentMethod === 'cod' ? <Banknote className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />} {pay.label}
        </span>
      </div>

      {(ci.address || ci.city) && (
        <div className="flex items-start gap-1.5 text-[11px] text-gray-600 font-medium">
          <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
          <span>{[ci.address, ci.city, ci.state, ci.pincode].filter(Boolean).join(', ')}</span>
        </div>
      )}

      {(order.items || []).length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-0.5 px-0.5">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 shrink-0 bg-gray-50 rounded-xl p-1.5 pr-3 border border-gray-100">
              <div className="h-8 w-8 rounded-lg overflow-hidden bg-white border border-gray-100 shrink-0 flex items-center justify-center">
                {item.image ? <img src={item.image} className="h-full w-full object-cover" alt="" /> : <ShoppingBag className="h-3.5 w-3.5 text-gray-300" />}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-800 truncate max-w-[100px]">{item.name || item.title}</p>
                <p className="text-[9px] text-gray-400 font-medium">{item.selectedWeight} × {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StaffChats() {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'active'
  const [pendingChats, setPendingChats] = useState([]);
  const [myChats, setMyChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  // Customer details panel
  const [showCustomer, setShowCustomer] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);

  useEffect(() => {
    if (selectedChat && selectedChat.status === 'active') {
      const newSocket = io(SOCKET_URL, { auth: { token: localStorage.getItem('token') } });
       
      setSocket(newSocket);
      newSocket.on('connect_error', (err) => console.error('Chat connection failed:', err.message));
      newSocket.emit('join_chat', selectedChat.id);

      newSocket.on('receive_message', (msg) => {
        setMessages(prev => [...prev, msg]);
      });

      newSocket.on('chat_status', ({ status }) => {
        setSelectedChat(prev => (prev ? { ...prev, status } : prev));
      });

      return () => newSocket.disconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchPendingChats = async () => {
    try {
      const res = await authenticatedFetch('/chat/staff/pending');
      if (!res) return;
      const data = await res.json();
      if (data.success) {
        setPendingChats(data.data);
      } else {
        console.error("Fetch pending failed:", data);
      }
    } catch (err) { console.error(err); }
  };

  const fetchMyChats = async () => {
    try {
      const res = await authenticatedFetch('/chat/staff/active');
      if (!res) return;
      const data = await res.json();
      if (data.success) {
        setMyChats(data.data);
      } else {
        console.error("Fetch active failed:", data);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
       
    fetchPendingChats();
    fetchMyChats();
  }, []);

  const selectChat = async (chat) => {
    setSelectedChat(chat);
    setCustomerProfile(null);
    setCustomerOrders([]);
    try {
      const res = await authenticatedFetch(`/chat/session/${chat.id}`);
      if (!res) return;
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (err) { console.error(err); }
  };

  const acceptChat = async (chatId) => {
    try {
      const res = await authenticatedFetch(`/chat/staff/accept/${chatId}`, { method: 'POST' });
      if (!res) return;
      const data = await res.json();
      if (data.success) {
        fetchPendingChats();
        fetchMyChats();
        setActiveTab('active');
        setSelectedChat(null);
      } else {
        alert(data.error);
        fetchPendingChats();
      }
    } catch (err) { console.error(err); }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !socket || !selectedChat || selectedChat.status === 'closed') return;

    socket.emit('send_message', {
      chatId: selectedChat.id,
      text: inputMsg
    });
    setInputMsg('');
  };

  const closeTicket = async () => {
    if (!selectedChat) return;
    try {
      const res = await authenticatedFetch(`/chat/${selectedChat.id}/close`, { method: 'PUT' });
      if (res?.ok) {
        setSelectedChat(null);
        fetchMyChats();
      }
    } catch (err) { console.error('Failed to close ticket', err); }
  };

  const openCustomerPanel = async () => {
    if (!selectedChat) return;
    setShowCustomer(true);
    if (customerProfile) return; // already fetched for this chat
    setCustomerLoading(true);
    try {
      const [profileRes, ordersRes] = await Promise.all([
        selectedChat.ownerUid ? authenticatedFetch(`/users/${selectedChat.ownerUid}`) : Promise.resolve(null),
        selectedChat.guestEmail ? authenticatedFetch(`/orders/user/${encodeURIComponent(selectedChat.guestEmail)}`) : Promise.resolve(null),
      ]);
      if (profileRes?.ok) {
        setCustomerProfile(await profileRes.json());
      }
      if (ordersRes?.ok) {
        const data = await ordersRes.json();
        if (data.success) setCustomerOrders(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load customer context', err);
    } finally {
      setCustomerLoading(false);
    }
  };

  const totalSpent = customerOrders.reduce((s, o) => s + (o.totalAmount || o.total || 0), 0);
  const ongoingOrders = customerOrders.filter((o) => ONGOING_STATUSES.includes((o.status || '').toLowerCase()));
  const previousOrders = customerOrders.filter((o) => !ONGOING_STATUSES.includes((o.status || '').toLowerCase()));

  return (
    <div className="p-3 sm:p-6 lg:p-10 bg-transparent min-h-screen space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight italic">Support Desk.</h1>
        <p className="text-xs sm:text-sm text-gray-500 font-medium">Live conversations with customers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        <Card className="md:col-span-1 border-0 shadow-sm rounded-2xl bg-white border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button
              className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'pending' ? 'border-[#E83D6E] text-[#E83D6E]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending <span className="ml-1 text-gray-300">({pendingChats.length})</span>
            </button>
            <button
              className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'active' ? 'border-[#E83D6E] text-[#E83D6E]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              onClick={() => setActiveTab('active')}
            >
              My Chats <span className="ml-1 text-gray-300">({myChats.length})</span>
            </button>
          </div>
          <CardContent className="p-3 space-y-2 h-[560px] overflow-y-auto">
            {activeTab === 'pending' ? (
              pendingChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-2 text-gray-300">
                  <MessageSquare className="h-9 w-9 opacity-40" />
                  <p className="text-xs font-bold text-gray-400">No pending chats</p>
                </div>
              ) : (
                pendingChats.map(chat => (
                  <div key={chat.id} className="p-3.5 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/60 transition-all">
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="h-9 w-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[11px] font-bold text-gray-600 shrink-0">
                        {initials(chat.guestName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-gray-900 truncate">{chat.guestName}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{chat.type}</p>
                      </div>
                      <Badge className="bg-amber-50 text-amber-600 border-amber-100 text-[9px] font-bold shrink-0">Waiting</Badge>
                    </div>
                    <Button size="sm" onClick={() => acceptChat(chat.id)} className="w-full h-9 rounded-xl bg-black hover:bg-zinc-800 !text-white font-bold text-xs">Accept Chat</Button>
                  </div>
                ))
              )
            ) : (
              myChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-2 text-gray-300">
                  <MessageSquare className="h-9 w-9 opacity-40" />
                  <p className="text-xs font-bold text-gray-400">No active chats</p>
                </div>
              ) : (
                myChats.map(chat => (
                  <div key={chat.id} onClick={() => selectChat(chat)}
                       className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${selectedChat?.id === chat.id ? 'border-[#E83D6E] bg-rose-50/40' : 'border-gray-100 hover:bg-gray-50/60'}`}>
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="h-9 w-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[11px] font-bold text-gray-600">
                          {initials(chat.guestName)}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm truncate text-gray-900">{chat.guestName}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">{chat.type}</p>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-0 shadow-sm rounded-2xl bg-white border border-gray-100 flex flex-col overflow-hidden">
          {!selectedChat || selectedChat.status !== 'active' ? (
            <div className="flex-1 min-h-[560px] flex flex-col items-center justify-center text-gray-300 p-6 text-center">
              <MessageSquare className="h-12 w-12 mb-4 opacity-30" />
              <p className="font-bold text-gray-400 text-sm">{activeTab === 'pending' ? 'Accept a chat from the Pending tab to start messaging' : 'Select an active chat'}</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-3 bg-white z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 text-xs font-bold shrink-0">
                    {initials(selectedChat.guestName)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">{selectedChat.guestName}</h3>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Active now</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={openCustomerPanel} className="h-9 rounded-xl font-bold text-xs gap-1.5">
                    <UserCircle2 className="h-4 w-4" /> Customer
                  </Button>
                  <Button variant="outline" size="sm" onClick={closeTicket} className="h-9 rounded-xl font-bold text-xs gap-1.5 text-emerald-600 border-emerald-100 hover:bg-emerald-50">
                    <CheckCheck className="h-4 w-4" /> Close
                  </Button>
                </div>
              </div>

              <div
                className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-0.5 min-h-[420px]"
                style={{
                  backgroundColor: '#EFEAE2',
                  backgroundImage: 'radial-gradient(rgba(0,0,0,0.045) 1px, transparent 1px)',
                  backgroundSize: '18px 18px',
                }}
              >
                {messages.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 text-gray-400">
                    <MessageSquare className="h-9 w-9 opacity-30" />
                    <p className="text-xs font-bold">No messages yet — say hello!</p>
                  </div>
                )}
                {groupByDay(messages).map((group, gi) => (
                  <React.Fragment key={gi}>
                    <div className="flex justify-center my-3 sticky top-0 z-[1]">
                      <span className="bg-white/80 backdrop-blur-sm text-gray-500 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                        {group.label}
                      </span>
                    </div>
                    {group.items.map((msg, idx) => {
                      const isStaffMsg = msg.senderType === 'staff';
                      const prev = group.items[idx - 1];
                      const grouped = prev && prev.senderType === msg.senderType;
                      return (
                        <div key={idx} className={`flex max-w-[78%] sm:max-w-[70%] ${isStaffMsg ? 'self-end' : 'self-start'} ${grouped ? 'mt-0.5' : 'mt-2.5'}`}>
                          <div className="relative">
                            <div className={`flow-root px-3 py-2 text-sm font-medium shadow-sm relative z-[1] ${
                              isStaffMsg
                                ? 'bg-[#E83D6E] text-white rounded-2xl rounded-tr-2xl rounded-tl-2xl rounded-bl-2xl'
                                : 'bg-white text-gray-800 rounded-2xl rounded-tl-2xl rounded-tr-2xl rounded-br-2xl'
                            } ${grouped ? '' : isStaffMsg ? 'rounded-br-md' : 'rounded-bl-md'}`}>
                              {/* text first, then a trailing float — lets the timestamp share the last
                                  line when it fits, and wrap onto its own right-aligned line when it doesn't */}
                              <span className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</span>
                              <span className={`float-right ml-2 mt-[3px] flex items-center gap-0.5 text-[9.5px] font-medium select-none ${isStaffMsg ? 'text-white/70' : 'text-gray-400'}`}>
                                {fmtTime(msg.timestamp)}
                                {isStaffMsg && <CheckCheck className="h-3 w-3" />}
                              </span>
                            </div>
                            {!grouped && <BubbleTail side={isStaffMsg ? 'right' : 'left'} color={isStaffMsg ? '#E83D6E' : '#ffffff'} />}
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-3 bg-white border-t border-gray-100">
                <form onSubmit={sendMessage} className="flex gap-2.5 items-center">
                  <Input
                    value={inputMsg}
                    onChange={e => setInputMsg(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 h-11 rounded-full bg-gray-100 border-transparent focus:bg-white focus:border-gray-200 font-medium px-4"
                  />
                  <Button type="submit" size="icon" disabled={!inputMsg.trim()} className="h-11 w-11 rounded-full bg-[#E83D6E] hover:bg-[#c72f5a] !text-white shrink-0 disabled:opacity-40"><Send className="h-4 w-4" /></Button>
                </form>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* --- CUSTOMER DETAILS PANEL --- */}
      <Dialog open={showCustomer} onOpenChange={setShowCustomer}>
        <DialogContent className="max-w-md rounded-3xl p-0 border-0 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
          <div className="bg-black p-6 text-white shrink-0">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-sm font-bold">
                  {initials(selectedChat?.guestName)}
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-lg font-bold truncate text-white">{selectedChat?.guestName}</DialogTitle>
                  <DialogDescription className="text-white/50 text-xs font-medium">Customer profile & order history</DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto">
            {customerLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-300">
                <div className="animate-spin h-5 w-5 border-2 border-[#E83D6E] border-t-transparent rounded-full" />
                <p className="text-xs font-bold text-gray-400">Loading customer context...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-2.5 text-sm">
                  <div className="flex items-center gap-2.5 text-gray-700">
                    <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="font-medium truncate">{customerProfile?.email || selectedChat?.guestEmail || '—'}</span>
                  </div>
                  {customerProfile?.phone && (
                    <div className="flex items-center gap-2.5 text-gray-700">
                      <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="font-medium">{customerProfile.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 text-gray-700">
                    <CalendarDays className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="font-medium">Member since {fmtDate(customerProfile?.createdAt)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Total Orders</p>
                    <p className="text-xl font-bold text-gray-900 mt-0.5">{customerOrders.length}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Total Spent</p>
                    <p className="text-xl font-bold text-gray-900 mt-0.5">₹{totalSpent.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {ongoingOrders.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShoppingBag className="h-3 w-3" /> Ongoing Orders
                    </p>
                    <div className="space-y-2.5">
                      {ongoingOrders.map((o) => <OrderCard key={o.id} order={o} />)}
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="h-3 w-3" /> Previous Orders
                  </p>
                  {previousOrders.length === 0 ? (
                    <p className="text-xs font-medium text-gray-400 py-4 text-center">No previous orders found.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {previousOrders.map((o) => <OrderCard key={o.id} order={o} />)}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
