import React, { useState, useEffect } from 'react';
import {
  Truck, Package, CheckCircle, MapPin, CreditCard, Star, ArrowLeft, ArrowRight,
  ChevronDown, Check, MessageCircle, FileText, RotateCcw, Boxes,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import FallbackImg from '../../assets/lan.png';
import { authenticatedFetch } from '../../lib/api';
import { useCart } from '../../context/CartContext';
import OrderListSkeleton from '../../components/skeletons/OrderListSkeleton';
import useSkeletonLoader from '../../hooks/useSkeletonLoader';

const EASE = [0.16, 1, 0.3, 1];

const ORDER_FAQS = [
  { q: 'How do I track my order in real time?', a: 'Your order status updates live on this page. Once shipped, you receive an SMS with a courier tracking link.' },
  { q: 'What should I do if my order is delayed?', a: 'Deliveries take 4–7 business days. If delayed beyond 10 days, contact support via chat with your Order ID.' },
  { q: 'Can I cancel my order after placing it?', a: 'Orders cannot be cancelled once placed. If there is an issue with your order, please contact support via chat with your Order ID.' },
  { q: 'How do I return or exchange a product?', a: 'We offer a 3-day return window from delivery for damaged or incorrect items. Raise a request via support chat for a free pickup.' },
  { q: 'Will I receive an invoice?', a: 'A GST-compliant digital invoice is emailed to your registered address after payment confirmation.' },
];

const TIMELINE = [
  { key: 'confirmed', label: 'Order confirmed', icon: Check },
  { key: 'packed', label: 'Packed', icon: Boxes },
  { key: 'shipped', label: 'Shipped', icon: Package },
  { key: 'out_for_delivery', label: 'Out for delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: MapPin },
];

const statusToIndex = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'pending': case 'payment_pending': case 'processing': return 0;
    case 'packed': return 1;
    case 'shipped': return 2;
    case 'out_for_delivery': return 3;
    case 'delivered': return 4;
    default: return 0;
  }
};

const headline = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'delivered': return ['Delivered', 'successfully'];
    case 'out_for_delivery': return ['Arriving', 'today'];
    case 'shipped': return ['On its', 'way'];
    case 'packed': return ['Packed &', 'ready to ship'];
    case 'cancelled': return ['Order', 'cancelled'];
    default: return ['Order', 'confirmed'];
  }
};

const fmtDate = (ts) =>
  ts?._seconds
    ? new Date(ts._seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

const StatusPill = ({ status }) => {
  const s = (status || '').toLowerCase();
  const cls =
    s === 'delivered' ? 'bg-leaf/10 text-leaf border-leaf/20'
    : s === 'cancelled' ? 'bg-danger/10 text-danger border-danger/20'
    : 'bg-berry/10 text-berry-deep border-berry/20';
  const label = { out_for_delivery: 'On the way', payment_pending: 'Payment pending' };
  return (
    <span className={`inline-flex items-center h-[26px] px-3 rounded-full border text-[9px] font-bold uppercase tracking-widest ${cls}`}>
      {label[s] || s.replace(/_/g, ' ')}
    </span>
  );
};

export default function MyOrders() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useSkeletonLoader(loading);
  // Post-delivery feedback IS the product review — one rating/comment per item.
  // reviewedKeys tracks which (orderId, productId) pairs already have a review,
  // so a page reload doesn't re-show the picker for items already rated.
  const [reviewedKeys, setReviewedKeys] = useState(new Set());
  const [itemRatings, setItemRatings] = useState({});
  const [submittingKey, setSubmittingKey] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/orders/my-orders`);
        if (!res) { setLoading(false); return; }
        const data = await res.json();
        if (data.success) {
          setOrders((data.data || []).sort((a, b) => (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0)));
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    const fetchMyReviews = async () => {
      try {
        const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/reviews/mine`);
        if (!res) return;
        const data = await res.json();
        if (data.success) {
          setReviewedKeys(new Set((data.data || []).map((r) => `${r.orderId}_${r.productId}`)));
        }
      } catch (e) { console.error(e); }
    };
    fetchOrders();
    fetchMyReviews();
  }, []);

  const getItemRating = (key) => itemRatings[key] || { rating: 5, comment: '' };

  const submitItemReview = async (orderId, productId) => {
    const key = `${orderId}_${productId}`;
    const r = getItemRating(key);
    setSubmittingKey(key);
    try {
      const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/reviews`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, orderId, rating: r.rating, comment: r.comment }),
      });
      const data = await res?.json().catch(() => ({}));
      if (res?.ok && data?.success !== false) {
        setReviewedKeys((prev) => new Set(prev).add(key));
        toast.success('Thanks for the review!');
      } else {
        toast.error(data?.error || 'Could not submit review');
      }
    } catch (e) { console.error(e); toast.error('Could not submit review'); }
    finally { setSubmittingKey(null); }
  };

  const reorder = (order) => {
    (order.items || []).forEach((it) =>
      addToCart(
        { id: it.productId, name: it.name, price: it.price, image: it.image, category: it.category, selectedWeight: it.selectedWeight },
        it.quantity || 1,
      ));
    navigate('/cart');
  };

  if (loading) {
    if (showSkeleton) {
      return (
        <div className="relative min-h-screen font-sans text-ink overflow-x-hidden pb-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-[1264px] py-24 relative z-10">
            <OrderListSkeleton />
          </div>
        </div>
      );
    }
    return <div className="min-h-screen" />;
  }

  const activeStates = ['pending', 'payment_pending', 'processing', 'packed', 'shipped', 'out_for_delivery'];
  const activeOrder = orders.find((o) => activeStates.includes((o.status || '').toLowerCase()));
  const history = orders.filter((o) => o.id !== activeOrder?.id);

  const counts = {
    active: orders.filter((o) => activeStates.includes((o.status || '').toLowerCase())).length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  /* ── EMPTY ── */
  if (orders.length === 0) {
    return (
      <div className="relative min-h-screen font-sans text-ink flex items-center justify-center px-4">
        <div className="glass rounded-panel foil-top max-w-md w-full text-center px-8 py-16 relative z-10">
          <span className="ico-chip h-16 w-16 rounded-2xl mx-auto mb-6"><Package className="h-7 w-7" /></span>
          <h1 className="display-md text-2xl mb-2">No orders yet</h1>
          <p className="text-ink-soft text-sm mb-8">Your order history is empty. Explore our heritage grain collection.</p>
          <Link to="/shop" className="btn-berry inline-flex items-center gap-2 h-12 px-8 rounded-full text-[11px] font-extrabold uppercase tracking-[0.16em]">
            Discover products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen font-sans text-ink overflow-x-hidden pb-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-[1264px] py-24 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-9"
        >
          <div className="flex flex-col gap-3.5">
            <button onClick={() => navigate('/shop')} className="kicker text-[10px] text-ink-soft hover:text-berry transition-colors inline-flex items-center gap-2 self-start">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to shop
            </button>
            <h1 className="display-lg text-[2.5rem] sm:text-[2.9rem]">Track your <span className="accent-text">order</span></h1>
            <span className="rule-berry" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="pill-berry-soft inline-flex items-center h-[34px] px-3.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Active · {counts.active}</span>
            <span className="pill-glass inline-flex items-center h-[34px] px-3.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Delivered · {counts.delivered}</span>
            <span className="pill-glass inline-flex items-center h-[34px] px-3.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Cancelled · {counts.cancelled}</span>
          </div>
        </motion.div>

        {/* ── ACTIVE ORDER ── */}
        {activeOrder && (() => {
          const idx = statusToIndex(activeOrder.status);
          const [h1, h2] = headline(activeOrder.status);
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}
              className="glass foil-top rounded-panel p-6 sm:p-8 lg:p-9 mb-6"
            >
              {/* head */}
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 pb-7 border-b border-white/50">
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="inline-flex items-center h-[28px] px-3 rounded-full text-[9.5px] font-bold uppercase tracking-widest bg-berry/10 text-berry-deep border border-berry/15">
                      #{activeOrder.id.slice(-8).toUpperCase()}
                    </span>
                    <StatusPill status={activeOrder.status} />
                  </div>
                  <p className="display-lg text-[1.9rem] sm:text-[2.1rem]">{h1} <span className="accent-text">{h2}</span></p>
                  <p className="text-[12.5px] text-ink-muted">
                    Placed {fmtDate(activeOrder.createdAt)} · {activeOrder.items?.length || 0} items · ₹{activeOrder.totalAmount} paid via {activeOrder.customerInfo?.paymentMethod === 'razorpay' ? 'online payment' : 'cash on delivery'}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button className="btn-glass h-10 px-3.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Invoice</button>
                  <button onClick={() => navigate('/policies/shipping-policy')} className="btn-glass h-10 px-3.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-berry">Need help?</button>
                </div>
              </div>

              {/* timeline */}
              {activeOrder.status !== 'cancelled' && (
                <div className="relative py-9 px-1 sm:px-6">
                  <div className="absolute left-8 right-8 sm:left-14 sm:right-14 top-[62px] h-[3px] rounded-full bg-hairline" />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `calc((100% - ${'4rem'}) * ${idx / (TIMELINE.length - 1)})` }}
                    transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                    className="absolute left-8 sm:left-14 top-[62px] h-[3px] rounded-full bg-gradient-to-r from-berry to-gold-light"
                  />
                  <div className="flex relative">
                    {TIMELINE.map((step, i) => {
                      const done = i < idx;
                      const now = i === idx;
                      const Icon = step.icon;
                      return (
                        <div key={step.key} className="flex-1 flex flex-col items-center gap-3 text-center">
                          <span
                            className={`h-[52px] w-[52px] rounded-full flex items-center justify-center relative z-[2] shrink-0 ${
                              done
                                ? 'bg-gradient-to-br from-berry to-[#C21A75] text-white shadow-berry'
                                : now
                                ? 'bg-white border-[2.5px] border-berry text-berry shadow-[0_0_0_7px_rgba(165,13,90,0.12)]'
                                : 'bg-white/70 border border-hairline text-ink-muted'
                            }`}
                          >
                            <Icon className="h-5 w-5" strokeWidth={done ? 2.6 : 2.2} />
                          </span>
                          <div>
                            <p className={`display-md text-[13px] leading-tight ${now ? 'text-berry' : done ? '' : 'text-ink-muted'}`}>{step.label}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* courier strip */}
              {['shipped', 'out_for_delivery'].includes((activeOrder.status || '').toLowerCase()) && (
                <div className="glass-sm rounded-card p-4 sm:px-5 flex items-center gap-4 mb-6">
                  <span className="ico-chip ico-chip-gold h-11 w-11 rounded-2xl shrink-0"><Truck className="h-5 w-5" /></span>
                  <div className="flex-1 min-w-0">
                    <p className="display-md text-[14px]">
                      Dispatched from Chennai
                    </p>
                    <p className="text-[11.5px] text-ink-muted mt-0.5">
                      {activeOrder.status === 'out_for_delivery' ? 'Out for delivery in your area today' : 'In transit · tracked shipment'}
                    </p>
                  </div>
                </div>
              )}

              {/* items + address/payment */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
                <div className="flex flex-col gap-3">
                  <p className="kicker text-[10px] text-ink-soft">Items in this order</p>
                  {(activeOrder.items || []).map((it, i) => (
                    <div key={i} className="glass-sm rounded-card p-3.5 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-cream border border-hairline shrink-0">
                        <img src={it.image || FallbackImg} alt={it.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="display-md text-[14.5px] line-clamp-1">{it.name}</p>
                        <p className="text-[11.5px] text-ink-muted mt-0.5">{it.selectedWeight || 'Standard'} · Qty {it.quantity}</p>
                      </div>
                      <span className="display-md text-[15px] shrink-0">₹{it.price * it.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-4">
                  <div className="glass-sm rounded-card p-5">
                    <p className="kicker text-[10px] text-ink-soft mb-3">Delivering to</p>
                    <p className="display-md text-[15px]">{activeOrder.customerInfo?.firstName} {activeOrder.customerInfo?.lastName}</p>
                    <p className="text-[13px] text-ink-soft leading-relaxed mt-1.5">
                      {activeOrder.customerInfo?.address}<br />
                      {activeOrder.customerInfo?.city}, {activeOrder.customerInfo?.state} {activeOrder.customerInfo?.pincode}
                    </p>
                    {activeOrder.customerInfo?.phone && <p className="text-[11.5px] text-ink-muted mt-2">{activeOrder.customerInfo.phone}</p>}
                  </div>
                  <div className="glass-sm rounded-card p-5">
                    <p className="kicker text-[10px] text-ink-soft mb-3">Payment</p>
                    <div className="flex items-center justify-between py-1.5 text-[13px]"><span className="text-ink-soft">Subtotal</span><span className="display-md text-[13.5px]">₹{activeOrder.subtotal ?? activeOrder.totalAmount}</span></div>
                    {activeOrder.discountAmount > 0 && (
                      <div className="flex items-center justify-between py-1.5 text-[13px]"><span className="text-ink-soft">Discount</span><span className="display-md text-[13.5px] text-leaf">− ₹{activeOrder.discountAmount}</span></div>
                    )}
                    {activeOrder.shipping != null && (
                      <div className="flex items-center justify-between py-1.5 text-[13px]">
                        <span className="text-ink-soft">Delivery{activeOrder.deliveryMethod === 'fastest' ? ' · fastest' : activeOrder.deliveryMethod === 'standard' ? ' · standard' : ''}</span>
                        <span className="display-md text-[13.5px]">{activeOrder.shipping === 0 ? 'Free' : `₹${activeOrder.shipping}`}</span>
                      </div>
                    )}
                    <div className="h-px bg-white/50 my-2" />
                    <div className="flex items-center justify-between py-1.5">
                      <span className="kicker text-[9.5px] text-ink-soft inline-flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> {activeOrder.customerInfo?.paymentMethod === 'razorpay' ? 'Paid online' : 'Cash on delivery'}</span>
                      <span className="display-lg text-[1.25rem]">₹{activeOrder.totalAmount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* ── HISTORY ── */}
        {history.length > 0 && (
          <div className="mt-8">
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex items-baseline gap-4"><span className="kicker text-berry">N&#8304; 01</span><span className="kicker text-ink-soft">Order history</span></div>
              <h2 className="display-lg text-[1.9rem]">Previous <span className="accent-text">orders</span></h2>
            </div>

            <div className="flex flex-col gap-3.5">
              {history.map((order) => {
                const cancelled = order.status === 'cancelled';
                const reviewableItems = order.status === 'delivered'
                  ? (order.items || []).filter((it) => it.productId || it.id)
                  : [];
                const pendingItems = reviewableItems.filter(
                  (it) => !reviewedKeys.has(`${order.id}_${it.productId || it.id}`)
                );
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className={`glass rounded-card p-5 sm:px-6 ${cancelled ? 'opacity-75' : ''}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                      <div className="flex -space-x-3.5 shrink-0">
                        {(order.items || []).slice(0, 2).map((it, i) => (
                          <span key={i} className="w-12 h-12 rounded-xl overflow-hidden bg-cream border-2 border-cream shrink-0">
                            <img src={it.image || FallbackImg} alt={it.name} className="w-full h-full object-cover" />
                          </span>
                        ))}
                        {(order.items || []).length > 2 && (
                          <span className="w-12 h-12 rounded-xl border-2 border-cream glass-sm flex items-center justify-center display-md text-[12px] text-ink-soft">
                            +{order.items.length - 2}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                          <p className="display-md text-[15px]">#{order.id.slice(-8).toUpperCase()}</p>
                          <StatusPill status={order.status} />
                        </div>
                        <p className="text-[12px] text-ink-muted">
                          {order.items?.length || 0} items · {cancelled ? 'Cancelled' : order.status === 'delivered' ? 'Delivered' : (order.status || '').replace(/_/g, ' ')} {fmtDate(order.createdAt)}
                        </p>
                      </div>

                      <span className="display-md text-[18px] shrink-0">₹{order.totalAmount}</span>

                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => reorder(order)} className="btn-glass h-9 px-4 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-berry inline-flex items-center gap-1.5">
                          <RotateCcw className="h-3.5 w-3.5" /> Reorder
                        </button>
                      </div>
                    </div>

                    {/* delivered — rate each item; this is the product review */}
                    {pendingItems.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/50 flex flex-col gap-3">
                        <span className="kicker text-[9.5px] text-berry inline-flex items-center gap-1.5"><Star className="h-3 w-3 fill-current" /> Rate what you got</span>
                        {pendingItems.map((it) => {
                          const productId = it.productId || it.id;
                          const key = `${order.id}_${productId}`;
                          const r = getItemRating(key);
                          const submitting = submittingKey === key;
                          return (
                            <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-3">
                              <div className="flex items-center gap-2.5 sm:w-[190px] shrink-0 min-w-0">
                                <span className="w-9 h-9 rounded-lg overflow-hidden bg-cream border border-hairline shrink-0">
                                  <img src={it.image || FallbackImg} alt={it.name} className="w-full h-full object-cover" />
                                </span>
                                <p className="text-[12px] font-medium text-ink truncate">{it.name}</p>
                              </div>
                              <div className="flex gap-0.5 shrink-0">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <button key={s} onClick={() => setItemRatings((p) => ({ ...p, [key]: { ...getItemRating(key), rating: s } }))}>
                                    <Star className={`h-4 w-4 transition-transform hover:scale-110 ${s <= r.rating ? 'text-gold-light fill-gold-light' : 'text-hairline'}`} />
                                  </button>
                                ))}
                              </div>
                              <input
                                value={r.comment}
                                onChange={(e) => setItemRatings((p) => ({ ...p, [key]: { ...getItemRating(key), comment: e.target.value } }))}
                                placeholder="How was it?"
                                className="flex-1 h-9 px-3 rounded-lg bg-white border border-hairline text-[12px] outline-none focus:border-berry/50 placeholder:text-ink-muted"
                              />
                              <button
                                onClick={() => submitItemReview(order.id, productId)}
                                disabled={submitting}
                                className="btn-berry h-9 px-4 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 disabled:opacity-60"
                              >
                                {submitting ? 'Sending…' : 'Send'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {reviewableItems.length > 0 && pendingItems.length === 0 && (
                      <div className="mt-4 pt-4 border-t border-white/50 flex items-center gap-2 text-leaf">
                        <CheckCircle className="h-4 w-4 shrink-0" />
                        <p className="text-[12px] font-medium">Thanks for reviewing this order!</p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SUPPORT ── */}
        <div className="glass foil-top rounded-panel mt-8 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="ico-chip h-[52px] w-[52px] rounded-2xl shrink-0"><MessageCircle className="h-5 w-5" /></span>
            <div>
              <p className="display-md text-lg">Something wrong with an order?</p>
              <p className="text-[13px] text-ink-soft mt-1">Damaged, incorrect or missing items can be reported within 3 days of delivery.</p>
            </div>
          </div>
          <div className="flex gap-2.5 shrink-0">
            <button onClick={() => navigate('/policies/returns-refunds')} className="btn-glass h-11 px-5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">Report an issue</button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-support-chat'))}
              className="btn-berry h-11 px-5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
            >
              Chat with support
            </button>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="mt-16">
          <div className="text-center max-w-2xl mx-auto mb-8 flex flex-col items-center gap-3">
            <span className="pill-berry-soft inline-flex items-center h-7 px-4 rounded-full text-[9.5px] font-extrabold uppercase tracking-[0.18em]">Support</span>
            <h2 className="display-lg text-[1.9rem]">Order FAQs</h2>
          </div>
          <div className="max-w-3xl mx-auto grid grid-cols-1 gap-3">
            {ORDER_FAQS.map((faq, i) => (
              <div key={i} className={`glass rounded-card overflow-hidden transition-all ${openFaq === i ? 'border-berry/25' : ''}`}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left gap-4">
                  <span className={`display-md text-[14.5px] leading-snug transition-colors ${openFaq === i ? 'text-berry' : ''}`}>{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-ink-muted shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-berry' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                      <div className="px-5 pb-5 border-t border-white/50 pt-4">
                        <p className="text-ink-soft text-[13px] leading-relaxed">{faq.a}</p>
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
