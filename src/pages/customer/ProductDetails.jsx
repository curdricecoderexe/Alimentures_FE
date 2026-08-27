import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  ShoppingCart, Heart, Star, Truck, Shield, ArrowLeft, Package,
  Minus, Plus, Check, Leaf, Zap, Sparkles, ChevronDown, ChevronUp,
  Tag, X, TicketPercent, IndianRupee
} from 'lucide-react';
import FallbackImg from '../../assets/lan.png';
import { useCart } from '../../context/CartContext';
import { toast } from 'sonner';
import ProductDetailsSkeleton from '../../components/skeletons/ProductDetailsSkeleton';
import useSkeletonLoader from '../../hooks/useSkeletonLoader';
import SEO from '../../components/SEO';
import ProductCard from '../../components/ui/ProductCard';

import { cachedFetch } from '../../lib/api';

const stagger = { visible: { transition: { staggerChildren: 0.09 } } };
const fadeUp = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } } };

const CLEAN_BADGES = [
  { icon: '🌾', label: 'Heritage Grains' },
  { icon: '🚫', label: 'Zero Maida' },
  { icon: '🍯', label: 'Palm Sugar Only' },
  { icon: '🔬', label: 'Lab Toxin-Free' },
];

const TRUST_PILLARS = [
  { icon: <Truck className="h-4.5 w-4.5 text-[#D4AF37]" />, label: 'Free Shipping ₹500+', sub: 'Sealed climate packs' },
  { icon: <Shield className="h-4.5 w-4.5 text-[#E91E8C]" />, label: '100% Toxin-Free', sub: 'Lab certified batches' },
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
  const [descExpanded, setDescExpanded] = useState(false);
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

  // Reset quantity when variant changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant]);

  if (loading) {
    if (showSkeleton) return <ProductDetailsSkeleton />;
    return <div className="min-h-screen bg-[#FDFBF7]"></div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F5] gap-5">
        <SEO title="Product Not Found" noindex={true} />
        <Package className="w-20 h-20 text-[#D4AF37]/40" />
        <h2 className="text-2xl font-display font-black text-[#0a0806]">Product Not Found</h2>
        <Button onClick={() => navigate(-1)} className="rounded-2xl bg-[#0a0806] hover:bg-[#D4AF37] text-white hover:text-black font-black uppercase text-[11px] tracking-[0.2em] h-12 px-8 transition-all duration-300">
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
    <div className="min-h-screen bg-[#FDFBF7] relative overflow-x-hidden font-sans">
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
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-[#920075]/4 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-[#D4AF37]/4 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-[1440px] py-24 sm:py-28 relative z-10">

        {/* Back Button */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-6 sm:mb-8">
          <Button
            onClick={() => navigate(-1)}
            className="rounded-full border border-gray-200 hover:border-[#920075]/40 text-gray-700 hover:text-[#920075] font-semibold text-xs h-9 px-4 bg-white/80 backdrop-blur-sm transition-all duration-300 flex items-center gap-1.5 shadow-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Shop
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">

          {/* ── LEFT: Image & Highlights Showcase Panel (Wider Column) ── */}
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="lg:col-span-7 space-y-6 lg:sticky lg:top-10">
            {/* Primary Main Image Box (Extra Wide & Deep) */}
            <div className="relative w-full h-[480px] sm:h-[580px] lg:h-[620px] rounded-[3.5rem] overflow-hidden bg-white border border-gray-150 shadow-[0_25px_65px_rgba(0,0,0,0.07)] p-2">
              <img
                src={activeImage || product.image || FallbackImg}
                alt={name}
                className="w-full h-full object-cover rounded-[3rem] hover:scale-105 transition-transform duration-[1.2s] ease-[0.16,1,0.3,1]"
              />
              {/* Golden "Original" badge */}
              <div className="absolute top-7 left-7">
                <span className="px-3.5 py-1.5 rounded-full bg-[#D4AF37] text-black font-black uppercase text-[9px] tracking-wider shadow-md">
                  Original
                </span>
              </div>
              {/* Low stock urgent badge */}
              {isLowStock && (
                <div className="absolute top-7 right-7">
                  <span className="px-3.5 py-1.5 rounded-full bg-red-500 text-white font-black text-[9px] uppercase tracking-wider shadow-md animate-pulse">
                    Only {selectedStock} left!
                  </span>
                </div>
              )}
              {/* Bottom gradient overlay */}
              <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-black/20 to-transparent pointer-events-none rounded-b-[3.5rem]" />
            </div>

            {/* Thumbnail Selectors (if secondary image or multiple views exist) */}
            {(product.secondaryImage || product.image) && (
              <div className="flex items-center gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setActiveImage(product.image)}
                  className={`w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all p-0.5 bg-white cursor-pointer ${
                    activeImage === product.image ? 'border-[#920075] shadow-md scale-105' : 'border-gray-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={product.image || FallbackImg} className="w-full h-full object-cover rounded-xl" alt="Main View" />
                </button>
                {product.secondaryImage && (
                  <button
                    type="button"
                    onClick={() => setActiveImage(product.secondaryImage)}
                    className={`w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all p-0.5 bg-white cursor-pointer ${
                      activeImage === product.secondaryImage ? 'border-[#920075] shadow-md scale-105' : 'border-gray-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={product.secondaryImage} className="w-full h-full object-cover rounded-xl" alt="Secondary View" />
                  </button>
                )}
              </div>
            )}

            {/* Clean Food Promise Chips */}
            <div className="flex flex-wrap gap-2.5 justify-center">
              {CLEAN_BADGES.map((b, i) => (
                <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-150 text-[9px] font-black text-gray-500 uppercase tracking-wider shadow-sm hover:border-[#D4AF37]/30 transition-colors duration-300">
                  <span className="text-sm">{b.icon}</span> {b.label}
                </span>
              ))}
            </div>

            {/* ── Secondary Description & Product Highlights Card ── */}
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-7 shadow-[0_12px_35px_rgba(0,0,0,0.04)] space-y-4 max-w-full overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-[#920075]/10 text-[#920075]">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-base text-gray-900">Product Highlights</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Crafted with Care</p>
                  </div>
                </div>
                <span className="text-xs font-black text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-full border border-[#D4AF37]/20">100% Pure</span>
              </div>
              
              <p 
                className="text-sm text-gray-600 font-medium leading-relaxed break-all whitespace-pre-line overflow-hidden w-full max-w-full"
                style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}
              >
                {product.secondaryDescription || 'Artisanally prepared using heritage grains and natural wholesome sweeteners. Perfect balance of authentic flavor, crisp texture, and pure unrefined nourishment.'}
              </p>

              <div className="pt-2 grid grid-cols-2 gap-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" /> 0% Preservatives
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                  <span className="h-2 w-2 rounded-full bg-[#920075] shrink-0" /> Hand-baked Batch
                </div>
              </div>
            </div>

            {/* ── SHOWCASE IMAGE BANNER (MINIMIZED SIZE AT BOTTOM AFTER PRODUCT HIGHLIGHTS) ── */}
            {(() => {
              const displayBannerImg = product.secondaryImage || product.image || FallbackImg;
              return (
                <div className="relative w-full rounded-[2.5rem] overflow-hidden bg-white border border-gray-150 shadow-[0_15px_40px_rgba(0,0,0,0.05)] p-2.5 group mt-6">
                  <div className="relative w-full h-[250px] sm:h-[320px] lg:h-[350px] rounded-[2rem] overflow-hidden bg-[#FAF8F5] flex items-center justify-center">
                    <img
                      src={displayBannerImg}
                      alt={`${name} showcase view`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-[#920075] font-black uppercase text-[9px] tracking-wider shadow-sm border border-gray-100 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-[#920075]" /> Gallery View
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>

          {/* ── RIGHT: Info Panel ── */}
          <motion.div initial="hidden" animate="visible" variants={stagger} className="lg:col-span-5">

            {/* Category */}
            <motion.div variants={fadeUp} className="mb-4">
              <Badge className="bg-[#D4AF37]/10 text-[#b89312] border border-[#D4AF37]/25 rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-widest">
                {product.category || 'Biscuit'}
              </Badge>
            </motion.div>

            {/* Product Name */}
            <motion.h1 variants={fadeUp} className="font-display text-4xl sm:text-5xl font-black text-[#0a0806] tracking-tight leading-tight mb-4">
              {name}
            </motion.h1>

            {/* Star Rating */}
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-8">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className={`h-4.5 w-4.5 ${star <= Math.floor(product.rating || 4.5) ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-200 fill-current'}`} />
                ))}
              </div>
              <span className="font-bold text-gray-400 text-xs">{product.rating || '4.5'} · {product.reviews || 0} reviews</span>
            </motion.div>

            {/* ── Variant / Weight Selector ── */}
            {product.variants && product.variants.length > 0 && (
              <motion.div variants={fadeUp} className="mb-8">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-[#D4AF37]" /> Select Pack Size
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
                        className={`relative px-5 py-3 rounded-2xl font-black text-sm transition-all duration-300 border-2 group ${
                          soldOut
                            ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50/50 line-through'
                            : active
                            ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-[#0a0806] shadow-[0_6px_20px_rgba(212,175,55,0.15)]'
                            : 'border-gray-150 text-gray-500 hover:border-[#D4AF37]/50 hover:text-[#0a0806] bg-white'
                        }`}
                      >
                        {variant.weight}
                        {active && (
                          <span className="absolute -top-2 -right-2 w-4.5 h-4.5 bg-[#D4AF37] rounded-full flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-black" />
                          </span>
                        )}
                        {!soldOut && !active && (
                          <span className="block text-[8px] text-gray-400 font-bold mt-0.5">₹{variant.price}</span>
                        )}
                        {soldOut && (
                          <span className="block text-[7px] text-gray-300 font-bold mt-0.5">Out of stock</span>
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
                <span className="text-5xl font-black text-[#E91E8C]">₹{displayPrice}</span>
                {selectedVariant && product.variants && product.variants.length > 1 && (
                  <span className="text-sm text-gray-400 font-semibold">for {selectedVariant.weight}</span>
                )}
              </div>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3">GST & All Taxes Inclusive</p>

              {/* Stock Indicator */}
              <AnimatePresence mode="wait">
                {isOutOfStock ? (
                  <motion.div key="out" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="inline-flex items-center gap-2 bg-gray-100 text-gray-500 px-4 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest border border-gray-200">
                    <span className="h-2 w-2 rounded-full bg-gray-400" /> Out of Stock — Choose Another Size
                  </motion.div>
                ) : isLowStock ? (
                  <motion.div key="low" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest border border-red-100 animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" /> Hurry! Only {selectedStock} remaining
                  </motion.div>
                ) : (
                  <motion.div key="avail" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest border border-emerald-100">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> In Stock · {selectedStock} units ready
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* ── Quantity Selector ── */}
            {!isOutOfStock && (
              <motion.div variants={fadeUp} className="mb-8">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-[#E91E8C]" /> Quantity
                </p>
                <div className="flex items-center gap-5">
                  <div className="flex items-center border border-gray-150 rounded-2xl bg-white shadow-sm">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-11 h-11 flex items-center justify-center rounded-l-2xl hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Minus className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                    <span className="w-12 text-center text-base font-black text-[#0a0806]">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                      disabled={quantity >= maxQty}
                      className="w-11 h-11 flex items-center justify-center rounded-r-2xl hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 font-semibold">Max {maxQty} per order</p>
                </div>
              </motion.div>
            )}

            {/* ── CTA Buttons ── */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-10">
              <Button
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                size="lg"
                className={`w-full sm:flex-1 h-14 sm:h-16 rounded-2xl font-black text-[11px] sm:text-[12px] uppercase tracking-[0.15em] shadow-lg transition-all duration-300 active:scale-95 ${
                  isOutOfStock
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-[#920075] hover:bg-[#7a0062] text-white shadow-[0_8px_24px_rgba(146,0,117,0.3)] hover:shadow-[0_12px_32px_rgba(146,0,117,0.4)]'
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
                    ? 'bg-red-50 border-[#E91E8C]/40 text-[#E91E8C]'
                    : 'border-gray-150 text-gray-400 hover:border-[#E91E8C]/40 hover:text-[#E91E8C] hover:bg-red-50/50 bg-white'
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
                            <span className="font-mono font-black text-sm text-emerald-700 tracking-widest">{couponData.code}</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-[9px] font-black uppercase text-emerald-600 tracking-wider">Applied</span>
                          </div>
                          <p className="text-xs text-emerald-600 font-semibold mb-2">{couponMsg}</p>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-xs font-semibold text-gray-500">
                              <span>Price:</span>
                              <span className="line-through text-gray-400">₹{(displayPrice * quantity).toFixed(0)}</span>
                            </div>
                            <span className="text-gray-300">→</span>
                            <div className="flex items-center gap-1 text-sm font-black text-emerald-700">
                              <IndianRupee className="h-3 w-3" />
                              <span>{couponData.finalAmount}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-[#920075]/5 border border-[#920075]/15 text-[9px] font-black text-[#920075] uppercase">
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
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Tag className="h-3 w-3 text-[#920075]" /> Have a Coupon Code?
                    </p>
                    <div className={`flex items-center gap-2.5 p-1.5 rounded-2xl border-2 bg-white transition-all duration-300 ${
                      couponStatus === 'error' ? 'border-red-200 bg-red-50/30' : 'border-gray-100 hover:border-[#920075]/25 focus-within:border-[#920075]/40'
                    }`}>
                      <div className="flex-1 flex items-center gap-2 pl-3">
                        <TicketPercent className={`h-4 w-4 shrink-0 ${couponStatus === 'error' ? 'text-red-400' : 'text-gray-300'}`} />
                        <input
                          type="text"
                          value={couponCode}
                          onChange={e => { setCouponCode(e.target.value.toUpperCase()); if (couponStatus === 'error') setCouponStatus(null); }}
                          onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                          placeholder="Enter coupon code"
                          className="w-full bg-transparent font-mono font-bold text-sm text-gray-800 placeholder:text-gray-300 placeholder:font-sans placeholder:font-normal focus:outline-none uppercase tracking-widest"
                          disabled={couponStatus === 'loading'}
                        />
                      </div>
                      <button
                        onClick={handleApplyCoupon}
                        disabled={!couponCode.trim() || couponStatus === 'loading'}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#920075] to-[#C41E6B] text-white font-black text-[11px] uppercase tracking-[0.12em] shadow-md shadow-[#920075]/25 hover:shadow-lg hover:shadow-[#920075]/35 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none shrink-0"
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
                <div key={i} className="flex flex-row sm:flex-col items-center sm:text-center p-3.5 sm:p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-[#D4AF37]/25 hover:shadow-md transition-all duration-300 gap-3 sm:gap-0">
                  <div className="sm:mb-2 shrink-0">{p.icon}</div>
                  <div>
                    <p className="font-black text-[10px] sm:text-[9px] text-[#0a0806] uppercase tracking-wider leading-tight sm:mb-0.5">{p.label}</p>
                    <p className="text-[9px] sm:text-[8px] text-gray-400 font-semibold">{p.sub}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* ── Description Accordion ── */}
            <motion.div variants={fadeUp}>
              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">

                {/* Description */}
                <button
                  onClick={() => setDescExpanded(prev => !prev)}
                  className="w-full flex items-center justify-between px-7 py-5 hover:bg-gray-50/50 transition-colors"
                >
                  <span className="font-black text-sm text-[#0a0806] uppercase tracking-wider">Product Description</span>
                  {descExpanded ? <ChevronUp className="h-4 w-4 text-[#D4AF37]" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </button>
                <AnimatePresence>
                  {descExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="px-7 pb-6 text-gray-500 text-sm leading-relaxed border-t border-gray-50">
                        <div 
                          className="pt-4 break-all whitespace-pre-line overflow-hidden w-full max-w-full"
                          style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}
                        >
                          {product.description || 'Premium quality organic biscuits crafted with zero preservatives, ancient heritage grains, and pure natural sweeteners.'}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="border-t border-gray-50 px-7 py-5">
                  <p className="font-black text-sm text-[#0a0806] uppercase tracking-wider mb-4">Clean Promises</p>
                  <ul className="grid grid-cols-1 gap-2.5">
                    {['100% Heritage Grain Base', 'Zero Refined White Sugar', 'No Maida or Refined Flour', 'No Artificial Preservatives', 'Oven-Baked, Not Fried', 'Eco-Friendly Packaging'].map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-semibold text-gray-600">
                        <span className="flex-shrink-0 h-5 w-5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/25 flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 text-[#D4AF37]" />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Variants Stock Summary */}
                {product.variants && product.variants.length > 0 && (
                  <div className="border-t border-gray-50 px-7 py-5">
                    <p className="font-black text-sm text-[#0a0806] uppercase tracking-wider mb-4">Pack Availability</p>
                    <div className="space-y-2.5">
                      {product.variants.map((v, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="font-bold text-gray-700">{v.weight}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-[#E91E8C]">₹{v.price}</span>
                            {v.stock === 0 ? (
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider px-2.5 py-0.5 bg-gray-50 rounded-full border border-gray-100">Out of Stock</span>
                            ) : v.stock < 10 ? (
                              <span className="text-[9px] font-black text-red-500 uppercase tracking-wider px-2.5 py-0.5 bg-red-50 rounded-full border border-red-100">{v.stock} left</span>
                            ) : (
                              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider px-2.5 py-0.5 bg-emerald-50 rounded-full border border-emerald-100">Available</span>
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

        {/* --- Phase 8: Related Products --- */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 pt-16 border-t border-gray-100">
            <h3 className="text-2xl font-black mb-8 text-center uppercase tracking-widest">You May Also Like</h3>
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
            <h3 className="text-xl font-bold mb-6 text-gray-500 text-center tracking-wide">Recently Viewed</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {recentlyViewed.map(p => (
                <Link key={p.id} to={`/product/${p.id}`} className="block group">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-white border border-gray-100 mb-2">
                    <img src={p.image || FallbackImg} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <p className="text-[10px] font-bold text-gray-900 group-hover:text-[#920075] line-clamp-2">{p.name}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}