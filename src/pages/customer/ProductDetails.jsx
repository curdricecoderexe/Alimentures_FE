import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import {
  Heart, Star, Truck, Package, Minus, Plus, Check, Leaf, Loader2,
  Tag, X, TicketPercent, Maximize2, ShieldCheck, ShoppingBag, MapPin,
} from 'lucide-react';
import FallbackImg from '../../assets/lan.webp';
import { useCart } from '../../context/CartContext';
import { toast } from 'sonner';
import ProductDetailsSkeleton from '../../components/skeletons/ProductDetailsSkeleton';
import useSkeletonLoader from '../../hooks/useSkeletonLoader';
import SEO from '../../components/SEO';
import ProductCard from '../../components/ui/ProductCard';
import ProductReviews from '../../components/reviews/ProductReviews';

import { cachedFetch } from '../../lib/api';
import {
  productPath, categoryPath, productTitle, productDescription, productJsonLd,
  breadcrumbJsonLd, productBreadcrumbs, productImagePath, displayName,
} from '../../lib/seo';
import { useDeliverySummary } from '../../lib/delivery';
import { getDeliveryOptions, isValidPincode } from '../../lib/deliveryApi';

const BRAND_PREFIX = 'Alimenture ';

/** Full-screen image viewer — used for the gallery and the nutrition table. */
function ImageLightbox({ src, alt, hideOriginal = false, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#120A0E]/90 backdrop-blur-xl p-3 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <div className="absolute top-3 right-3 sm:top-6 sm:right-6 flex items-center gap-2 z-10">
        {!hideOriginal && (
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="h-11 px-4 rounded-full bg-white/10 border border-white/20 text-white text-[11px] font-bold uppercase tracking-[0.14em] inline-flex items-center gap-2 hover:bg-white/20 transition-colors"
          >
            <ExternalLink className="h-4 w-4" /> Original
          </a>
        )}
        <button
          onClick={onClose}
          aria-label="Close"
          className="h-11 w-11 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <motion.img
        src={src}
        alt={alt}
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.97 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-[86vh] w-auto h-auto rounded-2xl bg-white shadow-[0_40px_120px_-20px_rgba(165,13,90,0.5)]"
      />
    </motion.div>,
    document.body,
  );
}

/** Zouk-style accordion row: title + “+”, rotates to “×” when open. */
function Accordion({ title, defaultOpen = false, children }) {
  return (
    <details open={defaultOpen} className="group border-b border-[#E2DCD0]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <Plus className="h-4 w-4 shrink-0 text-ink-soft transition-transform duration-300 group-open:rotate-45" />
      </summary>
      <div className="pb-5 -mt-1 space-y-3 text-[14px] leading-relaxed text-ink-soft">{children}</div>
    </details>
  );
}

export default function ProductDetails() {
  // `urlKey` is whatever the URL carries: a slug, a former slug or a legacy id.
  const { id: urlKey } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const showSkeleton = useSkeletonLoader(loading);
  const [lightbox, setLightbox] = useState(null); // { src, alt } | null
  const delivery = useDeliverySummary();
  const closeLightbox = useCallback(() => setLightbox(null), []);

  // ── Coupon State ──────────────────────────────────────────────
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [couponData, setCouponData] = useState(null);  // { code, discountType, discountValue, discountAmount }
  const [couponMsg, setCouponMsg] = useState('');

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    const token = localStorage.getItem('token');
    if (!token) { toast.error('Please login to apply a coupon'); navigate('/login', { state: { from: productPath(product) } }); return; }
    setCouponStatus('loading');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: couponCode.trim().toUpperCase(), orderValue: displayPrice * quantity }),
      });
      const json = await res.json();
      if (json.success) {
        const applied = { ...json.coupon, discountAmount: json.discountAmount, finalAmount: json.finalAmount };
        setCouponData(applied);
        sessionStorage.setItem('appliedCoupon', JSON.stringify(applied));
        setCouponStatus('success');
        setCouponMsg(json.message || 'Coupon applied!');
        toast.success(`🎉 ${json.coupon.discountType === 'percentage' ? `${json.coupon.discountValue}% off` : `₹${json.coupon.discountValue} off`} applied!`);
      } else {
        setCouponData(null);
        sessionStorage.removeItem('appliedCoupon');
        setCouponStatus('error');
        setCouponMsg(json.error || 'Invalid coupon');
      }
    } catch {
      setCouponData(null);
      sessionStorage.removeItem('appliedCoupon');
      setCouponStatus('error');
      setCouponMsg('Network error. Please try again.');
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponData(null);
    setCouponStatus(null);
    setCouponMsg('');
    sessionStorage.removeItem('appliedCoupon');
    toast.info('Coupon removed');
  };


  const [relatedProducts, setRelatedProducts] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // ── Estimated delivery (Zouk-style PIN check, same API as checkout) ──
  const [pin, setPin] = useState(() => { try { return localStorage.getItem('alim_last_pin') || ''; } catch { return ''; } });
  const [pinState, setPinState] = useState({ status: 'idle' }); // idle | loading | ok | error
  const checkPin = async () => {
    if (!isValidPincode(pin)) { setPinState({ status: 'error', msg: 'Enter a valid 6-digit PIN code' }); return; }
    setPinState({ status: 'loading' });
    const r = await getDeliveryOptions(pin, 0);
    if (!r.ok) { setPinState({ status: 'error', msg: r.error }); return; }
    try { localStorage.setItem('alim_last_pin', pin); } catch { /* ignore */ }
    setPinState({ status: 'ok', data: r.data });
  };

  // ── Sticky buy bar once the main CTA scrolls away (desktop) ──
  const ctaRef = useRef(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  useEffect(() => {
    const el = ctaRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => {
      setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [product, loading]); // the CTA only exists once the page has finished loading

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const json = await cachedFetch(`${import.meta.env.VITE_API_URL}/products/${encodeURIComponent(urlKey)}`);
        const pData = json.data || json;
        setProduct(pData);
        setActiveImage(pData.image || FallbackImg);
        if (pData.variants && pData.variants.length > 0) {
          const firstAvail = pData.variants.find(v => v.stock > 0) || pData.variants[0];
          setSelectedVariant(firstAvail);
        }

        // --- Phase 8: Recently Viewed Tracking ---
        try {
          let viewed = JSON.parse(localStorage.getItem('alimenture_recently_viewed')) || [];
          viewed = viewed.filter(v => v.id !== pData.id && v.id !== pData._id); // Remove if exists
          viewed.unshift({
            id: pData.id || pData._id,
            slug: pData.slug,
            name: pData.name || pData.title,
            image: pData.image,
            price: pData.price || (pData.variants && pData.variants.length > 0 ? pData.variants[0].price : 0)
          });
          if (viewed.length > 6) viewed = viewed.slice(0, 6);
          localStorage.setItem('alimenture_recently_viewed', JSON.stringify(viewed));
          setRecentlyViewed(viewed.slice(1)); // All except current
        } catch (e) { console.error(e); }

        // --- Phase 8: Related Products Fetch ---
        if (pData.category) {
          try {
            const relRes = await fetch(`${import.meta.env.VITE_API_URL}/products/search?category=${encodeURIComponent(pData.category)}&limit=5`);
            const relData = await relRes.json();
            if (relData.success) {
              setRelatedProducts(relData.data.filter(p => p.id !== pData.id && p._id !== pData.id).slice(0, 4));
            }
          } catch(e) { console.error(e); }
        }

      } catch (err) {
        console.error('Failed to fetch product:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [urlKey]);

  // Old /product/<id> links and renamed slugs land here — swap in the canonical URL.
  useEffect(() => {
    if (!product) return;
    const canonical = productPath(product);
    if (location.pathname !== canonical) navigate(`${canonical}${location.search}${location.hash}`, { replace: true });
  }, [product, location.pathname, location.search, location.hash, navigate]);

  // Reviews come from the post-delivery feedback flow (Order Tracking) — this
  // just loads whatever is already live for the product.
  const productId = product?.id;
  useEffect(() => {
    if (!productId) return undefined;
    let cancelled = false;
    const loadReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/reviews/product/${productId}`);
        const json = await res.json();
        if (!cancelled && json.success) setReviews(json.data || []);
      } catch (e) {
        console.error('Failed to load reviews', e);
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    };
    loadReviews();
    return () => { cancelled = true; };
  }, [productId]);

  // Reset quantity when variant changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant]);

  if (loading) {
    if (showSkeleton) return <ProductDetailsSkeleton />;
    return <div className="min-h-screen"></div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 relative z-10">
        <SEO title="Product Not Found" noindex={true} />
        <Package className="w-20 h-20 text-[#D7A94E]/40" />
        <h2 className="text-2xl font-display font-extrabold text-[#1F1726]">Product Not Found</h2>
        <Button onClick={() => navigate(-1)} className="rounded-2xl bg-[#1F1726] hover:bg-[#D7A94E] text-white hover:text-black font-extrabold uppercase text-[11px] tracking-[0.2em] h-12 px-8 transition-all duration-300">
          Go Back
        </Button>
      </div>
    );
  }

  const name = product.name || product.title || 'Unnamed Product';
  const displayPrice = selectedVariant ? selectedVariant.price : (product.price || 0);
  const selectedStock = selectedVariant ? selectedVariant.stock : (product.stock || 0);
  const isOutOfStock = selectedStock === 0;
  const isLowStock = selectedStock > 0 && selectedStock < 10;
  const maxQty = Math.min(selectedStock, 10);
  const inWishlist = isInWishlist(product.id || product._id);

  const handleAddToCart = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Please login to add to cart");
      navigate('/login', { state: { from: productPath(product) } });
      return;
    }
    if (isOutOfStock) return;
    for (let i = 0; i < quantity; i++) {
      addToCart({
        ...product,
        price: displayPrice,
        selectedWeight: selectedVariant?.weight,
        category: product.category || 'Biscuit'
      });
    }
    toast.success(`${quantity}× ${name} added to your bag!`);
  };

  const handleWishlist = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Please login to save to wishlist");
      navigate('/login', { state: { from: productPath(product) } });
      return;
    }
    toggleWishlist(product);
  };

  const mrp = Number(selectedVariant?.mrp) || 0;
  const hasMrp = mrp > Number(displayPrice);
  const discountPct = hasMrp ? Math.round(((mrp - displayPrice) / mrp) * 100) : 0;
  const prettyName = displayName(name);
  const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
  const badges = Array.isArray(product.cleanBadges) ? product.cleanBadges.filter((b) => b?.label) : [];
  const promises = Array.isArray(product.cleanPromises) ? product.cleanPromises.filter(Boolean) : [];
  const chips = badges.length ? badges.map((b) => b.label) : ['No maida', 'No white sugar', 'Baked in Chennai'];
  const keyLine = [product.category, selectedVariant?.weight && `${selectedVariant.weight} pack`, ...badges.slice(0, 2).map((b) => b.label)]
    .filter(Boolean).join(' · ');
  const gallery = [
    { src: product.image || FallbackImg, label: 'Main view' },
    product.secondaryImage && { src: product.secondaryImage, label: 'Alternate view' },
    product.tertiaryImage && { src: product.tertiaryImage, label: 'Nutrition table', contain: true },
  ].filter(Boolean);
  const current = gallery.find((g) => g.src === activeImage) || gallery[0];
  const shippingLine = delivery.freeDeliveryEnabled
    ? `Free over ₹${delivery.freeDeliveryThreshold}`
    : 'Pan-India delivery';

  const renderQty = (size = 'lg') => (
    <div className={`flex items-center rounded-[14px] border border-[#E2DCD0] bg-white ${size === 'lg' ? 'h-12' : 'h-11'}`} aria-label="Quantity">
      <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1} aria-label="Decrease quantity"
        className="w-10 h-full flex items-center justify-center text-ink-soft disabled:opacity-30">
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-7 text-center text-[15px] font-semibold text-ink tabular-nums" aria-live="polite">{quantity}</span>
      <button type="button" onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))} disabled={quantity >= maxQty} aria-label="Increase quantity"
        className="w-10 h-full flex items-center justify-center text-ink-soft disabled:opacity-30">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream font-sans">
      <SEO
        title={productTitle(product)}
        description={productDescription(product)}
        type="product"
        url={productPath(product)}
        image={productImagePath(product, product.image)}
        imageAlt={`${BRAND_PREFIX}${prettyName}`}
        jsonLd={[productJsonLd(product), breadcrumbJsonLd(productBreadcrumbs(product))]}
      />

      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 sm:pb-24">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[12px] text-ink-muted min-w-0" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-ink transition-colors">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-ink transition-colors">Shop</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link to={categoryPath(product.category)} className="hover:text-ink transition-colors">{product.category}</Link>
            </>
          )}
          <span>/</span>
          <span className="text-ink-soft truncate">{prettyName}</span>
        </nav>

        <div className="mt-4 sm:mt-5 grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-12 items-start">
          {/* ── Gallery ── */}
          <div className="lg:col-span-7 lg:sticky lg:top-28 flex flex-col-reverse sm:flex-row gap-3">
            {gallery.length > 1 && (
              <div className="flex sm:flex-col gap-2.5 sm:w-[76px] shrink-0 overflow-x-auto sm:overflow-visible no-scrollbar">
                {gallery.map((g) => {
                  const active = current.src === g.src;
                  return (
                    <button
                      key={g.src}
                      type="button"
                      onClick={() => setActiveImage(g.src)}
                      aria-label={g.label}
                      aria-pressed={active}
                      className={`shrink-0 w-[68px] sm:w-full aspect-square rounded-[12px] overflow-hidden bg-white border-2 transition-colors ${active ? 'border-ink' : 'border-transparent opacity-75 hover:opacity-100'}`}
                    >
                      <img src={g.src} alt="" className={`h-full w-full ${g.contain ? 'object-contain p-1' : 'object-cover'}`} />
                    </button>
                  );
                })}
              </div>
            )}

            <div className="relative flex-1 min-w-0 rounded-[20px] overflow-hidden bg-[#F1EDE6]">
              <button
                type="button"
                onClick={() => setLightbox({ src: current.src, alt: prettyName, hideOriginal: !!current.contain })}
                className="block w-full cursor-zoom-in"
                aria-label="View image full screen"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.img
                    key={current.src}
                    src={current.src}
                    alt={`${BRAND_PREFIX}${prettyName}`}
                    fetchPriority="high"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`block w-full ${current.contain ? 'h-auto bg-white' : 'aspect-[4/3] object-cover'}`}
                  />
                </AnimatePresence>
              </button>
              <button
                type="button"
                onClick={handleWishlist}
                aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                aria-pressed={inWishlist}
                className="absolute top-3 right-3 h-10 w-10 rounded-full bg-white/95 shadow-sm flex items-center justify-center hover:scale-105 transition-transform"
              >
                <Heart className={`h-[18px] w-[18px] ${inWishlist ? 'fill-berry text-berry' : 'text-ink-soft'}`} />
              </button>
              <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/90 text-[12px] font-medium text-ink-soft shadow-sm">
                <Maximize2 className="h-3.5 w-3.5" /> Zoom
              </span>
            </div>
          </div>

          {/* ── Buy box ── */}
          <div className="lg:col-span-5 min-w-0">
            {product.reviewCount > 0 && (
              <a href="#reviews" className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-ink">
                <Star className="h-4 w-4 fill-gold-light text-gold-light" />
                <span className="font-semibold text-ink">{Number(product.averageRating).toFixed(1)}</span>
                <span>({product.reviewCount} review{product.reviewCount === 1 ? '' : 's'})</span>
              </a>
            )}

            <h1 className="mt-1.5 text-[24px] sm:text-[30px] font-semibold leading-tight tracking-[-0.01em] text-ink">{prettyName}</h1>
            {keyLine && <p className="mt-1.5 text-[14px] text-ink-soft">{keyLine}</p>}

            {/* Price */}
            <div className="mt-5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="text-[28px] sm:text-[32px] font-bold leading-none tracking-tight text-ink">{inr(displayPrice)}</span>
              {hasMrp && <s className="text-[16px] text-[#A09A92]" aria-label={`MRP ${inr(mrp)}`}>{inr(mrp)}</s>}
              {hasMrp && <span className="text-[16px] font-bold text-[#1E6E2A]">{discountPct}% OFF</span>}
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {hasMrp && (
                <span className="inline-flex items-center h-7 px-2.5 rounded-md bg-[#E7F3E8] text-[13px] font-semibold text-[#1E6E2A]">
                  You save {inr(mrp - displayPrice)}
                </span>
              )}
              <span className="text-[12px] text-ink-muted">(incl. of all taxes)</span>
            </div>

            {/* Pack size */}
            {product.variants && product.variants.length > 0 && (
              <div className="mt-6">
                <p className="text-[13px] font-semibold text-ink">
                  Pack size{selectedVariant?.weight && <span className="font-normal text-ink-soft"> · {selectedVariant.weight}</span>}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {product.variants.map((variant) => {
                    const soldOut = variant.stock === 0;
                    const active = selectedVariant?.weight === variant.weight;
                    return (
                      <button
                        key={variant.weight}
                        type="button"
                        onClick={() => !soldOut && setSelectedVariant(variant)}
                        disabled={soldOut}
                        aria-pressed={active}
                        className={`min-w-[92px] rounded-[12px] border px-3.5 py-2.5 text-left transition-colors ${
                          soldOut
                            ? 'border-[#E2DCD0] bg-cream text-ink-muted cursor-not-allowed'
                            : active
                              ? 'border-ink bg-white ring-1 ring-ink'
                              : 'border-[#E2DCD0] bg-white hover:border-ink/40'
                        }`}
                      >
                        <span className={`block text-[14px] font-semibold ${soldOut ? 'line-through' : 'text-ink'}`}>{variant.weight}</span>
                        <span className="block text-[12px] text-ink-muted">{soldOut ? 'Out of stock' : inr(variant.price)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity + Add to cart */}
            <div ref={ctaRef} className="mt-6 flex items-stretch gap-2.5">
              {!isOutOfStock && renderQty()}
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className={`flex-1 min-w-0 h-12 rounded-[14px] inline-flex items-center justify-center gap-2 text-[14px] font-semibold uppercase tracking-[0.05em] transition-colors ${
                  isOutOfStock ? 'bg-[#EDE8DF] text-ink-muted cursor-not-allowed' : 'btn-brand'
                }`}
              >
                <ShoppingBag className="h-[18px] w-[18px]" />
                {isOutOfStock ? 'Out of stock' : 'Add to cart'}
              </button>
            </div>
            <p className={`mt-2 text-[12.5px] ${isOutOfStock ? 'text-ink-muted' : isLowStock ? 'text-[#B42318]' : 'text-[#1E6E2A]'}`}>
              {isOutOfStock ? 'This pack is out of stock — choose another size.' : isLowStock ? `Only ${selectedStock} left in stock` : 'In stock · ready to ship'}
            </p>

            {/* Trust chips */}
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <li key={c} className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-[#EFEAE1] text-[12px] font-medium text-ink-soft">
                  <Check className="h-3.5 w-3.5 text-[#1E6E2A]" /> {c}
                </li>
              ))}
            </ul>

            {/* Estimated delivery */}
            <div className="mt-6">
              <p className="text-[13px] font-semibold text-ink">Estimated delivery</p>
              <form
                onSubmit={(e) => { e.preventDefault(); checkPin(); }}
                className="mt-2 flex items-center h-12 rounded-[14px] border border-[#E2DCD0] bg-white pl-3.5 pr-1.5 focus-within:border-ink/40"
              >
                <MapPin className="h-4 w-4 text-ink-muted shrink-0" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); if (pinState.status !== 'idle') setPinState({ status: 'idle' }); }}
                  placeholder="Enter 6-digit PIN code"
                  aria-label="Delivery PIN code"
                  className="flex-1 min-w-0 bg-transparent px-2.5 text-[14px] text-ink placeholder:text-ink-muted focus:outline-none"
                />
                <button type="submit" disabled={pinState.status === 'loading'} className="h-9 px-3.5 rounded-[10px] text-[13px] font-semibold text-berry hover:bg-berry-tint/60 disabled:opacity-50">
                  {pinState.status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check'}
                </button>
              </form>
              {pinState.status === 'error' && <p className="mt-1.5 text-[12.5px] text-[#B42318]">{pinState.msg}</p>}
              {pinState.status === 'ok' && (
                pinState.data.deliveryAvailable ? (
                  <p className="mt-1.5 text-[12.5px] text-[#1E6E2A]">
                    Delivers to {pinState.data.city || pin} in {pinState.data.standard?.eta || 'a few days'}
                    {pinState.data.fastest?.available && ` · express in ${pinState.data.fastest.eta}`}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[12.5px] text-[#B42318]">{pinState.data.reason || 'Sorry, we don’t deliver to this PIN code yet.'}</p>
                )
              )}
            </div>

            {/* Service row */}
            <ul className="mt-5 grid grid-cols-3 divide-x divide-[#E2DCD0] rounded-[14px] border border-[#E2DCD0] bg-white">
              {[
                { Icon: Truck, title: 'Shipping', sub: shippingLine },
                { Icon: ShieldCheck, title: 'Secure payments', sub: 'UPI, cards & more' },
                { Icon: Leaf, title: 'FSSAI registered', sub: 'Baked in Chennai' },
              ].map(({ Icon, title, sub }) => (
                <li key={title} className="flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-2.5 p-3 text-center sm:text-left">
                  <Icon className="h-5 w-5 text-ink-soft shrink-0" strokeWidth={1.6} />
                  <span className="min-w-0">
                    <span className="block text-[12px] sm:text-[12.5px] font-semibold text-ink leading-tight">{title}</span>
                    <span className="block text-[11px] sm:text-[11.5px] text-ink-muted leading-tight mt-0.5">{sub}</span>
                  </span>
                </li>
              ))}
            </ul>

            {/* Coupon */}
            <div className="mt-5">
              {couponData ? (
                <div className="flex items-center justify-between gap-3 rounded-[14px] border border-[#CFE6D2] bg-[#F1F8F2] px-3.5 py-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#1E6E2A]">
                      <TicketPercent className="inline h-4 w-4 mr-1 -mt-0.5" />{couponData.code} applied · you save {inr(couponData.discountAmount)}
                    </p>
                    <p className="text-[12px] text-ink-muted mt-0.5">{couponMsg}</p>
                  </div>
                  <button type="button" onClick={handleRemoveCoupon} aria-label="Remove coupon" className="p-1.5 rounded-md text-ink-muted hover:text-ink">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className={`flex items-center h-12 rounded-[14px] border bg-white pl-3.5 pr-1.5 ${couponStatus === 'error' ? 'border-[#F1B8B2]' : 'border-[#E2DCD0] focus-within:border-ink/40'}`}>
                    <Tag className="h-4 w-4 text-ink-muted shrink-0" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); if (couponStatus === 'error') setCouponStatus(null); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      placeholder="Have a coupon code?"
                      aria-label="Coupon code"
                      disabled={couponStatus === 'loading'}
                      className="flex-1 min-w-0 bg-transparent px-2.5 text-[14px] uppercase tracking-wide text-ink placeholder:normal-case placeholder:tracking-normal placeholder:text-ink-muted focus:outline-none"
                    />
                    <button type="button" onClick={handleApplyCoupon} disabled={!couponCode.trim() || couponStatus === 'loading'}
                      className="h-9 px-3.5 rounded-[10px] text-[13px] font-semibold text-berry hover:bg-berry-tint/60 disabled:opacity-40">
                      {couponStatus === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                  {couponStatus === 'error' && couponMsg && <p className="mt-1.5 text-[12.5px] text-[#B42318]">{couponMsg}</p>}
                </>
              )}
            </div>

            {/* Accordions */}
            <div className="mt-7 border-t border-[#E2DCD0]">
              {(product.description || product.secondaryDescription) && (
                <Accordion title="Product details" defaultOpen>
                  {product.description && !String(product.secondaryDescription || '').trim().startsWith(String(product.description).trim()) && (
                    <p>{product.description}</p>
                  )}
                  {product.secondaryDescription && <p className="whitespace-pre-line" style={{ overflowWrap: 'anywhere' }}>{product.secondaryDescription}</p>}
                </Accordion>
              )}
              {promises.length > 0 && (
                <Accordion title="Why you’ll love it">
                  <ul className="space-y-2">
                    {promises.map((f) => (
                      <li key={f} className="flex gap-2"><Check className="h-4 w-4 mt-0.5 text-[#1E6E2A] shrink-0" />{f}</li>
                    ))}
                  </ul>
                </Accordion>
              )}
              {product.tertiaryImage && (
                <Accordion title="Nutrition information">
                  <button
                    type="button"
                    onClick={() => setLightbox({ src: product.tertiaryImage, alt: `${prettyName} nutrition table`, hideOriginal: true })}
                    className="block w-full rounded-[12px] overflow-hidden border border-[#E2DCD0] bg-white cursor-zoom-in"
                    aria-label="View nutrition table full screen"
                  >
                    <img src={product.tertiaryImage} alt={`${prettyName} nutrition table`} loading="lazy" className="block w-full h-auto" />
                  </button>
                </Accordion>
              )}
              {product.variants && product.variants.length > 0 && (
                <Accordion title="Pack sizes & availability">
                  <dl className="divide-y divide-[#EEE8DD]">
                    {product.variants.map((v) => (
                      <div key={v.weight} className="flex items-center justify-between py-2">
                        <dt className="text-ink">{v.weight}</dt>
                        <dd className="flex items-center gap-3">
                          <span className="font-semibold text-ink">{inr(v.price)}</span>
                          <span className={`text-[12px] ${v.stock === 0 ? 'text-ink-muted' : v.stock < 10 ? 'text-[#B42318]' : 'text-[#1E6E2A]'}`}>
                            {v.stock === 0 ? 'Out of stock' : v.stock < 10 ? `${v.stock} left` : 'Available'}
                          </span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Accordion>
              )}
              <Accordion title="Shipping & delivery">
                <p>
                  Freshly packed and shipped across India from our FSSAI-registered kitchen in Chennai.
                  {delivery.freeDeliveryEnabled ? ` Free delivery on orders over ₹${delivery.freeDeliveryThreshold}.` : ''}
                  {' '}Check the estimate for your PIN code above; the exact fee is shown at checkout.
                </p>
              </Accordion>
            </div>
          </div>
        </div>

        {/* Customer reviews */}
        <div id="reviews" className="scroll-mt-28">
          <ProductReviews
            reviews={reviews}
            loading={reviewsLoading}
            averageRating={product.averageRating || 0}
            reviewCount={product.reviewCount || 0}
          />
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 sm:mt-20">
            <div className="flex items-end justify-between gap-4 mb-5 sm:mb-6">
              <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.01em] text-ink">You may also like</h2>
              {product.category && (
                <Link to={categoryPath(product.category)} className="text-[13px] font-semibold text-ink underline underline-offset-4 decoration-ink/30 hover:decoration-ink">View all</Link>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id || p._id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Recently viewed */}
        {recentlyViewed.length > 0 && (
          <section className="mt-14 sm:mt-16">
            <h2 className="text-[18px] sm:text-[20px] font-semibold text-ink mb-4">Recently viewed</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {recentlyViewed.map((p) => (
                <Link key={p.id} to={productPath(p)} className="group block overflow-hidden rounded-[16px] bg-white border border-[#ECE6DA]">
                  <div className="aspect-[4/3] overflow-hidden bg-cream">
                    <img src={p.image || FallbackImg} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="text-[13px] font-semibold text-ink line-clamp-1">{displayName(p.name)}</p>
                    {Number(p.price) > 0 && <p className="text-[12.5px] text-ink-soft mt-0.5">{inr(p.price)}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky buy bar (desktop) */}
      <AnimatePresence>
        {showStickyBar && !isOutOfStock && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block fixed inset-x-0 bottom-0 z-[95] bg-white/95 backdrop-blur-xl border-t border-[#E2DCD0] shadow-[0_-12px_30px_-20px_rgba(0,0,0,0.25)]"
          >
            <div className="mx-auto max-w-[1240px] px-8 h-[76px] flex items-center gap-5">
              <img src={product.image || FallbackImg} alt="" className="h-12 w-12 rounded-[10px] object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-ink truncate">{prettyName}{selectedVariant?.weight ? ` · ${selectedVariant.weight}` : ''}</p>
                <p className="flex items-baseline gap-2 text-[13px]">
                  <span className="text-[17px] font-bold text-ink">{inr(displayPrice)}</span>
                  {hasMrp && <s className="text-[#A09A92]">{inr(mrp)}</s>}
                  {hasMrp && <span className="font-bold text-[#1E6E2A]">{discountPct}% OFF</span>}
                </p>
              </div>
              <button type="button" onClick={handleAddToCart} className="h-11 w-[260px] rounded-[14px] btn-brand text-[14px] font-semibold uppercase tracking-[0.05em] inline-flex items-center justify-center gap-2">
                <ShoppingBag className="h-[18px] w-[18px]" /> Add to cart
              </button>
              {renderQty('md')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lightbox && <ImageLightbox src={lightbox.src} alt={lightbox.alt} hideOriginal={lightbox.hideOriginal} onClose={closeLightbox} />}
      </AnimatePresence>
    </div>
  );
}
