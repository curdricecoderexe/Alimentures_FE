import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  User, MapPin, Truck, CreditCard, Zap, Wallet, Lock, RotateCcw,
  ArrowLeft, ShieldCheck, TicketPercent, Check, X, Loader2, Rocket,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { authenticatedFetch, API_BASE } from '../../lib/api';
import FallbackImg from '../../assets/lan.png';
import CheckoutSteps from '../../components/ui/CheckoutSteps';
import SearchableSelect from '../../components/ui/SearchableSelect';
import { INDIA_STATES } from '../../data/indiaStates';
import { getCities, getDeliveryOptions, isValidPincode } from '../../lib/deliveryApi';

const EASE = [0.16, 1, 0.3, 1];

const loadRazorpay = () =>
  new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } };

function Field({ label, name, value, onChange, placeholder, full, type = 'text' }) {
  return (
    <label className={full ? 'sm:col-span-2 block' : 'block'}>
      <span className="kicker text-[9.5px] text-ink-soft mb-1.5 block">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full h-[52px] px-4 rounded-2xl bg-white border border-hairline outline-none text-[14px] font-medium placeholder:text-ink-muted transition-all focus:border-berry/50 focus:ring-4 focus:ring-berry/10"
      />
    </label>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, clearCart, validateCartData } = useCart();
  const userEmail = localStorage.getItem('userEmail') || 'guest';
  const [loading, setLoading] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(null);

  React.useEffect(() => {
    validateCartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [appliedCoupon] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('appliedCoupon')) || null; } catch { return null; }
  });

  const [formData, setFormData] = useState(() => {
    const savedAddress = localStorage.getItem(`shippingAddress_${userEmail}`);
    const base = {
      firstName: '', lastName: '', phone: '', address: '', city: '', pincode: '', state: '',
      coords: null, paymentMethod: 'razorpay',
    };
    if (savedAddress) {
      try { return { ...base, ...JSON.parse(savedAddress) }; } catch { return base; }
    }
    return base;
  });

  const handleGeolocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation is not supported by your browser'); return; }
    const toastId = toast.loading('Fetching your exact location…');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          coords: { lat: latitude, lng: longitude },
          address: prev.address || `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
        }));
        toast.success('Location pinned for fast delivery!', { id: toastId });
      },
      () => toast.error('Unable to retrieve location. Please enter manually.', { id: toastId }),
    );
  };

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discount = appliedCoupon?.discountAmount || 0;
  const itemCount = cart.reduce((n, i) => n + i.quantity, 0);

  const persist = useCallback((next) => {
    setFormData(next);
    const { paymentMethod: _pm, ...addressOnly } = next;
    localStorage.setItem(`shippingAddress_${userEmail}`, JSON.stringify(addressOnly));
  }, [userEmail]);

  const handleInputChange = (e) => {
    let v = e.target.value;
    if (e.target.name === 'pincode') v = v.replace(/\D/g, '').slice(0, 6);
    persist({ ...formData, [e.target.name]: v });
    setSelectedAddrId(null);
  };

  // ── Saved addresses (from the account) ──────────────────────────────────
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddrId, setSelectedAddrId] = useState(null);

  const applyAddress = useCallback((a) => {
    const parts = (a.fullName || '').trim().split(/\s+/);
    persist({
      ...formData,
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' '),
      phone: a.phone || '',
      address: a.street || '',
      city: a.city || '',
      state: a.state || '',
      pincode: (a.pincode || '').replace(/\D/g, '').slice(0, 6),
    });
    setSelectedAddrId(a.id);
  }, [formData, persist]);

  useEffect(() => {
    let alive = true;
    (async () => {
      // Soft fetch — the picker is a convenience, so a dead token just means
      // "no saved addresses" here rather than bouncing the user to /login.
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/addresses`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok || !alive) return;
        const json = await res.json();
        if (!json?.success || !Array.isArray(json.data)) return;
        const sorted = [...json.data].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
        setSavedAddresses(sorted);
        // Prefill from the default address only if the form is still blank.
        const def = sorted.find((a) => a.isDefault) || sorted[0];
        if (def && !formData.address && !formData.state) applyAddress(def);
      } catch { /* stay on the manual form */ }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── India state → city dependency ──
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);

  useEffect(() => {
    const st = formData.state;
    if (!st) { setCities([]); return; }
    let alive = true;
    setCitiesLoading(true);
    getCities(st).then((list) => {
      if (!alive) return;
      setCities(list);
      setCitiesLoading(false);
      // drop a city that doesn't belong to the (newly) selected state
      if (formData.city && !list.some((c) => c.toLowerCase() === formData.city.toLowerCase())) {
        setFormData((p) => ({ ...p, city: '' }));
      }
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.state]);

  // ── PIN-code → delivery options (debounced; frontend value is only an estimate) ──
  const [deliveryOpts, setDeliveryOpts] = useState(null);
  const [deliveryChecking, setDeliveryChecking] = useState(false);
  const [deliveryErr, setDeliveryErr] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('standard');

  useEffect(() => {
    const pin = formData.pincode;
    if (!isValidPincode(pin)) { setDeliveryOpts(null); setDeliveryErr(''); return; }
    let alive = true;
    setDeliveryChecking(true);
    const t = setTimeout(async () => {
      const r = await getDeliveryOptions(pin, subtotal);
      if (!alive) return;
      setDeliveryChecking(false);
      if (r.ok) {
        setDeliveryOpts(r.data);
        setDeliveryErr('');
        if (deliveryMethod === 'fastest' && !r.data.fastest?.available) setDeliveryMethod('standard');
      } else {
        setDeliveryOpts(null);
        setDeliveryErr(r.error || 'Could not check delivery');
      }
    }, 350);
    return () => { alive = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.pincode, subtotal]);

  // Resolved (or estimated) delivery fee for the chosen method.
  let resolvedFee;
  let feeIsEstimate = false;
  if (deliveryOpts && deliveryOpts.deliveryAvailable) {
    if (deliveryMethod === 'fastest' && deliveryOpts.fastest?.available) resolvedFee = deliveryOpts.fastest.fee;
    else resolvedFee = deliveryOpts.standard.fee;
  } else {
    resolvedFee = subtotal > 500 || subtotal === 0 ? 0 : 50; // pre-check estimate
    feeIsEstimate = true;
  }
  const shipping = resolvedFee;
  const total = Math.max(0, subtotal + shipping - discount);

  const handlePlaceOrder = async () => {
    if (!formData.firstName || !formData.address || !formData.city || !formData.state) {
      toast.error('Please fill in your name, address, state and city');
      return;
    }
    if (!isValidPincode(formData.pincode)) {
      toast.error('Please enter a valid 6-digit PIN code');
      return;
    }
    if (deliveryOpts && !deliveryOpts.deliveryAvailable) {
      toast.error(deliveryOpts.reason || 'Delivery is unavailable for this PIN code');
      return;
    }
    if (deliveryChecking) {
      toast.error('Please wait — checking delivery for your PIN code');
      return;
    }
    const rzpLoaded = await loadRazorpay();
    if (!rzpLoaded) { toast.error('Razorpay SDK failed to load. Are you online?'); return; }

    setLoading(true);
    setCheckoutStep('creating');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    try {
      const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString();
      const response = await authenticatedFetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({
          items: cart.map((it) => ({
            productId: it.id || it._id || it.uid,
            name: it.name || it.title,
            price: it.price,
            quantity: it.quantity,
            image: it.image,
            category: it.category || 'Biscuit',
            selectedWeight: it.selectedWeight || '',
          })),
          totalAmount: total, // display only — server recomputes authoritatively
          discountAmount: discount || 0,
          couponId: appliedCoupon?.id || null,
          couponCode: appliedCoupon?.code || null,
          deliveryMethod,
          customerInfo: { ...formData, email: localStorage.getItem('userEmail') || 'unknown_user@alimenture.com' },
        }),
      });

      if (!response) { setLoading(false); setCheckoutStep(null); return; }
      const data = await response.json();

      if (data.success) {
        setCheckoutStep('opening');

        // The pending order already reserved the stock for this checkout.
        // If the customer backs out or the payment fails, release that
        // reservation immediately instead of leaving it locked until the
        // ~10 minute reservation window (and cleanup cron) catch up — that
        // gap is exactly what makes a 1-in-stock item look "in stock" to
        // the next shopper while checkout still rejects it.
        let paymentCompleted = false;
        const releaseAbandonedReservation = async () => {
          if (paymentCompleted) return;
          try {
            await authenticatedFetch(`${API_URL}/orders/${data.orderId}/abandon-payment`, { method: 'PUT' });
          } catch {
            // best-effort — the reservation-expiry cleanup still catches this eventually
          }
        };

        const options = {
          key: data.key_id,
          amount: data.amount,
          currency: 'INR',
          name: 'Alimenture',
          description: 'Premium Order Payment',
          order_id: data.razorpayOrderId,
          handler: async function (res) {
            paymentCompleted = true;
            setLoading(true);
            setCheckoutStep('processing');
            try {
              const verifyRes = await authenticatedFetch(`${API_URL}/orders/razorpay/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_payment_id: res.razorpay_payment_id,
                  razorpay_order_id: res.razorpay_order_id,
                  razorpay_signature: res.razorpay_signature,
                  orderId: data.orderId,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                toast.success('Payment successful! Order confirmed.');
                clearCart();
                sessionStorage.removeItem('appliedCoupon');
                setTimeout(() => navigate('/orders'), 1500);
              } else {
                toast.error('Payment verification failed. Please contact support.');
                setLoading(false);
                setCheckoutStep(null);
              }
            } catch {
              toast.error('Payment verification encountered an error.');
              setLoading(false);
              setCheckoutStep(null);
            }
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
              setCheckoutStep(null);
              releaseAbandonedReservation();
            },
          },
          prefill: {
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            email: localStorage.getItem('userEmail') || '',
            contact: formData.phone || '',
          },
          theme: { color: '#A50D5A' },
        };
        const paymentObject = new window.Razorpay(options);
        paymentObject.on('payment.failed', () => {
          toast.error('Payment failed. Please try again.');
          releaseAbandonedReservation();
        });
        paymentObject.open();
        setLoading(false);
        setCheckoutStep(null);
      } else {
        toast.error(data.error || 'Failed to place order');
        setLoading(false);
        setCheckoutStep(null);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Network error. Please try again.');
      setLoading(false);
      setCheckoutStep(null);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="relative min-h-screen font-sans text-ink flex items-center justify-center px-4">
        <div className="glass rounded-panel foil-top max-w-md w-full text-center px-8 py-16 relative z-10">
          <span className="ico-chip h-16 w-16 rounded-2xl mx-auto mb-6"><Truck className="h-7 w-7" /></span>
          <h1 className="display-md text-2xl mb-2">Your cart is empty</h1>
          <p className="text-ink-soft text-sm mb-8">Nothing to check out yet.</p>
          <button onClick={() => navigate('/shop')} className="btn-berry inline-flex items-center gap-2 h-12 px-8 rounded-full text-[11px] font-extrabold uppercase tracking-[0.16em]">
            Go shopping
          </button>
        </div>
      </div>
    );
  }

  const ctaLabel =
    checkoutStep === 'creating' ? 'Creating secure order…'
    : checkoutStep === 'opening' ? 'Opening payment gateway…'
    : checkoutStep === 'processing' ? 'Verifying payment…'
    : `Pay ₹${total}`;

  return (
    <div className="relative min-h-screen font-sans text-ink overflow-x-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-[1264px] py-24 relative z-10">

        {/* Header + steps */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-9"
        >
          <div className="flex flex-col gap-3.5">
            <button onClick={() => navigate('/cart')} className="kicker text-[10px] text-ink-soft hover:text-berry transition-colors inline-flex items-center gap-2 self-start">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to cart
            </button>
            <h1 className="display-lg text-[2.5rem] sm:text-[2.9rem]">
              Delivery &amp; <span className="accent-text">payment</span>
            </h1>
            <span className="rule-berry" />
          </div>
          <CheckoutSteps current={2} className="self-start lg:self-auto" />
        </motion.div>

        <motion.div
          variants={container} initial="hidden" animate="visible"
          className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start"
        >
          {/* ── LEFT ── */}
          <div className="flex flex-col gap-5">

            {/* Contact */}
            <motion.div variants={item} className="glass rounded-card p-6 sm:p-7">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3.5">
                  <span className="ico-chip h-11 w-11 rounded-2xl"><User className="h-5 w-5" /></span>
                  <div>
                    <p className="display-md text-lg">Contact</p>
                    <p className="text-[11.5px] text-ink-muted">We'll send order updates here</p>
                  </div>
                </div>
                <span className="pill-berry-soft inline-flex items-center h-[26px] px-3 rounded-full text-[9px] font-bold uppercase tracking-widest">Signed in</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="First name" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="Sriram" />
                <Field label="Last name" name="lastName" value={formData.lastName} onChange={handleInputChange} />
                <Field label="Phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+91 98847 33453" full />
                <label className="sm:col-span-2 block">
                  <span className="kicker text-[9.5px] text-ink-soft mb-1.5 block">Email</span>
                  <div className="w-full h-[52px] px-4 rounded-2xl bg-cream border border-hairline flex items-center text-[14px] font-medium text-ink-soft">
                    {localStorage.getItem('userEmail') || 'your account email'}
                  </div>
                </label>
              </div>
            </motion.div>

            {/* Delivery address */}
            <motion.div variants={item} className="glass rounded-card p-6 sm:p-7">
              <div className="flex items-center justify-between mb-5 gap-3">
                <div className="flex items-center gap-3.5">
                  <span className="ico-chip ico-chip-gold h-11 w-11 rounded-2xl"><MapPin className="h-5 w-5" /></span>
                  <div>
                    <p className="display-md text-lg">Delivery address</p>
                    <p className="text-[11.5px] text-ink-muted">Where should we send this order?</p>
                  </div>
                </div>
                <button type="button" onClick={handleGeolocation} className="btn-glass h-10 px-3.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-berry inline-flex items-center gap-1.5 shrink-0">
                  <MapPin className="h-3.5 w-3.5" /> Use location
                </button>
              </div>

              {savedAddresses.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="kicker text-[9px] text-ink-soft">Saved addresses</span>
                    <button type="button" onClick={() => navigate('/addresses')} className="text-[10px] font-bold text-berry hover:opacity-70 transition-opacity">
                      Manage
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {savedAddresses.map((a) => {
                      const active = selectedAddrId === a.id;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => applyAddress(a)}
                          className={`text-left rounded-2xl border p-3.5 transition-all ${
                            active
                              ? 'border-berry bg-berry/[0.04] ring-2 ring-berry/15'
                              : 'border-hairline bg-white hover:border-berry/40'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[12.5px] font-bold text-ink truncate">{a.fullName}</span>
                            {a.isDefault && (
                              <span className="pill-berry-soft inline-flex items-center h-5 px-2 rounded-full text-[8px] font-bold uppercase tracking-wider shrink-0">Default</span>
                            )}
                          </div>
                          <p className="text-[11.5px] text-ink-soft leading-snug mt-1 line-clamp-2">
                            {[a.street, a.city, a.state, a.pincode].filter(Boolean).join(', ')}
                          </p>
                          {a.phone && <p className="text-[11px] text-ink-muted mt-0.5">{a.phone}</p>}
                          {active && (
                            <span className="mt-1.5 inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider text-berry">
                              <Check className="h-3 w-3" strokeWidth={3} /> Using this
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10.5px] text-ink-muted mt-2.5">Or fill in a new address below.</p>
                </div>
              )}

              {formData.coords && (
                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="kicker text-[9px] text-leaf inline-flex items-center gap-1.5">
                      <Check className="h-3 w-3" strokeWidth={3} /> Location verified
                    </span>
                    <button onClick={() => setFormData((p) => ({ ...p, coords: null }))} className="text-[10px] font-bold text-ink-muted hover:text-danger transition-colors">Remove</button>
                  </div>
                  <div className="w-full h-40 rounded-2xl overflow-hidden border border-hairline bg-cream-deep">
                    <iframe title="Selected location" width="100%" height="100%" frameBorder="0" style={{ border: 0 }}
                      src={`https://maps.google.com/maps?q=${formData.coords.lat},${formData.coords.lng}&z=16&output=embed`} allowFullScreen />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Street address *" name="address" value={formData.address} onChange={handleInputChange} placeholder="Flat 4B, 12 Green Avenue" full />

                <label className="sm:col-span-2 block">
                  <span className="kicker text-[9.5px] text-ink-soft mb-1.5 block">State *</span>
                  <SearchableSelect
                    value={formData.state}
                    onChange={(v) => { persist({ ...formData, state: v, city: '' }); setSelectedAddrId(null); }}
                    options={INDIA_STATES}
                    placeholder="Select State"
                    searchPlaceholder="Search states…"
                    ariaLabel="Delivery state"
                    emptyText="No matching state"
                  />
                </label>

                <label className="block">
                  <span className="kicker text-[9.5px] text-ink-soft mb-1.5 block">City *</span>
                  <SearchableSelect
                    value={formData.city}
                    onChange={(v) => { persist({ ...formData, city: v }); setSelectedAddrId(null); }}
                    options={cities}
                    loading={citiesLoading}
                    disabled={!formData.state}
                    placeholder={formData.state ? 'Select City' : 'Pick a state first'}
                    searchPlaceholder="Search cities…"
                    ariaLabel="Delivery city"
                    emptyText={formData.state ? 'No cities found for this state' : 'Select a state first'}
                  />
                </label>

                <label className="block">
                  <span className="kicker text-[9.5px] text-ink-soft mb-1.5 block">PIN code *</span>
                  <input
                    name="pincode" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                    value={formData.pincode} onChange={handleInputChange} placeholder="600001"
                    className="w-full h-[52px] px-4 rounded-2xl bg-white border border-hairline outline-none text-[14px] font-medium tracking-[0.15em] placeholder:tracking-normal placeholder:text-ink-muted transition-all focus:border-berry/50 focus:ring-4 focus:ring-berry/10"
                  />
                </label>
              </div>
            </motion.div>

            {/* Delivery options */}
            <motion.div variants={item} className="glass rounded-card p-6 sm:p-7">
              <div className="flex items-center gap-3.5 mb-4">
                <span className="ico-chip h-11 w-11 rounded-2xl"><Truck className="h-5 w-5" /></span>
                <div>
                  <p className="display-md text-lg">Delivery options</p>
                  <p className="text-[11.5px] text-ink-muted">Dispatched from Chennai in 24–48 hrs</p>
                </div>
              </div>

              {!isValidPincode(formData.pincode) ? (
                <div className="glass-sm rounded-2xl p-4 text-[12.5px] text-ink-soft flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-ink-muted shrink-0" />
                  Enter your PIN code above to see delivery options and fees.
                </div>
              ) : deliveryChecking ? (
                <div className="glass-sm rounded-2xl p-4 text-[12.5px] text-ink-soft flex items-center gap-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-berry shrink-0" /> Checking delivery for {formData.pincode}…
                </div>
              ) : deliveryErr ? (
                <div className="rounded-2xl p-4 text-[12.5px] text-danger bg-danger/[0.06] border border-danger/20 flex items-center gap-2.5">
                  <X className="h-4 w-4 shrink-0" /> {deliveryErr}
                </div>
              ) : deliveryOpts && !deliveryOpts.deliveryAvailable ? (
                <div className="rounded-2xl p-4 text-[12.5px] text-danger bg-danger/[0.06] border border-danger/20 flex items-start gap-2.5">
                  <X className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{deliveryOpts.reason || 'Sorry, delivery is currently unavailable for this PIN code.'}</span>
                </div>
              ) : deliveryOpts ? (
                <div className="flex flex-col gap-3">
                  <p className="kicker text-[9px] text-leaf inline-flex items-center gap-1.5">
                    <Check className="h-3 w-3" strokeWidth={3} /> Delivery available
                    {deliveryOpts.city ? ` · ${deliveryOpts.city}` : ''}
                  </p>
                  {[
                    { id: 'standard', icon: Truck, gold: false, title: 'Standard delivery', ...deliveryOpts.standard },
                    ...(deliveryOpts.fastest?.available
                      ? [{ id: 'fastest', icon: Rocket, gold: true, title: 'Fastest delivery', ...deliveryOpts.fastest }]
                      : []),
                  ].map(({ id, icon: Icon, gold, title, fee, eta }) => {
                    const on = deliveryMethod === id;
                    return (
                      <button
                        key={id} type="button" onClick={() => setDeliveryMethod(id)}
                        className={`glass-sm rounded-2xl p-4 flex items-center gap-3.5 text-left transition-all ${
                          on ? 'border-berry/50 ring-4 ring-berry/10' : 'hover:border-berry/25'
                        }`}
                      >
                        <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${on ? 'border-berry' : 'border-hairline'}`}>
                          {on && <span className="h-2 w-2 rounded-full bg-berry" />}
                        </span>
                        <span className={`ico-chip ${gold ? 'ico-chip-gold' : ''} h-9 w-9 rounded-xl shrink-0`}><Icon className="h-4 w-4" /></span>
                        <span className="flex-1 min-w-0">
                          <span className="display-md text-[14.5px] block">{title}</span>
                          <span className="text-[11.5px] text-ink-muted">{eta || 'Standard timeline'}</span>
                        </span>
                        <span className="display-md text-[15px] shrink-0">{fee === 0 ? 'Free' : `₹${fee}`}</span>
                      </button>
                    );
                  })}
                  {deliveryOpts.fastest && !deliveryOpts.fastest.available && deliveryOpts.fastest.reason && (
                    <p className="text-[11px] text-ink-muted pl-1">{deliveryOpts.fastest.reason}</p>
                  )}
                </div>
              ) : null}
            </motion.div>

            {/* Payment */}
            <motion.div variants={item} className="glass foil-top rounded-card p-6 sm:p-7">
              <div className="flex items-center gap-3.5 mb-5">
                <span className="ico-chip h-11 w-11 rounded-2xl"><CreditCard className="h-5 w-5" /></span>
                <div>
                  <p className="display-md text-lg">Payment method</p>
                  <p className="text-[11.5px] text-ink-muted">Processed securely by Razorpay — we never store card details</p>
                </div>
              </div>
              <div className="glass-sm rounded-2xl p-4 flex items-center gap-3">
                <span className="ico-chip h-9 w-9 rounded-xl shrink-0">
                  <Zap className="h-4 w-4" />
                </span>
                <span>
                  <span className="display-md text-[14px] block">Pay online</span>
                  <span className="text-[11px] text-ink-muted">UPI · Cards · Netbanking</span>
                </span>
              </div>
              <div className="mt-4 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-berry/[0.05] border border-dashed border-berry/25">
                <Wallet className="h-4 w-4 text-berry shrink-0" />
                <p className="text-[12px] text-ink-soft">You'll choose UPI / card / netbanking in the Razorpay window.</p>
              </div>
            </motion.div>
          </div>

          {/* ── SUMMARY ── */}
          <motion.div variants={item} className="flex flex-col gap-4 lg:sticky lg:top-24 self-start">
            <div className="glass foil-top rounded-panel p-6 sm:p-7">
              <div className="flex items-center justify-between mb-4">
                <p className="kicker text-[10px] text-ink-soft">Order summary</p>
                <button onClick={() => navigate('/cart')} className="kicker text-[9.5px] text-berry hover:opacity-70 transition-opacity">Edit cart</button>
              </div>

              <div className="flex flex-col gap-3 pb-4 border-b border-white/50">
                {cart.map((it) => (
                  <div key={(it.id || it._id) + it.selectedWeight} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-cream border border-hairline shrink-0 relative">
                      <img src={it.image || FallbackImg} alt={it.name || it.title} className="w-full h-full object-cover" />
                      <span className="absolute -top-1.5 -right-1.5 h-[18px] min-w-[18px] px-1 rounded-full bg-berry text-white text-[9px] font-display font-extrabold flex items-center justify-center border-2 border-cream">
                        {it.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="display-md text-[13px] line-clamp-1">{it.name || it.title}</p>
                      <p className="text-[11px] text-ink-muted">{it.selectedWeight || 'Standard'}</p>
                    </div>
                    <span className="display-md text-[13.5px]">₹{it.price * it.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3">
                <div className="flex justify-between items-center py-2.5 text-sm">
                  <span className="text-ink-soft">Subtotal ({itemCount})</span>
                  <span className="display-md text-[14px]">₹{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center py-2.5 text-sm">
                    <span className="text-ink-soft flex items-center gap-1.5"><TicketPercent className="h-3.5 w-3.5" /> {appliedCoupon?.code}</span>
                    <span className="display-md text-[14px] text-leaf">− ₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2.5 text-sm">
                  <span className="text-ink-soft">
                    Delivery{deliveryMethod === 'fastest' ? ' · fastest' : ' · standard'}
                    {feeIsEstimate && <span className="text-ink-muted text-[11px]"> (estimated)</span>}
                  </span>
                  {shipping === 0
                    ? <span className="pill-leaf inline-flex items-center h-6 px-2.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest">Free</span>
                    : <span className="display-md text-[14px]">₹{shipping}</span>}
                </div>

                <div className="h-px bg-white/50 my-2.5" />
                <div className="flex items-end justify-between pt-2 pb-5">
                  <div>
                    <p className="kicker text-[9.5px] text-ink-soft">Total payable</p>
                    <p className="text-[11px] text-ink-muted mt-0.5">Inclusive of all taxes</p>
                  </div>
                  <p className="display-lg text-[1.9rem]">₹{total}</p>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading || deliveryChecking || (deliveryOpts && !deliveryOpts.deliveryAvailable)}
                  className="btn-berry w-full h-[52px] rounded-full text-[11px] font-extrabold uppercase tracking-[0.14em] flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading && <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                  {!loading && <Lock className="h-4 w-4" />}
                  {deliveryOpts && !deliveryOpts.deliveryAvailable ? 'Delivery unavailable' : ctaLabel}
                </button>
                <p className="text-[11px] text-ink-muted text-center mt-3.5 leading-relaxed">
                  By placing this order you agree to our <span className="text-berry">Terms of Service</span> and <span className="text-berry">Returns &amp; Refunds Policy</span>.
                </p>
              </div>
            </div>

            <div className="glass-sm rounded-card p-5 flex flex-col gap-3.5">
              {[
                [ShieldCheck, '256-bit encrypted', 'PCI-DSS compliant gateway', false],
                [RotateCcw, 'Easy cancellation', 'Free until your order ships', true],
              ].map(([Icon, title, sub, gold]) => (
                <div key={title} className="flex gap-3 items-center">
                  <span className={`ico-chip ${gold ? 'ico-chip-gold' : ''} h-9 w-9 rounded-xl shrink-0`}><Icon className="h-4 w-4" /></span>
                  <div>
                    <p className="display-md text-[13px]">{title}</p>
                    <p className="text-[10.5px] text-ink-muted">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
