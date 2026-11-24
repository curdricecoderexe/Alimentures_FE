import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart, User, Package, Search, Heart, Truck, Lock, Menu, X, ArrowRight,
  MapPin, Mail, Phone, Globe, ArrowUp, Send, Check, ChevronRight, LayoutDashboard, Leaf,
  Users, CheckCircle2, Quote, ShieldCheck, Loader2, ChevronDown, Gift, Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import logo from '../assets/logo.png';
import ImageWithFallback from '../assets/lan.webp';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { toast } from 'sonner';
// Lazy: keeps socket.io out of the first page load.
const ChatWidget = lazy(() => import('../components/ChatWidget'));
import CookieConsent from '../components/CookieConsent';
import MobileDock from '../components/MobileDock';
import { PageBackdrop } from '../components/ui/motion';
import { pageview, initAutoTracking, initPerformance } from '../lib/lazyInsights';
import { cachedFetch, logout, API_BASE } from '../lib/api';
import { POLICIES } from '../data/policies';
import { productPath, categoryPath, displayName } from '../lib/seo';
import { useCategories } from '../lib/categories';
import { CHENNAI_PAGE } from '../data/localSeo';
import TrustBadges from '../components/TrustBadges';
import ShopMenu from '../components/nav/ShopMenu';
import { SOCIAL_PLATFORMS, resolveSocialLinks } from '../lib/socialPlatforms';
import { hampersVisibleIn } from '../lib/storefrontSettings';
// Removed Loader import
// Removed unused import: womenImage
// Removed unused import: coverImage

gsap.registerPlugin(ScrollTrigger);

export default function CustomerLayout() {
  const { cart, wishlist } = useCart();
  const navigate = useNavigate();
  // Footer social links — managed in Admin → Social Links.
  const [socialLinks, setSocialLinks] = useState(() => resolveSocialLinks(null));
  // Gift Hampers page switch — Admin → Gift Hampers. Hidden until settings load
  // so a switched-off page never flashes into the nav.
  const [hampersVisible, setHampersVisible] = useState(false);
  useEffect(() => {
    let alive = true;
    cachedFetch(`${API_BASE}/settings`, 5 * 60 * 1000)
      .then((j) => {
        if (!alive) return;
        if (j?.success) setSocialLinks(resolveSocialLinks(j.data));
        setHampersVisible(hampersVisibleIn(j?.success ? j.data : null));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  // Crawlable links to every category that has products (SEO + navigation).
  const managedCategories = useCategories();
  const footerCategories = managedCategories.filter((c) => c.visible !== false && c.productCount > 0);
  // Nav / Shop menu: visible categories in admin order (empty shelves are hidden inside the menu).
  const navCategories = managedCategories.filter((c) => c.visible !== false);
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const shopCloseTimer = useRef(null);
  const shopOpenedAt = useRef(0);
  const openShop = () => {
    clearTimeout(shopCloseTimer.current);
    setShopOpen((was) => { if (!was) shopOpenedAt.current = Date.now(); return true; });
  };
  // Hover already opened it → a click right after must not close it again.
  const toggleShop = () => {
    if (Date.now() - shopOpenedAt.current < 400) return;
    setShopOpen((v) => !v);
  };
  const scheduleShopClose = () => {
    clearTimeout(shopCloseTimer.current);
    shopCloseTimer.current = setTimeout(() => setShopOpen(false), 160);
  };
  const [animateCart, setAnimateCart] = useState(false);
  const [animateWishlist, setAnimateWishlist] = useState(false);

  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [email, setEmail] = useState('');

  // Saves the email (Admin → Subscribers) and triggers the welcome email.
  const handleSubscribe = async (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setSubscribing(true);
    try {
      const res = await fetch(`${API_BASE}/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value, source: 'footer' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Something went wrong. Please try again.');
      setSubscribed(true);
      toast.success('Welcome to the Nourishment Circle!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubscribing(false);
    }
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

  useEffect(() => { setShopOpen(false); setIsSearching(false); }, [location.pathname]);

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

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'About Us', path: '/about', group: 'about', icon: Users, desc: 'Who we are & what we stand for' },
    { name: 'Why Choose Us', path: '/why-choose-us', group: 'about', icon: ShieldCheck, desc: 'Clean label, nothing hidden' },
    { name: 'Blog', path: '/blog' },
    ...(hampersVisible ? [{ name: 'Gift Hampers', path: '/hampers' }] : []),
  ];
  // Desktop pill: Shop ▾ · About Us · Why Choose Us · Blog · Hampers.
  const aboutLinks = navLinks.filter((l) => l.group === 'about');

  const smoothTo = (target) => lenisRef.current?.scrollTo(target, {
    offset: -90,
    duration: 1.4,
    easing: (x) => Math.min(1, 1.001 - Math.pow(2, -10 * x)),
  });

  const handleNavClick = (link) => {
    const onPage = location.pathname === link.path;
    if (link.scrollId) {
      const el = document.getElementById(link.scrollId);
      // Same page → glide to the section; otherwise the hash effect scrolls after the page loads.
      if (onPage && el) smoothTo(el);
      else navigate(`${link.path}#${link.scrollId}`);
      return;
    }
    if (onPage) { smoothTo(0); return; }
    navigate(link.path);
  };

  const badgeCls = "absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full flex items-center justify-center text-[10.5px] font-bold text-white bg-berry border-2 border-white shadow-sm";

  const isHome = location.pathname === '/';
  const isSolidNav = scrolled || !isHome;

  // Seed-style pills: frosted, more opaque once the page scrolls.
  const pillCls = `rounded-full backdrop-blur-xl ring-1 transition-[background-color,box-shadow] duration-500 ${
    isSolidNav
      ? 'bg-paper/95 ring-black/5 shadow-[0_14px_40px_-18px_rgba(43,11,51,0.40)]'
      : 'bg-paper/80 ring-white/60 shadow-[0_14px_40px_-20px_rgba(0,0,0,0.45)]'
  }`;
  const navLinkCls = (active) =>
    `inline-flex items-center h-10 px-2.5 xl:px-4 rounded-full text-[13.5px] xl:text-[14.5px] font-medium tracking-[-0.005em] transition-colors duration-200 whitespace-nowrap ${
      active ? 'bg-berry-tint text-berry' : 'text-ink hover:bg-ink/[0.05]'
    }`;
  const footerHeadCls = 'text-[13px] font-semibold text-white';
  const footerLinkCls = 'inline-flex items-center min-h-[40px] lg:min-h-0 text-[14px] text-white/60 hover:text-white transition-colors text-left';
  const iconBtnCls = 'relative h-10 w-10 rounded-full flex items-center justify-center text-ink hover:bg-ink/[0.06] transition-colors';

  return (
    <div className="min-h-screen text-ink relative font-sans overflow-x-clip bg-cream isolate">

      {/* Shared ambient background for every customer route (sits behind everything, nav included) */}
      {!isHome && <PageBackdrop />}

      {/* ── NAVBAR — Seed pattern: two floating pills, "Shop" opens a category mega-menu ── */}
      <header
        ref={navRef}
        className="fixed top-0 inset-x-0 z-[100] px-3 sm:px-5 lg:px-6 pt-3 sm:pt-4 pointer-events-none"
        onKeyDown={(e) => { if (e.key === 'Escape') { setShopOpen(false); setIsSearching(false); } }}
      >
        <div className="mx-auto max-w-[1440px] flex items-start justify-between gap-3">
          {/* LEFT PILL — logo + primary links */}
          <div className="relative pointer-events-auto" onMouseLeave={scheduleShopClose}>
            <nav aria-label="Main" className={`${pillCls} flex items-center h-14 sm:h-[60px] pl-3 sm:pl-4 pr-2`}>
              <Link to="/" className="flex items-center shrink-0 pr-2" aria-label="Alimenture home">
                <img src={logo} alt="Alimenture" className="h-12 sm:h-[58px] w-auto object-contain -my-1 scale-[1.18] origin-left" />
              </Link>

              <div className="hidden lg:flex items-center gap-0.5 pl-3 ml-1 border-l border-hairline">
                <button
                  type="button"
                  onMouseEnter={openShop}
                  onClick={toggleShop}
                  aria-expanded={shopOpen}
                  aria-controls="shop-menu"
                  className={`${navLinkCls(shopOpen || location.pathname.startsWith('/shop') || location.pathname.startsWith('/categories'))} gap-1`}
                >
                  Shop <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${shopOpen ? 'rotate-180' : ''}`} />
                </button>

                {aboutLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onMouseEnter={scheduleShopClose}
                    className={navLinkCls(location.pathname === link.path)}
                  >
                    {link.name}
                  </Link>
                ))}
                <Link
                  to="/blog"
                  onMouseEnter={scheduleShopClose}
                  className={navLinkCls(location.pathname.startsWith('/blog'))}
                >
                  Blog
                </Link>
                {/* Hampers — seasonal highlight: gold gift chip */}
                {hampersVisible && (
                  <Link
                    to="/hampers"
                    onMouseEnter={scheduleShopClose}
                    className={`${navLinkCls(location.pathname === '/hampers')} gap-2 pl-2.5`}
                  >
                    <span className="relative h-6 w-6 rounded-full bg-gradient-to-br from-gold-light to-[#F5C46A] text-night flex items-center justify-center shadow-[0_4px_10px_-4px_rgba(199,128,26,0.8)]">
                      <Gift className="h-3.5 w-3.5" />
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-berry ring-2 ring-paper animate-pulse" aria-hidden="true" />
                    </span>
                    Hampers
                  </Link>
                )}
              </div>
            </nav>

            <AnimatePresence>
              {shopOpen && (
                <ShopMenu
                  categories={navCategories}
                  onNavigate={() => setShopOpen(false)}
                  onMouseEnter={openShop}
                  onMouseLeave={scheduleShopClose}
                />
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT PILL — search, wishlist, cart, account */}
          <div className="relative pointer-events-auto">
            <div className={`${pillCls} flex items-center gap-1 h-14 sm:h-[60px] px-2`}>
              <button
                type="button"
                onClick={() => { setIsSearching((v) => !v); setShopOpen(false); }}
                aria-label="Search products"
                aria-expanded={isSearching}
                className={`${iconBtnCls} ${isSearching ? 'bg-berry-tint text-berry' : ''}`}
              >
                {isSearching ? <X className="h-[18px] w-[18px]" /> : <Search className="h-[18px] w-[18px]" />}
              </button>

              <motion.div className="hidden lg:block" animate={animateWishlist ? { scale: [1, 1.25, 1] } : {}} transition={{ duration: 0.3 }}>
                <button type="button" onClick={() => navigate('/wishlist')} aria-label="Wishlist" className={iconBtnCls}>
                  <Heart className="h-[18px] w-[18px]" />
                  {wishlist.length > 0 && <span className={badgeCls}>{wishlist.length}</span>}
                </button>
              </motion.div>

              <motion.div className="hidden lg:block" animate={animateCart ? { scale: [1, 1.25, 1] } : {}} transition={{ duration: 0.3 }}>
                <button type="button" onClick={() => navigate('/cart')} aria-label="Cart" className={iconBtnCls}>
                  <ShoppingCart className="h-[18px] w-[18px]" />
                  {cart.length > 0 && <span className={badgeCls}>{cart.length}</span>}
                </button>
              </motion.div>

              <div className="hidden lg:flex items-center pl-1">
                {localStorage.getItem('token') ? (
                  <>
                    {/* Profile */}
                  <div className="relative">
                    <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} aria-label="Account" aria-expanded={profileMenuOpen}
                      className={`${iconBtnCls} ${profileMenuOpen ? 'bg-berry-tint text-berry' : ''}`}>
                      <User className="h-[18px] w-[18px]" />
                    </button>

                    <AnimatePresence>
                      {profileMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                          <motion.div initial={{ opacity: 0, y: 12, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.95 }}
                            transition={{ type: 'spring', bounce: 0.1, duration: 0.4 }}
                            className="absolute right-0 top-full mt-3 w-80 bg-white/95 backdrop-blur-3xl border border-hairline rounded-3xl p-6 z-50 shadow-[0_30px_60px_rgba(0,0,0,0.08)] overflow-hidden">

                            {/* Ambient background glows for the dropdown */}
                            <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] rounded-full bg-[#D4148F] opacity-10 blur-[60px] pointer-events-none" />
                            <div className="absolute bottom-[-50px] left-[-50px] w-[150px] h-[150px] rounded-full bg-[#F8A830] opacity-10 blur-[60px] pointer-events-none" />

                            {localStorage.getItem('token') ? (
                              <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-hairline">
                                  <div className="relative shrink-0">
                                    <div className="h-12 w-12 rounded-full bg-white border border-hairline/80 flex items-center justify-center text-[#B0128F] shadow-md">
                                      <User className="h-6 w-6 text-[#B0128F]" />
                                    </div>
                                  </div>
                                  <div className="flex-1 text-left min-w-0">
                                    <span className="inline-block mb-1 text-[10px] font-extrabold bg-cream-deep border border-hairline text-ink-soft px-2 py-0.5 rounded-full uppercase tracking-widest">
                                      {localStorage.getItem('role') || 'Member'}
                                    </span>
                                    <p className="font-display font-extrabold text-ink text-base leading-tight truncate">{localStorage.getItem('userName') || 'Customer'}</p>
                                    <p className="text-[10px] text-ink-muted truncate">{localStorage.getItem('userEmail')}</p>
                                  </div>
                                </div>

                                <div className="space-y-1 mb-6">
                                  {localStorage.getItem('role') === 'admin' && (
                                    <button onClick={() => { setProfileMenuOpen(false); navigate('/admin'); }} className="w-full flex items-center justify-between p-3 rounded-xl text-ink-soft hover:text-ink hover:bg-cream transition-colors group">
                                      <div className="flex items-center gap-3">
                                        <LayoutDashboard className="h-4 w-4 text-ink-muted group-hover:text-[#B0128F] transition-colors" />
                                        <span className="text-xs font-bold">Admin Dashboard</span>
                                      </div>
                                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-ink-muted group-hover:text-ink" />
                                    </button>
                                  )}
                                  {localStorage.getItem('role') === 'staff' && (
                                    <button onClick={() => { setProfileMenuOpen(false); navigate('/staff'); }} className="w-full flex items-center justify-between p-3 rounded-xl text-ink-soft hover:text-ink hover:bg-cream transition-colors group">
                                      <div className="flex items-center gap-3">
                                        <LayoutDashboard className="h-4 w-4 text-ink-muted group-hover:text-[#B0128F] transition-colors" />
                                        <span className="text-xs font-bold">Staff Dashboard</span>
                                      </div>
                                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-ink-muted group-hover:text-ink" />
                                    </button>
                                  )}
                                  <button onClick={() => { setProfileMenuOpen(false); navigate('/orders'); }} className="w-full flex items-center justify-between p-3 rounded-xl text-ink-soft hover:text-ink hover:bg-cream transition-colors group">
                                    <div className="flex items-center gap-3">
                                      <Package className="h-4 w-4 text-ink-muted group-hover:text-[#F8A830] transition-colors" />
                                      <span className="text-xs font-bold">My Orders</span>
                                    </div>
                                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-ink-muted group-hover:text-ink" />
                                  </button>
                                  <button onClick={() => { setProfileMenuOpen(false); navigate('/addresses'); }} className="w-full flex items-center justify-between p-3 rounded-xl text-ink-soft hover:text-ink hover:bg-cream transition-colors group">
                                    <div className="flex items-center gap-3">
                                      <MapPin className="h-4 w-4 text-ink-muted group-hover:text-[#B0128F] transition-colors" />
                                      <span className="text-xs font-bold">My Addresses</span>
                                    </div>
                                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-ink-muted group-hover:text-ink" />
                                  </button>
                                  <button onClick={() => { setProfileMenuOpen(false); navigate('/wishlist'); }} className="w-full flex items-center justify-between p-3 rounded-xl text-ink-soft hover:text-ink hover:bg-cream transition-colors group">
                                    <div className="flex items-center gap-3">
                                      <Heart className="h-4 w-4 text-ink-muted group-hover:text-[#D4148F] transition-colors" />
                                      <span className="text-xs font-bold">Wishlist</span>
                                    </div>
                                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-ink-muted group-hover:text-ink" />
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
                                    className="absolute inset-0 rounded-full border border-dashed border-[#F8A830]/40"
                                  />
                                  <div className="h-12 w-12 rounded-full bg-white border border-hairline/80 flex items-center justify-center text-[#B0128F] shadow-md">
                                    <User className="h-6 w-6 text-[#B0128F]" />
                                  </div>
                                </div>
                                <h4 className="font-display font-extrabold text-2xl text-ink mb-1 tracking-tight">Welcome Back</h4>
                                <p className="text-[11px] text-ink-muted mb-6 font-medium">Securely access your account</p>

                                <button className="relative w-full h-12 rounded-xl bg-gray-900 text-white font-extrabold text-[11px] uppercase tracking-widest hover:bg-black transition-all mb-4 flex items-center justify-center gap-2 group overflow-hidden shadow-md hover:shadow-lg"
                                  onClick={() => { setProfileMenuOpen(false); navigate('/login'); }}>
                                  <span className="relative z-10 flex items-center gap-2">Sign In <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" /></span>
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                </button>

                                <p className="text-[10px] text-ink-muted">
                                  New here? <Link to="/register" onClick={() => setProfileMenuOpen(false)} className="text-[#B0128F] hover:text-[#D4148F] transition-colors underline decoration-[#B0128F]/30 underline-offset-2 font-bold ml-1">Create an account</Link>
                                </p>
                              </div>
                            )}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  </>
                ) : (
                  <Link to="/login" className="btn-pill btn-pill-sm">Sign in</Link>
                )}
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className={`lg:hidden ${iconBtnCls}`}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            {/* search dropdown */}
            <AnimatePresence>
              {isSearching && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full pt-2 z-[120] w-[min(440px,calc(100vw-1.5rem))]"
                >
                  <div className="rounded-[24px] bg-paper/95 backdrop-blur-2xl ring-1 ring-black/5 shadow-[0_30px_70px_-30px_rgba(43,11,51,0.45)] p-3">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-berry" />
                      <input
                        type="search"
                        autoFocus
                        placeholder="Search millet cookies, honey, jaggery…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && searchQuery.trim()) {
                            setIsSearching(false);
                            navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
                          }
                        }}
                        className="w-full h-12 pl-11 pr-4 rounded-full bg-cream border border-hairline text-[14px] text-ink placeholder:text-ink-muted focus:outline-none focus:border-berry/50 focus:ring-2 focus:ring-berry/15"
                      />
                    </div>
                    {searchQuery.trim().length >= 2 ? (
                      <div className="mt-2 max-h-[60vh] overflow-y-auto">
{searchLoading && <div className="flex justify-center py-3"><Loader2 className="animate-spin text-berry" /></div>}
                    {!searchLoading && searchResults.length === 0 && <p className="text-ink-muted text-xs text-center py-4">No products found…</p>}
                    {searchResults.map(p => (
                      <Link key={p.id || p._id} to={productPath(p)}
                        onClick={() => { setIsSearching(false); setSearchQuery(''); }}
                        className="flex items-center gap-3 p-2 rounded-2xl hover:bg-cream transition-colors group">
                        <img src={p.image || ImageWithFallback} alt="" className="w-12 h-12 rounded-xl object-cover plate-sandal" />
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-[14px] font-medium text-ink group-hover:text-berry transition-colors truncate">{displayName(p.name || p.title)}</p>
                          <p className="text-[12px] text-ink-muted truncate">{p.category}</p>
                        </div>
                        {Number(p.price) > 0 && <span className="text-[13px] text-ink-soft shrink-0">₹{p.price}</span>}
                      </Link>
                    ))}
                      </div>
                    ) : (
                      <div className="mt-3 px-1 pb-1 flex flex-wrap gap-1.5">
                        {navCategories.slice(0, 6).map((c) => (
                          <Link
                            key={c.name}
                            to={categoryPath(c.name)}
                            onClick={() => setIsSearching(false)}
                            className="h-8 px-3 inline-flex items-center rounded-full border border-hairline text-[12.5px] text-ink-soft hover:border-berry/40 hover:text-berry transition-colors"
                          >
                            {c.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
              <div className="flex items-center justify-between pb-5 border-b border-hairline">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center">
                  <img src={logo} alt="Alimenture" className="h-12 w-auto object-contain drop-shadow-sm" />
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-9 w-9 flex items-center justify-center text-ink-muted rounded-full hover:bg-cream-deep hover:text-ink transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User Profile Info Card in Mobile Drawer */}
              <div className="mt-5 p-4 bg-cream/80 rounded-2xl border border-hairline flex items-center justify-between">
                {localStorage.getItem('token') ? (
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-[#B0128F]/10 border border-[#B0128F]/20 flex items-center justify-center text-[#B0128F] shrink-0 font-bold">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-extrabold text-ink text-sm truncate">{localStorage.getItem('userName') || 'Customer'}</p>
                      <p className="text-[10px] text-ink-muted truncate">{localStorage.getItem('userEmail')}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <p className="font-display font-extrabold text-ink text-sm">Welcome Guest</p>
                      <p className="text-[10px] text-ink-muted">Sign in for exclusive offers</p>
                    </div>
                    <button
                      onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#B0128F] text-white font-extrabold text-[10px] uppercase tracking-wider shrink-0"
                    >
                      Sign In
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Customer Action Grid */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { label: 'Orders', icon: Package, path: '/orders', color: 'text-[#F8A830]' },
                  { label: 'Wishlist', icon: Heart, path: '/wishlist', color: 'text-[#D4148F]', badge: wishlist.length },
                  { label: 'Cart', icon: ShoppingCart, path: '/cart', color: 'text-[#B0128F]', badge: cart.length },
                ].map(({ label, icon: Icon, path, color, badge }) => (
                  <button
                    key={label}
                    onClick={() => { setMobileMenuOpen(false); navigate(path); }}
                    className="relative flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-hairline shadow-xs hover:border-[#B0128F]/20 transition-all"
                  >
                    <Icon className={`h-4.5 w-4.5 mb-1 ${color}`} />
                    <span className="text-[10px] font-bold text-ink-soft">{label}</span>
                    {badge > 0 && (
                      <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-[#B0128F] text-white rounded-full text-[10px] font-extrabold flex items-center justify-center">
                        {badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Gift hampers promo */}
              {hampersVisible && (
                <Link
                  to="/hampers"
                  onClick={() => setMobileMenuOpen(false)}
                  className="relative mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#2B0B33] via-[#542650] to-[#7C276E] text-paper p-4 flex items-center gap-3.5 isolate"
                >
                  <span aria-hidden="true" className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gold-light/30 blur-2xl -z-10" />
                  <span className="h-11 w-11 shrink-0 rounded-xl bg-gold-light text-night flex items-center justify-center"><Gift className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 font-display text-[15px] font-medium">Gift hampers <Sparkles className="h-3.5 w-3.5 text-gold-light" /></span>
                    <span className="block text-[12px] text-white/65">Curated for festivals, teams & loved ones</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-white/70 shrink-0" />
                </Link>
              )}

              {/* Shop by category (Seed: product list in the menu) */}
              {navCategories.length > 0 && (
                <div className="mt-6">
                  <p className="text-[10.5px] font-extrabold uppercase tracking-[0.25em] text-ink-muted px-4 mb-2">Shop by category</p>
                  <div className="grid grid-cols-2 gap-2">
                    {navCategories.map((c) => (
                      <Link
                        key={c.id || c.name}
                        to={categoryPath(c.name)}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex flex-col justify-between min-h-[4.5rem] rounded-2xl bg-cream/80 border border-hairline px-3.5 py-3 hover:border-berry/30 transition-colors"
                      >
                        <span className="font-display text-[14px] font-medium text-ink leading-tight">{c.name}</span>
                        {c.productCount > 0 && <span className="text-[11px] text-ink-muted">{c.productCount} products</span>}
                      </Link>
                    ))}
                    <Link
                      to="/shop"
                      onClick={() => setMobileMenuOpen(false)}
                      className="col-span-2 flex items-center justify-between rounded-2xl bg-mulberry text-white px-4 h-12 text-[14px] font-medium"
                    >
                      Shop all products <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Nav Links */}
              <div className="flex-grow flex flex-col gap-1.5 mt-6">
                <p className="text-[10.5px] font-extrabold uppercase tracking-[0.25em] text-ink-muted px-4 mb-1">Navigation</p>
                {navLinks.filter((link) => link.name !== 'Shop').map((link, idx) => (
                  <motion.button
                    key={link.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => { setMobileMenuOpen(false); handleNavClick(link); }}
                    className="flex items-center justify-between w-full h-11 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider text-ink-soft hover:text-[#B0128F] hover:bg-[#B0128F]/5 transition-all"
                  >
                    <span className="flex items-center gap-2">
                      {link.name}
                      {link.path === '/hampers' && <Gift className="h-3.5 w-3.5 text-gold" />}
                      {link.path === '/blog' && <span className="h-4 px-1.5 rounded-full bg-gold-light/90 text-night text-[9px] leading-4 tracking-wider">NEW</span>}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 opacity-30" />
                  </motion.button>
                ))}
              </div>

              {/* Drawer Footer */}
              <div className="mt-auto pt-5 border-t border-hairline">
                {localStorage.getItem('token') ? (
                  <button
                    className="w-full h-11 rounded-xl text-red-600 border border-red-200 bg-red-50/50 text-xs font-extrabold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                    onClick={() => { setMobileMenuOpen(false); logout(); }}
                  >
                    <Lock className="h-3.5 w-3.5" /> Sign Out
                  </button>
                ) : (
                  <button
                    className="w-full h-11 rounded-xl bg-[#B0128F] text-white font-extrabold text-xs uppercase tracking-widest hover:bg-[#7a0062] transition-all shadow-md flex items-center justify-center gap-2"
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
      <main className={`relative z-10 ${location.pathname === '/' ? 'pt-0' : 'pt-20'}`}>
        <Outlet />
      </main>


      {/* Footer */}
      <footer
        id="contact"
        className="relative mt-0 overflow-hidden text-white/70 font-sans rounded-t-[28px] sm:rounded-t-[40px] pt-14 sm:pt-16 pb-28 lg:pb-10"
        style={{ background: 'linear-gradient(165deg, #542650 0%, #4A2147 55%, #401C3E 100%)' }}
      >
        <div className="relative mx-auto max-w-[1240px] 2xl:max-w-[1400px] px-5 sm:px-8">

          {/* Newsletter */}
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-center rounded-[20px] bg-white/[0.06] ring-1 ring-white/[0.1] px-5 py-6 sm:px-8 sm:py-7">
            <div className="lg:col-span-6">
              <h3 className="text-[20px] sm:text-[22px] font-semibold text-white tracking-[-0.01em]">Join the Nourishment Circle</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-white/60">
                Heritage recipes, meal-prep ideas and early word on new batches. No spam.
              </p>
            </div>
            <div className="lg:col-span-6">
              <AnimatePresence mode="wait" initial={false}>
                {!subscribed ? (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubscribe}
                    className="flex flex-col sm:flex-row gap-2.5"
                  >
                    <label className="relative flex-1">
                      <span className="sr-only">Email address</span>
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        className="w-full h-12 pl-10 pr-4 rounded-[12px] bg-white/[0.06] border border-white/[0.12] text-[14px] text-white placeholder:text-white/35 focus:outline-none focus:border-white/40 transition-colors"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={subscribing}
                      className="h-12 px-6 rounded-[12px] bg-white text-[#542650] text-[14px] font-semibold hover:bg-white/90 disabled:opacity-60 transition-colors"
                    >
                      {subscribing ? 'Subscribing…' : 'Subscribe'}
                    </button>
                  </motion.form>
                ) : (
                  <motion.p
                    key="done"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-start gap-3 text-[14px] text-white/80"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    You’re in. Check your inbox for a welcome email from Alimenture.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Columns */}
          <div className="mt-12 sm:mt-14 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-x-6 gap-y-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-4 lg:col-span-4 lg:pr-8">
              <Link to="/" className="inline-flex rounded-[14px] bg-white px-3.5 py-2" aria-label="Alimenture home">
                <img src={logo} alt="Alimenture" className="h-10 sm:h-11 w-auto object-contain" />
              </Link>
              <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-white/60">
                Heritage millets, country sugar and honest baking — clean food made in Chennai and delivered across India.
              </p>
              {socialLinks.length > 0 && (
                <div className="mt-6 flex gap-2.5">
                  {socialLinks.map((social, i) => {
                    const meta = SOCIAL_PLATFORMS[social.platform];
                    return (
                      <a
                        key={`${social.platform}-${i}`}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={meta.label}
                        title={meta.label}
                        className="h-10 w-10 rounded-full bg-white/[0.06] ring-1 ring-white/[0.1] flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.12] transition-colors [&>svg]:h-4 [&>svg]:w-4"
                      >
                        {meta.icon}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Explore */}
            <nav aria-label="Explore" className="lg:col-span-2">
              <h4 className={footerHeadCls}>Explore</h4>
              <ul className="mt-4 space-y-2.5">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <button type="button" onClick={() => handleNavClick(link)} className={footerLinkCls}>{link.name}</button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Shop + account */}
            <nav aria-label="Shop" className="lg:col-span-2">
              {footerCategories.length > 0 && (
                <>
                  <h4 className={footerHeadCls}>Shop</h4>
                  <ul className="mt-4 mb-8 space-y-2.5">
                    {footerCategories.map((c) => (
                      <li key={c.id}><Link to={categoryPath(c.name)} className={footerLinkCls}>{c.name}</Link></li>
                    ))}
                    {CHENNAI_PAGE.published && (
                      <li><Link to="/locations/chennai" className={footerLinkCls}>Delivery in Chennai</Link></li>
                    )}
                  </ul>
                </>
              )}
              <h4 className={footerHeadCls}>Account</h4>
              <ul className="mt-4 space-y-2.5">
                <li><Link to="/orders" className={footerLinkCls}>Track orders</Link></li>
                <li><Link to="/wishlist" className={footerLinkCls}>Wishlist</Link></li>
                <li><Link to="/cart" className={footerLinkCls}>Cart</Link></li>
              </ul>
            </nav>

            {/* Policies */}
            <nav aria-label="Policies" className="lg:col-span-2">
              <h4 className={footerHeadCls}>Policies</h4>
              <ul className="mt-4 space-y-2.5">
                {POLICIES.map((policy) => (
                  <li key={policy.slug}><Link to={`/policies/${policy.slug}`} className={footerLinkCls}>{policy.name}</Link></li>
                ))}
              </ul>
            </nav>

            {/* Contact */}
            <div className="col-span-2 md:col-span-1 lg:col-span-2">
              <h4 className={footerHeadCls}>Contact</h4>
              <ul className="mt-4 space-y-3 text-[14px]">
                <li className="flex items-start gap-2.5"><MapPin className="h-4 w-4 mt-0.5 text-white/40 shrink-0" /> Chennai, Tamil Nadu</li>
                <li><a href="mailto:alimentureindustries@gmail.com" className={`${footerLinkCls} flex items-start gap-2.5 min-w-0`}><Mail className="h-4 w-4 mt-0.5 text-white/40 shrink-0" /> <span className="min-w-0 [overflow-wrap:anywhere] lg:text-[13px] xl:text-[14px]">alimentureindustries<wbr />@gmail.com</span></a></li>
                <li><a href="tel:+917358196132" className={`${footerLinkCls} flex items-center gap-2.5`}><Phone className="h-4 w-4 text-white/40 shrink-0" /> +91 73581 96132</a></li>
                <li><a href="tel:+919884733453" className={`${footerLinkCls} flex items-center gap-2.5`}><Phone className="h-4 w-4 text-white/40 shrink-0" /> +91 98847 33453</a></li>
              </ul>
            </div>
          </div>

          {/* Payment, licence & shipping partners */}
          <div className="mt-12">
            <TrustBadges />
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 text-[12.5px] text-white/45">
            <p>© {new Date().getFullYear()} Alimenture Industries Private Limited. All rights reserved.</p>
            <p>Made in Chennai, India</p>
          </div>
        </div>
      </footer>

      <MobileDock />
      <CookieConsent />
      <Suspense fallback={null}><ChatWidget /></Suspense>
    </div>
  );
}