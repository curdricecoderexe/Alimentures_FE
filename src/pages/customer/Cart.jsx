import React, { useState, useEffect } from 'react';
import {
  Trash2, Plus, Minus, ShoppingBag, Truck, ArrowLeft, ArrowRight, ChevronDown,
  ShieldCheck, RotateCcw, Lock, TicketPercent, X, CheckCircle2,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { toast } from 'sonner';
import FallbackImg from '../../assets/lan.png';
import { cachedFetch } from '../../lib/api';
import CheckoutSteps from '../../components/ui/CheckoutSteps';

const EASE = [0.16, 1, 0.3, 1];

const CART_FAQS = [
  { q: 'Is free shipping available on all orders?', a: 'Yes! All orders above ₹500 qualify for free shipping anywhere in India. Orders below ₹500 incur a flat ₹50 shipping fee.' },
  { q: 'How many days does delivery take?', a: 'Standard delivery takes 4–7 business days. Express delivery (available in select cities) takes 1–2 business days and charges apply.' },
  { q: 'Can I modify my order after placing it?', a: 'Order modifications are possible within 2 hours of placing the order. Contact our support team immediately via chat or email.' },
  { q: 'Are all Alimenture products 100% natural with no preservatives?', a: 'Absolutely. Every product we bake is free from maida, white sugar, refined oils, preservatives, and artificial additives. We use only ancient grains, palm jaggery, and pure cow butter.' },
  { q: 'What payment methods do you accept?', a: 'We accept UPI (GPay, PhonePe, Paytm), all major credit/debit cards, and net banking — all processed securely via Razorpay.' },
];

export default function Cart() {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart, addToCart, validateCartData } = useCart();
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    validateCartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Coupon state ──
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [couponData, setCouponData] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('appliedCoupon')) || null; } catch { return null; }
  });
  const [couponMsg, setCouponMsg] = useState('');

  const freeShippingThreshold = 500;
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 50;
  const discount = couponData?.discountAmount || 0;
  // Shipping is a checkout-time, PIN-code-resolved fee (see Cart's "Shipping charges
  // applied!" note) — never baked into the cart's displayed total.
  const total = Math.max(0, subtotal - discount);
  const remainingForFree = Math.max(0, freeShippingThreshold - subtotal);
  const progress = Math.min((subtotal / freeShippingThreshold) * 100, 100);
  const itemCount = cart.reduce((n, i) => n + i.quantity, 0);

  useEffect(() => {
    if (cart.length === 0) {
      setCouponData(null);
      sessionStorage.removeItem('appliedCoupon');
    }
  }, [cart.length]);

  const handleApplyCoupon = async () => {
    const token = localStorage.getItem('token');
    if (!token) { toast.error('Please login to apply a coupon'); navigate('/login'); return; }
    if (!couponCode.trim()) return;
    setCouponStatus('loading');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: couponCode.trim().toUpperCase(), orderValue: subtotal + shipping }),
      });
      const json = await res.json();
      if (json.success) {
        const applied = { ...json.coupon, discountAmount: json.discountAmount, finalAmount: json.finalAmount };
        setCouponData(applied);
        sessionStorage.setItem('appliedCoupon', JSON.stringify(applied));
        setCouponStatus('success');
        setCouponMsg(json.message || 'Coupon applied!');
        toast.success(`🎉 Coupon applied — ₹${json.discountAmount} off!`);
      } else {
        setCouponStatus('error');
        setCouponMsg(json.error || 'Invalid coupon');
      }
    } catch {
      setCouponStatus('error');
      setCouponMsg('Network error. Please try again.');
    }
  };

  const handleRemoveCoupon = () => {
    setCouponData(null);
    setCouponCode('');
    setCouponStatus(null);
    setCouponMsg('');
    sessionStorage.removeItem('appliedCoupon');
    toast.success('Coupon removed');
  };

  const [existingProducts, setExistingProducts] = useState([]);
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const json = await cachedFetch(`${import.meta.env.VITE_API_URL}/products`);
        const pData = json.data || json;
        if (Array.isArray(pData)) {
          const inCartIds = cart.map((item) => item.id || item._id);
          let filtered = pData.filter((p) => !inCartIds.includes(p.id || p._id));
          if (!filtered.length) filtered = pData;
          setExistingProducts([...filtered].sort(() => 0.5 - Math.random()).slice(0, 4));
        }
      } catch (e) { console.error(e); }
    };
    fetchCatalog();
  }, [cart]);

  const handleQuickAdd = (prod) => {
    const token = localStorage.getItem('token');
    if (!token) { toast.error('Please login to add to cart'); navigate('/login'); return; }
    const variant = prod.variants?.length > 0 ? prod.variants[0] : null;
    addToCart({ ...prod, price: variant ? variant.price : prod.price, selectedWeight: variant ? variant.weight : '150g', category: prod.category || 'Snack' });
    toast.success(`Added ${prod.name || prod.title}!`);
  };

  const goCheckout = () => {
    const token = localStorage.getItem('token');
    if (!token) { toast.error('Please login to checkout'); navigate('/login', { state: { from: '/checkout' } }); }
    else navigate('/checkout');
  };

  /* ─────────────────────────── EMPTY ─────────────────────────── */
  if (cart.length === 0) {
    return (
      <div className="relative min-h-screen font-sans text-ink flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}
          className="glass rounded-panel foil-top max-w-md w-full text-center px-8 py-16 relative z-10"
        >
          <span className="ico-chip h-16 w-16 rounded-2xl mx-auto mb-6">
            <ShoppingBag className="h-7 w-7" />
          </span>
          <h1 className="display-md text-2xl mb-2">Your cart is empty</h1>
          <p className="text-ink-soft text-sm mb-8">Add heritage grain products to start your wellness journey.</p>
          <button
            onClick={() => navigate('/shop')}
            className="btn-berry inline-flex items-center gap-2 h-12 px-8 rounded-full text-[11px] font-extrabold uppercase tracking-[0.16em]"
          >
            Explore products <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  /* ─────────────────────────── CART ─────────────────────────── */
  return (
    <div className="relative min-h-screen font-sans text-ink overflow-x-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-[1264px] py-24 relative z-10">

        {/* Header + steps */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-9"
        >
          <div className="flex flex-col gap-3.5">
            <h1 className="display-lg text-[2.6rem] sm:text-[3rem]">
              Your <span className="accent-text">cart</span>
            </h1>
            <span className="rule-berry" />
            <p className="text-ink-soft text-[15px] font-medium">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} · ready to dispatch from Chennai
            </p>
          </div>
          <CheckoutSteps current={1} className="self-start lg:self-auto" />
        </motion.div>

        {/* Free shipping progress */}
        {shipping > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
            className="glass rounded-card p-5 sm:px-6 flex items-center gap-4 sm:gap-6 mb-6"
          >
            <span className="ico-chip ico-chip-gold h-11 w-11 rounded-2xl shrink-0">
              <Truck className="h-5 w-5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink">
                You're <strong className="text-berry">₹{remainingForFree}</strong> away from free shipping
              </p>
              <div className="h-[7px] rounded-full bg-cream-deep mt-2.5 overflow-hidden">
                <motion.span
                  initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, ease: EASE }}
                  className="block h-full rounded-full bg-gradient-to-r from-berry to-gold-light"
                />
              </div>
            </div>
            <span className="pill-berry-soft shrink-0 inline-flex items-center h-[30px] px-3 rounded-full text-[10px] font-bold">
              ₹{subtotal} / ₹{freeShippingThreshold}
            </span>
          </motion.div>
        )}

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">

          {/* ── Items ── */}
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {cart.map((item) => {
                const id = item.id || item._id || item.uid;
                return (
                  <motion.div
                    key={id}
                    layout
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="glass rounded-card p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 sm:items-center"
                  >
                    <div className="w-full h-40 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-cream border border-hairline shrink-0 plate-berry">
                      <img
                        src={item.image || FallbackImg}
                        alt={item.name || item.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.category && <span className="kicker text-berry text-[9.5px]">{item.category}</span>}
                        <span className="pill-leaf inline-flex items-center h-[22px] px-2 rounded-full text-[9px] font-bold">In stock</span>
                      </div>
                      <Link to={`/product/${item.id || item._id}`}>
                        <p className="display-md text-lg leading-tight hover:text-berry transition-colors line-clamp-1">
                          {item.name || item.title}
                        </p>
                      </Link>
                      <p className="text-xs text-ink-muted">
                        {item.selectedWeight && <>Pack size <strong className="text-ink-soft">{item.selectedWeight}</strong> · </>}
                        ₹{item.price} each
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-normal sm:flex-col sm:items-end gap-4">
                      <div className="flex items-center gap-1 h-[42px] px-1.5 rounded-full glass-sm">
                        <button
                          onClick={() => updateQuantity(id, item.selectedWeight, -1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:text-berry transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" strokeWidth={2.6} />
                        </button>
                        <span className="display-md text-[15px] w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(id, item.selectedWeight, 1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-berry to-[#C21A75] text-white"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" strokeWidth={2.6} />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="display-md text-xl">₹{item.price * item.quantity}</p>
                        <p className="text-[10px] text-ink-muted mt-0.5">₹{item.price} × {item.quantity}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(id, item.selectedWeight)}
                      className="hidden sm:flex w-9 h-9 rounded-xl items-center justify-center text-ink-muted hover:text-danger border border-hairline transition-colors shrink-0"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            <div className="flex items-center justify-between px-1 pt-1">
              <button onClick={() => navigate('/shop')} className="kicker text-[10px] text-ink-soft hover:text-berry transition-colors inline-flex items-center gap-2">
                <ArrowLeft className="h-3.5 w-3.5" /> Continue shopping
              </button>
              <button onClick={() => clearCart()} className="kicker text-[10px] text-ink-muted hover:text-danger transition-colors">
                Clear cart
              </button>
            </div>
          </div>

          {/* ── Summary column ── */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-24 self-start">
            <div className="glass foil-top rounded-panel p-6 sm:p-7">
              <p className="kicker text-[10px] text-ink-soft mb-1.5">Order summary</p>

              <div className="divide-y divide-white/50">
                <div className="flex justify-between items-center py-3 text-sm">
                  <span className="text-ink-soft">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                  <span className="display-md text-[14.5px]">₹{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center py-3 text-sm">
                    <span className="text-ink-soft flex items-center gap-1.5">
                      <TicketPercent className="h-3.5 w-3.5" /> {couponData?.code}
                    </span>
                    <span className="display-md text-[14.5px] text-leaf">− ₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-3 text-sm">
                  <span className="text-ink-soft">Shipping</span>
                  {shipping === 0
                    ? <span className="pill-leaf inline-flex items-center h-6 px-2.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest">Free</span>
                    : <span className="pill-berry-soft inline-flex items-center h-6 px-2.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest">Shipping charges applied!</span>}
                </div>
                <div className="flex justify-between items-center py-3 text-sm">
                  <span className="text-ink-soft">Taxes</span>
                  <span className="text-[12px] font-display font-bold text-ink-muted">Included</span>
                </div>
              </div>

              <div className="h-px bg-white/50 my-2.5" />
              <div className="flex items-end justify-between pt-2 pb-5">
                <div>
                  <p className="kicker text-[9.5px] text-ink-soft">Total payable</p>
                  <p className="text-[11px] text-ink-muted mt-0.5">Inclusive of all taxes · shipping applied at checkout</p>
                </div>
                <p className="display-lg text-[2rem]">₹{total}</p>
              </div>

              <button
                onClick={goCheckout}
                className="btn-berry w-full h-[52px] rounded-full text-[11px] font-extrabold uppercase tracking-[0.14em] flex items-center justify-center gap-2.5"
              >
                Proceed to checkout <ArrowRight className="h-4 w-4" />
              </button>

              <div className="flex items-center justify-center gap-2 mt-4">
                <Lock className="h-3.5 w-3.5 text-leaf" />
                <p className="text-[11px] text-ink-muted">Secure payment via Razorpay · UPI, cards, netbanking</p>
              </div>
            </div>

            {/* Coupon */}
            <div className="glass rounded-card p-5 sm:p-6">
              <p className="kicker text-[10px] text-ink-soft mb-3">Have a coupon?</p>
              {!couponData ? (
                <>
                  <div className={`glass-sm flex items-center gap-2 h-12 px-4 rounded-2xl transition-all ${
                    couponStatus === 'error' ? 'border-danger/40' : 'focus-within:border-berry/50'
                  }`}>
                    <TicketPercent className={`h-4 w-4 shrink-0 ${couponStatus === 'error' ? 'text-danger/70' : 'text-ink-muted'}`} />
                    <input
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); if (couponStatus === 'error') setCouponStatus(null); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      placeholder="Enter coupon code"
                      disabled={couponStatus === 'loading'}
                      className="flex-1 bg-transparent outline-none text-[13px] font-display font-bold tracking-[0.06em] text-ink placeholder:text-ink-muted placeholder:font-sans placeholder:font-medium placeholder:tracking-normal"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={!couponCode.trim() || couponStatus === 'loading'}
                      className="kicker text-[10px] text-berry hover:opacity-70 disabled:opacity-40 transition-opacity shrink-0"
                    >
                      {couponStatus === 'loading' ? '…' : 'Apply'}
                    </button>
                  </div>
                  {couponStatus === 'error' && couponMsg && (
                    <p className="text-[11px] font-medium text-danger mt-2 pl-1">{couponMsg}</p>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="glass-sm flex-1 h-12 rounded-2xl flex items-center px-4 font-display font-extrabold text-[13px] tracking-[0.06em]">
                      {couponData.code}
                    </span>
                    <button onClick={handleRemoveCoupon} className="btn-glass h-12 px-4 rounded-2xl text-[10.5px] font-extrabold uppercase tracking-wider text-berry inline-flex items-center gap-1.5">
                      <X className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-3 px-3 py-2.5 rounded-xl bg-leaf/10 border border-leaf/20">
                    <CheckCircle2 className="h-4 w-4 text-leaf shrink-0" />
                    <p className="text-[12px] text-leaf">₹{discount} off applied to this order</p>
                  </div>
                </>
              )}
            </div>

            {/* Trust */}
            <div className="glass-sm rounded-card p-5 sm:p-6 flex flex-col gap-3.5">
              {[
                [ShieldCheck, 'FSSAI registered kitchen', 'Licensed food business operator', false],
                [RotateCcw, '3-day return window', 'On damaged or incorrect items', true],
              ].map(([Icon, title, sub, gold]) => (
                <div key={title} className="flex gap-3 items-center">
                  <span className={`ico-chip ${gold ? 'ico-chip-gold' : ''} h-9 w-9 rounded-xl shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="display-md text-[13.5px]">{title}</p>
                    <p className="text-[11px] text-ink-muted">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Cross sell ── */}
        {existingProducts.length > 0 && (
          <div className="mt-20">
            <div className="flex flex-col gap-3 mb-8">
              <div className="flex items-baseline gap-4">
                <span className="kicker text-berry">N&#8304; 01</span>
                <span className="kicker text-ink-soft">Frequently added together</span>
              </div>
              <h2 className="display-lg text-[2rem]">Add a little more <span className="accent-text">goodness</span></h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {existingProducts.map((prod) => {
                const variant = prod.variants?.length > 0 ? prod.variants[0] : null;
                const price = variant ? variant.price : prod.price;
                return (
                  <article key={prod.id || prod._id} className="glass rounded-card overflow-hidden group">
                    <div className="aspect-[4/3] overflow-hidden bg-cream plate-gold">
                      <img src={prod.image || FallbackImg} alt={prod.name || prod.title} loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-4 flex flex-col gap-1.5">
                      <p className="display-md text-[15px] line-clamp-1">{prod.name || prod.title}</p>
                      <p className="text-[11.5px] text-ink-muted line-clamp-1">{prod.category || 'Heritage grain'}</p>
                      <div className="flex items-center justify-between pt-1.5">
                        <span className="display-md text-[17px]">₹{price}</span>
                        <button onClick={() => handleQuickAdd(prod)} className="btn-glass h-9 px-4 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-berry">
                          Add
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* ── FAQ ── */}
        <div className="mt-20">
          <div className="text-center max-w-2xl mx-auto mb-10 flex flex-col items-center gap-3">
            <span className="pill-berry-soft inline-flex items-center h-7 px-4 rounded-full text-[9.5px] font-extrabold uppercase tracking-[0.18em]">Have questions?</span>
            <h2 className="display-lg text-[2rem]">Cart &amp; checkout FAQs</h2>
          </div>
          <div className="max-w-3xl mx-auto grid grid-cols-1 gap-3">
            {CART_FAQS.map((faq, i) => (
              <div key={i} className={`glass rounded-card overflow-hidden transition-all ${openFaq === i ? 'border-berry/25' : ''}`}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 sm:p-6 text-left gap-4">
                  <span className={`display-md text-[15px] leading-snug transition-colors ${openFaq === i ? 'text-berry' : ''}`}>{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-ink-muted shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-berry' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                      <div className="px-5 sm:px-6 pb-6 border-t border-white/50 pt-4">
                        <p className="text-ink-soft text-sm leading-relaxed">{faq.a}</p>
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
