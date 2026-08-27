import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart, User, Package, Search, Heart, Truck, Lock, Menu, X, ArrowRight,
  MapPin, Mail, Phone, Globe, ArrowUp, Send, Sparkles, Check, ChevronRight, LayoutDashboard, Leaf,
  Sprout, Users, CheckCircle2, Quote, ShieldCheck, Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useState, useEffect, useRef } from 'react';
import logo from '../assets/logo.png';
import ImageWithFallback from '../assets/lan.png';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { toast } from 'sonner';
import ChatWidget from '../components/ChatWidget';
import CookieConsent from '../components/CookieConsent';
import { pageview, initAutoTracking, initPerformance } from '../lib/analytics';
import { cachedFetch, logout } from '../lib/api';
// Removed Loader import
// Removed unused import: womenImage
// Removed unused import: coverImage

gsap.registerPlugin(ScrollTrigger);

export default function CustomerLayout() {
  const { cart, wishlist } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredTab, setHoveredTab] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [animateCart, setAnimateCart] = useState(false);
  const [animateWishlist, setAnimateWishlist] = useState(false);

  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');
    const [activePolicy, setActivePolicy] = useState(null);

  const policyDetails = {
    privacy: {
      title: 'Privacy Policy',
      content: 'Alimenture Industries Private Limited respects your privacy. We collect personal information solely to process orders, improve product recommendations, and communicate shipping status. We do not sell or lease your personal data to third parties under any circumstances. All payment transactions are encrypted securely through PCI-DSS compliant payment gateways.'
    },
    terms: {
      title: 'Terms of Service',
      content: 'By accessing and purchasing from Alimenture Industries, you agree to comply with our terms. All website content, brand assets, product formulations, and trademarks belong to Alimenture Industries Private Limited. Products are crafted for personal consumption and wellness.'
    },
    shipping: {
      title: 'Shipping & Delivery Policy',
      content: 'We offer nationwide shipping across India. Standard orders are processed within 24 to 48 hours. Express delivery typically arrives within 2 to 5 business days depending on location. Tracking information is provided via SMS and Email once dispatched.'
    },
    returns: {
      title: 'Refund & Return Policy',
      content: 'Due to the fresh food nature of our millet treats and heritage grain products, returns are accepted if items arrive damaged, expired, or incorrect. Please notify our customer support team within 48 hours of delivery with photo proof for instant replacements or full refunds.'
    },
    quality: {
      title: 'Quality & Food Safety Guidelines',
      content: 'Our products are 100% toxin-free, crafted without maida, refined sugar, refined oil, or artificial preservatives. All batches are manufactured in FSSAI-compliant certified clean facilities, utilizing traditional slow-baking methods to preserve maximum grain nutrition.'
    }
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setSubscribed(true);
    toast.success('Welcome to the clean food movement!');
  };


  const navRef = useRef(null);
  const lenisRef = useRef(null);

  // Initialize Lenis Smooth Physics-Based Scroll Engine
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.95,
      syncTouch: false,
      infinite: false,
    });

    lenisRef.current = lenis;
    window.lenis = lenis;

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Coordinate GSAP ScrollTrigger computations
    const unbindScroll = lenis.on('scroll', ScrollTrigger.update);

    return () => {
      cancelAnimationFrame(rafId);
      if (typeof unbindScroll === 'function') unbindScroll();
      lenis.destroy();
      window.lenis = null;
    };
  }, []);

  // Disable browser automatic scroll restoration on load
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Smoothly scroll to initial hash segments or force top position on mount/path changes
  useEffect(() => {
    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      const timer = setTimeout(() => {
        const el = document.getElementById(hash);
        if (el && lenisRef.current) {
          lenisRef.current.scrollTo(el, {
            offset: -90,
            duration: 1.6,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
          });
        }
      }, 600); // Elegant delay allowing components and photography assets to settle
      return () => clearTimeout(timer);
    } else {
      window.scrollTo(0, 0);
      if (lenisRef.current) {
        lenisRef.current.scrollTo(0, { immediate: true });
      }
    }
  }, [location.pathname]);

  // ─── Analytics: track page view on route change ─────────────────────────
  useEffect(() => {
    pageview(window.location.href, document.title);
  }, [location.pathname, location.search]);

  // ─── Analytics: init click tracking & web vitals once ────────────────────
  useEffect(() => {
    initAutoTracking();
    initPerformance();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (navRef.current) {
      gsap.fromTo(navRef.current,
        { y: -80, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.2 }
      );
    }
  }, []);

  useEffect(() => {
    if (cart.length > 0) {
      setAnimateCart(true);
      const t = setTimeout(() => setAnimateCart(false), 300);
      return () => clearTimeout(t);
    }
  }, [cart.length]);

  useEffect(() => {
    if (wishlist.length > 0) {
      setAnimateWishlist(true);
      const t = setTimeout(() => setAnimateWishlist(false), 300);
      return () => clearTimeout(t);
    }
  }, [wishlist.length]);

  useEffect(() => {
    let isActive = true;
    if (searchQuery.trim().length < 2) { setSearchResults([]); return; }
    const debounce = setTimeout(async () => {
      if (!isActive) return;
      setSearchLoading(true);
      try {
        const data = await cachedFetch(`${import.meta.env.VITE_API_URL}/products/search?q=${encodeURIComponent(searchQuery)}&limit=5`);
        if (isActive && data.success) {
          setSearchResults(data.data);
        }
      } catch (e) { 
        if (isActive) console.error(e); 
      }
      finally { 
        if (isActive) setSearchLoading(false); 
      }
    }, 200);
    return () => {
      isActive = false;
      clearTimeout(debounce);
    };
  }, [searchQuery]);

  const [activeSection, setActiveSection] = useState('Home');

  useEffect(() => {
    if (location.pathname !== '/') {
      setActiveSection('');
      return;
    }

    const handleScroll = () => {
      const scrollPos = window.scrollY + 220;
      const sections = [
        { id: 'philosophy-3s', name: 'Philosophy' },
        { id: 'about', name: 'About' },
        { id: 'sustainability', name: 'Sustainability' },
        { id: 'products', name: 'Products' },
      ];

      let current = 'Home';
      for (const sec of sections) {
        const el = document.getElementById(sec.id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPos >= top) {
            current = sec.name;
            break;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/#products', isScroll: true, scrollId: 'products' },
    { name: 'Sustainability', path: '/#sustainability', isScroll: true, scrollId: 'sustainability' },
    { name: 'About', path: '/#about', isScroll: true, scrollId: 'about' },
    { name: 'Philosophy', path: '/#philosophy-3s', isScroll: true, scrollId: 'philosophy-3s' },
  ];

  const handleNavClick = (link) => {
    if (link.name === 'Home' && location.pathname === '/') {
      lenisRef.current?.scrollTo(0, { duration: 1.4 });
      return;
    }
    if (link.isScroll) {
      const targetElement = document.getElementById(link.scrollId);
      if (location.pathname === '/') {
        if (targetElement) {
          lenisRef.current?.scrollTo(targetElement, {
            offset: -90,
            duration: 1.4,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
          });
        }
      } else {
        navigate('/');
        setTimeout(() => {
          const el = document.getElementById(link.scrollId);
          if (el) {
            lenisRef.current?.scrollTo(el, {
              offset: -90,
              duration: 1.4,
              easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
            });
          }
        }, 200);
      }
    } else { navigate(link.path); }
  };

  const badgeCls = "absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full flex items-center justify-center text-[9.5px] font-bold text-white bg-rose-600 border-2 border-white shadow-sm";

  const isHome = location.pathname === '/';
  const isSolidNav = scrolled || !isHome;

  const navTextColor = isSolidNav
    ? 'text-[#0a0806] hover:text-rose-700 font-bold'
    : 'text-white hover:text-white font-bold drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]';

  const navIconColor = isSolidNav
    ? 'text-gray-700 hover:text-rose-700 bg-gray-50/80 hover:bg-white backdrop-blur-md border border-gray-200 shadow-sm transition-all'
    : 'text-gray-900 hover:text-rose-700 bg-white/90 hover:bg-white backdrop-blur-md border border-white/70 shadow-md transition-all';

  return (
    <div className="min-h-screen text-brand-dark relative font-sans overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <header ref={navRef} className="fixed top-0 left-0 right-0 z-[100] transition-all duration-500 pt-2.5 sm:pt-4 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto transition-all duration-500">
          <div className={`flex items-center justify-between transition-all duration-500 rounded-full px-4 sm:px-6 md:px-8 py-2 md:py-3 ${
            isSolidNav
              ? 'bg-white/95 backdrop-blur-2xl border border-gray-200/60 shadow-sm scale-[0.99]'
              : 'bg-white/85 sm:bg-transparent backdrop-blur-xl sm:backdrop-blur-none border border-white/60 sm:border-transparent shadow-md sm:shadow-none'
          }`}>

            {/* Logo */}
            <Link to="/" className="flex items-center group shrink-0">
              <motion.img
                src={logo}
                alt="Alimenture Logo"
                className="h-10 sm:h-14 md:h-16 w-auto object-contain transition-all duration-300 drop-shadow-sm"
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
              />
            </Link>

            {/* Desktop Nav */}
            <div className="flex-1 max-w-lg mx-8 relative hidden md:block">
              <AnimatePresence mode="wait">
                {!isSearching ? (
                  <motion.div key="nav" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-1">
                    {navLinks.map((link) => {
                      const isHovered = hoveredTab === link.name;
                      const isActive = location.pathname === '/'
                        ? activeSection === link.name
                        : (location.pathname === link.path);

                      const isTargeted = hoveredTab ? isHovered : isActive;

                      return (
                        <button
                          key={link.name}
                          onClick={() => handleNavClick(link)}
                          onMouseEnter={() => setHoveredTab(link.name)}
                          onMouseLeave={() => setHoveredTab(null)}
                          className={`relative px-3.5 py-2 text-[11px] font-bold tracking-widest uppercase transition-colors duration-200 group ${isTargeted ? 'text-rose-700' : navTextColor
                            }`}
                        >
                          <span className="relative z-10">{link.name}</span>

                          {/* Razor-Sharp Gliding Underline Bar */}
                          {isTargeted && (
                            <motion.div
                              layoutId="crispNavUnderline"
                              className="absolute bottom-0 left-1 right-1 h-[2.5px] rounded-full bg-gradient-to-r from-rose-700 via-rose-500 to-orange-500"
                              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                ) : (
                  <motion.div key="search" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center w-full">
                    <div className="relative w-full">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-700" />
                      <input type="text" autoFocus placeholder="Search organic products..."
                        value={searchQuery} 
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && searchQuery.trim()) {
                            setIsSearching(false);
                            navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
                          }
                        }}
                        className="w-full h-10 pl-11 pr-10 bg-white/60 border border-rose-700/20 rounded-full text-xs font-bold text-gray-900 placeholder-gray-500 focus:outline-none focus:border-rose-700/60 focus:ring-1 focus:ring-rose-700/20 transition-all"
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-700 text-[10px] uppercase tracking-wider font-bold">
                          Clear
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Search dropdown */}
              <AnimatePresence>
                {isSearching && searchQuery.trim().length >= 2 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-2xl border border-rose-700/20 rounded-2xl p-4 z-[60] shadow-[0_20px_50px_rgba(155,45,138,0.1)]">
                    {searchLoading && <div className="flex justify-center py-3"><Loader2 className="animate-spin text-rose-700" /></div>}
                    {!searchLoading && searchResults.length === 0 && <p className="text-gray-400 text-xs text-center py-4">No products found…</p>}
                    {searchResults.map(p => (
                      <Link key={p.id || p._id} to={`/product/${p.id || p._id}`}
                        onClick={() => { setIsSearching(false); setSearchQuery(''); }}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-rose-700/5 transition-colors group">
                        <img src={p.image || ImageWithFallback} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-rose-700/10" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 group-hover:text-rose-700 transition-colors truncate">{p.name}</p>
                          <p className="text-[9px] text-gray-400 uppercase tracking-wider">{p.category}</p>
                        </div>
                        <span className="text-rose-700 font-bold text-xs">₹{p.price}</span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-1.5">
              <motion.div animate={{ scale: 1 }}>
                <button onClick={() => setIsSearching(!isSearching)}
                  className={`relative rounded-full h-9 w-9 flex items-center justify-center transition-all ${navIconColor} ${isSearching ? 'text-rose-700' : ''}`}>
                  <Search className="h-4 w-4" />
                </button>
              </motion.div>

              {/* Wishlist */}
              <motion.div animate={animateWishlist ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }}>
                <button onClick={() => navigate('/wishlist')}
                  className={`relative rounded-full h-9 w-9 flex items-center justify-center transition-all ${navIconColor} hover:text-rose-700`}>
                  <Heart className="h-4 w-4" />
                  {wishlist.length > 0 && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className={badgeCls}>{wishlist.length}</motion.span>
                  )}
                </button>
              </motion.div>

              {/* Orders */}
              <button onClick={() => navigate('/orders')}
                className={`relative rounded-full h-9 w-9 flex items-center justify-center transition-all ${navIconColor} hover:text-orange-500`}>
                <Package className="h-4 w-4" />
              </button>

              {/* Cart */}
              <motion.div animate={animateCart ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }}>
                <button onClick={() => navigate('/cart')}
                  className={`relative rounded-full h-9 w-9 flex items-center justify-center transition-all ${navIconColor} hover:text-rose-700`}>
                  <ShoppingCart className="h-4 w-4" />
                  {cart.length > 0 && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className={badgeCls}>{cart.length}</motion.span>
                  )}
                </button>
              </motion.div>

              {/* Profile */}
              <div className="relative">
                <button onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className={`relative rounded-full h-9 w-9 flex items-center justify-center transition-all ${navIconColor} ${profileMenuOpen ? 'text-[#920075] border-[#920075]/40 ring-2 ring-[#920075]/20 !bg-white' : ''}`}>
                  <User className="h-4 w-4" />
                  {localStorage.getItem('token') && (
                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white shadow-sm" />
                  )}
                </button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                      <motion.div initial={{ opacity: 0, y: 12, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.95 }}
                        transition={{ type: 'spring', bounce: 0.1, duration: 0.4 }}
                        className="absolute right-0 top-full mt-3 w-80 bg-white/95 backdrop-blur-3xl border border-gray-100 rounded-3xl p-6 z-50 shadow-[0_30px_60px_rgba(0,0,0,0.08)] overflow-hidden">

                        {/* Ambient background glows for the dropdown */}
                        <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] rounded-full bg-[#E91E8C] opacity-10 blur-[60px] pointer-events-none" />
                        <div className="absolute bottom-[-50px] left-[-50px] w-[150px] h-[150px] rounded-full bg-[#D4AF37] opacity-10 blur-[60px] pointer-events-none" />

                        {localStorage.getItem('token') ? (
                          <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                              <div className="relative shrink-0">
                                <div className="h-12 w-12 rounded-full bg-white border border-gray-200/80 flex items-center justify-center text-[#920075] shadow-md">
                                  <User className="h-6 w-6 text-[#920075]" />
                                </div>
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <span className="inline-block mb-1 text-[8px] font-black bg-gray-100 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                  {localStorage.getItem('role') || 'Member'}
                                </span>
                                <p className="font-display font-black text-gray-900 text-base leading-tight truncate">{localStorage.getItem('userName') || 'Customer'}</p>
                                <p className="text-[10px] text-gray-500 truncate">{localStorage.getItem('userEmail')}</p>
                              </div>
                            </div>

                            <div className="space-y-1 mb-6">
                              {localStorage.getItem('role') === 'admin' && (
                                <button onClick={() => { setProfileMenuOpen(false); navigate('/admin'); }} className="w-full flex items-center justify-between p-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors group">
                                  <div className="flex items-center gap-3">
                                    <LayoutDashboard className="h-4 w-4 text-gray-400 group-hover:text-[#C41E6B] transition-colors" />
                                    <span className="text-xs font-bold">Admin Dashboard</span>
                                  </div>
                                  <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 group-hover:text-gray-900" />
                                </button>
                              )}
                              {localStorage.getItem('role') === 'staff' && (
                                <button onClick={() => { setProfileMenuOpen(false); navigate('/staff'); }} className="w-full flex items-center justify-between p-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors group">
                                  <div className="flex items-center gap-3">
                                    <LayoutDashboard className="h-4 w-4 text-gray-400 group-hover:text-[#C41E6B] transition-colors" />
                                    <span className="text-xs font-bold">Staff Dashboard</span>
                                  </div>
                                  <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 group-hover:text-gray-900" />
                                </button>
                              )}
                              <button onClick={() => { setProfileMenuOpen(false); navigate('/orders'); }} className="w-full flex items-center justify-between p-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors group">
                                <div className="flex items-center gap-3">
                                  <Package className="h-4 w-4 text-gray-400 group-hover:text-[#D4AF37] transition-colors" />
                                  <span className="text-xs font-bold">My Orders</span>
                                </div>
                                <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 group-hover:text-gray-900" />
                              </button>
                              <button onClick={() => { setProfileMenuOpen(false); navigate('/addresses'); }} className="w-full flex items-center justify-between p-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors group">
                                <div className="flex items-center gap-3">
                                  <MapPin className="h-4 w-4 text-gray-400 group-hover:text-[#920075] transition-colors" />
                                  <span className="text-xs font-bold">My Addresses</span>
                                </div>
                                <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 group-hover:text-gray-900" />
                              </button>
                              <button onClick={() => { setProfileMenuOpen(false); navigate('/wishlist'); }} className="w-full flex items-center justify-between p-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors group">
                                <div className="flex items-center gap-3">
                                  <Heart className="h-4 w-4 text-gray-400 group-hover:text-[#E91E8C] transition-colors" />
                                  <span className="text-xs font-bold">Wishlist</span>
                                </div>
                                <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 group-hover:text-gray-900" />
                              </button>
                            </div>

                            <button className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-red-50 border border-red-100 text-red-600 hover:bg-red-500 hover:text-white font-bold text-[11px] uppercase tracking-widest transition-all shadow-sm hover:shadow-md"
                              onClick={() => { setProfileMenuOpen(false); logout(); }}>
                              <Lock className="h-3.5 w-3.5" /> Sign Out
                            </button>
                          </div>
                        ) : (
                          <div className="relative text-center py-4 z-10">
                            <div className="relative mx-auto mb-5 w-16 h-16 flex items-center justify-center">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 rounded-full border border-dashed border-[#D4AF37]/40"
                              />
                              <div className="h-12 w-12 rounded-full bg-white border border-gray-200/80 flex items-center justify-center text-[#920075] shadow-md">
                                <User className="h-6 w-6 text-[#920075]" />
                              </div>
                            </div>
                            <h4 className="font-display font-black text-2xl text-gray-900 mb-1 tracking-tight">Welcome Back</h4>
                            <p className="text-[11px] text-gray-500 mb-6 font-medium">Securely access your account</p>

                            <button className="relative w-full h-12 rounded-xl bg-gray-900 text-white font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all mb-4 flex items-center justify-center gap-2 group overflow-hidden shadow-md hover:shadow-lg"
                              onClick={() => { setProfileMenuOpen(false); navigate('/login'); }}>
                              <span className="relative z-10 flex items-center gap-2">Sign In <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" /></span>
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                            </button>

                            <p className="text-[10px] text-gray-500">
                              New here? <Link to="/register" onClick={() => setProfileMenuOpen(false)} className="text-[#C41E6B] hover:text-[#E91E8C] transition-colors underline decoration-[#C41E6B]/30 underline-offset-2 font-bold ml-1">Create an account</Link>
                            </p>
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile Actions Header Bar */}
            <div className="flex md:hidden items-center gap-1.5">
              {/* Wishlist */}
              <button
                onClick={() => navigate('/wishlist')}
                className={`relative h-9 w-9 flex items-center justify-center rounded-full transition-all ${navIconColor} hover:text-[#E91E8C]`}
                aria-label="Wishlist"
              >
                <Heart className="h-4 w-4 text-[#920075]" />
                {wishlist.length > 0 && <span className={`${badgeCls} text-[8px]`}>{wishlist.length}</span>}
              </button>

              {/* Cart */}
              <button
                onClick={() => navigate('/cart')}
                className={`relative h-9 w-9 flex items-center justify-center rounded-full transition-all ${navIconColor} hover:text-[#E91E8C]`}
                aria-label="Cart"
              >
                <ShoppingCart className="h-4 w-4 text-[#920075]" />
                {cart.length > 0 && <span className={`${badgeCls} text-[8px]`}>{cart.length}</span>}
              </button>

              {/* Mobile Hamburger Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className={`h-9 w-9 flex items-center justify-center rounded-full transition-all ${navIconColor} text-[#0a0806]`}
                aria-label="Toggle Menu"
              >
                <Menu className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Premium Mobile Slide-Out Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-md z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-[88%] max-w-sm bg-white/95 backdrop-blur-3xl z-[101] border-l border-white/80 p-6 flex flex-col overflow-y-auto shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-5 border-b border-gray-100">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center">
                  <img src={logo} alt="Alimenture" className="h-12 w-auto object-contain drop-shadow-sm" />
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-9 w-9 flex items-center justify-center text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User Profile Info Card in Mobile Drawer */}
              <div className="mt-5 p-4 bg-gray-50/80 rounded-2xl border border-gray-100 flex items-center justify-between">
                {localStorage.getItem('token') ? (
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-[#920075]/10 border border-[#920075]/20 flex items-center justify-center text-[#920075] shrink-0 font-bold">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-black text-gray-900 text-sm truncate">{localStorage.getItem('userName') || 'Customer'}</p>
                      <p className="text-[10px] text-gray-500 truncate">{localStorage.getItem('userEmail')}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <p className="font-display font-black text-gray-900 text-sm">Welcome Guest</p>
                      <p className="text-[10px] text-gray-500">Sign in for exclusive offers</p>
                    </div>
                    <button
                      onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#920075] text-white font-black text-[10px] uppercase tracking-wider shrink-0"
                    >
                      Sign In
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Customer Action Grid */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { label: 'Orders', icon: Package, path: '/orders', color: 'text-[#D4AF37]' },
                  { label: 'Wishlist', icon: Heart, path: '/wishlist', color: 'text-[#E91E8C]', badge: wishlist.length },
                  { label: 'Cart', icon: ShoppingCart, path: '/cart', color: 'text-[#920075]', badge: cart.length },
                ].map(({ label, icon: Icon, path, color, badge }) => (
                  <button
                    key={label}
                    onClick={() => { setMobileMenuOpen(false); navigate(path); }}
                    className="relative flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-gray-100 shadow-xs hover:border-[#920075]/20 transition-all"
                  >
                    <Icon className={`h-4.5 w-4.5 mb-1 ${color}`} />
                    <span className="text-[10px] font-bold text-gray-700">{label}</span>
                    {badge > 0 && (
                      <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-[#920075] text-white rounded-full text-[8px] font-black flex items-center justify-center">
                        {badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Nav Links */}
              <div className="flex-grow flex flex-col gap-1.5 mt-6">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400 px-4 mb-1">Navigation</p>
                {navLinks.map((link, idx) => (
                  <motion.button
                    key={link.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => { setMobileMenuOpen(false); handleNavClick(link); }}
                    className="flex items-center justify-between w-full h-11 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-gray-700 hover:text-[#920075] hover:bg-[#920075]/5 transition-all"
                  >
                    <span>{link.name}</span>
                    <ArrowRight className="h-3.5 w-3.5 opacity-30" />
                  </motion.button>
                ))}
              </div>

              {/* Drawer Footer */}
              <div className="mt-auto pt-5 border-t border-gray-100">
                {localStorage.getItem('token') ? (
                  <button
                    className="w-full h-11 rounded-xl text-red-600 border border-red-200 bg-red-50/50 text-xs font-black uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                    onClick={() => { setMobileMenuOpen(false); logout(); }}
                  >
                    <Lock className="h-3.5 w-3.5" /> Sign Out
                  </button>
                ) : (
                  <button
                    className="w-full h-11 rounded-xl bg-[#920075] text-white font-black text-xs uppercase tracking-widest hover:bg-[#7a0062] transition-all shadow-md flex items-center justify-center gap-2"
                    onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                  >
                    Sign In to Account <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Page Content */}
      <main className={location.pathname === '/' ? 'pt-0' : 'pt-20'}>
        <Outlet />
      </main>


      {/* Footer */}
      <footer id="contact" className="bg-[#1F0320] border-t border-purple-950/60 text-white relative overflow-hidden mt-0 pt-20 pb-12 font-sans shadow-2xl">
        {/* Curved Separator SVG (Smooth concave top edge) */}
        <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0] -translate-y-[99%] pointer-events-none z-0">
          <svg className="relative block w-full h-[30px] md:h-[50px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0 C300,90 900,90 1200,0 L1200,120 L0,120 Z" className="fill-[#1F0320]"></path>
          </svg>
        </div>

        {/* Muted Ambient Matte Glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute w-[500px] h-[500px] rounded-full blur-[150px] opacity-[0.15] -top-[120px] -left-[120px]"
            style={{ background: 'radial-gradient(circle, #E91E8C 0%, rgba(0,0,0,0) 70%)' }} />
          <div className="absolute w-[500px] h-[500px] rounded-full blur-[150px] opacity-[0.15] bottom-[30px] right-[80px]"
            style={{ background: 'radial-gradient(circle, #D4AF37 0%, rgba(0,0,0,0) 70%)' }} />
        </div>

        {/* Subtle Matte Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-0"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1.5px,transparent 1.5px),linear-gradient(90deg,rgba(255,255,255,0.1) 1.5px,transparent 1.5px)', backgroundSize: '60px 60px' }} />

        <div className="container mx-auto px-6 relative z-10">

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-8 lg:gap-12 pb-12">

            {/* Interactive Newsletter Subscription Card - Matte Finish */}
            <div className="sm:col-span-2 md:col-span-3 lg:col-span-12">
              <div className="relative overflow-hidden rounded-[2.5rem] bg-[#2B062C] border border-purple-900/40 p-8 md:p-12 shadow-xl">
                {/* Muted Glow lights inside the card */}
                <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[#920075]/15 blur-[80px] pointer-events-none" />
                <div className="absolute -left-20 -bottom-20 h-60 w-60 rounded-full bg-[#F59E0B]/15 blur-[80px] pointer-events-none" />

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
                    <h3 className="font-display font-black text-3xl sm:text-4xl text-white leading-tight">
                      Join Our Clean Food <br className="hidden sm:block" />
                      <span className="text-[#F59E0B] italic font-semibold">Nourishment Circle</span>
                    </h3>
                    <p className="text-sm text-purple-100/90 max-w-xl leading-relaxed font-sans font-medium mx-auto lg:mx-0">
                      Subscribe to receive ancient heritage recipe books, healthy meal prep ideas, and exclusive priority invitations to our limited batch farm-fresh product releases.
                    </p>
                  </div>

                  <div className="lg:col-span-5">
                    <AnimatePresence mode="wait">
                      {!subscribed ? (
                        <motion.form
                          key="form"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          onSubmit={handleSubscribe}
                          className="relative flex items-center w-full max-w-md mx-auto lg:mx-0"
                        >
                          <Mail className="absolute left-3.5 sm:left-5 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-purple-300/40 pointer-events-none" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email address..."
                            className="w-full h-12 sm:h-14 pl-10 sm:pl-14 pr-24 sm:pr-36 bg-[#1C031C] border border-purple-800/40 rounded-full text-xs sm:text-sm font-medium text-white placeholder-purple-300/50 focus:outline-none focus:border-[#920075] focus:ring-1 focus:ring-[#920075]/50 transition-all font-sans"
                          />
                          <button
                            type="submit"
                            className="absolute right-1 sm:right-1.5 h-10 sm:h-11 px-3.5 sm:px-6 rounded-full bg-[#920075] hover:bg-[#780060] text-white font-black text-[10px] sm:text-[11px] uppercase tracking-wider transition-all shadow-md shrink-0 flex items-center justify-center gap-1 sm:gap-2 group/btn font-sans"
                          >
                            Join <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-300" />
                          </button>
                        </motion.form>
                      ) : (
                        <motion.div
                          key="success"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="p-6 rounded-2xl bg-[#1C031C] border border-green-400/30 flex items-start gap-4 shadow-sm"
                        >
                          <div className="h-10 w-10 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center text-green-400 shrink-0">
                            <Check className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-black text-white text-sm font-sans">Welcome to the Revolution! 🌱</h4>
                            <p className="text-xs text-purple-100/90 mt-1 leading-relaxed font-sans font-medium">
                              You've joined our movement. Check your inbox shortly for an exclusive **15% discount code** for your next order!
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            {/* Brand Narrative Column */}
            <div className="sm:col-span-2 md:col-span-3 lg:col-span-4 space-y-6 text-center sm:text-left flex flex-col items-center sm:items-start">
              <div>
                <img src={logo} alt="Alimenture Brand Logo" className="h-16 sm:h-20 w-auto object-contain drop-shadow-sm brightness-125 contrast-125 mx-auto sm:mx-0" />
              </div>
              <p className="text-sm text-purple-100/90 leading-relaxed max-w-sm font-sans font-medium">
                Dream of Toxic-Free Food. Ancient heritage grains, traditional clean millets, and natural nourishment — we refuse to compromise.
              </p>

              <div className="flex flex-col gap-2.5 pt-2 text-xs font-sans font-bold items-center sm:items-start">
                <p className="flex items-center gap-2 text-[#920075]">
                  <Leaf className="h-4 w-4 text-[#920075] shrink-0" /> <span className="text-purple-100/90">100% Clean Ingredients</span>
                </p>

                {/* Pulse shipping Nationwide status */}
                <p className="flex items-center gap-2 text-green-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                  </span>
                  <span>Operational & Shipping Nationwide</span>
                </p>
              </div>
            </div>

            {/* Navigation Column */}
            <div className="sm:col-span-1 md:col-span-1 lg:col-span-2 space-y-6 text-center sm:text-left flex flex-col items-center sm:items-start">
              <h4 className="font-sans font-black text-xs uppercase tracking-widest text-[#F59E0B] text-center sm:text-left">Explore</h4>
              <ul className="space-y-3.5 text-sm text-purple-100/80 font-medium font-sans flex flex-col items-center sm:items-start">
                {navLinks.map(link => (
                  <li key={link.name}>
                    <button
                      onClick={() => handleNavClick(link)}
                      className="group/link flex items-center justify-center sm:justify-start gap-1 hover:text-white transition-colors text-center sm:text-left"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#920075] scale-0 group-hover/link:scale-100 transition-transform duration-300 mr-0 group-hover/link:mr-2" />
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account Column */}
            <div className="sm:col-span-1 md:col-span-1 lg:col-span-2 space-y-6 text-center sm:text-left flex flex-col items-center sm:items-start">
              <h4 className="font-sans font-black text-xs uppercase tracking-widest text-[#F59E0B] text-center sm:text-left">Account</h4>
              <ul className="space-y-3.5 text-sm text-purple-100/80 font-medium font-sans flex flex-col items-center sm:items-start">
                <li>
                  <Link to="/orders" className="group/link flex items-center justify-center sm:justify-start gap-1 hover:text-white transition-colors">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#920075] scale-0 group-hover/link:scale-100 transition-transform duration-300 mr-0 group-hover/link:mr-2" />
                    Track Orders
                  </Link>
                </li>
                <li>
                  <Link to="/wishlist" className="group/link flex items-center justify-center sm:justify-start gap-1 hover:text-white transition-colors">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#920075] scale-0 group-hover/link:scale-100 transition-transform duration-300 mr-0 group-hover/link:mr-2" />
                    Wishlist
                  </Link>
                </li>
                <li>
                  <Link to="/cart" className="group/link flex items-center justify-center sm:justify-start gap-1 hover:text-white transition-colors">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#920075] scale-0 group-hover/link:scale-100 transition-transform duration-300 mr-0 group-hover/link:mr-2" />
                    Cart
                  </Link>
                </li>
              </ul>
            </div>

            {/* Policies & Guidelines Column */}
            <div className="sm:col-span-1 md:col-span-1 lg:col-span-2 space-y-6 text-center sm:text-left flex flex-col items-center sm:items-start">
              <h4 className="font-sans font-black text-xs uppercase tracking-widest text-[#F59E0B] text-center sm:text-left">Policies</h4>
              <ul className="space-y-3.5 text-sm text-purple-100/80 font-medium font-sans flex flex-col items-center sm:items-start">
                {[
                  { name: 'Privacy Policy', key: 'privacy' },
                  { name: 'Terms of Service', key: 'terms' },
                  { name: 'Shipping Policy', key: 'shipping' },
                  { name: 'Refund & Returns', key: 'returns' },
                  { name: 'Quality Guidelines', key: 'quality' }
                ].map(policy => (
                  <li key={policy.key}>
                    <button
                      onClick={() => setActivePolicy(policy.key)}
                      className="group/link flex items-center justify-center sm:justify-start gap-1 hover:text-white transition-colors text-center sm:text-left"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#920075] scale-0 group-hover/link:scale-100 transition-transform duration-300 mr-0 group-hover/link:mr-2" />
                      {policy.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Interactive Contact Details */}
            <div className="sm:col-span-2 md:col-span-2 lg:col-span-2 space-y-6 text-center sm:text-left flex flex-col items-center sm:items-start">
              <h4 className="font-sans font-black text-xs uppercase tracking-widest text-[#F59E0B] text-center sm:text-left">Direct Contact</h4>
              <div className="space-y-4 text-xs text-purple-100/80 font-medium font-sans flex flex-col items-center sm:items-start">

                {/* Location */}
                <div className="flex items-center gap-3 group">
                  <div className="h-8 w-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 shadow-sm flex items-center justify-center text-[#F59E0B] group-hover:bg-white/20 group-hover:border-[#F59E0B]/40 group-hover:scale-110 transition-all duration-300 shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <span>Chennai, Tamil Nadu</span>
                </div>

                {/* Email */}
                <a href="mailto:alimentureindustries@gmail.com" className="flex items-center gap-3 group">
                  <div className="h-8 w-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 shadow-sm flex items-center justify-center text-[#F59E0B] group-hover:bg-white/20 group-hover:border-[#F59E0B]/40 group-hover:scale-110 transition-all duration-300 shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="hover:text-white transition-colors truncate">alimentureindustries@gmail.com</span>
                </a>

                {/* Phone lines */}
                <div className="space-y-2 flex flex-col items-center sm:items-start">
                  <a href="tel:+919884733453" className="flex items-center gap-3 group">
                    <div className="h-8 w-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 shadow-sm flex items-center justify-center text-[#F59E0B] group-hover:bg-white/20 group-hover:border-[#F59E0B]/40 group-hover:scale-110 transition-all duration-300 shrink-0">
                      <Phone className="h-4 w-4" />
                    </div>
                    <span className="hover:text-white transition-colors font-sans">+91 98847 33453</span>
                  </a>
                  <a href="tel:+917358196132" className="flex items-center gap-3 group">
                    <div className="h-8 w-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 shadow-sm flex items-center justify-center text-[#F59E0B] group-hover:bg-white/20 group-hover:border-[#F59E0B]/40 group-hover:scale-110 transition-all duration-300 shrink-0">
                      <Phone className="h-4 w-4" />
                    </div>
                    <span className="hover:text-white transition-colors font-sans">+91 73581 96132</span>
                  </a>
                </div>

                {/* Website link */}
                <a href="http://www.alimenture.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                  <div className="h-8 w-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 shadow-sm flex items-center justify-center text-[#F59E0B] group-hover:bg-white/20 group-hover:border-[#F59E0B]/40 group-hover:scale-110 transition-all duration-300 shrink-0">
                    <Globe className="h-4 w-4" />
                  </div>
                  <span className="hover:text-white transition-colors font-sans">www.alimenture.com</span>
                </a>

              </div>
            </div>

          </div>

          {/* Socials & Sub-Footer */}
          <div className="mt-8 pt-8 border-t border-purple-900/40 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3.5 text-center md:text-left">
              <p className="text-xs text-purple-300/60 font-sans font-medium">
                © 2026 Alimenture Industries Private Limited. All rights reserved.
              </p>

              {/* Branded Social circle badges */}
              <div className="flex justify-center md:justify-start gap-3">
                {[
                  {
                    icon: (
                      <svg className="h-4 w-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                    ),
                    href: 'https://instagram.com/alimenture',
                    label: 'Instagram',
                    color: 'hover:text-[#920075] hover:border-[#920075]/50 hover:bg-[#2B062C]'
                  },
                  {
                    icon: (
                      <svg className="h-4 w-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                      </svg>
                    ),
                    href: 'https://facebook.com/alimenture',
                    label: 'Facebook',
                    color: 'hover:text-[#1877F2] hover:border-[#1877F2]/50 hover:bg-[#2B062C]'
                  },
                  {
                    icon: (
                      <svg className="h-4 w-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                        <rect x="2" y="9" width="4" height="12"></rect>
                        <circle cx="4" cy="4" r="2"></circle>
                      </svg>
                    ),
                    href: 'https://linkedin.com/company/alimenture',
                    label: 'LinkedIn',
                    color: 'hover:text-[#0A66C2] hover:border-[#0A66C2]/50 hover:bg-[#2B062C]'
                  },
                  {
                    icon: (
                      <svg className="h-4 w-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                      </svg>
                    ),
                    href: 'https://twitter.com/alimenture',
                    label: 'Twitter',
                    color: 'hover:text-[#1DA1F2] hover:border-[#1DA1F2]/50 hover:bg-[#2B062C]'
                  },
                ].map(social => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className={`h-9 w-9 rounded-xl bg-[#2B062C] border border-purple-900/40 shadow-sm flex items-center justify-center text-purple-200/70 hover:-translate-y-1 transition-all duration-300 ${social.color}`}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Inverted pills for core attributes */}
            <div className="flex flex-wrap justify-center gap-3 text-[10px] font-black uppercase tracking-wider font-sans">
              <span className="px-3.5 py-1.5 bg-[#2B062C] border border-purple-900/30 rounded-full text-[#920075]">Pure Ingredients</span>
              <span className="px-3.5 py-1.5 bg-[#2B062C] border border-purple-900/30 rounded-full text-[#F59E0B]">Honest Nourishment</span>
              <span className="px-3.5 py-1.5 bg-[#2B062C] border border-purple-900/30 rounded-full text-purple-200 font-sans">Crafted Naturally</span>
            </div>
          </div>

        </div>
      </footer>

      {/* Policy Details Modal */}
      <AnimatePresence>
        {activePolicy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#2B062C] border border-purple-900/60 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white shadow-2xl relative overflow-hidden"
            >
              <div className="flex justify-between items-center pb-4 border-b border-purple-900/40">
                <h3 className="font-display font-black text-lg sm:text-xl text-[#F59E0B]">
                  {policyDetails[activePolicy]?.title}
                </h3>
                <button
                  onClick={() => setActivePolicy(null)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="py-6 text-xs sm:text-sm text-purple-100/90 leading-relaxed font-sans font-medium">
                <p>{policyDetails[activePolicy]?.content}</p>
              </div>

              <div className="pt-4 border-t border-purple-900/40 flex justify-end">
                <button
                  onClick={() => setActivePolicy(null)}
                  className="px-6 py-2.5 rounded-full bg-[#920075] hover:bg-[#780060] text-white font-black text-xs uppercase tracking-wider transition-all shadow-md"
                >
                  Close Guidelines
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CookieConsent />
      <ChatWidget />
    </div>
  );
}