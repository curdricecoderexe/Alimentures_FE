import React, { useState, useEffect } from 'react';
import { Truck, Clock, CheckCircle, Package, Calendar, CreditCard, ShieldCheck, MapPin, Star, ArrowLeft, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import FallbackImg from '../../assets/lan.png';
import { authenticatedFetch } from '../../lib/api';
import OrderListSkeleton from '../../components/skeletons/OrderListSkeleton';
import useSkeletonLoader from '../../hooks/useSkeletonLoader';

const ORDER_FAQS = [
  { q: 'How do I track my order in real time?', a: 'Your order status is updated live on this page. Once shipped, you will receive an SMS with a courier tracking link. You can also contact our support for live updates.' },
  { q: 'What should I do if my order is delayed?', a: 'Deliveries typically take 4–7 business days. If your order is delayed beyond 10 days, please contact us via chat support with your Order ID and we will investigate immediately.' },
  { q: 'Can I cancel my order after placing it?', a: 'Orders can be cancelled within 2 hours of placement. After that, the order enters our packing process and cannot be cancelled. Contact support immediately if you need to cancel.' },
  { q: 'How do I return or exchange a product?', a: 'We offer a 7-day return window from the date of delivery. Products must be unused and in original packaging. Raise a return request via our support chat and we will arrange a free pickup.' },
  { q: 'Will I receive an invoice for my order?', a: 'Yes, a digital invoice (GST-compliant) is automatically emailed to your registered email address after payment confirmation. You can also download it from this orders page.' },
];

const getStatusConfig = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'delivered') return { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Delivered' };
  if (s === 'out_for_delivery') return { color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200', label: 'Out for Delivery' };
  if (s === 'shipped') return { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Shipped' };
  if (s === 'processing') return { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Processing' };
  if (s === 'packed') return { color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', label: 'Packed' };
  if (s === 'cancelled') return { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', label: 'Cancelled' };
  return { color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', label: status || 'Pending' };
};

const STEPS = [
  { id: 'pending', label: 'Placed', icon: CheckCircle },
  { id: 'processing', label: 'Processing', icon: Clock },
  { id: 'packed', label: 'Packed', icon: Package },
  { id: 'shipped', label: 'Shipped', icon: Truck },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { id: 'delivered', label: 'Delivered', icon: CheckCircle },
];

const getStepStatus = (stepId, orderStatus) => {
  const s = (orderStatus || '').toLowerCase();
  const order = ['pending', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
  const curr = order.indexOf(s);
  const stepIdx = order.indexOf(stepId);
  
  if (s === 'cancelled') return 'cancelled';
  if (curr === -1) return stepIdx === 0 ? 'completed' : 'pending';
  if (stepIdx < curr) return 'completed';
  if (stepIdx === curr) return 'active';
  return 'pending';
};

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useSkeletonLoader(loading);
  const [feedback, setFeedback] = useState({});
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/orders/my-orders`);
        if (!res) { setLoading(false); return; }
        const data = await res.json();
        if (data.success) {
          setOrders(data.data.sort((a, b) => (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0)));
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchOrders();
  }, []);

  if (loading) {
    if (showSkeleton) return (
      <div className="min-h-screen bg-[#FDFBF7] relative overflow-x-hidden font-sans">
        <div className="mx-auto max-w-5xl px-4 py-24"><OrderListSkeleton /></div>
      </div>
    );
    return <div className="min-h-screen bg-[#FDFBF7]"></div>;
  }

  const totalOrders = orders.length;
  const delivered = orders.filter(o => o.status === 'delivered').length;
  const pending = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;

  return (
    <div className="min-h-screen bg-[#FDFBF7] relative overflow-x-hidden font-sans pb-24">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-1/4 w-[700px] h-[400px] bg-rose-700/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[350px] bg-amber-500/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20 relative z-10">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
          <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-600 text-xs font-semibold hover:border-rose-700 hover:text-rose-700 transition-all mb-8 shadow-sm">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Shop
          </Link>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-rose-700">
                <Package className="h-3.5 w-3.5" /> Order History
              </span>
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#0a0806] tracking-tight">
                My <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-700 to-orange-500">Orders</span>
              </h1>
            </div>

            {/* Stats bar */}
            {totalOrders > 0 && (
              <div className="flex items-center gap-3">
                {[
                  { value: totalOrders, label: 'Total Orders' },
                  { value: pending, label: 'In Progress' },
                  { value: delivered, label: 'Delivered' },
                ].map(({ value, label }, i) => (
                  <div key={i} className="px-5 py-3 bg-white border border-gray-200/60 rounded-2xl shadow-sm text-center min-w-[80px]">
                    <p className="text-xl font-bold text-rose-700">{value}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Orders List ── */}
        <AnimatePresence mode="wait">
          {orders.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 bg-white rounded-[2rem] border border-gray-200/60 shadow-sm">
              <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                <Package className="h-7 w-7 text-rose-300" />
              </div>
              <h2 className="text-2xl font-display font-bold text-[#0a0806] mb-2 tracking-tight">No Orders Yet</h2>
              <p className="text-gray-500 text-sm max-w-sm text-center mb-8 font-medium">Your order history is empty. Explore our heritage grain collection!</p>
              <Link to="/" className="h-10 px-6 rounded-xl bg-rose-700 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-rose-800 transition-all shadow-sm flex items-center justify-center">
                Discover Products
              </Link>
            </motion.div>
          ) : (
            <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8">
              {orders.map((order) => {
                const statusCfg = getStatusConfig(order.status);
                const orderFeedback = feedback[order.id] || { rating: 5, comment: '', submitted: false };
                const isCancelled = order.status === 'cancelled';
                
                return (
                  <motion.div key={order.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}>
                    <div className="bg-white border border-gray-200/60 rounded-[1.5rem] shadow-sm hover:shadow-lg hover:shadow-rose-900/5 hover:border-rose-700/20 transition-all duration-300 overflow-hidden h-full flex flex-col">
                      
                      {/* Order Header */}
                      <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 shrink-0">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-3">
                            <h2 className="font-display font-bold text-[#0a0806] text-lg tracking-tight">#{order.id.slice(-8).toUpperCase()}</h2>
                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                              {statusCfg.label}
                            </span>
                          </div>
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            {new Date(order.createdAt?._seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total</p>
                            <p className="text-lg font-bold text-[#0a0806]">₹{order.totalAmount}</p>
                          </div>
                        </div>
                      </div>

                      {/* Horizontal Fulfillment Stepper */}
                      {!isCancelled && (
                        <div className="px-5 py-5 border-b border-gray-100 bg-white shrink-0">
                          <div className="relative flex justify-between items-center w-full">
                            {/* Connecting Line Base */}
                            <div className="absolute top-4 left-4 right-4 h-[2px] bg-gray-100 z-0" />
                            
                            {/* Active Flow Line */}
                            {(() => {
                              const s = (order.status || '').toLowerCase();
                              const orderStatusArr = ['pending', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
                              let curr = orderStatusArr.indexOf(s);
                              if (curr === -1) curr = 0;
                              
                              return (
                                <motion.div 
                                  initial={{ width: 0 }} 
                                  animate={{ width: `calc((100% - 2rem) * ${curr / (STEPS.length - 1)})` }} 
                                  transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                                  className={`absolute top-4 left-4 h-[2px] z-0 ${s === 'delivered' ? 'bg-emerald-500' : 'bg-rose-700'}`} 
                                />
                              );
                            })()}
                            
                            {STEPS.map((step) => {
                              const status = getStepStatus(step.id, order.status);
                              const Icon = step.icon;
                              const isCompleted = status === 'completed';
                              const isActive = status === 'active';
                              
                              return (
                                <div key={step.id} className="flex flex-col items-center gap-1.5 z-10 relative bg-white px-1 sm:px-2">
                                  <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                                    isCompleted ? 'bg-emerald-500 text-white shadow-sm' :
                                    isActive ? 'bg-rose-700 text-white shadow-md shadow-rose-700/20 ring-4 ring-rose-50' :
                                    'bg-white border-2 border-gray-200 text-gray-300'
                                  }`}>
                                    {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                                  </div>
                                  <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wider hidden sm:block ${
                                    isCompleted || isActive ? 'text-[#0a0806]' : 'text-gray-400'
                                  }`}>
                                    {step.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Order Body Grid (Now purely vertical) */}
                      <div className="p-5 flex flex-col gap-5 bg-white flex-1">
                        
                        {/* Products List */}
                        <div className="space-y-2.5 flex-1">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Order Items</p>
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                                <div className="h-12 w-12 rounded-lg overflow-hidden bg-[#FDFBF7] shrink-0">
                                  <img src={item.image || FallbackImg} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-display font-bold text-[#0a0806] text-sm leading-tight truncate">{item.name}</p>
                                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                                    {item.selectedWeight || 'Standard'} • Qty: {item.quantity}
                                  </p>
                                </div>
                                <span className="font-bold text-[#0a0806] text-sm shrink-0">₹{item.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px w-full bg-gray-100" />

                        {/* Shipping & Payment Grid */}
                        <div className="grid grid-cols-2 gap-3 shrink-0">
                          {/* Shipping Info */}
                          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-emerald-500" /> Delivery To
                            </p>
                            <p className="font-bold text-[#0a0806] text-xs truncate">{order.customerInfo?.firstName} {order.customerInfo?.lastName}</p>
                            <p className="text-gray-500 text-[11px] mt-0.5 leading-snug line-clamp-2">
                              {order.customerInfo?.address}, {order.customerInfo?.city} - {order.customerInfo?.pincode}
                            </p>
                          </div>

                          {/* Payment Info */}
                          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col justify-center">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 flex items-center gap-1">
                              <CreditCard className="h-3 w-3 text-rose-700" /> Payment
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-[#0a0806] text-xs">{order.customerInfo?.paymentMethod === 'razorpay' ? 'Prepaid' : 'COD'}</p>
                              <ShieldCheck className="h-5 w-5 text-emerald-400" />
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="shrink-0 mt-2">
                          {['payment_pending', 'pending', 'processing', 'packed'].includes(order.status) && (
                            <button onClick={async () => {
                              if(!window.confirm('Are you sure you want to cancel this order?')) return;
                              try {
                                const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/orders/${order.id}/cancel`, { method: 'PUT' });
                                if (res.ok) {
                                   setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o));
                                } else {
                                   const err = await res.json();
                                   alert(err.error || 'Failed to cancel order');
                                }
                              } catch (e) {
                                console.error(e);
                              }
                            }} className="w-full h-10 rounded-xl border border-red-200 text-red-600 font-bold text-[10px] uppercase tracking-widest hover:bg-red-50 transition-colors">
                              Cancel Order
                            </button>
                          )}

                          {order.status === 'delivered' && !orderFeedback.submitted && (
                            <div className="p-3.5 bg-white border border-rose-700/20 rounded-xl shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-rose-700 flex items-center gap-1.5">
                                  <Star className="h-3 w-3 fill-current" /> Rate Order
                                </p>
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} onClick={() => setFeedback(prev => ({ ...prev, [order.id]: { ...(prev[order.id] || { rating: 5, comment: '' }), rating: s } }))}
                                      className={`h-4 w-4 cursor-pointer hover:scale-110 transition-transform ${s <= orderFeedback.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <textarea
                                  value={orderFeedback.comment}
                                  onChange={e => setFeedback(prev => ({ ...prev, [order.id]: { ...(prev[order.id] || { rating: 5, comment: '' }), comment: e.target.value } }))}
                                  placeholder="Your experience..."
                                  className="flex-1 text-[11px] text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 outline-none focus:border-rose-700 resize-none h-9 placeholder:text-gray-400" />
                                <button onClick={async () => {
                                  try {
                                    await authenticatedFetch(`${import.meta.env.VITE_API_URL}/orders/${order.id}/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating: orderFeedback.rating, comment: orderFeedback.comment }) });
                                    setFeedback(prev => ({ ...prev, [order.id]: { ...orderFeedback, submitted: true } }));
                                  } catch (e) { console.error(e); }
                                }} className="h-9 px-4 rounded-lg bg-rose-700 text-white font-bold text-[9px] uppercase tracking-widest hover:bg-rose-800 transition-colors shrink-0">
                                  Send
                                </button>
                              </div>
                            </div>
                          )}
                          {order.status === 'delivered' && orderFeedback.submitted && (
                            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center gap-2">
                              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                              <p className="font-bold text-emerald-700 text-xs">Feedback Received. Thank You!</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FAQ Section ── */}
        <div className="mt-20 border-t border-gray-200/60 pt-16">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-orange-600 bg-orange-50 border border-orange-200/50 px-4 py-1.5 rounded-full inline-block">Support</span>
            <h2 className="font-display text-3xl font-bold text-[#0a0806] tracking-tight">Order FAQs</h2>
          </div>
          <div className="max-w-3xl mx-auto grid grid-cols-1 gap-3">
            {ORDER_FAQS.map((faq, i) => (
              <div key={i} className={`rounded-xl border bg-white transition-all duration-300 overflow-hidden ${openFaq === i ? 'border-rose-700/30 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left gap-4">
                  <span className={`font-semibold text-sm transition-colors ${openFaq === i ? 'text-rose-700' : 'text-[#0a0806]'}`}>{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-rose-700' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                      <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                        <p className="text-gray-500 text-xs leading-relaxed">{faq.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}