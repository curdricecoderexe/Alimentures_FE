import { useState, useEffect } from 'react';
import {
  Trash2, Plus, Minus, Truck, ArrowLeft, ArrowRight,
  ShieldCheck, RotateCcw, Lock, TicketPercent, X, CheckCircle2,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { toast } from 'sonner';
import { useWelcomeCoupon } from '../../lib/welcomeCoupon';
import { cachedFetch } from '../../lib/api';
import CheckoutSteps from '../../components/ui/CheckoutSteps';
import ProductCard, { ProductImageFrame } from '../../components/ui/ProductCard';
import { useDeliverySummary } from '../../lib/delivery';
import { productPath } from '../../lib/seo';
import SEO from '../../components/SEO';
import { ShopHero, ShopSectionHead, FaqList, CARD, LABEL } from '../../components/shop/ShopSections';

const EASE = [0.16, 1, 0.3, 1];

// The shipping answer is built from Admin → PIN Code Delivery (see shippingFaq).
const CART_FAQS = [
  { q: 'How many days does delivery take?', a: 'We ship through Shiprocket and its courier partners. Orders are dispatched within 1–2 working days and usually arrive 2–7 working days after that — the estimate for your PIN code is shown at checkout.' },
  { q: 'Can I modify my order after placing it?', a: 'The delivery address can be changed only before a courier is assigned. Contact our support team immediately via chat or email with your order number.' },
  { q: 'Are all Alimenture products 100% natural with no preservatives?', a: 'Absolutely. Every product we bake is free from maida, white sugar, refined oils, preservatives, and artificial additives. We use only ancient grains, palm jaggery, and pure cow butter.' },
  { q: 'What payment methods do you accept?', a: 'We accept UPI (GPay, PhonePe, Paytm), all major credit/debit cards, and net banking — all processed securely via Razorpay.' },
];

export default function Cart() {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart, addToCart, validateCartData } = useCart();

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
  const welcomeCoupon = useWelcomeCoupon();

  const delivery = useDeliverySummary();
  const freeEnabled = delivery.freeDeliveryEnabled;
  const freeShippingThreshold = delivery.freeDeliveryThreshold;
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const fromFee = delivery.minDeliveryFee ?? delivery.defaultDeliveryFee;
  const shipping = subtotal === 0 || (freeEnabled && subtotal >= freeShippingThreshold) ? 0 : fromFee;
  const discount = couponData?.discountAmount || 0;
  // Shipping is a checkout-time, PIN-code-resolved fee (see Cart's "Shipping charges
  // applied!" note) — never baked into the cart's displayed total.
  const total = Math.max(0, subtotal - discount);
  const remainingForFree = Math.max(0, freeShippingThreshold - subtotal);
  const progress = freeShippingThreshold > 0 ? Math.min((subtotal / freeShippingThreshold) * 100, 100) : 100;
  const shippingFaq = {
    q: freeEnabled ? 'Is free shipping available on all orders?' : 'How much is delivery?',
    a: freeEnabled
      ? `Yes! Orders of ₹${freeShippingThreshold} or more ship free. Below that, a standard delivery fee applies — the exact charge for your PIN code is shown at checkout.`
      : `Delivery is charged at our courier partner's rate for your parcel's weight and PIN code, starting from ₹${fromFee}. The exact charge is shown at checkout before you pay.`,
  };
  const faqs = [shippingFaq, ...CART_FAQS];
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
      <div className="relative min-h-screen bg-cream font-sans text-ink overflow-x-hidden">
        <SEO title="Your cart" noindex />
        <ShopHero
          eyebrow="Your cart"
          title={<>Your cart is <em>empty</em></>}
          text="Add a few heritage grain bakes and pantry staples to start your wellness journey."
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            <Link to="/shop" className="btn-pill">Explore products <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/wishlist" className="btn-outline">View wishlist</Link>
          </motion.div>
        </ShopHero>
      </div>
    );
  }

  /* ─────────────────────────── CART ─────────────────────────── */
  return (
    <div className="relative min-h-screen bg-cream font-sans text-ink overflow-x-hidden">
      <SEO title="Your cart" noindex />

      <ShopHero
        eyebrow="Your cart"
        title={<>Your <em>cart</em></>}
        text={`${itemCount} ${itemCount === 1 ? 'item' : 'items'} · ready to dispatch from Chennai`}
        aside={<CheckoutSteps current={1} className="self-start lg:self-auto lg:mb-2" />}
      />

      <section className="relative z-10 bg-cream pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="mx-auto max-w-[1240px] lg:px-2">

          {/* Free shipping progress */}
          {freeEnabled && shipping > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
              className={`${CARD} p-5 sm:px-6 flex items-center gap-4 sm:gap-6 mb-6`}
            >
              <span className="h-11 w-11 rounded-full bg-gold-tint text-gold flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] text-ink">
                  You're <strong className="font-semibold text-berry">₹{remainingForFree}</strong> away from free shipping
                </p>
                <div className="h-1.5 rounded-full bg-cream-deep mt-2.5 overflow-hidden">
                  <motion.span
                    initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, ease: EASE }}
                    className="block h-full rounded-full bg-brand"
                  />
                </div>
              </div>
              <span className="hidden sm:inline text-[13px] font-medium text-ink-muted shrink-0">
                ₹{subtotal} / ₹{freeShippingThreshold}
              </span>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8">

            {/* ── Items ── */}
            <div className="flex flex-col">
              <div className={`${CARD} px-4 sm:px-6`}>
                <ul className="divide-y divide-ink/10">
                  <AnimatePresence initial={false} mode="popLayout">
                    {cart.map((item) => {
                      const id = item.id || item._id || item.uid;
                      const name = item.name || item.title;
                      return (
                        <motion.li
                          key={`${id}-${item.selectedWeight ?? ''}`}
                          layout
                          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                          transition={{ duration: 0.4, ease: EASE }}
                          className="relative flex gap-4 sm:gap-5 py-5 sm:py-6"
                        >
                          <Link to={productPath(item)} className="group shrink-0 w-24 sm:w-32 rounded-[16px] overflow-hidden" aria-label={name}>
                            <ProductImageFrame src={item.image} alt={name} aspect="aspect-[4/3]" />
                          </Link>

                          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                            <div className="flex-1 min-w-0 pr-8 sm:pr-0">
                              <span className={`${LABEL} truncate block`}>{item.category || 'Heritage grain'}</span>
                              <Link to={productPath(item)}>
                                <p className="mt-1 text-[15.5px] sm:text-[17px] font-semibold leading-snug text-[#3D3A3C] hover:text-berry transition-colors line-clamp-2">
                                  {name}
                                </p>
                              </Link>
                              <p className="mt-1 text-[13px] text-ink-muted">
                                {item.selectedWeight && <>{item.selectedWeight} · </>}₹{item.price} each
                              </p>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-5 sm:gap-8">
                              <div className="flex items-center h-10 rounded-full border border-ink/15 bg-white">
                                <button
                                  type="button"
                                  onClick={() => item.quantity <= 1
                                    ? removeFromCart(id, item.selectedWeight)
                                    : updateQuantity(id, item.selectedWeight, -1)}
                                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${item.quantity <= 1 ? 'text-ink-muted hover:text-danger' : 'text-ink-soft hover:text-berry'}`}
                                  aria-label={item.quantity <= 1 ? 'Remove item' : 'Decrease quantity'}
                                >
                                  {item.quantity <= 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                                </button>
                                <span className="font-display text-[15px] w-6 text-center tabular-nums">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(id, item.selectedWeight, 1)}
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-ink-soft hover:text-berry transition-colors"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              <p className="text-[17px] sm:text-[19px] font-bold text-ink tracking-tight min-w-[4.5rem] text-right">
                                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(id, item.selectedWeight)}
                            className="absolute top-5 right-0 sm:static sm:self-center h-8 w-8 rounded-full flex items-center justify-center text-ink-muted hover:text-danger hover:bg-cream transition-colors shrink-0"
                            aria-label={`Remove ${name}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              </div>

              <div className="flex items-center justify-between mt-6 px-1">
                <Link to="/shop" className="link-arrow">
                  <ArrowLeft className="h-4 w-4" /> Continue shopping
                </Link>
                <button type="button" onClick={() => clearCart()} className="text-[13px] font-medium text-ink-muted hover:text-danger transition-colors">
                  Clear cart
                </button>
              </div>
            </div>

            {/* ── Summary column ── */}
            <div className="flex flex-col gap-4 lg:sticky lg:top-28 self-start w-full">
              <div className={`${CARD} p-6 sm:p-7`}>
                <h2 className="headline text-[1.75rem]">Order summary</h2>

                <dl className="mt-4 divide-y divide-ink/10 text-[14.5px]">
                  <div className="flex justify-between items-center py-3">
                    <dt className="text-ink-soft">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</dt>
                    <dd className="font-semibold text-ink">₹{subtotal.toLocaleString('en-IN')}</dd>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center py-3">
                      <dt className="text-ink-soft flex items-center gap-1.5">
                        <TicketPercent className="h-3.5 w-3.5" /> {couponData?.code}
                      </dt>
                      <dd className="font-semibold text-leaf">− ₹{discount}</dd>
                    </div>
                  )}
                  <div className="flex justify-between items-center gap-3 py-3">
                    <dt className="text-ink-soft">Shipping</dt>
                    {shipping === 0
                      ? <dd className="font-semibold text-leaf">Free</dd>
                      : <dd className="text-[13px] text-ink-muted text-right">Calculated at checkout</dd>}
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <dt className="text-ink-soft">Taxes</dt>
                    <dd className="text-[13px] text-ink-muted">Included</dd>
                  </div>
                </dl>

                <div className="flex items-end justify-between gap-4 border-t border-ink/15 pt-4 pb-6">
                  <div>
                    <p className="font-display text-[15px] text-ink">Total</p>
                    <p className="text-[12px] text-ink-muted mt-0.5">Inclusive of all taxes</p>
                  </div>
                  <p className="headline text-[2.4rem] leading-none">₹{total.toLocaleString('en-IN')}</p>
                </div>

                <button type="button" onClick={goCheckout} className="btn-pill w-full">
                  Proceed to checkout <ArrowRight className="h-4 w-4" />
                </button>

                <p className="flex items-center justify-center gap-2 mt-4 text-[12px] text-ink-muted">
                  <Lock className="h-3.5 w-3.5 text-leaf" /> Secure payment via Razorpay · UPI, cards, netbanking
                </p>
              </div>

              {/* Coupon */}
              <div className={`${CARD} p-5 sm:p-6`}>
                <p className="font-display text-[15px] text-ink mb-3">Have a coupon?</p>
                {welcomeCoupon && !couponData && (
                  <button
                    type="button"
                    onClick={() => { setCouponCode(welcomeCoupon.code); setCouponStatus(null); }}
                    className="mb-3 w-full flex items-center justify-between gap-3 rounded-xl border border-dashed border-berry/35 bg-berry-tint/50 px-3.5 py-2.5 text-left"
                  >
                    <span className="text-[12.5px] text-ink-soft">
                      <span className="block text-[10.5px] font-display uppercase tracking-[0.14em] text-berry">Suggested for you</span>
                      <span className="font-display font-semibold text-ink tracking-wide">{welcomeCoupon.code}</span> · {welcomeCoupon.discountValue}% off your first order
                    </span>
                    <span className="text-[12px] font-display font-medium text-berry shrink-0">Use code</span>
                  </button>
                )}
                {!couponData ? (
                  <>
                    <div className={`flex items-center gap-2 h-12 pl-4 pr-1.5 rounded-full border bg-white transition-colors ${
                      couponStatus === 'error' ? 'border-danger/50' : 'border-ink/15 focus-within:border-berry/60'
                    }`}>
                      <TicketPercent className={`h-4 w-4 shrink-0 ${couponStatus === 'error' ? 'text-danger/70' : 'text-ink-muted'}`} />
                      <input
                        value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); if (couponStatus === 'error') setCouponStatus(null); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        placeholder="Enter coupon code"
                        aria-label="Coupon code"
                        disabled={couponStatus === 'loading'}
                        className="flex-1 min-w-0 bg-transparent outline-none text-[14px] font-semibold tracking-[0.06em] text-ink placeholder:text-ink-muted placeholder:font-normal placeholder:tracking-normal"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={!couponCode.trim() || couponStatus === 'loading'}
                        className="btn-pill btn-pill-sm disabled:opacity-40 disabled:pointer-events-none shrink-0"
                      >
                        {couponStatus === 'loading' ? '…' : 'Apply'}
                      </button>
                    </div>
                    {couponStatus === 'error' && couponMsg && (
                      <p className="text-[12px] text-danger mt-2 pl-4">{couponMsg}</p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-[16px] bg-leaf/10">
                    <CheckCircle2 className="h-4 w-4 text-leaf shrink-0" />
                    <p className="flex-1 min-w-0 text-[13.5px] text-ink">
                      <strong className="font-semibold tracking-[0.04em]">{couponData.code}</strong>
                      <span className="text-leaf"> · ₹{discount} off</span>
                    </p>
                    <button type="button" onClick={handleRemoveCoupon} className="text-[13px] font-medium text-ink-soft hover:text-danger transition-colors">
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Trust */}
              <div className="flex flex-col gap-4 px-2 pt-2">
                {[
                  [ShieldCheck, 'FSSAI registered kitchen', 'Licensed food business operator'],
                  [RotateCcw, '3-day return window', 'On damaged or incorrect items'],
                ].map(([Icon, title, sub]) => (
                  <div key={title} className="flex gap-3 items-center">
                    <span className="h-9 w-9 rounded-full bg-berry-tint text-berry flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-display text-[14.5px] text-ink">{title}</p>
                      <p className="text-[12px] text-ink-muted">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cross sell ── */}
      {existingProducts.length > 0 && (
        <section className="relative z-10 bg-cream border-t border-ink/10 py-16 sm:py-24 px-4 sm:px-6">
          <div className="mx-auto max-w-[1240px] lg:px-2">
            <ShopSectionHead
              eyebrow="Frequently added together"
              title={<>Add a little more <em>goodness</em></>}
              action={<Link to="/shop" className="btn-outline self-start sm:self-auto">View all <ArrowRight className="h-4 w-4" /></Link>}
            />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {existingProducts.map((prod) => (
                <ProductCard key={prod.id || prod._id} product={prod} onAdd={handleQuickAdd} />
              ))}
            </div>
          </div>
        </section>
      )}

      <FaqList title={<>Cart &amp; checkout <em>FAQs</em></>} faqs={faqs} />
    </div>
  );
}
