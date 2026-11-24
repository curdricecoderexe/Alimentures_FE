import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Check, ArrowRight, Wheat, Cookie, Star, Shield, Leaf, Zap, HelpCircle, Minus, Plus, ShieldCheck, Sprout, Activity, Award, CheckCircle2, Quote, Globe, Users, ChevronLeft, ChevronRight, Droplet } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAppearance } from '../../lib/appearance';
import { cachedFetch } from '../../lib/api';
import CatalogueDownload from '../../components/home/CatalogueDownload';
import { BenefitBand, CraftSpotlight, CategoryRows } from '../../components/home/SeedSections';
import ProductCard, { ProductImageFrame } from '../../components/ui/ProductCard';
import ProductCardSkeleton from '../../components/skeletons/ProductCardSkeleton';
import { Reveal } from '../../components/ui/motion';
import MobileSliderControls from '../../components/ui/MobileSliderControls';
import featuredBgDefault from '../../assets/feature-bg.webp';


import redMilletsMateImg from '../../assets/fav/red_millets_mate.webp';
import pentaBiteImg from '../../assets/fav/penta_bite.webp';
import triGrainGainImg from '../../assets/fav/tri_grain_gain.webp';
import classicCocletsImg from '../../assets/fav/classic_coclets.webp';
import { productPath, HOME_SEO, organizationJsonLd, websiteJsonLd } from '../../lib/seo';
import SEO from '../../components/SEO';
import { SUPPORT_CONTACT } from '../../data/policies';
import { useCategories } from '../../lib/categories';
import useMediaQuery from '../../hooks/useMediaQuery';
import { Snowfall, HangingOrnaments, ChristmasBand } from '../../components/home/Festive';
import { isChristmasSeason } from '../../data/seasonal';
import { useStorefrontSettings, hampersVisibleIn } from '../../lib/storefrontSettings';

gsap.registerPlugin(ScrollTrigger);

// Gradients & Glass Styles
const GRADIENT_PURPLE_GOLD = 'bg-gradient-to-br from-berry via-berry-bright to-gold-light';
const TEXT_GRADIENT = 'bg-gradient-to-r from-berry-deep to-orange-600 bg-clip-text text-transparent drop-shadow-sm';
const GLASS_CARD = 'glass border border-white/40 shadow-xl shadow-violet-900/5 hover:shadow-2xl hover:shadow-violet-900/10 transition-all duration-500';
const GLASS_DRAWER = 'bg-white/90 backdrop-blur-3xl border border-white/50 shadow-2xl shadow-violet-900/10';

export default function Home() {
  const festive = isChristmasSeason();
  const { settings: storefront, loaded: storefrontLoaded } = useStorefrontSettings();
  const hampersOn = storefrontLoaded && hampersVisibleIn(storefront);
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const navigate = useNavigate();

  // Admin-customisable section backgrounds (fall back to the bundled defaults).
  const appearance = useAppearance();
  const featuredBg = appearance.featuredBg || featuredBgDefault;
  const CATALOG_BG_KEY = {
    'Cookies': 'catalogCookiesBg',
    'Health Mixtures': 'catalogHealthMixturesBg',
    'Honey': 'catalogHoneyBg',
    'Jaggery': 'catalogJaggeryBg',
  };

  const getInitialSlides = () => {
    try {
      const cached = localStorage.getItem('cached_hero_slides');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { console.error(e); }
    return [];
  };

  const [activeSlides, setActiveSlides] = useState(getInitialSlides);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/hero-slides`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.length > 0) {
          setActiveSlides(data.data);
          try {
            localStorage.setItem('cached_hero_slides', JSON.stringify(data.data));
          } catch { /* ignore */ }
        }
      })
      .catch(console.error);
  }, []);

  // Preload all banner slide images into browser memory to prevent transition lag
  // (phones preload their portrait variant when the slide has one)
  const preloadPhone = typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;
  useEffect(() => {
    activeSlides.forEach(slide => {
      const src = preloadPhone && slide?.mobileSrc ? slide.mobileSrc : slide?.src;
      if (src) {
        const img = new Image();
        img.src = src;
      }
    });
  }, [activeSlides, preloadPhone]);

  const [currentSlide, setCurrentSlide] = useState(0);

  // Phones get the admin's portrait banner when there is one; otherwise the wide
  // banner is shown whole ("fit") rather than cropped to a tall frame.
  const isPhone = useMediaQuery('(max-width: 639px)');
  const heroSlide = activeSlides[currentSlide];
  const heroFit = isPhone && activeSlides.length > 0 && !heroSlide?.mobileSrc;
  const heroSrc = isPhone && heroSlide?.mobileSrc ? heroSlide.mobileSrc : heroSlide?.src;

  // DOM References for GSAP
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const textRef = useRef(null);
  const imageCardRef = useRef(null);
  const sectionsRef = useRef([]);
  const backgroundBlobsRef = useRef([]);

  // Catalog & Product States
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const CATALOG_PAGE = 8;
  // 2 / 3 / 4 cards per row (widths match the gap), centred so short last rows sit in the middle
  const CATALOG_CELL = 'w-[calc(50%-6px)] sm:w-[calc(50%-10px)] md:w-[calc((100%-40px)/3)] lg:w-[calc(25%-15px)]';
  const [catalogLimit, setCatalogLimit] = useState(CATALOG_PAGE);
  const [categories, setCategories] = useState([]);
  const managedCategories = useCategories(); // Admin → Categories (name, order, visible)
  const [featuredProducts, setFeaturedProducts] = useState([]);

  // Featured row (phones swipe through it one card at a time)
  const featuredRowRef = useRef(null);
  const getFeaturedRow = useCallback(() => featuredRowRef.current, []);

  const DEFAULT_CATEGORIES = ['Cookies', 'Health Mixtures', 'Honey', 'Jaggery'];
  // 'biscuit' (and uncategorised products) are folded into Cookies, so they never get their own section.
  const COOKIE_ALIASES = ['biscuit', 'cookies'];

  const productInCategory = (p, catName) => {
    const productCat = (p.category || '').trim().toLowerCase();
    if (catName === 'Cookies') return !productCat || COOKIE_ALIASES.includes(productCat);
    return productCat === catName.toLowerCase();
  };

  // Tabs follow the live catalogue: Admin → Categories order (visible ones),
  // then any other category found on products — and only categories that
  // currently have products, so no tab ever opens onto an empty shelf.
  const orderedCategoryNames = managedCategories.length
    ? managedCategories.filter((c) => c.visible !== false).map((c) => c.name)
    : DEFAULT_CATEGORIES;
  const catalogCategories = [...orderedCategoryNames, ...categories]
    .map((cat) => String(cat || '').trim())
    .filter((cat, i, arr) =>
      cat &&
      !(COOKIE_ALIASES.includes(cat.toLowerCase()) && cat !== 'Cookies') &&
      arr.findIndex((c) => c.toLowerCase() === cat.toLowerCase()) === i
    )
    .filter((cat) => products.some((p) => productInCategory(p, cat)));
  const allCategoryTabs = ['All Products', ...catalogCategories];
  const tabCount = (tab) => (tab === 'All Products' ? products.length : products.filter((p) => productInCategory(p, tab)).length);

  // A selected tab whose products are gone (e.g. after a catalogue change) falls back to All.
  const activeCategoryGone = activeCategory !== 'All' && products.length > 0 && !catalogCategories.includes(activeCategory);
  useEffect(() => {
    if (activeCategoryGone) setActiveCategory('All');
  }, [activeCategoryGone]);


  useEffect(() => {
    const fallbackFeatured = [
      {
        name: 'Red Millets Mate',
        tagline: 'Endurance & Active Energy Base',
        desc: 'Formulated with raw heritage red finger millets and unrefined raw fibers for sustained daily energy release.',
        image: redMilletsMateImg,
        badges: ['Ragi Base', '0% White Sugar', 'High Fiber']
      },
      {
        name: 'Penta Bite Millets',
        tagline: 'Complete 5-Grain Powerhouse',
        desc: 'A majestic blend of 5 essential ancient grainlets baked slowly with rich, authentic country cow butter.',
        image: pentaBiteImg,
        badges: ['5 Grainlets', 'Preservative Free', 'Native Sweet']
      },
      {
        name: 'Tri-Grain Gain',
        tagline: 'Triple Native Strength',
        desc: 'Crafted with the pristine power of organic Ragi, premium Thinai, and nutrient-dense Kambu grains.',
        image: triGrainGainImg,
        badges: ['Ragi & Thinai', 'No Refined Oils', 'Clean Nutrition']
      },
      {
        name: 'Classic Coclets',
        tagline: 'The Clean Heritage Sweet',
        desc: 'Our signature traditional chocolate grain cookie sweetened purely with raw organic palm sugar crystals.',
        image: classicCocletsImg,
        badges: ['Palm Sugar Base', 'Toxin Free', 'Native Grains']
      }
    ];

    const fetchFeatured = async () => {
      try {
        // Use the main products endpoint (already deployed) and filter isFeatured client-side
        // This avoids depending on the /api/featured-products endpoint which may be stale on Render
        const data = await cachedFetch(`${import.meta.env.VITE_API_URL}/products?limit=100`);
        if (data.success && data.data) {
          const featured = data.data.filter(p => p.isFeatured === true);
          if (featured.length > 0) {
            const normalized = featured.map(p => ({
              ...p,
              name: p.name || p.title || 'Product',
              desc: p.desc || p.description || '',
              tagline: p.tagline || p.category || 'Heritage Craft',
              badges: p.badges && p.badges.length > 0
                ? p.badges
                : [p.category, '100% Natural', 'Heritage Grain'].filter(Boolean),
              image: p.image || '',
            }));
            setFeaturedProducts(normalized);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to fetch featured products", err);
      }
      setFeaturedProducts(fallbackFeatured);
    };

    fetchFeatured();
  }, []);

  // Carousel Slider State
  const [_slideDirection, setSlideDirection] = useState(1);

  // Quick-Add Modal State
  const [quickAddItem, setQuickAddItem] = useState(null);   // product being added
  const [quickAddMode, setQuickAddMode] = useState('cart'); // 'cart' | 'wishlist'
  const [qaVariant, setQaVariant] = useState(null);
  const [qaQty, setQaQty] = useState(1);

  useEffect(() => {
    if (!activeSlides || activeSlides.length <= 1) return;
    const interval = setInterval(() => {
      setSlideDirection(1);
      setCurrentSlide(prev => (prev + 1) % activeSlides.length);
    }, 4500);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlides.length]);

  const handleNextSlide = () => {
    setSlideDirection(1);
    setCurrentSlide(prev => (prev + 1) % activeSlides.length);
  };

  const handlePrevSlide = () => {
    setSlideDirection(-1);
    setCurrentSlide(prev => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  // GSAP Smooth Visual Animations
  useEffect(() => {
    // Hero Entrance
    const tl = gsap.timeline({ delay: 0.2 });
    if (titleRef.current) {
      tl.fromTo(titleRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out' }
      );
    }
    if (textRef.current) {
      tl.fromTo(textRef.current,
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' }
      );
    }
    if (imageCardRef.current) {
      tl.fromTo(imageCardRef.current,
        { scale: 0.96, opacity: 0, y: 15 },
        { scale: 1, opacity: 1, y: 0, duration: 1.1, ease: 'power2.out' }
      );
    }

    // Floating animation for ambient light blobs
    backgroundBlobsRef.current.forEach((blob, idx) => {
      if (!blob) return;
      gsap.to(blob, {
        y: idx % 2 === 0 ? -40 : 40,
        x: idx % 2 === 0 ? 30 : -30,
        duration: 5 + idx * 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: idx * 0.5
      });
    });

    // Scroll Triggered Section Entrance animations
    sectionsRef.current.forEach((section) => {
      if (!section) return;
      gsap.fromTo(section,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            once: true
          }
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  // Fetch Products Catalog
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // Fetch the full catalogue (API max) so products in custom categories aren't cut off.
        const data = await cachedFetch(`${import.meta.env.VITE_API_URL}/products?limit=100`);
        if (data.success && active) {
          setProducts(data.data);
          const distinctCategories = [...new Set(data.data.map(p => p.category).filter(Boolean))];
          setCategories(distinctCategories);
        }
      } catch (err) {
        console.error('Error fetching catalog data:', err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const filteredProducts = activeCategory === 'All'
    ? products
    : products.filter(p => productInCategory(p, activeCategory));

  const registerSectionRef = (el) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };

  const openQuickAdd = (item, mode = 'cart') => {
    if (!localStorage.getItem('token')) {
      toast.error('Please login to continue.');
      navigate('/login');
      return;
    }
    const firstAvail = item.variants && item.variants.length > 0
      ? (item.variants.find(v => v.stock > 0) || item.variants[0])
      : null;
    setQaVariant(firstAvail);
    setQaQty(1);
    setQuickAddMode(mode);
    setQuickAddItem(item);
  };

  const closeQuickAdd = () => setQuickAddItem(null);

  const confirmQuickAdd = () => {
    if (!quickAddItem) return;
    const name = quickAddItem.name || quickAddItem.title;
    const price = qaVariant ? qaVariant.price : quickAddItem.price;
    const weight = qaVariant ? qaVariant.weight : undefined;
    if (quickAddMode === 'cart') {
      for (let i = 0; i < qaQty; i++) {
        addToCart({ ...quickAddItem, price, selectedWeight: weight, category: quickAddItem.category || 'Biscuit' });
      }
      toast.success(`${qaQty}× ${name} added to cart!`);
    } else {
      toggleWishlist({ ...quickAddItem, price, selectedWeight: weight });
      toast.success(`${name} saved to wishlist!`);
    }
    closeQuickAdd();
  };

  return (
    <div className="min-h-screen bg-cream text-ink relative">
      <SEO
        title={HOME_SEO.title}
        description={HOME_SEO.description}
        url="/"
        jsonLd={[organizationJsonLd({ email: SUPPORT_CONTACT.email, phones: SUPPORT_CONTACT.phones }), websiteJsonLd()]}
      />

      {/* ⸻ HERO — Seed pattern: full-bleed image only, flush to the top, curved bottom edge ⸻ */}
      <section ref={heroRef} className="relative z-10 font-sans select-none">
        <h1 className="sr-only">Alimenture — millet cookies, ghee, honey and healthy bakes from Chennai</h1>
        <div
          ref={imageCardRef}
          className={`relative overflow-hidden rounded-b-[28px] sm:rounded-b-hero bg-night ${
            heroFit
              ? 'pt-[84px] pb-4' // phone + wide banner: show it whole, below the floating nav
              : 'h-[78svh] min-h-[520px] max-h-[860px] sm:h-[100svh] sm:min-h-[560px] sm:max-h-[920px] 2xl:max-h-[1080px] [@media(max-height:500px)]:!min-h-[340px]'
          }`}
        >
          {heroFit && (
            // soft, blurred copy of the banner fills the frame around the uncropped image
            <img src={heroSlide?.src} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover scale-125 blur-2xl opacity-60" />
          )}

          <div className={heroFit ? 'relative mx-3 aspect-[16/9] overflow-hidden rounded-[18px] shadow-[0_18px_40px_-20px_rgba(0,0,0,0.6)]' : 'absolute inset-0'}>
            {activeSlides.length > 0 ? (
              <AnimatePresence>
                <motion.img
                  key={`${currentSlide}-${heroSrc}`}
                  src={heroSrc}
                  alt={heroSlide?.title || `Alimenture banner ${currentSlide + 1}`}
                  initial={{ opacity: 0, scale: 1.06 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ opacity: { duration: 0.9 }, scale: { duration: 6, ease: 'easeOut' } }}
                  // ultra-wide screens crop banners vertically — anchor to the top, where the artwork's lettering sits
                  className="absolute inset-0 h-full w-full object-cover object-center min-[1700px]:object-top"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
              </AnimatePresence>
            ) : (
              /* No banners yet (none uploaded, or the API is unreachable): a neutral placeholder. */
              <div
                role="img"
                aria-label="Banner image"
                className="absolute inset-0 flex items-center justify-center"
                style={{ backgroundImage: 'radial-gradient(80% 90% at 70% 40%, rgba(248,168,48,0.16) 0%, transparent 60%), linear-gradient(135deg,#5F1C54 0%,#2B0B33 100%)' }}
              >
                <svg viewBox="0 0 64 64" className="h-16 w-16 sm:h-20 sm:w-20 text-paper/25" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="6" y="12" width="52" height="40" rx="6" />
                  <circle cx="22" cy="26" r="5" />
                  <path d="M6 44l14-12 12 10 8-6 18 14" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>

          {/* Christmas: soft snowfall + hanging ornaments over the banner (src/data/seasonal.js) */}
          {festive && <Snowfall />}
          {festive && !heroFit && <HangingOrnaments />}

          {/* slide controls — overlaid on the photo, or in a row under the uncropped banner */}
          {activeSlides.length > 1 && (
            <div className={`flex items-center justify-between sm:justify-end gap-3 ${
              heroFit ? 'relative mx-3 mt-3' : 'absolute inset-x-4 bottom-5 sm:inset-x-auto sm:right-8 sm:bottom-8'
            }`}>
              <div className="flex items-center rounded-full bg-night/45 backdrop-blur-md px-1.5 ring-1 ring-white/15">
                {activeSlides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setSlideDirection(idx > currentSlide ? 1 : -1); setCurrentSlide(idx); }}
                    className="h-10 min-w-[22px] px-1.5 flex items-center justify-center" // 40px-tall hit area around a small dot
                    aria-label={`Go to slide ${idx + 1}`}
                    aria-current={currentSlide === idx ? 'true' : undefined}
                  >
                    <span className={`block h-1.5 rounded-full transition-all duration-500 ${currentSlide === idx ? 'w-7 bg-mulberry' : 'w-1.5 bg-white/50 hover:bg-white/80'}`} />
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handlePrevSlide} aria-label="Previous banner" className="h-11 w-11 sm:h-10 sm:w-10 rounded-full bg-white/90 text-night flex items-center justify-center hover:bg-mulberry hover:text-white transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" onClick={handleNextSlide} aria-label="Next banner" className="h-11 w-11 sm:h-10 sm:w-10 rounded-full bg-white/90 text-night flex items-center justify-center hover:bg-mulberry hover:text-white transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {festive && (
        <ChristmasBand
          to={hampersOn ? '/hampers' : '/shop'}
          cta={hampersOn ? 'Explore Christmas hampers' : 'Shop Christmas gifts'}
        />
      )}

      {/* ⸻ BENEFIT BAND — Seed's "benefits you can feel in…" row ⸻ */}
      <BenefitBand />

      {/* ⸻ 2. FEATURED PRODUCTS ⸻ */}
      <section id="signature-spotlight" className="relative z-10 overflow-hidden bg-cream py-12 sm:py-24 font-sans">
        {featuredBg && (
          <div className="absolute inset-0 -z-10">
            <img src={featuredBg} alt="" aria-hidden="true" className="w-full h-full object-cover object-center" loading="lazy" decoding="async" />
          </div>
        )}

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1240px] 2xl:max-w-[1400px] relative z-10">
          {/* centered header */}
          <div className="flex flex-col items-center text-center gap-3 sm:gap-4 max-w-2xl mx-auto mb-8 sm:mb-14">
            <h2 className="headline text-[2.4rem] sm:text-6xl lg:text-[4.25rem]">
              Featured <span className="accent-text">products</span>
            </h2>
            <p className="text-ink-soft text-[14px] sm:text-[15px] leading-relaxed font-medium">
              Our most-loved bakes and pantry staples — slow-baked with heritage grains, butter and country sugar.
            </p>
            <Link
              to="/shop"
              className="btn-outline mt-2"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Real products: one card at a time on phones, grid from tablet up */}
          {featuredProducts.some((p) => p.id) && (
            <>
            <div ref={featuredRowRef} className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 overflow-x-auto sm:overflow-visible snap-x snap-mandatory scrollbar-none pb-2">
              {featuredProducts.filter((p) => p.id).map((item) => (
                <div key={item.id} className="w-full sm:w-auto shrink-0 snap-start snap-always flex">
                  <ProductCard
                    product={item}
                    addLabel="Add"
                    onAdd={(p) => openQuickAdd(p, 'cart')}
                    onWishlist={(p) => (isInWishlist(p.id || p._id) ? toggleWishlist(p) : openQuickAdd(p, 'wishlist'))}
                  />
                </div>
              ))}
            </div>
            <MobileSliderControls getEl={getFeaturedRow} count={featuredProducts.filter((p) => p.id).length} label="featured product" />
            </>
          )}

          {/* Offline fallback (no product data) */}
          <div className={`${featuredProducts.some((p) => p.id) ? 'hidden' : 'grid'} grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6`}>
            {featuredProducts.map((item, index) => {
              const pid = item.id || item._id;
              const href = pid ? productPath(item) : '/shop';
              return (
                <motion.div
                  key={pid || index}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    to={href}
                    className="group relative flex flex-col h-full glass foil-top rounded-panel overflow-hidden hover:-translate-y-1.5 transition-transform duration-400"
                  >
                    <div className="p-2 pb-0">
                      <ProductImageFrame src={item.image} alt={item.name} className="rounded-[20px]">
                        <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-white/85 backdrop-blur-md border border-white/70 text-[10px] font-extrabold uppercase tracking-[0.14em] text-berry z-20">
                          <Star className="h-3 w-3 fill-current" /> Featured
                        </span>
                      </ProductImageFrame>
                    </div>

                    <div className="flex flex-col flex-1 gap-2.5 p-5">
                      <div>
                        <h3 className="display-md text-[16.5px] text-[#1F1726] leading-snug">{item.name}</h3>
                      </div>
                      <p className="text-ink-soft text-[12.5px] leading-relaxed line-clamp-2 font-medium flex-1">{item.desc}</p>

                      <div className="flex flex-wrap gap-1.5">
                        {(item.badges || []).slice(0, 2).map((badge, bIdx) => (
                          <span
                            key={bIdx}
                            className="inline-flex items-center h-6 px-2.5 rounded-full bg-cream-deep/60 border border-hairline text-[10.5px] font-bold text-ink-soft"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>

                      <span className="mt-1 inline-flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-berry">
                        {pid ? 'View product' : 'Shop now'}
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ⸻ SHOP BY NEED — Seed-style category rows ⸻ */}
      <CategoryRows
        rows={catalogCategories.map((name) => ({ name, items: products.filter((p) => productInCategory(p, name)) }))}
      />

      {/* ⸻ CRAFT SPOTLIGHT — Seed's "ViaCap® Technology" glass panel ⸻ */}
      <CraftSpotlight bgImage={appearance.craftSpotlightBg} productImage={appearance.craftSpotlightImage} />

      {/* ⸻ TRADITIONAL NOURISHMENT CATALOG — wrapped tabs + responsive grids (no sideways scrolling) ⸻ */}
      <section
        id="products"
        ref={registerSectionRef}
        className={`relative z-10 overflow-clip py-16 sm:py-28 font-sans bg-center bg-cover ${appearance.catalogAllBg ? '' : 'bg-cream'}`}
        style={appearance.catalogAllBg ? { backgroundImage: `url(${appearance.catalogAllBg})` } : undefined}
      >
        <div className="relative mx-auto max-w-[1240px] 2xl:max-w-[1400px] px-4 sm:px-6 lg:px-8">
          {/* header */}
          <div className="text-center max-w-2xl mx-auto space-y-3 sm:space-y-4">
            <h2 className="headline text-[2.1rem] sm:text-5xl lg:text-[3.6rem]">
              Traditional <em>nourishment catalog</em>
            </h2>
            <p className="text-ink-soft text-[14px] sm:text-base leading-relaxed">
              Clean snacks and pantry staples, crafted for a mindful everyday.
            </p>
          </div>

          {/* category tabs — wrap onto new lines instead of scrolling sideways */}
          <div role="tablist" aria-label="Product categories" className="mt-8 sm:mt-12 flex flex-wrap justify-center gap-2">
            {allCategoryTabs.map((category) => {
              const isAll = category === 'All Products';
              const isSelected = (activeCategory === 'All' && isAll) || activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => { setActiveCategory(isAll ? 'All' : category); setCatalogLimit(CATALOG_PAGE); }}
                  className={`inline-flex items-center gap-2 h-10 px-4 sm:px-5 rounded-full border text-[13.5px] sm:text-[14px] font-medium transition-colors ${
                    isSelected
                      ? 'bg-ink border-ink text-white'
                      : 'bg-white/80 border-[#E2DCD0] text-ink-soft hover:border-ink/40 hover:text-ink'
                  }`}
                >
                  {isAll ? 'All' : category}
                  {products.length > 0 && (
                    <span className={`text-[12px] tabular-nums ${isSelected ? 'text-white/70' : 'text-ink-muted'}`}>{tabCount(category)}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-10 sm:mt-14">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : activeCategory === 'All' ? (
              /* All: one block per category — header + a short grid, "View all" for the rest */
              <div className="space-y-12 sm:space-y-16">
                {catalogCategories
                  .map((catName) => ({ catName, catProducts: products.filter((p) => productInCategory(p, catName)) }))
                  .filter(({ catProducts }) => catProducts.length > 0)
                  .map(({ catName, catProducts }) => {
                    const catBg = appearance[CATALOG_BG_KEY[catName]];
                    return (
                      <div key={catName}>
                        <div
                          className={`flex items-end justify-between gap-4 pb-4 mb-5 sm:mb-6 border-b border-ink/10 ${catBg ? 'relative overflow-hidden rounded-[22px] border-b-0 px-5 sm:px-7 pt-10 sm:pt-14 text-white' : ''}`}
                        >
                          {catBg && (
                            <>
                              <span aria-hidden="true" className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${catBg})` }} />
                              <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
                            </>
                          )}
                          <div className="relative min-w-0">
                            <h3 className={`headline text-[1.7rem] sm:text-[2.4rem] ${catBg ? 'headline-on-dark' : ''}`}>{catName}</h3>
                            <p className={`mt-1 text-[13px] ${catBg ? 'text-white/80' : 'text-ink-muted'}`}>
                              {catProducts.length} product{catProducts.length === 1 ? '' : 's'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap justify-start lg:justify-center gap-3 sm:gap-5">
                          {catProducts.map((item, i) => (
                            <Reveal key={item.id || item._id} delay={(i % 4) * 0.08} className={`flex ${CATALOG_CELL}`}>
                              <ProductCard
                                product={item}
                                onAdd={(p) => openQuickAdd(p, 'cart')}
                                onWishlist={(p) => (isInWishlist(p.id || p._id) ? toggleWishlist(p) : openQuickAdd(p, 'wishlist'))}
                              />
                            </Reveal>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              /* One category: full grid, revealed 8 at a time */
              <div>
                <div className="flex items-end justify-between gap-4 pb-4 mb-5 sm:mb-6 border-b border-ink/10">
                  <div>
                    <h3 className="headline text-[1.7rem] sm:text-[2.4rem]">{activeCategory}</h3>
                    <p className="mt-1 text-[13px] text-ink-muted">
                      Showing {Math.min(catalogLimit, filteredProducts.length)} of {filteredProducts.length}
                    </p>
                  </div>
                  <button type="button" onClick={() => setActiveCategory('All')} className="link-arrow shrink-0 text-[13.5px]">
                    All categories
                  </button>
                </div>
                <div className="flex flex-wrap justify-start lg:justify-center gap-3 sm:gap-5">
                  {filteredProducts.slice(0, catalogLimit).map((item, i) => (
                    <Reveal key={item.id || item._id} delay={(i % 4) * 0.08} className={`flex ${CATALOG_CELL}`}>
                      <ProductCard
                        product={item}
                        onAdd={(p) => openQuickAdd(p, 'cart')}
                        onWishlist={(p) => (isInWishlist(p.id || p._id) ? toggleWishlist(p) : openQuickAdd(p, 'wishlist'))}
                      />
                    </Reveal>
                  ))}
                </div>
                {filteredProducts.length > catalogLimit && (
                  <div className="mt-8 flex justify-center">
                    <button type="button" onClick={() => setCatalogLimit((n) => n + CATALOG_PAGE)} className="btn-outline">
                      Show more <span className="text-ink-muted">({filteredProducts.length - catalogLimit})</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* full catalogue CTA */}
          <div className="mt-14 sm:mt-20 flex flex-col items-center gap-4 text-center">
            <p className="text-ink-soft text-sm">Looking for something specific? Browse the complete range.</p>
            <Link to="/shop" className="btn-pill">
              Shop all products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ⸻ CATALOGUE DOWNLOAD — lead-gated PDF (Admin → Catalogue) ⸻ */}
      <CatalogueDownload />





      {/* Marquee smooth css keyframe helper */}
      <style>{`
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* ——— QUICK ADD MODAL ——— */}
      <AnimatePresence>
        {quickAddItem && (() => {
          const item = quickAddItem;
          const name = item.name || item.title;
          const hasVariants = item.variants && item.variants.length > 0;
          const selectedStock = qaVariant ? qaVariant.stock : (item.stock || 0);
          const isOutOfStock = selectedStock === 0;
          const maxQty = Math.min(selectedStock, 10);
          const totalPrice = qaVariant ? qaVariant.price * qaQty : (item.price ? item.price * qaQty : null);

          return (
            <motion.div
              key="qa-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[999] flex items-end sm:items-center justify-center p-4"
              onClick={closeQuickAdd}
              role="dialog"
              aria-modal="true"
              aria-label={quickAddMode === 'cart' ? 'Add to cart' : 'Save to wishlist'}
            >
              <motion.div
                initial={{ opacity: 0, y: 60, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 60, scale: 0.96 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md bg-white rounded-[2rem] shadow-[0_40px_100px_rgba(0,0,0,0.25)] overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {/* Modal Hero: Product Image + Title */}
                <div className="relative h-44 w-full overflow-hidden bg-[#F7F0E3]">
                  {item.image && (
                    <img src={item.image} alt={name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  {/* Close btn */}
                  <button
                    onClick={closeQuickAdd}
                    className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/40 border border-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-all"
                  >
                    <span className="text-sm leading-none">✕</span>
                  </button>
                  {/* Mode badge */}
                  <span className="absolute top-4 left-4 text-[10.5px] font-bold uppercase tracking-[0.25em] text-white bg-white/15 border border-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    {quickAddMode === 'cart' ? '🛒 Add to Cart' : '❤️ Save to Wishlist'}
                  </span>
                  {/* Name overlay */}
                  <div className="absolute bottom-4 left-5 right-5">
                    <h3 className="font-display font-bold text-white text-xl leading-tight">{name}</h3>
                    {item.category && (
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#F8A830] mt-0.5 block">{item.category}</span>
                    )}
                  </div>
                </div>

                <div className="px-6 py-5 space-y-5">
                  {/* Variant Selector */}
                  {hasVariants && (
                    <div>
                      <p className="text-[10.5px] font-bold text-ink-muted uppercase tracking-widest mb-3">Choose Pack Size</p>
                      <div className="flex flex-wrap gap-2">
                        {item.variants.map((v, i) => {
                          const sold = v.stock === 0;
                          const active = qaVariant?.weight === v.weight;
                          return (
                            <button
                              key={i}
                              disabled={sold}
                              onClick={() => { setQaVariant(v); setQaQty(1); }}
                              className={`relative px-4 py-2.5 rounded-2xl font-bold text-xs transition-all border-2 ${sold
                                ? 'border-hairline text-ink-muted cursor-not-allowed bg-cream line-through'
                                : active
                                  ? 'border-mulberry bg-mulberry-tint text-mulberry shadow-[0_4px_12px_rgba(124,39,110,0.15)]'
                                  : 'border-hairline text-ink-soft hover:border-mulberry/40 bg-white'
                                }`}
                            >
                              {v.weight}
                              <span className={`block text-[10px] mt-0.5 font-bold ${active ? 'text-mulberry' : 'text-ink-muted'}`}>₹{v.price}</span>
                              {sold && <span className="block text-[10px] text-ink-muted">Out of stock</span>}
                              {!sold && v.stock < 10 && (
                                <span className="absolute -top-1.5 -right-1.5 text-[10px] bg-red-500 text-white rounded-full px-1.5 py-0.5 font-bold">{v.stock} left</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quantity + Price — cart mode only */}
                  {quickAddMode === 'cart' && !isOutOfStock && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10.5px] font-bold text-ink-muted uppercase tracking-widest mb-2.5">Quantity</p>
                        <div className="flex items-center gap-0 border border-hairline rounded-2xl bg-cream overflow-hidden">
                          <button
                            onClick={() => setQaQty(q => Math.max(1, q - 1))}
                            disabled={qaQty <= 1}
                            className="w-11 h-11 flex items-center justify-center hover:bg-cream-deep transition-colors disabled:opacity-30 text-ink-soft"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={maxQty}
                            value={qaQty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setQaQty(isNaN(val) ? 1 : Math.max(1, Math.min(maxQty, val)));
                            }}
                            className="w-12 text-center text-sm font-bold text-[#1F1726] bg-transparent border-none outline-none focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            onClick={() => setQaQty(q => Math.min(maxQty, q + 1))}
                            disabled={qaQty >= maxQty}
                            className="w-11 h-11 flex items-center justify-center hover:bg-cream-deep transition-colors disabled:opacity-30 text-ink-soft"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      {totalPrice && (
                        <div className="text-right">
                          <p className="text-[10.5px] font-bold text-ink-muted uppercase tracking-widest mb-1">Total</p>
                          <span className="text-2xl font-bold text-[#1F1726]">₹{totalPrice}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Out of stock warning */}
                  {isOutOfStock && (
                    <div className="flex items-center gap-2 bg-red-50 text-red-500 px-4 py-3 rounded-xl text-xs font-bold border border-red-100">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400 flex-shrink-0" /> This size is currently out of stock
                    </div>
                  )}

                  {/* CTA Buttons */}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={closeQuickAdd}
                      className="h-12 px-5 rounded-[14px] border border-hairline text-ink-soft text-[13px] font-semibold uppercase tracking-[0.05em] hover:border-mulberry/30 hover:text-mulberry transition-colors bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmQuickAdd}
                      disabled={isOutOfStock}
                      className={`flex-1 h-12 rounded-[14px] text-[13px] font-semibold uppercase tracking-[0.05em] flex items-center justify-center gap-2 ${isOutOfStock
                        ? 'bg-cream text-ink-muted border border-hairline cursor-not-allowed'
                        : 'btn-brand'
                        }`}
                    >
                      {quickAddMode === 'cart' ? <ShoppingCart className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
                      {quickAddMode === 'cart' ? 'Add to Cart' : 'Save to Wishlist'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}