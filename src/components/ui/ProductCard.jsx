import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Heart, ArrowRight, ShoppingCart } from 'lucide-react';
import FallbackImg from '../../assets/lan.png';
import { useCart } from '../../context/CartContext';

export default function ProductCard({ product }) {
  const { toggleWishlist: toggleWishlistCtx, isInWishlist: isInWishlistCtx } = useCart();
  const navigate = useNavigate();
  const still = useReducedMotion();

  const itemId = product.id || product._id;
  const isInWishlist = isInWishlistCtx(itemId);

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlistCtx(product);
  };

  const handleAddClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Since products have variants, redirect to product details to select variant
    navigate(`/product/${itemId}`);
  };

  const hasVariants = product.variants && product.variants.length > 0;
  const displayPrice = hasVariants
    ? `From ₹${Math.min(...product.variants.map(v => Number(v.price)))}`
    : `₹${product.price}`;

  const isOutOfStock = hasVariants
    ? product.variants.every(v => v.stock === 0)
    : product.stock === 0;

  return (
    <motion.article
      layout
      initial={still ? false : { opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="glass glass-hover zoom-parent relative flex flex-col w-full rounded-card overflow-hidden group"
    >
      {/* ── Image plate ── */}
      <div className="relative aspect-square w-full overflow-hidden plate-berry shrink-0">
        <span className="orb orb-sm absolute w-[170px] h-[170px] left-3.5 -bottom-8 bg-[rgba(165,13,90,.22)] pointer-events-none" />
        <Link to={`/product/${itemId}`} className="block h-full w-full relative">
          <img
            src={product.image || FallbackImg}
            alt={product.name || product.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </Link>

        <span className="pill-glass absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[8.5px] font-bold text-ink uppercase tracking-widest z-20">
          <Sparkles className="h-2.5 w-2.5 text-gold-light" /> Pure
        </span>

        <motion.button
          onClick={handleWishlist}
          aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          whileTap={still ? undefined : { scale: 0.88 }}
          className={`absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 z-20 ${
            isInWishlist
              ? 'btn-berry border-transparent'
              : 'pill-glass hover:border-berry/45'
          }`}
        >
          <Heart
            className={`h-3.5 w-3.5 transition-all duration-300 ${
              isInWishlist ? 'fill-white text-white' : 'text-ink-muted group-hover:text-berry'
            }`}
          />
        </motion.button>

        {isOutOfStock && (
          <div className="absolute inset-0 bg-cream/55 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="px-4 h-8 inline-flex items-center rounded-full bg-ink/85 text-white text-[10px] font-extrabold uppercase tracking-[0.14em]">
              Sold out
            </span>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="relative p-5 flex-1 flex flex-col gap-3 z-20">
        <div className="flex items-center justify-between">
          <span className="pill-berry-soft text-[8.5px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full">
            {product.category || 'Product'}
          </span>
          <span className="flex items-center gap-0.5 text-gold-light font-bold text-[10px]">★ {product.rating || 4.8}</span>
        </div>

        <Link to={`/product/${itemId}`}>
          <h3 className="font-display font-bold text-ink text-base leading-snug group-hover:text-berry transition-colors duration-300 line-clamp-1">
            {product.name || product.title}
          </h3>
        </Link>

        <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed font-medium flex-1">
          {product.description}
        </p>

        <div className="pt-3 border-t border-hairline space-y-3 mt-auto">
          <div className="flex items-baseline justify-between">
            <span className="text-ink-muted text-[9px] font-bold uppercase tracking-wider">Price</span>
            <span className="font-display font-extrabold text-ink text-lg tracking-tight">
              {displayPrice}
            </span>
          </div>

          <div className="flex gap-2">
            <Link
              to={`/product/${itemId}`}
              className="btn-glass flex-1 h-9 rounded-xl text-[9px] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-1"
            >
              <ArrowRight className="h-3 w-3" /> View
            </Link>

            <motion.button
              whileTap={still ? undefined : { scale: 0.95 }}
              onClick={handleAddClick}
              disabled={isOutOfStock}
              className={`flex-1 h-9 rounded-xl text-[9px] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-1 transition-all ${
                isOutOfStock
                  ? 'bg-cream border border-hairline text-ink-muted cursor-not-allowed'
                  : 'btn-berry'
              }`}
            >
              <ShoppingCart className="h-3 w-3" />
              <span>{isOutOfStock ? 'Sold Out' : 'Select'}</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* berry→gold accent bar */}
      {!isOutOfStock && <div className="h-1 foil shrink-0" />}
    </motion.article>
  );
}
