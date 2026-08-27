import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Scale, ShoppingCart, Heart } from 'lucide-react';
import { AnimatePresence } from 'framer-';
export function VariantSelectorModal({ 
  isOpen, 
  onClose, 
  product, 
  onConfirm, 
  mode = 'cart' // 'cart' or 'wishlist'
}) {
  const [selectedVariant, setSelectedVariant] = useState(() => {
    if (!product?.variants || product.variants.length === 0) return null;
    // Find first variant that is in stock, otherwise first variant
    const inStock = product.variants.find(v => v.stock > 0);
    return inStock || product.variants[0];
  });

  if (!product) return null;

  const handleConfirm = () => {
    if (mode === 'cart' && selectedVariant && selectedVariant.stock <= 0) {
      return;
    }
    onConfirm(product, selectedVariant);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] rounded-2xl border-0 shadow-2xl p-0 overflow-hidden bg-white">
        <div className="relative h-48">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
          <Badge className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-[#E83D6E] border-0 rounded-full font-bold px-3 py-1 text-[10px] tracking-widest uppercase">
            {product.category || 'Biscuit'}
          </Badge>
        </div>

        <DialogHeader className="px-8 pt-2">
          <DialogTitle className="text-2xl font-bold text-gray-900 tracking-tight">
            {product.name}
          </DialogTitle>
          <p className="text-gray-400 font-medium text-sm leading-tight">
            Please select your preferred pack size to continue.
          </p>
        </DialogHeader>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Scale className="h-3 w-3" /> Select Pack Size
            </p>
            <div className="grid grid-cols-2 gap-3">
              {product.variants?.map((variant, idx) => {
                const isOutOfStock = variant.stock <= 0;
                return (
                  <button
                    key={idx}
                    disabled={isOutOfStock && mode === 'cart'}
                    onClick={() => setSelectedVariant(variant)}
                    className={`px-4 py-4 rounded-2xl font-bold text-sm transition-all border-2 text-left flex flex-col gap-1 relative overflow-hidden ${
                      selectedVariant?.weight === variant.weight 
                      ? 'border-[#E83D6E] bg-pink-50 text-[#E83D6E] shadow-md shadow-pink-100' 
                      : 'border-gray-100 text-gray-400 hover:border-gray-200 hover:text-gray-600 bg-white'
                    } ${isOutOfStock && mode === 'cart' ? 'opacity-50 grayscale cursor-not-allowed border-gray-100 bg-gray-50' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs uppercase tracking-widest opacity-60">{variant.weight}</span>
                      {isOutOfStock && mode === 'cart' && (
                        <span className="text-[8px] font-bold bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-md uppercase">Sold Out</span>
                      )}
                    </div>
                    <span className="text-lg">₹{variant.price}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="p-8 bg-gray-50/50 flex sm:flex-col gap-3">
          <Button 
            onClick={handleConfirm}
            disabled={mode === 'cart' && (!selectedVariant || selectedVariant.stock <= 0)}
            className={`w-full h-14 rounded-2xl font-bold text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
              mode === 'cart' && (!selectedVariant || selectedVariant.stock <= 0)
              ? 'bg-gray-200 text-gray-400 shadow-none'
              : 'bg-[#E83D6E] hover:bg-[#D81B60] text-white shadow-pink-100'
            }`}
          >
            {mode === 'cart' ? (
              selectedVariant && selectedVariant.stock <= 0 ? 'Out of Stock' : <><ShoppingCart className="h-5 w-5" /> Add to Cart</>
            ) : (
              <><Heart className="h-5 w-5 fill-current" /> Add to Wishlist</>
            )}
          </Button>
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="w-full h-12 rounded-xl font-bold text-gray-400 hover:text-gray-600"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
