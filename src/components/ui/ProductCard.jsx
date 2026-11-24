import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Heart, Star } from 'lucide-react';
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
    <div className={`relative ${aspect} w-full overflow-hidden plate-sandal ${className}`}>
      {!loaded && <div className="absolute inset-0 bg-gradient-to-br from-cream-deep to-cream animate-pulse" />}
      <img
        src={src || FallbackImg}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover object-center transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06] ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#2A0A24]/25 via-transparent to-transparent pointer-events-none" />
      {children}
    </div>
  );
}

/**
 * Storefront product card (Shop page, homepage catalog, related products).
 * Zouk-style: white card with a hairline border, edge-to-edge photo, grey tag,
 * two-line name, price row (₹ · struck MRP · green % OFF), full-width button.
 * `onAdd` / `onWishlist` let a page plug in its own quick-add flow; without
 * them the card opens the product page / toggles the wishlist directly.
 */
export default function ProductCard({ product, onAdd, onWishlist }) {
  const { toggleWishlist: toggleWishlistCtx, isInWishlist: isInWishlistCtx } = useCart();
  const navigate = useNavigate();
  const still = useReducedMotion();

  const itemId = product.id || product._id;
  const isInWishlist = isInWishlistCtx(itemId);
  const name = displayName(product.name || product.title);

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
    ? product.variants.every((v) => v.stock === 0)
    : product.stock === 0;

  // Only real review aggregates (set by the backend on approved reviews) are shown.
  const reviewCount = Number(product.reviewCount) || 0;
  const rating = Number(product.averageRating) || 0;
  const tag = product.tagline || product.category || 'Alimenture';
  const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

  return (
    <motion.article
      initial={still ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col w-full h-full overflow-hidden rounded-[22px] bg-white border border-[#ECE6DA] transition-[border-color,box-shadow] duration-300 hover:border-[#E0D6C4] hover:shadow-[0_18px_40px_-28px_rgba(43,11,51,0.35)]"
    >
      {/* ── Photo (edge to edge) ── */}
      <Link to={productPath(product)} className="relative block aspect-[4/3] overflow-hidden bg-cream" aria-label={name}>
        <ProductPhoto src={product.image} alt={`Alimenture ${name}`} />

        {reviewCount > 0 && (
          <span
            className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 h-6 px-2 rounded-full bg-white/95 text-[12px] font-semibold text-ink shadow-sm"
            aria-label={`Rated ${rating} out of 5 from ${reviewCount} review${reviewCount === 1 ? '' : 's'}`}
          >
            <Star className="h-3.5 w-3.5 fill-gold-light text-gold-light" />
            {rating.toFixed(1)}
          </span>
        )}

        {isOutOfStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/55">
            <span className="h-7 px-3 inline-flex items-center rounded-full bg-ink/85 text-white text-[11px] font-semibold uppercase tracking-[0.08em]">Sold out</span>
          </span>
        )}
      </Link>

      <button
        type="button"
        onClick={handleWishlist}
        aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={isInWishlist}
        className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 h-10 w-10 sm:h-9 sm:w-9 rounded-full bg-white/95 flex items-center justify-center shadow-sm transition-transform duration-200 hover:scale-105 active:scale-95"
      >
        <Heart className={`h-4 w-4 transition-colors ${isInWishlist ? 'fill-berry text-berry' : 'text-ink-soft'}`} />
      </button>

      {/* ── Details ── */}
      <div className="flex flex-1 flex-col px-3.5 pt-3 pb-3.5 sm:px-4 sm:pt-3.5 sm:pb-4">
        <span className="truncate text-[11px] sm:text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#A09A92]">
          {tag}
        </span>

        <Link to={productPath(product)} className="mt-1 min-w-0">
          <h3 className="line-clamp-2 min-h-[2.6em] text-[14.5px] sm:text-[16px] font-semibold leading-[1.3] text-[#3D3A3C] transition-colors group-hover:text-ink">
            {name}
          </h3>
        </Link>

        <p className="mt-auto pt-3 flex flex-wrap items-baseline gap-x-1.5 gap-y-1 leading-none min-h-[1.25rem]">
          {fromPrefix && <span className="text-[11.5px] text-ink-muted">From</span>}
          <span className="text-[15px] min-[380px]:text-[16px] sm:text-[18px] font-bold text-ink tracking-tight whitespace-nowrap">{inr(price)}</span>
          {showMrp && (
            <s className="text-[11.5px] sm:text-[13px] text-[#A09A92] whitespace-nowrap" aria-label={`MRP ${inr(mrp)}`}>{inr(mrp)}</s>
          )}
          {showMrp && !isOutOfStock && (
            <span className="text-[11.5px] sm:text-[13px] font-bold text-[#1E6E2A] whitespace-nowrap">{discount}% OFF</span>
          )}
        </p>

        <button
          type="button"
          onClick={handleAddClick}
          disabled={isOutOfStock}
          aria-label={isOutOfStock ? `${name} is sold out` : `Add ${name} to cart`}
          className={`mt-3 h-10 sm:h-11 w-full rounded-[14px] text-[12.5px] sm:text-[13.5px] font-semibold uppercase tracking-[0.05em] ${
            isOutOfStock
              ? 'bg-cream text-ink-muted border border-hairline cursor-not-allowed'
              : 'btn-brand'
          }`}
        >
          {isOutOfStock ? 'Sold out' : 'Add to cart'}
        </button>
      </div>
    </motion.article>
  );
}

/** Photo that fades in once loaded, with a gentle zoom on card hover. */
function ProductPhoto({ src, alt }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && <span className="absolute inset-0 skeleton" />}
      <img
        src={src || FallbackImg}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-[transform,opacity] duration-700 ease-soft group-hover:scale-[1.04] ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  );
}
