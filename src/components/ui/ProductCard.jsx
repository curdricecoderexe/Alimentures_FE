import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Heart, ArrowRight, ShoppingCart } from 'lucide-react';
import FallbackImg from '../../assets/lan.png';
import { useCart } from '../../context/CartContext';

export default function ProductCard({ product }) {
  const { toggleWishlist: toggleWishlistCtx, isInWishlist: isInWishlistCtx } = useCart();
  const navigate = useNavigate();

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative flex flex-col w-full rounded-3xl overflow-hidden group
        bg-white/90 backdrop-blur-xl border border-white/80
        shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(146,0,117,0.10)]
        hover:border-[#920075]/20 hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-[#FDFBF7] shrink-0">
        <Link to={`/product/${itemId}`}>
          <img
            src={product.image || FallbackImg}
            alt={product.name || product.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/92 backdrop-blur-md text-[8.5px] font-bold text-[#0a0806] uppercase tracking-widest border border-white/30 shadow-xs z-20">
          <Sparkles className="h-2.5 w-2.5 text-[#D4AF37]" /> Pure
        </span>
        <button
          onClick={handleWishlist}
          aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/92 backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all border border-white/30 shadow-xs z-20"
        >
          <Heart className={`h-3.5 w-3.5 transition-all duration-300 ${isInWishlist ? 'fill-[#920075] text-[#920075]' : 'text-gray-500 hover:text-[#920075]'}`} />
        </button>
      </div>

      <div className="relative p-5 flex-1 flex flex-col gap-3 bg-white/60 backdrop-blur-sm z-20">
        <div className="flex items-center justify-between">
          <span className="text-[8.5px] font-bold uppercase tracking-[0.18em] text-[#920075] bg-[#920075]/8 px-2.5 py-1 rounded-full">
            {product.category || 'Product'}
          </span>
          <span className="flex items-center gap-0.5 text-[#D4AF37] font-bold text-[10px]">★ {product.rating || 4.8}</span>
        </div>
        
        <Link to={`/product/${itemId}`}>
          <h3 className="font-display font-bold text-[#0a0806] text-base leading-snug group-hover:text-[#920075] transition-colors line-clamp-1">
            {product.name || product.title}
          </h3>
        </Link>
        
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed font-medium flex-1">
          {product.description}
        </p>

        <div className="pt-3 border-t border-gray-100 space-y-3 mt-auto">
          <div className="flex items-baseline justify-between">
            <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider">Price</span>
            <span className="font-bold text-[#0a0806] text-lg tracking-tight">
              {displayPrice}
            </span>
          </div>
          
          <div className="flex gap-2">
            <Link
              to={`/product/${itemId}`}
              className="flex-1 h-9 rounded-xl text-[9px] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-1 border border-gray-200 text-gray-600 hover:border-[#D4AF37] hover:text-[#b89312] bg-white transition-all"
            >
              <ArrowRight className="h-3 w-3" /> View
            </Link>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAddClick}
              disabled={isOutOfStock}
              className={`flex-1 h-9 rounded-xl text-[9px] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-1 transition-all ${
                isOutOfStock
                  ? 'bg-gray-50 border border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#920075] text-white hover:bg-[#7a0062] shadow-sm'
              }`}
            >
              <ShoppingCart className="h-3 w-3" />
              <span>{isOutOfStock ? 'Sold Out' : 'Select'}</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
