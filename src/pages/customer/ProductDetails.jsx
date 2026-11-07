import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import {
  ShoppingCart, Heart, Star, Truck, Shield, ArrowLeft, Package,
  Minus, Plus, Check, Leaf, BadgePercent, Loader2, HandHeart, UtensilsCrossed,
  Tag, X, TicketPercent, IndianRupee, Maximize2, ExternalLink, ZoomIn, Award,
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

const BRAND_PREFIX = 'Alimenture ';

const stagger = { visible: { transition: { staggerChildren: 0.09 } } };
const fadeUp = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } } };

const TRUST_PILLARS = [
  { Icon: Truck, tint: 'from-gold-light/25 to-gold-light/5 text-gold', label: 'Free Shipping', sub: 'Sealed climate packs' },
  { Icon: Shield, tint: 'from-berry/20 to-berry/5 text-berry', label: '100% Toxin-Free', sub: 'Lab certified batches' },
  { Icon: Leaf, tint: 'from-emerald-400/25 to-emerald-400/5 text-emerald-600', label: 'Pure Ingredients', sub: 'No preservatives' },
];

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
        <h2 className="text-2xl font-display font-extrabold text-[#221B1F]">Product Not Found</h2>
        <Button onClick={() => navigate(-1)} className="rounded-2xl bg-[#221B1F] hover:bg-[#D7A94E] text-white hover:text-black font-extrabold uppercase text-[11px] tracking-[0.2em] h-12 px-8 transition-all duration-300">
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

  return (
    <div className="min-h-screen relative overflow-x-hidden font-sans">
      <SEO
        title={productTitle(product)}
        description={productDescription(product)}
        type="product"
        url={productPath(product)}
        image={productImagePath(product, product.image)}
        imageAlt={`${BRAND_PREFIX}${displayName(name)}`}
        jsonLd={[productJsonLd(product), breadcrumbJsonLd(productBreadcrumbs(product))]}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-[1360px] py-24 sm:py-28 relative z-10">

        {/* Back + breadcrumb */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-6 sm:mb-8 flex items-center gap-3 flex-wrap">
          <Button
            onClick={() => navigate(-1)}
            className="rounded-full border border-hairline hover:border-berry/40 text-ink-soft hover:text-berry font-semibold text-xs h-9 px-4 glass-sm transition-all duration-300 flex items-center gap-1.5 shadow-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>
          <nav className="text-[11px] font-semibold text-ink-muted flex items-center gap-1.5 min-w-0" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-berry transition-colors">Home</Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-berry transition-colors">Shop</Link>
            <span>/</span>
            {product.category && (
              <>
                <Link to={categoryPath(product.category)} className="hover:text-berry transition-colors">{product.category}</Link>
                <span>/</span>
              </>
            )}
            <span className="text-ink truncate max-w-[180px] sm:max-w-none">{name}</span>
          </nav>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[auto_1fr] gap-x-8 gap-y-8 lg:gap-x-10 xl:gap-x-14 lg:gap-y-6 items-start">

          {/* ── LEFT: gallery, story, nutrition ── */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="lg:col-span-7 lg:col-start-1 lg:row-start-1 space-y-6 min-w-0">

            {/* Main image — shown at its natural shape, never cropped */}
            <div className="group relative rounded-[2.2rem] p-[2px] bg-gradient-to-br from-gold-light/70 via-white to-berry/40 shadow-[0_40px_80px_-40px_rgba(121,8,63,0.45)]">
              <div className="relative rounded-[2.1rem] bg-white p-2 sm:p-2.5 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setLightbox({ src: activeImage || product.image || FallbackImg, alt: name })}
                  className="relative block w-full rounded-[1.7rem] overflow-hidden bg-cream cursor-zoom-in"
                  aria-label="View image full screen"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.img
                      key={activeImage}
                      src={activeImage || product.image || FallbackImg}
                      alt={`${BRAND_PREFIX}${displayName(name)}`}
                      fetchPriority="high"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35 }}
                      className="block w-full h-auto transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                    />
                  </AnimatePresence>
                  <span className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#1A0F14]/55 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-[0.14em] opacity-90 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="h-3.5 w-3.5" /> Zoom
                  </span>
                </button>

                <div className="absolute bottom-5 left-5 sm:bottom-6 sm:left-6 flex items-center gap-2 pointer-events-none">
                  <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-white/85 backdrop-blur-md border border-white text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-gold shadow-sm">
                    <Award className="h-3.5 w-3.5" /> Original
                  </span>
                  {isLowStock && (
                    <span className="inline-flex items-center h-7 px-3 rounded-full bg-red-500 text-white font-extrabold text-[10.5px] uppercase tracking-wider shadow-md animate-pulse">
                      Only {selectedStock} left
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Thumbnails */}
            {(() => {
              const thumbs = [
                { src: product.image, label: 'Main view' },
                product.secondaryImage && { src: product.secondaryImage, label: 'Alternate view' },
              ].filter(Boolean);
              if (thumbs.length < 2) return null;
              return (
                <div className="flex items-center gap-3">
                  {thumbs.map((t, i) => {
                    const active = activeImage === t.src;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveImage(t.src)}
                        aria-label={t.label}
                        className={`w-24 sm:w-28 rounded-2xl p-[2px] transition-all ${
                          active ? 'bg-gradient-to-br from-gold-light to-berry shadow-md' : 'bg-hairline opacity-70 hover:opacity-100'
                        }`}
                      >
                        <span className="block aspect-video rounded-[14px] overflow-hidden bg-white">
                          <img src={t.src || FallbackImg} className="w-full h-full object-cover" alt="" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            {/* Badge chips (admin-managed) */}
            {Array.isArray(product.cleanBadges) && product.cleanBadges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.cleanBadges.map((b, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-white/90 border border-gold-light/30 text-[10px] font-extrabold text-ink-soft uppercase tracking-wider shadow-sm">
                    {b.icon && <span className="text-sm">{b.icon}</span>} {b.label}
                  </span>
                ))}
              </div>
            )}
          </motion.div>

          {/* ── RIGHT: buy panel ── */}
          <motion.div initial="hidden" animate="visible" variants={stagger} className="lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:row-span-2 min-w-0">

            <motion.div variants={fadeUp} className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-white/80 border border-gold-light/30 text-[10px] font-extrabold uppercase tracking-[0.2em] text-gold">
                <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-berry to-gold-light" />
                {product.category || 'Product'}
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="font-display text-[2.1rem] sm:text-5xl font-extrabold text-ink tracking-tight leading-[1.05] mb-4">
              {name}
            </motion.h1>

            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className={`h-4 w-4 ${star <= Math.round(product.averageRating || 0) ? 'fill-gold-light text-gold-light' : 'fill-hairline text-hairline'}`} />
                ))}
              </div>
              <span className="font-bold text-ink-muted text-xs">
                {product.reviewCount > 0
                  ? `${product.averageRating} · ${product.reviewCount} review${product.reviewCount === 1 ? '' : 's'}`
                  : 'No reviews yet'}
              </span>
            </motion.div>

            {product.description && (
              <motion.p variants={fadeUp} className="text-[14.5px] text-ink-soft font-medium leading-relaxed mb-7">
                {product.description}
              </motion.p>
            )}

            {/* Price panel */}
            {(() => {
              const mrp = Number(selectedVariant?.mrp) || 0;
              const hasMrp = mrp > Number(displayPrice);
              return (
                <motion.div variants={fadeUp} className="relative rounded-[1.6rem] p-[1.5px] bg-gradient-to-br from-gold-light/70 via-white to-berry/35 mb-7 shadow-[0_20px_40px_-26px_rgba(121,8,63,0.45)]">
                  <div className="relative rounded-[1.5rem] bg-gradient-to-br from-white to-[#FFF8EF] p-5 sm:p-6 overflow-hidden">
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 opacity-40 pointer-events-none"
                      style={{ backgroundImage: 'radial-gradient(rgba(178,123,38,0.35) 1px, transparent 1px)', backgroundSize: '12px 12px', maskImage: 'linear-gradient(90deg, transparent 55%, #000)' }}
                    />
                    <div className="relative flex items-end flex-wrap gap-x-3 gap-y-2">
                      <span className="font-display text-[2.6rem] sm:text-5xl font-extrabold text-berry-deep leading-none tracking-tight">₹{displayPrice}</span>
                      {hasMrp && (
                        <>
                          <s className="text-lg font-semibold text-ink-muted leading-none mb-1" aria-label={`MRP ₹${mrp}`}>₹{mrp}</s>
                          <span className="mb-1 inline-flex items-center gap-1 h-7 px-3 rounded-full bg-gradient-to-r from-berry to-gold-light text-white text-[10px] font-extrabold uppercase tracking-[0.12em] shadow-[0_8px_18px_-6px_rgba(165,13,90,0.6)]">
                            <BadgePercent className="h-3 w-3" /> {Math.round(((mrp - displayPrice) / mrp) * 100)}% off
                          </span>
                        </>
                      )}
                    </div>
                    <p className="relative mt-3 text-[11.5px] font-semibold text-ink-muted">
                      {selectedVariant?.weight && <span className="text-ink-soft font-bold">{selectedVariant.weight} pack · </span>}
                      Inclusive of all taxes
                      {hasMrp && <span className="text-berry font-extrabold"> · You save ₹{mrp - displayPrice}</span>}
                    </p>

                    <div className="relative mt-4">
                      <AnimatePresence mode="wait">
                        {isOutOfStock ? (
                          <motion.div key="out" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                            className="inline-flex items-center gap-2 bg-cream-deep text-ink-muted px-3.5 h-8 rounded-full font-extrabold uppercase text-[10.5px] tracking-widest border border-hairline">
                            <span className="h-2 w-2 rounded-full bg-gray-400" /> Out of stock — choose another size
                          </motion.div>
                        ) : isLowStock ? (
                          <motion.div key="low" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                            className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-3.5 h-8 rounded-full font-extrabold uppercase text-[10.5px] tracking-widest border border-red-100">
                            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" /> Hurry! Only {selectedStock} left
                          </motion.div>
                        ) : (
                          <motion.div key="avail" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                            className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3.5 h-8 rounded-full font-extrabold uppercase text-[10.5px] tracking-widest border border-emerald-100">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" /> In stock · ready to ship
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* Pack size */}
            {product.variants && product.variants.length > 0 && (
              <motion.div variants={fadeUp} className="mb-7">
                <p className="text-[10px] font-extrabold text-ink-muted uppercase tracking-[0.2em] mb-3">Pack size</p>
                <div className="flex flex-wrap gap-2.5">
                  {product.variants.map((variant, idx) => {
                    const soldOut = variant.stock === 0;
                    const active = selectedVariant?.weight === variant.weight;
                    return (
                      <button
                        key={idx}
                        onClick={() => !soldOut && setSelectedVariant(variant)}
                        disabled={soldOut}
                        aria-pressed={active}
                        className={`relative min-w-[104px] px-4 py-3 rounded-2xl text-left transition-all duration-300 border ${
                          soldOut
                            ? 'border-hairline bg-cream/60 text-ink-muted cursor-not-allowed'
                            : active
                            ? 'border-transparent bg-gradient-to-br from-berry to-berry-bright text-white shadow-berry'
                            : 'border-hairline bg-white text-ink hover:border-berry/40 hover:-translate-y-0.5'
                        }`}
                      >
                        <span className={`block font-display font-extrabold text-[15px] leading-tight ${soldOut ? 'line-through' : ''}`}>{variant.weight}</span>
                        <span className={`block text-[11px] font-bold mt-0.5 ${active ? 'text-white/85' : 'text-ink-muted'}`}>
                          {soldOut ? 'Out of stock' : `₹${variant.price}`}
                        </span>
                        {active && (
                          <span className="absolute top-2 right-2 h-4 w-4 rounded-full bg-white/25 flex items-center justify-center">
                            <Check className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Quantity + CTA */}
            <motion.div variants={fadeUp} className="mb-3 flex items-stretch gap-2 sm:gap-3">
              {!isOutOfStock && (
                <div className="flex items-center h-14 rounded-2xl border border-hairline bg-white shadow-sm" aria-label="Quantity">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    className="w-10 sm:w-12 h-full flex items-center justify-center rounded-l-2xl hover:bg-cream transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-4 w-4 text-ink-soft" />
                  </button>
                  <span className="w-8 sm:w-10 text-center text-lg font-display font-extrabold text-ink">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                    disabled={quantity >= maxQty}
                    aria-label="Increase quantity"
                    className="w-10 sm:w-12 h-full flex items-center justify-center rounded-r-2xl hover:bg-cream transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4 text-ink-soft" />
                  </button>
                </div>
              )}
              <Button
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                size="lg"
                className={`flex-1 min-w-0 h-14 px-3 rounded-2xl font-extrabold text-[11px] sm:text-[12px] uppercase tracking-[0.1em] sm:tracking-[0.15em] transition-all duration-300 active:scale-[0.98] ${
                  isOutOfStock
                    ? 'bg-cream-deep text-ink-muted cursor-not-allowed'
                    : 'btn-berry shadow-[0_14px_30px_-10px_rgba(146,0,117,0.55)] hover:shadow-[0_18px_36px_-10px_rgba(146,0,117,0.65)]'
                }`}
              >
                <ShoppingCart className="h-4.5 w-4.5 mr-2" />
                {isOutOfStock ? 'Out of stock' : `Add ${quantity > 1 ? `${quantity} ` : ''}to cart`}
              </Button>
              <Button
                onClick={handleWishlist}
                size="lg"
                variant="outline"
                aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                className={`h-14 w-14 shrink-0 rounded-2xl border transition-all duration-300 flex items-center justify-center ${
                  inWishlist
                    ? 'bg-berry-tint border-berry/40 text-berry'
                    : 'border-hairline text-ink-muted hover:border-berry/40 hover:text-berry bg-white'
                }`}
              >
                <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
              </Button>
            </motion.div>
            {!isOutOfStock && (
              <motion.p variants={fadeUp} className="text-[11px] text-ink-muted font-semibold mb-7">Max {maxQty} per order</motion.p>
            )}

            {/* Coupon */}
            <motion.div variants={fadeUp} className="mb-7">
              <AnimatePresence mode="wait">
                {couponData ? (
                  <motion.div
                    key="applied"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/50 p-4"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-300/20 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-start justify-between gap-3 relative">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-emerald-100 border border-emerald-200 shrink-0 mt-0.5">
                          <TicketPercent className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-mono font-extrabold text-sm text-emerald-700 tracking-widest">{couponData.code}</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-[10.5px] font-extrabold uppercase text-emerald-600 tracking-wider">Applied</span>
                          </div>
                          <p className="text-xs text-emerald-600 font-semibold mb-2">{couponMsg}</p>
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-1 text-xs font-semibold text-ink-muted">
                              <span>Price:</span>
                              <span className="line-through text-ink-muted">₹{(displayPrice * quantity).toFixed(0)}</span>
                            </div>
                            <span className="text-ink-muted">→</span>
                            <div className="flex items-center gap-1 text-sm font-extrabold text-emerald-700">
                              <IndianRupee className="h-3 w-3" />
                              <span>{couponData.finalAmount}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-berry/5 border border-berry/15 text-[10.5px] font-extrabold text-berry uppercase">
                              Save ₹{couponData.discountAmount}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        aria-label="Remove coupon"
                        className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-400 hover:text-emerald-600 transition-all shrink-0 mt-0.5"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className={`flex items-center gap-2 p-1.5 rounded-2xl border border-dashed bg-white/80 transition-all duration-300 ${
                      couponStatus === 'error' ? 'border-red-300 bg-red-50/40' : 'border-gold-light/60 hover:border-berry/40 focus-within:border-berry/50 focus-within:border-solid'
                    }`}>
                      <div className="flex-1 flex items-center gap-2 pl-3 min-w-0">
                        <Tag className={`h-4 w-4 shrink-0 ${couponStatus === 'error' ? 'text-red-400' : 'text-gold'}`} />
                        <input
                          type="text"
                          value={couponCode}
                          onChange={e => { setCouponCode(e.target.value.toUpperCase()); if (couponStatus === 'error') setCouponStatus(null); }}
                          onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                          placeholder="Have a coupon code?"
                          aria-label="Coupon code"
                          className="w-full min-w-0 bg-transparent font-mono font-bold text-sm text-ink placeholder:text-ink-muted placeholder:font-sans placeholder:font-semibold focus:outline-none uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal"
                          disabled={couponStatus === 'loading'}
                        />
                      </div>
                      <button
                        onClick={handleApplyCoupon}
                        disabled={!couponCode.trim() || couponStatus === 'loading'}
                        className="px-5 h-10 rounded-xl btn-berry text-white font-extrabold text-[11px] uppercase tracking-[0.12em] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none shrink-0"
                      >
                        {couponStatus === 'loading' ? (
                          <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking…</span>
                        ) : 'Apply'}
                      </button>
                    </div>
                    <AnimatePresence>
                      {couponStatus === 'error' && couponMsg && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-[11px] text-red-500 font-bold mt-2 ml-1 flex items-center gap-1.5"
                        >
                          <X className="h-3 w-3" /> {couponMsg}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Trust pillars */}
            <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-7">
              {TRUST_PILLARS.map(({ Icon, tint, label: baseLabel, sub }) => {
                // Shipping pillar copy follows Admin → PIN Code Delivery.
                const isShipping = Icon === Truck;
                const label = isShipping
                  ? (delivery.freeDeliveryEnabled ? `Free Shipping ₹${delivery.freeDeliveryThreshold}+` : 'Fast Shipping')
                  : baseLabel;
                return (
                <div key={label} className="flex flex-col items-center text-center gap-2 p-3 sm:p-4 rounded-2xl bg-white/80 border border-white shadow-[0_10px_24px_-18px_rgba(121,8,63,0.35)] hover:-translate-y-0.5 transition-transform duration-300">
                  <span className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${tint} flex items-center justify-center`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-extrabold text-[10.5px] sm:text-[10px] text-ink uppercase tracking-wider leading-tight">{label}</p>
                    <p className="text-[10.5px] text-ink-muted font-semibold mt-0.5 hidden sm:block">{sub}</p>
                  </div>
                </div>
                );
              })}
            </motion.div>

            {/* Clean promises */}
            {Array.isArray(product.cleanPromises) && product.cleanPromises.length > 0 && (
              <motion.div variants={fadeUp} className="rounded-[1.6rem] bg-white/85 border border-white shadow-[0_18px_40px_-26px_rgba(121,8,63,0.3)] p-5 sm:p-6 mb-5">
                <p className="text-[10.5px] font-extrabold uppercase tracking-[0.2em] text-gold mb-1">Our promise</p>
                <h2 className="font-display font-extrabold text-lg text-ink mb-4">Clean promises</h2>
                {/* One promise per row, revealed one after another */}
                <ul className="divide-y divide-hairline/70">
                  {product.cleanPromises.map((f, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: '-30px' }}
                      transition={{ duration: 0.4, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 text-[13.5px] font-semibold text-ink-soft"
                    >
                      <span className="shrink-0 h-6 w-6 rounded-full bg-gradient-to-br from-berry to-gold-light text-white flex items-center justify-center shadow-[0_4px_10px_-4px_rgba(165,13,90,0.6)]">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      {f}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Pack availability */}
            {product.variants && product.variants.length > 0 && (
              <motion.div variants={fadeUp} className="rounded-[1.6rem] bg-white/85 border border-white shadow-[0_18px_40px_-26px_rgba(121,8,63,0.3)] p-5 sm:p-6">
                <h2 className="font-display font-extrabold text-lg text-ink mb-3">Pack availability</h2>
                <div className="divide-y divide-hairline/70">
                  {product.variants.map((v, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="font-bold text-ink-soft">{v.weight}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-display font-extrabold text-berry-deep">₹{v.price}</span>
                        {v.stock === 0 ? (
                          <span className="text-[10.5px] font-extrabold text-ink-muted uppercase tracking-wider px-2.5 py-1 bg-cream rounded-full border border-hairline">Out of stock</span>
                        ) : v.stock < 10 ? (
                          <span className="text-[10.5px] font-extrabold text-red-500 uppercase tracking-wider px-2.5 py-1 bg-red-50 rounded-full border border-red-100">{v.stock} left</span>
                        ) : (
                          <span className="text-[10.5px] font-extrabold text-emerald-700 uppercase tracking-wider px-2.5 py-1 bg-emerald-50 rounded-full border border-emerald-100">Available</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* ── LEFT (below gallery on desktop, after the buy panel on mobile): story & nutrition ── */}
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="lg:col-span-7 lg:col-start-1 lg:row-start-2 space-y-6 min-w-0">
            {/* Description (admin-managed; hidden when empty) */}
            {product.secondaryDescription && (
              <div className="relative rounded-[1.8rem] bg-white/85 backdrop-blur-sm border border-white shadow-[0_18px_40px_-24px_rgba(121,8,63,0.3)] p-6 sm:p-8 overflow-hidden">
                <div aria-hidden="true" className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gold-light/15 blur-3xl pointer-events-none" />
                <div className="relative flex items-center gap-3 mb-5">
                  <span className="h-11 w-11 rounded-2xl bg-gradient-to-br from-berry to-berry-bright text-white flex items-center justify-center shadow-berry shrink-0">
                    <HandHeart className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[10.5px] font-extrabold uppercase tracking-[0.2em] text-gold">Crafted with care</p>
                    <h2 className="font-display font-extrabold text-lg text-ink leading-tight">About this product</h2>
                  </div>
                </div>
                <p className="relative text-[14.5px] text-ink-soft font-medium leading-[1.8] whitespace-pre-line" style={{ overflowWrap: 'anywhere' }}>
                  {product.secondaryDescription}
                </p>
              </div>
            )}

            {/* Vitamin & Nutrition table — the raw image at its own size, never cropped */}
            {product.tertiaryImage && (
              <div className="rounded-[1.8rem] bg-white/85 backdrop-blur-sm border border-white shadow-[0_18px_40px_-24px_rgba(121,8,63,0.3)] p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3 px-2 sm:px-3 pt-1 pb-3 sm:pb-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-10 w-10 rounded-2xl bg-gradient-to-br from-gold-light/30 to-gold-light/5 text-gold flex items-center justify-center shrink-0">
                      <Leaf className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10.5px] font-extrabold uppercase tracking-[0.2em] text-berry">Know what's inside</p>
                      <h2 className="font-display font-extrabold text-base sm:text-lg text-ink leading-tight">Vitamin & Nutrition Table</h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLightbox({ src: product.tertiaryImage, alt: `${name} vitamin and nutrition table`, hideOriginal: true })}
                      className="h-9 px-3.5 rounded-full bg-berry/10 text-berry text-[10px] font-extrabold uppercase tracking-[0.14em] inline-flex items-center gap-1.5 hover:bg-berry hover:text-white transition-colors"
                    >
                      <ZoomIn className="h-3.5 w-3.5" /> Zoom
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLightbox({ src: product.tertiaryImage, alt: `${name} vitamin and nutrition table`, hideOriginal: true })}
                  className="block w-full rounded-[1.3rem] overflow-hidden border border-hairline bg-white cursor-zoom-in"
                  aria-label="View nutrition table full screen"
                >
                  <img
                    src={product.tertiaryImage}
                    alt={`${name} vitamin and nutrition table`}
                    loading="lazy"
                    decoding="async"
                    className="block w-full h-auto"
                  />
                </button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Customer reviews */}
        <ProductReviews
          reviews={reviews}
          loading={reviewsLoading}
          averageRating={product.averageRating || 0}
          reviewCount={product.reviewCount || 0}
        />

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mt-20 sm:mt-24 pt-14 sm:pt-16 border-t border-hairline">
            <div className="flex flex-col items-center text-center gap-3 mb-10">
              <span className="kicker text-berry inline-flex items-center gap-2 bg-white/70 backdrop-blur-md border border-berry/15 px-4 py-2 rounded-full">
                <UtensilsCrossed className="h-3.5 w-3.5" /> Pairs well with
              </span>
              <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-ink">
                You may also <span className="accent-text">like</span>
              </h2>
              <span className="rule-berry" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p.id || p._id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Recently viewed */}
        {recentlyViewed.length > 0 && (
          <section className="mt-16 sm:mt-20">
            <h2 className="font-display font-bold text-xl text-ink mb-5">Recently viewed</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {recentlyViewed.map(p => (
                <Link key={p.id} to={productPath(p)} className="group block rounded-2xl bg-white/85 border border-white p-1.5 shadow-[0_10px_24px_-18px_rgba(121,8,63,0.35)] hover:-translate-y-0.5 transition-transform">
                  <div className="aspect-video rounded-xl overflow-hidden bg-cream">
                    <img src={p.image || FallbackImg} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <p className="px-1.5 pt-2 pb-1 text-[11px] font-bold text-ink group-hover:text-berry line-clamp-1">{p.name}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>

      <AnimatePresence>
        {lightbox && <ImageLightbox src={lightbox.src} alt={lightbox.alt} hideOriginal={lightbox.hideOriginal} onClose={closeLightbox} />}
      </AnimatePresence>
    </div>
  );
}
