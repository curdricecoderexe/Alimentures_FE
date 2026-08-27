import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Minus, ShoppingBag, Truck, ArrowLeft, Sparkles, ChevronDown, Shield, Star, Package, TicketPercent, X, CheckCircle2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { toast } from 'sonner';
import FallbackImg from '../../assets/lan.png';
import { cachedFetch } from '../../lib/api';

const CART_FAQS = [
  { q: 'Is free shipping available on all orders?', a: 'Yes! All orders above ₹500 qualify for free shipping anywhere in India. Orders below ₹500 incur a flat ₹50 shipping fee.' },
  { q: 'How many days does delivery take?', a: 'Standard delivery takes 4–7 business days. Express delivery (available in select cities) takes 1–2 business days and charges apply.' },
  { q: 'Can I modify my order after placing it?', a: 'Order modifications are possible within 2 hours of placing the order. Contact our support team immediately via chat or email.' },
  { q: 'Are all Alimenture products 100% natural with no preservatives?', a: 'Absolutely. Every product we bake is free from maida, white sugar, refined oils, preservatives, and artificial additives. We use only ancient grains, palm jaggery, and pure cow butter.' },
  { q: 'What payment methods do you accept?', a: 'We accept UPI (GPay, PhonePe, Paytm), all major credit/debit cards, net banking, and cash on delivery for orders above ₹300.' },
];

export default function Cart() {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, addToCart, validateCartData } = useCart();
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

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const freeShippingThreshold = 500;
  const shipping = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 50;
  const discount = couponData?.discountAmount || 0;
  const total = Math.max(0, subtotal + shipping - discount);
  const progress = Math.min((subtotal / freeShippingThreshold) * 100, 100);

  // Clear coupon when cart empties
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

  const getBenefitBadges = (item) => {
    const name = (item.name || item.title || '').toLowerCase();
    if (name.includes('red') || name.includes('ragi') || name.includes('bite')) return ['Ragi Base', '0% White Sugar'];
    if (name.includes('penta') || name.includes('five')) return ['5 Grainlets', 'Preservative Free'];
    if (name.includes('tri') || name.includes('grain')) return ['Ragi & Thinai', 'No Refined Oils'];
    return ['Palm Sugar Base', 'Toxin Free'];
  };

  const [existingProducts, setExistingProducts] = useState([]);
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const json = await cachedFetch(`${import.meta.env.VITE_API_URL}/products`);
        const pData = json.data || json;
        if (Array.isArray(pData)) {
          const inCartIds = cart.map(item => item.id || item._id);
          let filtered = pData.filter(p => !inCartIds.includes(p.id || p._id));
          if (!filtered.length) filtered = pData;
          setExistingProducts([...filtered].sort(() => 0.5 - Math.random()).slice(0, 3));
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

  return (
    <div className="min-h-screen bg-[#FDFBF7] relative overflow-x-hidden font-sans">
      <div className="absolute top-0 left-1/4 w-[700px] h-[400px] bg-[#920075]/4 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[350px] bg-[#D4AF37]/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-[1400px] py-24 relative z-10">

        {/* Back */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="mb-8 flex justify-center sm:justify-start">
          <button onClick={() => navigate('/')} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-600 text-xs font-semibold hover:border-[#920075]/40 hover:text-[#920075] transition-all shadow-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Continue Shopping
          </button>
        </motion.div>

        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="mb-12 text-center sm:text-left flex flex-col items-center sm:items-start">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-[#920075] mb-2 justify-center sm:justify-start">
            <ShoppingBag className="h-3.5 w-3.5" /> Shopping Bag
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-black text-[#0a0806] tracking-tight text-center sm:text-left">
            Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#920075] to-[#D4AF37]">Cart</span>
          </h1>
          <div className="h-px bg-gradient-to-r from-[#920075]/20 via-[#D4AF37]/30 to-transparent mt-8 w-full" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* ─── Left: Cart items ─── */}
          <div className="lg:col-span-8 space-y-5">
            <AnimatePresence mode="popLayout">
              {cart.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <div className="w-20 h-20 bg-[#920075]/5 border border-[#920075]/10 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="h-9 w-9 text-[#920075]/40" />
                  </div>
                  <h2 className="text-2xl font-display font-black text-[#0a0806] mb-2">Your Cart is Empty</h2>
                  <p className="text-gray-500 text-sm max-w-sm text-center mb-8">Add heritage grain products to start your wellness journey.</p>
                  <button onClick={() => navigate('/')}
                    className="px-8 h-12 rounded-xl bg-[#920075] text-white font-black uppercase text-[10px] tracking-[0.2em] hover:bg-[#7a0062] transition-colors shadow-[0_4px_14px_rgba(146,0,117,0.25)]">
                    Explore Products
                  </button>
                </motion.div>
              ) : (
                <>
                  {/* Free shipping tracker */}
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Truck className="h-4 w-4 text-[#920075]" />
                        {subtotal >= freeShippingThreshold
                          ? <span className="text-emerald-600 font-black">🎉 Free shipping unlocked!</span>
                          : <span>Add <span className="text-[#920075] font-black">₹{freeShippingThreshold - subtotal}</span> more for free shipping</span>}
                      </div>
                      <span className="text-[10px] font-black text-[#920075] bg-[#920075]/8 px-2.5 py-1 rounded-full">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full bg-gradient-to-r from-[#920075] to-[#D4AF37]" />
                    </div>
                  </motion.div>

                  {/* Cart item rows */}
                  {cart.map((item) => {
                    const id = item.id || item._id || item.uid;
                    return (
                      <motion.div key={id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.4 }}>
                        <div className="group bg-white border border-gray-100 rounded-[1.75rem] shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_36px_rgba(146,0,117,0.08)] hover:border-[#920075]/15 transition-all duration-400 overflow-hidden">
                          {/* Top accent line */}
                          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#920075]/20 to-transparent" />
                          <div className="p-5 sm:p-6 flex gap-5">
                            {/* Image */}
                            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0 relative">
                              <img src={item.image || FallbackImg} alt={item.name || item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy" />
                              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#D4AF37] text-white font-black uppercase text-[7px] tracking-wider">Original</span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                              <div className="space-y-1.5">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    {item.category && <span className="text-[8px] font-bold uppercase tracking-widest text-[#920075] bg-[#920075]/8 px-2 py-0.5 rounded-full">{item.category}</span>}
                                    <Link to={`/product/${item.id || item._id}`}>
                                      <h3 className="font-display font-black text-[#0a0806] text-lg leading-tight hover:text-[#920075] transition-colors mt-1 line-clamp-1">{item.name || item.title}</h3>
                                    </Link>
                                    {item.selectedWeight && <p className="text-gray-400 text-[10px] font-semibold mt-0.5">{item.selectedWeight}</p>}
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
                                    <p className="text-xl font-black text-[#920075]">₹{item.price * item.quantity}</p>
                                    <p className="text-[9px] text-gray-400 mt-0.5">₹{item.price} each</p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {getBenefitBadges(item).map((b, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded bg-gray-50 border border-gray-200/80 text-[9px] font-semibold text-gray-500">{b}</span>
                                  ))}
                                </div>
                              </div>

                              {/* Qty + Remove */}
                              <div className="flex items-center gap-4 mt-3">
                                <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                                  <button onClick={() => updateQuantity(id, item.selectedWeight, -1)}
                                    className="w-9 h-9 flex items-center justify-center hover:bg-white hover:text-[#920075] transition-colors text-gray-500">
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="w-9 text-center text-sm font-black text-[#0a0806]">{item.quantity}</span>
                                  <button onClick={() => updateQuantity(id, item.selectedWeight, 1)}
                                    className="w-9 h-9 flex items-center justify-center hover:bg-white hover:text-[#920075] transition-colors text-gray-500">
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                                <button onClick={() => removeFromCart(id, item.selectedWeight)}
                                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-red-500 transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" /> Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </>
              )}
            </AnimatePresence>
          </div>

          {/* ─── Right: Order summary ─── */}
          <div className="lg:col-span-4">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="sticky top-8">
              <div className="bg-white border border-gray-100 rounded-[2rem] shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden">
                {/* Header accent */}
                <div className="h-1 bg-gradient-to-r from-[#920075] via-[#D4AF37] to-[#F59E0B]" />
                <div className="p-7 space-y-6">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#920075] bg-[#920075]/8 px-3 py-1 rounded-full">
                      <Sparkles className="h-3 w-3" /> Order Summary
                    </span>
                    <h2 className="font-display font-black text-2xl text-[#0a0806]">Checkout</h2>
                  </div>

                  {/* Line items */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span className="font-medium">Subtotal ({cart.length} item{cart.length !== 1 ? 's' : ''})</span>
                      <span className="font-black text-[#0a0806]">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span className="font-medium">Packaging</span>
                      <span className="text-emerald-600 font-black text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">FREE</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span className="font-medium">Shipping</span>
                      {shipping === 0
                        ? <span className="text-emerald-600 font-black text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">FREE</span>
                        : <span className="font-black text-[#0a0806]">₹{shipping}</span>}
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span className="font-medium flex items-center gap-1.5">
                          <TicketPercent className="h-3.5 w-3.5" />
                          Coupon ({couponData?.code})
                        </span>
                        <span className="font-black">– ₹{discount}</span>
                      </div>
                    )}
                  </div>

                  {/* Coupon input */}
                  {!couponData ? (
                    <div className="space-y-2">
                      <div className={`flex items-center gap-2 rounded-xl border bg-gray-50 px-3 py-1 transition-all ${
                        couponStatus === 'error' ? 'border-red-300 bg-red-50/40' : 'border-gray-200 focus-within:border-[#920075]/40'
                      }`}>
                        <TicketPercent className={`h-4 w-4 shrink-0 ${couponStatus === 'error' ? 'text-red-400' : 'text-gray-300'}`} />
                        <input
                          id="cart-coupon-input"
                          type="text"
                          value={couponCode}
                          onChange={e => { setCouponCode(e.target.value.toUpperCase()); if (couponStatus === 'error') setCouponStatus(null); }}
                          onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                          placeholder="Enter coupon code"
                          className="flex-1 bg-transparent text-xs font-semibold text-gray-700 placeholder:text-gray-300 outline-none py-2"
                          disabled={couponStatus === 'loading'}
                        />
                        <button
                          id="cart-apply-coupon-btn"
                          onClick={handleApplyCoupon}
                          disabled={!couponCode.trim() || couponStatus === 'loading'}
                          className="text-[10px] font-black uppercase tracking-wider text-[#920075] hover:text-[#7a0062] disabled:opacity-40 transition-colors py-2 px-1 shrink-0"
                        >
                          {couponStatus === 'loading' ? '...' : 'Apply'}
                        </button>
                      </div>
                      {couponStatus === 'error' && couponMsg && (
                        <p className="text-[10px] font-semibold text-red-500 pl-1">{couponMsg}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <div>
                          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">{couponData.code}</p>
                          <p className="text-[9px] text-emerald-600">{couponMsg || `₹${discount} saved`}</p>
                        </div>
                      </div>
                      <button id="cart-remove-coupon-btn" onClick={handleRemoveCoupon} className="text-emerald-500 hover:text-red-500 transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Total */}
                  <div className="border-t border-gray-100 pt-5 flex justify-between items-end">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Order Total</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">GST & Taxes Included</p>
                    </div>
                    <div className="text-right">
                      {discount > 0 && <p className="text-xs text-gray-400 line-through font-semibold">₹{subtotal + shipping}</p>}
                      <p className="text-4xl font-black text-[#920075]">₹{total}</p>
                    </div>
                  </div>

                  {/* Trust badges */}
                  <div className="flex items-center justify-center gap-4">
                    {[{ icon: Shield, text: 'Secure Pay' }, { icon: Star, text: '4.9 Rating' }, { icon: Package, text: 'Safe Pack' }].map(({ icon: Icon, text }, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <Icon className="h-4 w-4 text-gray-300" />
                        <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400">{text}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <button
                    disabled={cart.length === 0}
                    onClick={() => {
                      const token = localStorage.getItem('token');
                      if (!token) { toast.error('Please login to checkout'); navigate('/login', { state: { from: '/checkout' } }); }
                      else navigate('/checkout');
                    }}
                    className="w-full h-14 rounded-xl bg-[#920075] text-white font-black uppercase text-[10px] tracking-[0.2em] hover:bg-[#7a0062] transition-colors shadow-[0_8px_24px_rgba(146,0,117,0.3)] hover:shadow-[0_12px_32px_rgba(146,0,117,0.4)] disabled:opacity-50 disabled:pointer-events-none">
                    Proceed to Checkout
                  </button>
                  <p className="text-[9px] text-center text-gray-400 font-semibold">🔒 256-bit SSL Encrypted Checkout</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* You May Also Like */}
        {existingProducts.length > 0 && (
          <div className="mt-24 border-t border-gray-200/50 pt-16">
            <div className="flex items-end justify-between mb-10">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">Complete Your Order</span>
                <h2 className="font-display text-3xl sm:text-4xl font-black text-[#0a0806]">You May Also Like</h2>
              </div>
              <Link to="/#products" className="hidden sm:flex items-center gap-1.5 text-xs font-black text-[#920075] uppercase tracking-wider hover:underline">View All</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {existingProducts.map((prod) => {
                const variant = prod.variants?.length > 0 ? prod.variants[0] : null;
                const price = variant ? variant.price : prod.price;
                return (
                  <div key={prod.id || prod._id} className="group bg-white border border-gray-100 rounded-[1.75rem] overflow-hidden hover:border-[#920075]/20 hover:shadow-[0_16px_40px_rgba(146,0,117,0.08)] hover:-translate-y-1 transition-all duration-400">
                    <div className="aspect-[3/2] overflow-hidden bg-gray-50">
                      <img src={prod.image || FallbackImg} alt={prod.name || prod.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    </div>
                    <div className="p-5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400">{prod.category}</p>
                        <h4 className="font-display font-black text-[#0a0806] text-base leading-snug truncate group-hover:text-[#920075] transition-colors">{prod.name || prod.title}</h4>
                        <p className="text-[#920075] font-black text-lg mt-0.5">₹{price}</p>
                      </div>
                      <button onClick={() => handleQuickAdd(prod)}
                        className="shrink-0 h-9 px-4 rounded-xl border border-[#920075] text-[#920075] text-[9px] font-black uppercase tracking-wider hover:bg-[#920075] hover:text-white transition-all">
                        Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="mt-24 border-t border-gray-200/50 pt-16 mb-16">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37] bg-[#D4AF37]/8 border border-[#D4AF37]/15 px-5 py-2 rounded-full inline-block">Have Questions?</span>
            <h2 className="font-display text-3xl sm:text-4xl font-black text-[#0a0806] tracking-tight">Cart & Checkout FAQs</h2>
          </div>
          <div className="max-w-3xl mx-auto grid grid-cols-1 gap-3">
            {CART_FAQS.map((faq, i) => (
              <div key={i} className={`rounded-2xl border bg-white transition-all duration-300 overflow-hidden ${openFaq === i ? 'border-[#920075]/25 shadow-[0_8px_30px_rgba(146,0,117,0.07)]' : 'border-gray-100 shadow-sm hover:border-gray-200'}`}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-6 text-left gap-4">
                  <span className={`font-display font-black text-base leading-snug transition-colors ${openFaq === i ? 'text-[#920075]' : 'text-[#0a0806]'}`}>{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-[#920075]' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                      <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                        <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
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