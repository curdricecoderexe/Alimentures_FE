import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { MessageSquare, Send, UserCircle2, Mail, Phone, CalendarDays, ShoppingBag, MapPin, CreditCard, Banknote, CheckCheck, Undo2, Lock } from 'lucide-react';
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

/** Groups a flat message list into { label, items } buckets by calendar day. */
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

export default function AdminChats() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
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
    fetchChats();
  }, []);

  // Admin can join and reply to any conversation directly, regardless of its
  // pending/active status — unlike staff, admin isn't gated by the accept flow.
  useEffect(() => {
    if (!selectedChat) return;
    const newSocket = io(SOCKET_URL, { auth: { token: localStorage.getItem('token') } });
    setSocket(newSocket);
    newSocket.on('connect_error', (err) => console.error('Chat connection failed:', err.message));
    newSocket.emit('join_chat', selectedChat.id);

    newSocket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    newSocket.on('chat_status', ({ status }) => {
      setSelectedChat((prev) => (prev ? { ...prev, status } : prev));
    });

    return () => newSocket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !socket || !selectedChat || selectedChat.status === 'closed') return;
    socket.emit('send_message', { chatId: selectedChat.id, text: inputMsg });
    setInputMsg('');
  };

  const closeTicket = async () => {
    if (!selectedChat) return;
    try {
      const res = await authenticatedFetch(`/chat/${selectedChat.id}/close`, { method: 'PUT' });
      if (res?.ok) {
        setSelectedChat((prev) => (prev ? { ...prev, status: 'closed' } : prev));
        fetchChats();
      }
    } catch (err) { console.error('Failed to close ticket', err); }
  };

  const reopenTicket = async () => {
    if (!selectedChat) return;
    try {
      const res = await authenticatedFetch(`/chat/${selectedChat.id}/reopen`, { method: 'PUT' });
      if (res?.ok) {
        setSelectedChat((prev) => (prev ? { ...prev, status: 'pending' } : prev));
        fetchChats();
      }
    } catch (err) { console.error('Failed to reopen ticket', err); }
  };

  const fetchChats = async () => {
    try {
      const res = await authenticatedFetch('/chat/admin/all');
      if (!res) return;
      const data = await res.json();
      if (data.success) {
        setChats(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const viewChat = async (chat) => {
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
    } catch (err) {
      console.error(err);
    }
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
    <div className="p-3 sm:p-6 lg:p-10 bg-transparent min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-center sm:text-left gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Support Inbox</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">Review and monitor customer interactions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 h-[calc(100vh-220px)] min-h-[600px]">
        {/* Chat List */}
        <Card className="lg:col-span-1 shadow-sm border border-gray-200/60 rounded-2xl bg-white flex flex-col overflow-hidden">
          <CardHeader className="p-5 border-b border-gray-100 bg-gray-50/50">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center justify-between">
              Active Conversations
              <Badge variant="secondary" className="bg-white border-gray-200 text-xs shadow-sm">
                {chats.length} Total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1 divide-y divide-gray-50 no-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-40 space-y-3">
                <div className="animate-spin h-5 w-5 border-2 border-rose-500 border-t-transparent rounded-full" />
                <p className="text-xs font-semibold text-gray-400">Loading inbox...</p>
              </div>
            ) : chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <MessageSquare className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm font-medium">No conversations found.</p>
              </div>
            ) : (
              chats.map(chat => {
                const isSelected = selectedChat?.id === chat.id;
                return (
                  <div 
                    key={chat.id} 
                    onClick={() => viewChat(chat)} 
                    className={`p-4 cursor-pointer transition-all border-l-4 ${
                      isSelected 
                        ? 'border-rose-500 bg-rose-50/30' 
                        : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex gap-3 items-start">
                      <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-xs font-bold shadow-sm border ${
                        isSelected ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-white text-gray-600 border-gray-200'
                      }`}>
                        {initials(chat.guestName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm truncate text-gray-900">{chat.guestName}</span>
                          <span className="text-[10px] font-semibold text-gray-400">
                            {new Date(chat.createdAt?._seconds * 1000 || chat.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs font-medium text-gray-500 truncate pr-2 flex items-center gap-1.5">
                            <Badge variant="outline" className={`text-[9px] h-4 px-1.5 uppercase ${chat.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : chat.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                              {chat.status}
                            </Badge>
                          </span>
                          <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">{chat.type}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Chat Thread */}
        <Card className="lg:col-span-2 shadow-sm border border-gray-200/60 rounded-2xl bg-white flex flex-col overflow-hidden relative">
          {!selectedChat ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
              <div className="h-20 w-20 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mb-4 shadow-sm">
                <MessageSquare className="h-8 w-8 text-gray-300" />
              </div>
              <p className="font-semibold text-gray-500">Select a conversation to view history</p>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="p-5 border-b border-gray-100 bg-white flex justify-between items-center z-10 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 text-xs font-bold">
                    {initials(selectedChat.guestName)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm leading-none truncate">{selectedChat.guestName}</h3>
                    <p className="text-[10px] font-semibold text-gray-400 mt-1 uppercase tracking-wider">
                      Chat ID: {selectedChat.id.substring(0,8)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <Badge variant="outline" className={`uppercase text-[10px] font-bold shadow-sm ${
                    selectedChat.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    selectedChat.status === 'closed' ? 'bg-gray-100 text-gray-500 border-gray-200' :
                    'bg-amber-50 text-amber-600 border-amber-200'
                  }`}>
                    {selectedChat.status}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={openCustomerPanel} className="h-9 rounded-xl font-bold text-xs gap-1.5">
                    <UserCircle2 className="h-4 w-4" /> Customer
                  </Button>
                  {selectedChat.status === 'closed' ? (
                    <Button variant="outline" size="sm" onClick={reopenTicket} className="h-9 rounded-xl font-bold text-xs gap-1.5">
                      <Undo2 className="h-4 w-4" /> Reopen
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={closeTicket} className="h-9 rounded-xl font-bold text-xs gap-1.5 text-emerald-600 border-emerald-100 hover:bg-emerald-50">
                      <CheckCheck className="h-4 w-4" /> Close
                    </Button>
                  )}
                </div>
              </div>

              {/* Thread Messages */}
              <div
                className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-0.5"
                style={{
                  backgroundColor: '#EFEAE2',
                  backgroundImage: 'radial-gradient(rgba(0,0,0,0.045) 1px, transparent 1px)',
                  backgroundSize: '18px 18px',
                }}
              >
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 text-gray-400">
                    <MessageSquare className="h-9 w-9 opacity-30" />
                    <p className="text-xs font-bold">No messages in this thread.</p>
                  </div>
                ) : (
                  <>
                    {groupByDay(messages).map((group, gi) => (
                      <React.Fragment key={gi}>
                        <div className="flex justify-center my-3 sticky top-0 z-[1]">
                          <span className="bg-white/80 backdrop-blur-sm text-gray-500 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                            {group.label}
                          </span>
                        </div>
                        {group.items.map((msg, idx) => {
                          const isUser = msg.senderType === 'user';
                          const prev = group.items[idx - 1];
                          const grouped = prev && prev.senderType === msg.senderType;
                          return (
                            <div key={idx} className={`flex max-w-[78%] sm:max-w-[70%] ${isUser ? 'self-start' : 'self-end'} ${grouped ? 'mt-0.5' : 'mt-2.5'}`}>
                              <div className="relative">
                                <div className={`flow-root px-3 py-2 text-sm font-medium shadow-sm relative z-[1] ${
                                  isUser
                                    ? 'bg-white text-gray-800 rounded-2xl rounded-tl-2xl rounded-tr-2xl rounded-br-2xl'
                                    : 'bg-[#E83D6E] text-white rounded-2xl rounded-tr-2xl rounded-tl-2xl rounded-bl-2xl'
                                } ${grouped ? '' : isUser ? 'rounded-bl-md' : 'rounded-br-md'}`}>
                                  {/* text first, then a trailing float — lets the timestamp share the last
                                      line when it fits, and wrap onto its own right-aligned line when it doesn't */}
                                  <span className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</span>
                                  <span className={`float-right ml-2 mt-[3px] flex items-center gap-0.5 text-[9.5px] font-medium select-none ${isUser ? 'text-gray-400' : 'text-white/70'}`}>
                                    {fmtTime(msg.timestamp)}
                                    {!isUser && <CheckCheck className="h-3 w-3" />}
                                  </span>
                                </div>
                                {!grouped && <BubbleTail side={isUser ? 'left' : 'right'} color={isUser ? '#ffffff' : '#E83D6E'} />}
                              </div>
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Reply composer */}
              {selectedChat.status === 'closed' ? (
                <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-center gap-2 text-gray-400">
                  <Lock className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-bold">Ticket closed — reopen it to reply</span>
                </div>
              ) : (
                <div className="p-3 bg-white border-t border-gray-100">
                  <form onSubmit={sendMessage} className="flex gap-2.5 items-center">
                    <Input
                      value={inputMsg}
                      onChange={(e) => setInputMsg(e.target.value)}
                      placeholder="Reply as Alimenture Support..."
                      className="flex-1 h-11 rounded-full bg-gray-100 border-transparent focus:bg-white focus:border-gray-200 font-medium px-4"
                    />
                    <button
                      type="submit"
                      disabled={!inputMsg.trim()}
                      className="h-11 w-11 shrink-0 rounded-full bg-[#E83D6E] hover:bg-[#c72f5a] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              )}
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
                <div className="animate-spin h-5 w-5 border-2 border-rose-500 border-t-transparent rounded-full" />
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
