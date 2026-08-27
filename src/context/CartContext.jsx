/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { API_BASE, authenticatedFetch } from '../lib/api';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem('wishlist');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const addToCart = (product, quantity = 1) => {
    const productId = product.id || product._id || product.uid;
    const name = product.name || product.title || 'Product';
    
    setCart(prev => {
      const existing = prev.find(item => 
        (item.id || item._id || item.uid) === productId && 
        item.selectedWeight === product.selectedWeight
      );
      if (existing) {
        toast.success(`Updated ${name} quantity in cart!`, { id: 'cart-toast' });
        return prev.map(item => 
          ((item.id || item._id || item.uid) === productId && item.selectedWeight === product.selectedWeight)
          ? { ...item, quantity: item.quantity + quantity } 
          : item
        );
      }
      toast.success(`${name} added to cart!`, { id: 'cart-toast' });
      return [...prev, { ...product, quantity }];
    });
  };

  const updateQuantity = (productId, selectedWeight, delta) => {
    setCart(prev => 
      prev.map(item => 
        ((item.id === productId || item._id === productId || item.uid === productId) && item.selectedWeight === selectedWeight)
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
      )
    );
  };

  const removeFromCart = (productId, selectedWeight) => {
    setCart(prev => prev.filter(item => {
      const isMatch = (item.id === productId || item._id === productId || item.uid === productId) && 
                      item.selectedWeight === selectedWeight;
      return !isMatch;
    }));
  };

  const clearCart = () => setCart([]);
  const clearWishlist = () => setWishlist([]);

  const validateCartData = async () => {
    if (cart.length === 0) return;
    try {
      const payload = cart.map(item => ({
        productId: item.id || item._id || item.uid,
        selectedWeight: item.selectedWeight,
        quantity: item.quantity,
        price: item.price,
        name: item.name || item.title
      }));
      const res = await fetch(`${API_BASE}/cart/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payload })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.items) {
          if (data.warnings && data.warnings.length > 0) {
            data.warnings.forEach(w => toast.error(w.message, { duration: 5000 }));
          }
          
          setCart(prevCart => {
            const newCart = [];
            data.items.forEach(validatedItem => {
              const localItem = prevCart.find(i => (i.id || i._id || i.uid) === validatedItem.productId && i.selectedWeight === validatedItem.selectedWeight);
              if (localItem) {
                const maxQty = validatedItem.stock;
                const newQty = Math.min(localItem.quantity, maxQty);
                if (newQty > 0) {
                  newCart.push({ ...localItem, price: validatedItem.price, quantity: newQty });
                }
              }
            });
            return newCart;
          });
        }
      }
    } catch (err) {
      console.error('Cart validation failed:', err);
    }
  };

  const fetchWishlist = async () => {
    if (!localStorage.getItem('token')) return;
    try {
      const res = await authenticatedFetch('/wishlist');
      if (res && res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setWishlist(data.data.map(w => w.product));
        }
      }
    } catch (err) { console.error('Failed to sync wishlist', err); }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWishlist();
  }, []);

  const toggleWishlist = async (product) => {
    const productId = product.id || product._id || product.uid;
    const token = localStorage.getItem('token');
    const isWishlisted = wishlist.find(item => (item.id || item._id || item.uid) === productId);

    // Optimistic update
    setWishlist(prev => {
      if (isWishlisted) {
        toast.info(`Removed from wishlist`, { id: 'wishlist-toast' });
        return prev.filter(item => (item.id !== productId && item._id !== productId && item.uid !== productId));
      }
      toast.success(`Added to wishlist!`, { id: 'wishlist-toast' });
      return [...prev, product];
    });

    if (token) {
      try {
        if (isWishlisted) {
          await authenticatedFetch(`/wishlist/${productId}`, { method: 'DELETE' });
        } else {
          await authenticatedFetch('/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId }),
          });
        }
      } catch (err) {
        console.error("Wishlist sync error", err);
      }
    }
  };

  const isInWishlist = (productId) => {
    return !!wishlist.find(item => (item.id === productId || item._id === productId || item.uid === productId));
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity,
      clearCart,
      wishlist,
      toggleWishlist,
      clearWishlist,
      isInWishlist,
      validateCartData
    }}>
      {children}
    </CartContext.Provider>
  );
};
