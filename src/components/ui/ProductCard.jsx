import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Heart, ArrowUpRight, ShoppingCart, Star } from 'lucide-react';
import FallbackImg from '../../assets/lan.webp';
import { useCart } from '../../context/CartContext';
import { productPath, displayName } from '../../lib/seo';

/**
 * Product photo frame: a 16:9 window the photo always fills edge-to-edge
 * (no letterbox bands). Catalogue shots are 16:9, so they fit exactly; other
 * shapes are trimmed evenly around the centre.
 */
export function ProductImageFrame({ src, alt, className = '', aspect = 'aspect-video', children }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`relative ${aspect} w-full overflow-hidden bg-cream-deep ${className}`}>
      {!loaded && <div className="absolute inset-0 bg-gradient-to-br from-cream-deep to-berry-tint animate-pulse" />}
      <img
        src={src || FallbackImg}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover object-center transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06] ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#2A1520]/25 via-transparent to-transparent pointer-events-none" />
      {children}
    </div>
  );
}

/**
 * Storefront product card (Shop page + homepage catalog).
 * `onAdd` / `onWishlist` let a page plug in its own quick-add flow; without
 * them the card opens the product page / toggles the wishlist directly.
 */
export default function ProductCard({ product, onAdd, onWishlist, addLabel }) {
  const { toggleWishlist: toggleWishlistCtx, isInWishlist: isInWishlistCtx } = useCart();
  const navigate = useNavigate();
  const still = useReducedMotion();

  const itemId = product.id || product._id;
  const isInWishlist = isInWishlistCtx(itemId);
  const name = product.name || product.title;

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onWishlist) onWishlist(product);
    else toggleWishlistCtx(product);
  };

  const handleAddClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAdd) onAdd(product);
    // Products have variants, so the default is the details page to pick one.
    else navigate(productPath(product));
  };

  const hasVariants = product.variants && product.variants.length > 0;
  // The cheapest variant drives the shown price and its (admin-set) MRP strike-through.
  const cheapest = hasVariants
    ? product.variants.reduce((a, v) => (Number(v.price) < Number(a.price) ? v : a))
    : { price: product.price, mrp: product.mrp };
  const price = Number(cheapest.price) || 0;
  const mrp = Number(cheapest.mrp) || 0;
  const showMrp = mrp > price;
  const discount = showMrp ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const fromPrefix = hasVariants && product.variants.length > 1;

  const isOutOfStock = hasVariants
    ? product.variants.every(v => v.stock === 0)
    : product.stock === 0;

  // Only real review aggregates (set by the backend on approved reviews) are shown.
  const reviewCount = Number(product.reviewCount) || 0;
  const rating = Number(product.averageRating) || 0;
  const weights = hasVariants ? product.variants.map((v) => v.weight).filter(Boolean) : [];

  return (
    <motion.article
      layout
      initial={still ? false : { opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col w-full h-full rounded-[24px] bg-white border border-hairline/80 shadow-[0_10px_28px_-18px_rgba(121,8,63,0.28),0_1px_3px_rgba(34,27,31,0.04)] hover:border-berry/20 hover:shadow-[0_26px_50px_-24px_rgba(121,8,63,0.42)] hover:-translate-y-1 transition-[transform,box-shadow,border-color] duration-500 ease-soft"
    >
      {/* ── Image ── */}
      <Link to={productPath(product)} className="block p-1.5 sm:p-2 pb-0 sm:pb-0" aria-label={name}>
        <ProductImageFrame src={product.image} alt={`Alimenture ${displayName(name)}`} aspect="aspect-[4/3] sm:aspect-video" className="rounded-[18px]">
          {showMrp && !isOutOfStock && (
            <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 inline-flex items-center h-5 sm:h-6 px-2 sm:px-2.5 rounded-full bg-berry text-white text-[10px] sm:text-[11px] font-extrabold tracking-wide shadow-[0_6px_14px_-6px_rgba(165,13,90,0.8)] z-20">
              {discount}% OFF
            </span>
          )}

          {!isOutOfStock && (
            <span className="hidden sm:inline-flex absolute bottom-2.5 right-2.5 items-center gap-1 h-7 px-3 rounded-full bg-white/90 backdrop-blur-md text-ink text-[10.5px] font-bold translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20">
              View details <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 bg-cream/60 backdrop-blur-[2px] flex items-center justify-center z-20">
              <span className="px-4 h-8 inline-flex items-center rounded-full bg-ink/85 text-white text-[10px] font-extrabold uppercase tracking-[0.14em]">
                Sold out
              </span>
            </div>
          )}
        </ProductImageFrame>
      </Link>

      <motion.button
        onClick={handleWishlist}
        aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={isInWishlist}
        whileTap={still ? undefined : { scale: 0.85 }}
        className={`absolute top-3 right-3 sm:top-4 sm:right-4 h-7 w-7 sm:h-9 sm:w-9 rounded-full flex items-center justify-center transition-all duration-300 z-30 shadow-[0_6px_16px_-6px_rgba(0,0,0,0.3)] ${
          isInWishlist
            ? 'btn-berry border-transparent'
            : 'bg-white/90 backdrop-blur-md border border-white hover:scale-110'
        }`}
      >
        <Heart
          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-all duration-300 ${
            isInWishlist ? 'fill-white text-white' : 'text-ink-soft hover:text-berry'
          }`}
        />
      </motion.button>

      {/* ── Body ── */}
      <div className="px-3 sm:px-4 pt-3 sm:pt-3.5 flex-1 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="truncate text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.14em] text-gold">
            {product.category || 'Product'}
          </span>
          {reviewCount > 0 && (
            <span
              className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-ink-soft"
              aria-label={`Rated ${rating} out of 5 from ${reviewCount} review${reviewCount === 1 ? '' : 's'}`}
            >
              <Star className="h-3 w-3 fill-gold-light text-gold-light" />
              {rating}
              <span className="font-medium text-ink-muted">({reviewCount})</span>
            </span>
          )}
        </div>

        <Link to={productPath(product)} className="min-w-0">
          <h3 className="font-display font-bold text-ink text-[14px] sm:text-[16.5px] leading-snug tracking-tight group-hover:text-berry transition-colors duration-300 line-clamp-2 min-h-[2.6em]">
            {name}
          </h3>
        </Link>

        {product.description && (
          <div className="hidden sm:block">
            <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed font-medium">
              {product.description}
            </p>
          </div>
        )}

        {weights.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 pt-0.5">
            {weights.slice(0, 3).map((w) => (
              <span key={w} className="h-5 px-2 inline-flex items-center rounded-md bg-cream border border-hairline text-[10px] font-semibold text-ink-soft">
                {w}
              </span>
            ))}
            {weights.length > 3 && (
              <span className="text-[10px] font-semibold text-ink-muted">+{weights.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* ── Price + action ── */}
      <div className="mx-3 sm:mx-4 mt-3 py-3 border-t border-hairline flex items-end justify-between gap-2">
        <div className="min-w-0">
          {fromPrefix && (
            <p className="text-[10px] font-semibold text-ink-muted leading-none mb-1">From</p>
          )}
          <p className="flex items-baseline flex-wrap gap-x-1.5 leading-none">
            <span className="font-display font-extrabold text-ink text-base sm:text-xl tracking-tight whitespace-nowrap">₹{price}</span>
            {showMrp && (
              <s className="text-[11px] font-semibold text-ink-muted" aria-label={`MRP ₹${mrp}`}>₹{mrp}</s>
            )}
          </p>
          {showMrp && !isOutOfStock && (
            <p className="mt-1 text-[10.5px] font-bold text-leaf leading-none">Save ₹{mrp - price}</p>
          )}
        </div>

        <motion.button
          whileTap={still ? undefined : { scale: 0.94 }}
          onClick={handleAddClick}
          disabled={isOutOfStock}
          aria-label={isOutOfStock ? 'Sold out' : `${addLabel || 'Select'} ${name}`}
          className={`group/add shrink-0 h-9 sm:h-10 min-w-[36px] sm:min-w-[40px] px-2 sm:px-4 rounded-xl text-[11px] font-extrabold uppercase tracking-[0.1em] inline-flex items-center justify-center gap-1.5 transition-all ${
            isOutOfStock
              ? 'bg-cream border border-hairline text-ink-muted cursor-not-allowed'
              : 'btn-berry'
          }`}
        >
          <ShoppingCart className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover/add:-rotate-12" />
          <span className="hidden sm:inline">{isOutOfStock ? 'Sold out' : (addLabel || 'Select')}</span>
        </motion.button>
      </div>
    </motion.article>
  );
}
