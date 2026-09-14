import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  ShoppingCart, Heart, Star, Truck, Shield, ArrowLeft, Package,
  Minus, Plus, Check, Leaf, Zap, Sparkles,
  Tag, X, TicketPercent, IndianRupee
} from 'lucide-react';
import FallbackImg from '../../assets/lan.png';
import { useCart } from '../../context/CartContext';
import { toast } from 'sonner';
import ProductDetailsSkeleton from '../../components/skeletons/ProductDetailsSkeleton';
import useSkeletonLoader from '../../hooks/useSkeletonLoader';
import SEO from '../../components/SEO';
import ProductCard from '../../components/ui/ProductCard';
import ProductReviews from '../../components/reviews/ProductReviews';

import { cachedFetch } from '../../lib/api';

const stagger = { visible: { transition: { staggerChildren: 0.09 } } };
const fadeUp = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } } };

const TRUST_PILLARS = [
  { icon: <Truck className="h-4.5 w-4.5 text-[#D7A94E]" />, label: 'Free Shipping ₹500+', sub: 'Sealed climate packs' },
  { icon: <Shield className="h-4.5 w-4.5 text-[#C21A75]" />, label: '100% Toxin-Free', sub: 'Lab certified batches' },
  { icon: <Leaf className="h-4.5 w-4.5 text-emerald-500" />, label: 'Pure Ingredients', sub: 'No preservatives' },
];

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const showSkeleton = useSkeletonLoader(loading);

  // ── Coupon State ──────────────────────────────────────────────
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [couponData, setCouponData] = useState(null);  // { code, discountType, discountValue, discountAmount }
  const [couponMsg, setCouponMsg] = useState('');

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    const token = localStorage.getItem('token');
    if (!token) { toast.error('Please login to apply a coupon'); navigate('/login', { state: { from: `/product/${id}` } }); return; }
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
        const json = await cachedFetch(`${import.meta.env.VITE_API_URL}/products/${id}`);
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
  }, [id]);

  // Reviews come from the post-delivery feedback flow (Order Tracking) — this
  // just loads whatever is already live for the product.
  useEffect(() => {
    let cancelled = false;
    const loadReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/reviews/product/${id}`);
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
  }, [id]);

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
      navigate('/login', { state: { from: `/product/${id}` } });
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
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }
    toggleWishlist(product);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden font-sans">
      <SEO
        title={name}
        description={product.description || `Premium toxin-free ${name} from Alimenture Industries.`}
        image={product.image || FallbackImg}
        url={`/product/${product.slug || product.id || product._id || id}`}
        jsonLd={{
          "@context": "https://schema.org/",
          "@type": "Product",
          "name": name,
          "image": product.image || FallbackImg,
          "description": product.description || `Premium toxin-free ${name} from Alimenture Industries.`,
          "sku": product.sku || product.id || id,
          "brand": {
            "@type": "Brand",
            "name": "Alimenture Industries"
          },
          "offers": {
            "@type": "Offer",
            "url": `${import.meta.env.VITE_APP_URL || 'https://alimenture.com'}/product/${product.slug || id}`,
            "priceCurrency": "INR",
            "price": displayPrice,
            "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            "itemCondition": "https://schema.org/NewCondition",
            "availability": isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
            "seller": {
              "@type": "Organization",
              "name": "Alimenture Industries"
            }
          }
        }}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-[1440px] py-24 sm:py-28 relative z-10">

        {/* Back Button */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-6 sm:mb-8">
          <Button
            onClick={() => navigate(-1)}
            className="rounded-full border border-hairline hover:border-[#A50D5A]/40 text-ink-soft hover:text-[#A50D5A] font-semibold text-xs h-9 px-4 glass-sm transition-all duration-300 flex items-center gap-1.5 shadow-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Shop
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">

          {/* ── LEFT: Image & Highlights Showcase Panel (Wider Column) ── */}
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="lg:col-span-7 space-y-6 lg:sticky lg:top-10">
            {/* Primary Main Image Box (Extra Wide & Deep) */}
            <div className="relative w-full h-[480px] sm:h-[580px] lg:h-[620px] rounded-[3.5rem] overflow-hidden bg-white border border-hairline shadow-[0_25px_65px_rgba(0,0,0,0.07)] p-2">
              <img
                src={activeImage || product.image || FallbackImg}
                alt={name}
                className="w-full h-full object-cover rounded-[3rem] hover:scale-105 transition-transform duration-[1.2s] ease-[0.16,1,0.3,1]"
              />
              {/* Golden "Original" badge */}
              <div className="absolute top-7 left-7">
                <span className="px-3.5 py-1.5 rounded-full bg-[#D7A94E] text-black font-extrabold uppercase text-[9px] tracking-wider shadow-md">
                  Original
                </span>
              </div>
              {/* Low stock urgent badge */}
              {isLowStock && (
                <div className="absolute top-7 right-7">
                  <span className="px-3.5 py-1.5 rounded-full bg-red-500 text-white font-extrabold text-[9px] uppercase tracking-wider shadow-md animate-pulse">
                    Only {selectedStock} left!
                  </span>
                </div>
              )}
              {/* Bottom gradient overlay */}
              <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-black/20 to-transparent pointer-events-none rounded-b-[3.5rem]" />
            </div>

            {/* Thumbnail Selectors */}
            {(() => {
              const thumbs = [
                { src: product.image, label: 'Main View' },
                product.secondaryImage && { src: product.secondaryImage, label: 'Alternate View' },
              ].filter(Boolean);
              if (thumbs.length < 2) return null;
              return (
                <div className="flex items-center gap-3 justify-center">
                  {thumbs.map((t, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImage(t.src)}
                      className={`w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all p-0.5 bg-white cursor-pointer ${
                        activeImage === t.src ? 'border-[#A50D5A] shadow-md scale-105' : 'border-hairline opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={t.src || FallbackImg} className="w-full h-full object-cover rounded-xl" alt={t.label} />
                    </button>
                  ))}
                </div>
              );
            })()}

            {/* Product Badge Chips (admin-managed) */}
            {Array.isArray(product.cleanBadges) && product.cleanBadges.length > 0 && (
              <div className="flex flex-wrap gap-2.5 justify-center">
                {product.cleanBadges.map((b, i) => (
                  <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-hairline text-[9px] font-extrabold text-ink-muted uppercase tracking-wider shadow-sm hover:border-[#D7A94E]/30 transition-colors duration-300">
                    {b.icon && <span className="text-sm">{b.icon}</span>} {b.label}
                  </span>
                ))}
              </div>
            )}

            {/* ── Description Card (admin-managed; hidden when empty) ── */}
            {product.secondaryDescription && (
              <div className="glass rounded-panel p-7 shadow-[0_12px_35px_rgba(0,0,0,0.04)] space-y-4 max-w-full overflow-hidden">
                <div className="flex items-center justify-between border-b border-hairline pb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-[#A50D5A]/10 text-[#A50D5A]">
                      <Sparkles className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="font-display font-extrabold text-base text-ink">Description</h3>
                      <p className="text-[10px] text-ink-muted font-bold uppercase tracking-wider">Crafted with Care</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-[#D7A94E] bg-[#D7A94E]/10 px-2.5 py-1 rounded-full border border-[#D7A94E]/20">100% Pure</span>
                </div>

                <p
                  className="text-sm text-ink-soft font-medium leading-relaxed whitespace-pre-line overflow-hidden w-full max-w-full"
                  style={{ overflowWrap: 'anywhere' }}
                >
                  {product.secondaryDescription}
                </p>
              </div>
            )}

            {/* ── VITAMIN / NUTRITION TABLE IMAGE (admin-managed; hidden when empty) ── */}
            {product.tertiaryImage && (
              <div className="relative w-full rounded-[2.5rem] overflow-hidden bg-white border border-hairline shadow-[0_15px_40px_rgba(0,0,0,0.05)] p-2.5 group mt-6">
                <div className="relative w-full h-[250px] sm:h-[320px] lg:h-[350px] rounded-[2rem] overflow-hidden bg-cream flex items-center justify-center">
                  <img
                    src={product.tertiaryImage}
                    alt={`${name} vitamin and nutrition table`}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-[#A50D5A] font-extrabold uppercase text-[9px] tracking-wider shadow-sm border border-hairline flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[#A50D5A]" /> Vitamin & Nutrition Table
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* ── RIGHT: Info Panel ── */}
          <motion.div initial="hidden" animate="visible" variants={stagger} className="lg:col-span-5">

            {/* Category */}
            <motion.div variants={fadeUp} className="mb-4">
              <Badge className="bg-[#D7A94E]/10 text-[#b89312] border border-[#D7A94E]/25 rounded-lg px-3 py-1 font-extrabold text-[10px] uppercase tracking-widest">
                {product.category || 'Biscuit'}
              </Badge>
            </motion.div>

            {/* Product Name */}
            <motion.h1 variants={fadeUp} className="font-display text-4xl sm:text-5xl font-extrabold text-[#221B1F] tracking-tight leading-tight mb-4">
              {name}
            </motion.h1>

            {/* Star Rating */}
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-8">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className={`h-4.5 w-4.5 ${star <= Math.round(product.averageRating || 0) ? 'fill-[#D7A94E] text-[#D7A94E]' : 'text-gray-200 fill-current'}`} />
                ))}
              </div>
              <span className="font-bold text-ink-muted text-xs">
                {product.reviewCount > 0
                  ? `${product.averageRating} · ${product.reviewCount} review${product.reviewCount === 1 ? '' : 's'}`
                  : 'No reviews yet'}
              </span>
            </motion.div>

            {/* ── Variant / Weight Selector ── */}
            {product.variants && product.variants.length > 0 && (
              <motion.div variants={fadeUp} className="mb-8">
                <p className="text-[10px] font-extrabold text-ink-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-[#D7A94E]" /> Select Pack Size
                </p>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((variant, idx) => {
                    const soldOut = variant.stock === 0;
                    const active = selectedVariant?.weight === variant.weight;
                    return (
                      <button
                        key={idx}
                        onClick={() => !soldOut && setSelectedVariant(variant)}
                        disabled={soldOut}
                        className={`relative px-5 py-3 rounded-2xl font-extrabold text-sm transition-all duration-300 border-2 group ${
                          soldOut
                            ? 'border-hairline text-ink-muted cursor-not-allowed bg-cream/50 line-through'
                            : active
                            ? 'border-[#D7A94E] bg-[#D7A94E]/5 text-[#221B1F] shadow-[0_6px_20px_rgba(212,175,55,0.15)]'
                            : 'border-hairline text-ink-muted hover:border-[#D7A94E]/50 hover:text-[#221B1F] bg-white'
                        }`}
                      >
                        {variant.weight}
                        {active && (
                          <span className="absolute -top-2 -right-2 w-4.5 h-4.5 bg-[#D7A94E] rounded-full flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-black" />
                          </span>
                        )}
                        {!soldOut && !active && (
                          <span className="block text-[8px] text-ink-muted font-bold mt-0.5">₹{variant.price}</span>
                        )}
                        {soldOut && (
                          <span className="block text-[7px] text-ink-muted font-bold mt-0.5">Out of stock</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── Price & Stock Status ── */}
            <motion.div variants={fadeUp} className="mb-8">
              <div className="flex items-baseline gap-4 mb-3">
                <span className="text-5xl font-extrabold text-[#C21A75]">₹{displayPrice}</span>
                {selectedVariant && product.variants && product.variants.length > 1 && (
                  <span className="text-sm text-ink-muted font-semibold">for {selectedVariant.weight}</span>
                )}
              </div>
              <p className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-widest mb-3">GST & All Taxes Inclusive</p>

              {/* Stock Indicator */}
              <AnimatePresence mode="wait">
                {isOutOfStock ? (
                  <motion.div key="out" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="inline-flex items-center gap-2 bg-cream-deep text-ink-muted px-4 py-2 rounded-xl font-extrabold uppercase text-[9px] tracking-widest border border-hairline">
                    <span className="h-2 w-2 rounded-full bg-gray-400" /> Out of Stock — Choose Another Size
                  </motion.div>
                ) : isLowStock ? (
                  <motion.div key="low" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl font-extrabold uppercase text-[9px] tracking-widest border border-red-100 animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" /> Hurry! Only {selectedStock} remaining
                  </motion.div>
                ) : (
                  <motion.div key="avail" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-extrabold uppercase text-[9px] tracking-widest border border-emerald-100">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> In Stock · {selectedStock} units ready
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* ── Quantity Selector ── */}
            {!isOutOfStock && (
              <motion.div variants={fadeUp} className="mb-8">
                <p className="text-[10px] font-extrabold text-ink-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-[#C21A75]" /> Quantity
                </p>
                <div className="flex items-center gap-5">
                  <div className="flex items-center border border-hairline rounded-2xl bg-white shadow-sm">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-11 h-11 flex items-center justify-center rounded-l-2xl hover:bg-cream transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Minus className="h-3.5 w-3.5 text-ink-muted" />
                    </button>
                    <span className="w-12 text-center text-base font-extrabold text-[#221B1F]">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                      disabled={quantity >= maxQty}
                      className="w-11 h-11 flex items-center justify-center rounded-r-2xl hover:bg-cream transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-3.5 w-3.5 text-ink-muted" />
                    </button>
                  </div>
                  <p className="text-xs text-ink-muted font-semibold">Max {maxQty} per order</p>
                </div>
              </motion.div>
            )}

            {/* ── CTA Buttons ── */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-10">
              <Button
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                size="lg"
                className={`w-full sm:flex-1 h-14 sm:h-16 rounded-2xl font-extrabold text-[11px] sm:text-[12px] uppercase tracking-[0.15em] shadow-lg transition-all duration-300 active:scale-95 ${
                  isOutOfStock
                    ? 'bg-cream-deep text-ink-muted cursor-not-allowed'
                    : 'btn-berry shadow-[0_8px_24px_rgba(146,0,117,0.3)] hover:shadow-[0_12px_32px_rgba(146,0,117,0.4)]'
                }`}
              >
                <ShoppingCart className="h-4.5 w-4.5 mr-2" />
                {isOutOfStock ? 'Out of Stock' : `Add ${quantity > 1 ? `${quantity}×` : ''} to Cart`}
              </Button>
              <Button
                onClick={handleWishlist}
                size="lg"
                variant="outline"
                className={`h-14 sm:h-16 w-full sm:w-16 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center gap-2 ${
                  inWishlist
                    ? 'bg-red-50 border-[#C21A75]/40 text-[#C21A75]'
                    : 'border-hairline text-ink-muted hover:border-[#C21A75]/40 hover:text-[#C21A75] hover:bg-red-50/50 bg-white'
                }`}
              >
                <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
                <span className="sm:hidden font-bold text-xs">{inWishlist ? 'In Wishlist' : 'Add to Wishlist'}</span>
              </Button>
            </motion.div>

            {/* ── Apply Coupon ── */}
            <motion.div variants={fadeUp} className="mb-8">
              <AnimatePresence mode="wait">
                {couponData ? (
                  /* Applied state */
                  <motion.div
                    key="applied"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className="relative overflow-hidden rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/50 p-4"
                  >
                    {/* Decorative corner glow */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-300/20 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-start justify-between gap-3 relative">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-emerald-100 border border-emerald-200 shrink-0 mt-0.5">
                          <TicketPercent className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-extrabold text-sm text-emerald-700 tracking-widest">{couponData.code}</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-[9px] font-extrabold uppercase text-emerald-600 tracking-wider">Applied</span>
                          </div>
                          <p className="text-xs text-emerald-600 font-semibold mb-2">{couponMsg}</p>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-xs font-semibold text-ink-muted">
                              <span>Price:</span>
                              <span className="line-through text-ink-muted">₹{(displayPrice * quantity).toFixed(0)}</span>
                            </div>
                            <span className="text-ink-muted">→</span>
                            <div className="flex items-center gap-1 text-sm font-extrabold text-emerald-700">
                              <IndianRupee className="h-3 w-3" />
                              <span>{couponData.finalAmount}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-[#A50D5A]/5 border border-[#A50D5A]/15 text-[9px] font-extrabold text-[#A50D5A] uppercase">
                              Save ₹{couponData.discountAmount}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-400 hover:text-emerald-600 transition-all shrink-0 mt-0.5"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* Input state */
                  <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <p className="text-[10px] font-extrabold text-ink-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Tag className="h-3 w-3 text-[#A50D5A]" /> Have a Coupon Code?
                    </p>
                    <div className={`flex items-center gap-2.5 p-1.5 rounded-2xl border-2 bg-white transition-all duration-300 ${
                      couponStatus === 'error' ? 'border-red-200 bg-red-50/30' : 'border-hairline hover:border-[#A50D5A]/25 focus-within:border-[#A50D5A]/40'
                    }`}>
                      <div className="flex-1 flex items-center gap-2 pl-3">
                        <TicketPercent className={`h-4 w-4 shrink-0 ${couponStatus === 'error' ? 'text-red-400' : 'text-ink-muted'}`} />
                        <input
                          type="text"
                          value={couponCode}
                          onChange={e => { setCouponCode(e.target.value.toUpperCase()); if (couponStatus === 'error') setCouponStatus(null); }}
                          onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                          placeholder="Enter coupon code"
                          className="w-full bg-transparent font-mono font-bold text-sm text-ink placeholder:text-ink-muted placeholder:font-sans placeholder:font-normal focus:outline-none uppercase tracking-widest"
                          disabled={couponStatus === 'loading'}
                        />
                      </div>
                      <button
                        onClick={handleApplyCoupon}
                        disabled={!couponCode.trim() || couponStatus === 'loading'}
                        className="px-5 py-2.5 rounded-xl btn-berry text-white font-extrabold text-[11px] uppercase tracking-[0.12em] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none shrink-0"
                      >
                        {couponStatus === 'loading' ? (
                          <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 animate-spin" /> Checking…</span>
                        ) : 'Apply'}
                      </button>
                    </div>
                    {/* Error message */}
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

            {/* ── Trust Pillars Row ── */}
            <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
              {TRUST_PILLARS.map((p, i) => (
                <div key={i} className="flex flex-row sm:flex-col items-center sm:text-center p-3.5 sm:p-4 glass-sm rounded-2xl shadow-sm hover:border-[#D7A94E]/25 hover:shadow-md transition-all duration-300 gap-3 sm:gap-0">
                  <div className="sm:mb-2 shrink-0">{p.icon}</div>
                  <div>
                    <p className="font-extrabold text-[10px] sm:text-[9px] text-[#221B1F] uppercase tracking-wider leading-tight sm:mb-0.5">{p.label}</p>
                    <p className="text-[9px] sm:text-[8px] text-ink-muted font-semibold">{p.sub}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* ── Description Accordion ── */}
            <motion.div variants={fadeUp}>
              <div className="glass rounded-card overflow-hidden shadow-sm">

                {Array.isArray(product.cleanPromises) && product.cleanPromises.length > 0 && (
                  <div className="px-7 py-5">
                    <p className="font-extrabold text-sm text-[#221B1F] uppercase tracking-wider mb-4">Clean Promises</p>
                    <ul className="grid grid-cols-1 gap-2.5">
                      {product.cleanPromises.map((f, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-semibold text-ink-soft">
                          <span className="flex-shrink-0 h-5 w-5 rounded-full bg-[#D7A94E]/10 border border-[#D7A94E]/25 flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-[#D7A94E]" />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Variants Stock Summary */}
                {product.variants && product.variants.length > 0 && (
                  <div className="border-t border-gray-50 px-7 py-5">
                    <p className="font-extrabold text-sm text-[#221B1F] uppercase tracking-wider mb-4">Pack Availability</p>
                    <div className="space-y-2.5">
                      {product.variants.map((v, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="font-bold text-ink-soft">{v.weight}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-[#C21A75]">₹{v.price}</span>
                            {v.stock === 0 ? (
                              <span className="text-[9px] font-extrabold text-ink-muted uppercase tracking-wider px-2.5 py-0.5 bg-cream rounded-full border border-hairline">Out of Stock</span>
                            ) : v.stock < 10 ? (
                              <span className="text-[9px] font-extrabold text-red-500 uppercase tracking-wider px-2.5 py-0.5 bg-red-50 rounded-full border border-red-100">{v.stock} left</span>
                            ) : (
                              <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-wider px-2.5 py-0.5 bg-emerald-50 rounded-full border border-emerald-100">Available</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

          </motion.div>
        </div>

        {/* --- Customer Reviews --- */}
        <ProductReviews
          reviews={reviews}
          loading={reviewsLoading}
          averageRating={product.averageRating || 0}
          reviewCount={product.reviewCount || 0}
        />

        {/* --- Phase 8: Related Products --- */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 pt-16 border-t border-hairline">
            <h3 className="text-2xl font-extrabold mb-8 text-center uppercase tracking-widest">You May Also Like</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p.id || p._id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* --- Phase 8: Recently Viewed --- */}
        {recentlyViewed.length > 0 && (
          <div className="mt-20">
            <h3 className="text-xl font-bold mb-6 text-ink-muted text-center tracking-wide">Recently Viewed</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {recentlyViewed.map(p => (
                <Link key={p.id} to={`/product/${p.id}`} className="block group">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-white border border-hairline mb-2">
                    <img src={p.image || FallbackImg} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <p className="text-[10px] font-bold text-ink group-hover:text-[#A50D5A] line-clamp-2">{p.name}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}