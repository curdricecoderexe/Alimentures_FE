import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Check, ArrowRight, Sparkles, Shield, Leaf, Zap, HelpCircle, Minus, Plus, ShieldCheck, Sprout, Activity, Award, CheckCircle2, Quote, Globe, Users, ChevronLeft, ChevronRight, Droplet } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Loader from '../../components/ui/loader';
import ParticleCanvas from '../../components/ui/ParticleCanvas';
import lan from '../../assets/lan.png';
import womenImage from '../../assets/cas/women.png';
import focusImage from '../../assets/focus.png';
import bgImage from '../../assets/bg.png';
import bg1Image from '../../assets/bg-1.png';

import fingerMilletImg from '../../assets/fav/finger.png';
import foxtailMilletImg from '../../assets/fav/foxtail.png';
import pearlMilletImg from '../../assets/fav/pearl.png';
import sorghumImg from '../../assets/fav/sorghum.png';
import sorghumRedImg from '../../assets/fav/sorghum-red.png';
import kodoMilletImg from '../../assets/fav/kodo.png';
import karuppuKavaniImg from '../../assets/fav/karuppu_kavani.png';
import kattuYaanamImg from '../../assets/fav/kattu-yaanam.png';
import karunguruvaiImg from '../../assets/fav/karunguruvai.png';
import mappillaiSambaImg from '../../assets/fav/mappillai_samba.png';

import redMilletsMateImg from '../../assets/fav/red_millets_mate.png';
import pentaBiteImg from '../../assets/fav/penta_bite.png';
import triGrainGainImg from '../../assets/fav/tri_grain_gain.png';
import classicCocletsImg from '../../assets/fav/classic_coclets.png';

gsap.registerPlugin(ScrollTrigger);

// Gradients & Glass Styles
const GRADIENT_PURPLE_GOLD = 'bg-gradient-to-br from-rose-700 via-rose-600 to-orange-500';
const TEXT_GRADIENT = 'bg-gradient-to-r from-rose-800 to-orange-600 bg-clip-text text-transparent drop-shadow-sm';
const GLASS_CARD = 'bg-white/70 backdrop-blur-2xl border border-white/40 shadow-xl shadow-rose-900/5 hover:shadow-2xl hover:shadow-rose-900/10 transition-all duration-500';
const GLASS_DRAWER = 'bg-white/90 backdrop-blur-3xl border border-white/50 shadow-2xl shadow-rose-900/10';

const forbiddenIngredients = [
  'No Maida',
  'No White Sugar',
  'No Refined Oil',
  'No Preservatives',
  'No Harmful Additives',
  'No Artificial Colors'
];

const milletsBenefitList = [
  { name: 'Finger Millet', local: 'Ragi', benefit: 'Naturally rich in calcium and fiber, supporting stronger nutrition.', image: fingerMilletImg },
  { name: 'Foxtail Millet', local: 'Thinai', benefit: 'Known for balanced nutrition and sustained energy release.', image: foxtailMilletImg },
  { name: 'Pearl Millet', local: 'Kambu', benefit: 'A traditional powerhouse grain rich in natural nutrients.', image: pearlMilletImg },
  { name: 'Sorghum', local: 'Cholam', benefit: 'Supports digestive health and wholesome nourishment.', image: sorghumImg },
  { name: 'Sorghum Red', local: 'Sivappu Cholam', benefit: 'A nutrient-rich red grain packed with traditional wellness benefits.', image: sorghumRedImg },
  { name: 'Kodo Millet', local: 'Varagu', benefit: 'Naturally wholesome and widely appreciated for healthy dietary support.', image: kodoMilletImg },
  { name: 'Karuppu Kavani', local: 'Heritage Rice', benefit: 'A traditional heritage rice celebrated for its nutritional richness.', image: karuppuKavaniImg },
  { name: 'Kattu Yaanam', local: 'Heritage Rice', benefit: 'An ancient rice variety associated with authentic traditional nourishment.', image: kattuYaanamImg },
  { name: 'Karunguruvai', local: 'Heritage Rice', benefit: 'Known for its deep nutritional profile and natural wellness benefits.', image: karunguruvaiImg },
  { name: 'Mappillai Samba', local: 'Heritage Rice', benefit: 'A heritage rice variety traditionally valued for strength and stamina.', image: mappillaiSambaImg }
];

const trustPillars = [
  { icon: <ShieldCheck className="h-6 w-6 stroke-[2.2px]" />, title: 'Purity', desc: 'Preserving the natural integrity of every ingredient without harmful chemicals or artificial additives.' },
  { icon: <Sprout className="h-6 w-6 stroke-[2.2px]" />, title: 'Sustainability', desc: 'Consciously sourcing ingredients to protect our ecosystems, farming communities, and the planet.' },
  { icon: <Activity className="h-6 w-6 stroke-[2.2px]" />, title: 'Wellness', desc: 'Crafting wholesome snacks that actively support a balanced, vibrant, and genuinely healthy lifestyle.' },
  { icon: <Award className="h-6 w-6 stroke-[2.2px]" />, title: 'Authentic Nourishment', desc: 'Reviving traditional nutritional wisdom for modern, fast-paced generations.' },
];

const refuseList = [
  {
    title: '0% Maida & Wheat',
    desc: 'We avoid refined flour and use nutrient-dense grains that naturally support healthier digestion and balanced nutrition.',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2v20M9 6c0 1.5 1.5 2 3 2.5M15 6c0 1.5-1.5 2-3 2.5M9 11c0 1.5 1.5 2 3 2.5M15 11c0 1.5-1.5 2-3 2.5M9 16c0 1.5 1.5 2 3 2.5M15 16c0 1.5-1.5 2-3 2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6" />
        <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6" />
      </svg>
    )
  },
  {
    title: '0% White Sugar',
    desc: 'Our products eliminate processed white sugar to encourage cleaner and healthier lifestyles.',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="11" width="7" height="7" rx="1.5" />
        <rect x="13" y="6" width="7" height="7" rx="1.5" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6" />
        <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6" />
      </svg>
    )
  },
  {
    title: '0% Refined Oil',
    desc: 'We prioritize healthier ingredient choices and traditional preparation methods instead of heavily processed oils.',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2l3 3v2h-6V5l3-3z" />
        <rect x="7" y="7" width="10" height="14" rx="2" />
        <circle cx="12" cy="14" r="2" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6" />
        <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6" />
      </svg>
    )
  },
  {
    title: '0% Preservatives & Additives',
    desc: 'Freshness should come from quality ingredients — not chemicals. No unnecessary artificial colors or flavors.',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2v20M17 5H7M17 19H7M7 5l5 7 5-7M7 19l5-7 5 7" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6" />
        <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6" />
      </svg>
    )
  }
];

export default function Home() {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const navigate = useNavigate();
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
  useEffect(() => {
    activeSlides.forEach(slide => {
      if (slide?.src) {
        const img = new Image();
        img.src = slide.src;
      }
    });
  }, [activeSlides]);

  const [currentSlide, setCurrentSlide] = useState(0);

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
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [superGrains, setSuperGrains] = useState([]);

  // Category Bar & Row Scroll Refs & Functions
  const categoryBarRef = useRef(null);
  const categoryRowRefs = useRef({});

  const scrollCategoryBar = (direction) => {
    if (categoryBarRef.current) {
      const amount = direction === 'left' ? -280 : 280;
      categoryBarRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const scrollCategoryRow = (catName, direction) => {
    const container = categoryRowRefs.current[catName];
    if (container) {
      const amount = direction === 'left' ? -340 : 340;
      container.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const DEFAULT_CATEGORIES = ['Cookies', 'Health Mixtures', 'Honey', 'Jaggery'];
  const allCategoryTabs = ['All Products', ...new Set([...DEFAULT_CATEGORIES, ...categories])];

  const getCategoryMeta = (catName) => {
    const c = catName.toLowerCase();
    if (c.includes('cookie') || c.includes('biscuit')) {
      return { desc: 'Crispy ancient millet biscuits baked slowly with pure country butter', icon: Sparkles };
    }
    if (c.includes('health') || c.includes('mixture') || c.includes('mix')) {
      return { desc: 'Nutrient-rich multigrain porridge and natural vitality mixes', icon: Sprout };
    }
    if (c.includes('honey')) {
      return { desc: '100% pure wild forest raw honey harvested naturally', icon: Droplet };
    }
    if (c.includes('jaggery') || c.includes('sugar')) {
      return { desc: 'Unrefined traditional palm jaggery and organic country sugar', icon: Leaf };
    }
    return { desc: 'Traditional clean food treats crafted for daily nourishment', icon: Award };
  };

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
        const res = await fetch(`${import.meta.env.VITE_API_URL}/products?limit=100`);
        if (res.ok) {
          const data = await res.json();
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
        }
      } catch (err) {
        console.error("Failed to fetch featured products", err);
      }
      setFeaturedProducts(fallbackFeatured);
    };

    const fetchGrains = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/super-grains`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data && data.data.length > 0) {
            setSuperGrains(data.data);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to fetch super grains", err);
      }
      setSuperGrains(milletsBenefitList);
    };

    fetchFeatured();
    fetchGrains();
  }, []);

  const [loadedImages, setLoadedImages] = useState({});

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

  // Dynamic SEO Optimization
  useEffect(() => {
    document.title = 'Alimenture Industries — Premium Toxin-Free Nourishment & Ancient Grains';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Explore Alimenture Industries. We redefine healthy snacking using ancient grains, organic millets, and clean ingredients. Free from maida, refined oils, or white sugars.');
    }
  }, []);

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
        const response = await fetch(`${import.meta.env.VITE_API_URL}/products?limit=12`);
        const data = await response.json();
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
    : products.filter(p => p.category === activeCategory);

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

  // Image Lazy Loading handler
  const handleImageLoad = (productId) => {
    setLoadedImages(prev => ({ ...prev, [productId]: true }));
  };

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-brand-dark relative">

      {/* ——— AMBIENT GLASS PINK/YELLOW BACKGROUND BLOBS ——— */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div ref={el => backgroundBlobsRef.current[0] = el}
          className="absolute w-[450px] h-[450px] rounded-full blur-[110px] opacity-[0.14] top-[5%] left-[2%]"
          style={{ background: 'radial-gradient(circle, #E91E8C 0%, rgba(255,255,255,0) 70%)' }} />

        <div ref={el => backgroundBlobsRef.current[1] = el}
          className="absolute w-[380px] h-[380px] rounded-full blur-[100px] opacity-[0.12] top-[20%] right-[10%]"
          style={{ background: 'radial-gradient(circle, #FDE047 0%, rgba(255,255,255,0) 70%)' }} />

        <div ref={el => backgroundBlobsRef.current[2] = el}
          className="absolute w-[500px] h-[500px] rounded-full blur-[130px] opacity-[0.11] top-[45%] left-[15%]"
          style={{ background: 'radial-gradient(circle, #FEF08A 0%, rgba(255,255,255,0) 70%)' }} />

        <div ref={el => backgroundBlobsRef.current[3] = el}
          className="absolute w-[420px] h-[420px] rounded-full blur-[110px] opacity-[0.13] top-[75%] right-[5%]"
          style={{ background: 'radial-gradient(circle, #E91E8C 0%, rgba(255,255,255,0) 70%)' }} />
      </div>

      {/* Grid overlay accent */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-0"
        style={{ backgroundImage: 'linear-gradient(#E91E8C 1.5px,transparent 1.5px),linear-gradient(90deg,#E91E8C 1.5px,transparent 1.5px)', backgroundSize: '70px 70px' }} />

      {/* ⸻ HERO SECTION (DEDICATED LIGHT MOBILE COMPOSITION + DESKTOP SLIDESHOW) ⸻ */}
      <section ref={heroRef} className="relative w-full bg-[#FDFBF7] overflow-hidden select-none z-10 font-sans">

        {/* ── 1. LIGHT THEME MOBILE HERO VIEW (< 640px) ── */}
        <div className="sm:hidden pt-20 pb-8 px-4 min-h-[85vh] flex flex-col justify-between relative z-10 bg-[#FDFBF7] text-[#0a0806]">
          {/* Animated Ambient Light Background Glows */}
          <div className="absolute top-12 right-0 w-72 h-72 bg-rose-700/8 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-12 left-0 w-72 h-72 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Top Brand Header */}
          <div className="space-y-2.5 text-center relative z-10 pt-2">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-700/10 border border-rose-700/20 text-[9.5px] font-bold uppercase tracking-[0.25em] text-rose-700 shadow-xs backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-rose-700" /> Heritage Grainlets
            </span>
            <h1 className="font-display font-bold text-3xl text-[#0a0806] tracking-tight leading-tight">
              Crafting Grains <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-700 via-rose-600 to-orange-500">Into Gold</span>
            </h1>
            <p className="text-xs text-gray-600 font-bold max-w-xs mx-auto">
              0% Maida · 0% Processed Sugar · 100% Pure Millets
            </p>
          </div>

          {/* Center Banner Artwork — Frameless natural fit */}
          <div className="my-3 relative z-10">
            {activeSlides.length > 0 && (
              <div className="relative aspect-[16/9] w-full flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentSlide}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.4 }}
                    src={activeSlides[currentSlide]?.src}
                    alt={activeSlides[currentSlide]?.title || `Banner ${currentSlide + 1}`}
                    className="w-full h-full object-contain rounded-2xl drop-shadow-md"
                    loading="eager"
                  />
                </AnimatePresence>

                {/* Corner slide count badge */}
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md border border-gray-200/80 px-2.5 py-0.5 rounded-full text-[8.5px] font-bold tracking-widest text-rose-700 shadow-xs">
                  0{currentSlide + 1} / 0{activeSlides.length}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Light Glass Progress Bar & Controls */}
          <div className="relative z-10 pt-1">
            {activeSlides.length > 1 && (
              <div className="flex items-center justify-between bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-gray-200/80 shadow-sm max-w-xs mx-auto">
                <button
                  onClick={handlePrevSlide}
                  className="p-1 text-gray-600 hover:text-rose-700 transition-colors"
                  aria-label="Previous Banner"
                >
                  <ChevronLeft className="h-4.5 w-4.5" />
                </button>

                <div className="flex items-center gap-2">
                  {activeSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSlideDirection(idx > currentSlide ? 1 : -1);
                        setCurrentSlide(idx);
                      }}
                      className="group relative flex items-center outline-none py-1"
                      aria-label={`Go to slide ${idx + 1}`}
                    >
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${currentSlide === idx ? 'w-6 bg-rose-700' : 'w-2 bg-gray-300'
                          }`}
                      />
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleNextSlide}
                  className="p-1 text-gray-600 hover:text-rose-700 transition-colors"
                  aria-label="Next Banner"
                >
                  <ChevronRight className="h-4.5 w-4.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── 2. DESKTOP HERO VIEW (>= 640px) ── */}
        <div className="hidden sm:flex relative w-full h-[68vh] md:h-[88vh] lg:h-screen min-h-[480px] max-h-[1100px] items-center justify-center overflow-hidden">
          {activeSlides.length > 0 ? (
            <>
              <AnimatePresence>
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 w-full h-full flex items-center justify-center"
                >
                  <img
                    src={activeSlides[currentSlide]?.src}
                    alt={activeSlides[currentSlide]?.title || `Slide ${currentSlide + 1}`}
                    className="w-full h-full object-cover object-center"
                    loading="eager"
                    fetchPriority="high"
                    decoding="sync"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
                </motion.div>
              </AnimatePresence>

              {/* Desktop Side Arrow Controls */}
              {activeSlides.length > 1 && (
                <div className="absolute inset-x-4 sm:inset-x-8 top-1/2 -translate-y-1/2 flex items-center justify-between z-20 pointer-events-none">
                  <button
                    onClick={handlePrevSlide}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all shadow-lg pointer-events-auto opacity-80 hover:opacity-100 group"
                    aria-label="Previous Banner"
                  >
                    <ArrowRight className="h-5 w-5 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                  <button
                    onClick={handleNextSlide}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all shadow-lg pointer-events-auto opacity-80 hover:opacity-100 group"
                    aria-label="Next Banner"
                  >
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              )}

              {/* Desktop Bottom Progress Bar */}
              {activeSlides.length > 1 && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-black/50 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 shadow-xl">
                  {activeSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSlideDirection(idx > currentSlide ? 1 : -1);
                        setCurrentSlide(idx);
                      }}
                      className="group relative flex items-center outline-none py-1"
                      aria-label={`Go to slide ${idx + 1}`}
                    >
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ease-out ${currentSlide === idx ? 'w-10 bg-[#D4AF37]' : 'w-2.5 bg-white/40 group-hover:bg-white/70 group-hover:scale-110'
                          }`}
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0a0806] via-[#1a140c] to-[#0a0806] animate-pulse flex items-center justify-center" />
          )}
        </div>

        {/* ── LOW-CONTRAST DUAL-DIRECTIONAL MIST FLOW (LEFT & RIGHT TO CENTER) ── */}
        <div className="absolute bottom-0 left-0 right-0 h-28 sm:h-36 md:h-48 pointer-events-none z-15 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7]/35 to-transparent" />
          <motion.div
            animate={{
              x: ['-25%', '15%', '-25%'],
              opacity: [0.15, 0.35, 0.15]
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -bottom-8 left-[-15%] w-[80%] h-36 rounded-[100%] bg-gradient-to-tr from-[#FDFBF7]/80 via-white/30 to-transparent blur-3xl"
          />
          <motion.div
            animate={{
              x: ['25%', '-15%', '25%'],
              opacity: [0.15, 0.35, 0.15]
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -bottom-8 right-[-15%] w-[80%] h-36 rounded-[100%] bg-gradient-to-tl from-[#FDFBF7]/80 via-white/30 to-transparent blur-3xl"
          />
        </div>
      </section>

      {/* ⸻ PREMIUM MARQUEE — Clean ingredient promise strip ⸻ */}
      <section ref={registerSectionRef} className="py-3.5 sm:py-5 border-y border-gray-200/50 bg-[#FDFBF7] relative z-10 overflow-hidden">
        <div className="overflow-hidden whitespace-nowrap w-full">
          <div className="inline-flex gap-5 sm:gap-8 animate-marquee">
            {[...forbiddenIngredients, ...forbiddenIngredients, ...forbiddenIngredients].map((item, idx) => (
              <span key={idx} className="inline-flex items-center gap-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500 shrink-0">
                <span className="w-1 h-1 rounded-full bg-rose-600/50 inline-block" />{item}<span className="w-1 h-1 rounded-full bg-amber-500/50 inline-block" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ⸻ 2. FEATURED PRODUCTS ⸻ */}
      <section id="signature-spotlight" className="relative z-10 overflow-hidden py-16 sm:py-24 lg:py-28 font-sans bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#FFFDF9] via-[#FAF3FC] to-[#F5EBFA]">

        {/* ── Interactive Luxury Particle Layer ── */}
        <ParticleCanvas count={60} colors={['#920075', '#D4AF37', '#F59E0B', '#E91E8C', '#B8860B']} minSize={0.8} maxSize={3.4} speed={0.65} interactive={true} glow={true} enableLines={true} />

        {/* ── BG: Premium Ambient Glowing Blobs ── */}
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-rose-600/[0.07] blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[550px] h-[550px] rounded-full bg-[#D4AF37]/[0.09] blur-[140px] pointer-events-none" />
        <div className="absolute top-[35%] left-[25%] w-[450px] h-[450px] rounded-full bg-purple-600/[0.05] blur-[120px] pointer-events-none" />

        {/* ── BG: Golden Geometric Ring Ornaments ── */}
        <div className="hidden sm:block absolute -top-24 -right-24 w-[450px] h-[450px] rounded-full border border-[#D4AF37]/20 pointer-events-none" />
        <div className="hidden sm:block absolute -top-12 -right-12 w-[350px] h-[350px] rounded-full border border-rose-500/15 stroke-dasharray-4 pointer-events-none" />
        <div className="hidden sm:block absolute bottom-[-60px] left-[-60px] w-[400px] h-[400px] rounded-full border border-[#D4AF37]/15 pointer-events-none" />

        {/* ── BG: SVG Luxury Mandala Ornaments ── */}
        <svg className="hidden lg:block absolute top-12 left-12 opacity-[0.12] pointer-events-none animate-spin-slow" width="140" height="140" viewBox="0 0 140 140" fill="none">
          <circle cx="70" cy="70" r="65" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="8 6" />
          <circle cx="70" cy="70" r="45" stroke="#920075" strokeWidth="1.2" strokeDasharray="4 6" />
          <circle cx="70" cy="70" r="25" fill="#D4AF37" fillOpacity="0.18" />
        </svg>

        <svg className="hidden lg:block absolute bottom-12 right-12 opacity-[0.1] pointer-events-none" width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="55" stroke="#E91E8C" strokeWidth="1.5" strokeDasharray="6 6" />
          <circle cx="60" cy="60" r="35" stroke="#D4AF37" strokeWidth="1" strokeDasharray="3 5" />
        </svg>

        <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-[1400px] relative z-10">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16 space-y-3 sm:space-y-4">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] text-rose-700 border border-rose-700/20 bg-rose-700/6 px-4 py-2 sm:px-6 sm:py-2.5 rounded-full inline-block backdrop-blur-sm shadow-xs">
              Signature Blends
            </span>
            <h2 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#1a0a15] leading-tight tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-700 via-[#D4AF37] to-[#E91E8C]">
                Featured Products
              </span>
            </h2>
            <p className="text-[#5a3d52] text-xs sm:text-base max-w-2xl mx-auto leading-relaxed font-medium px-2">
              Explore the pinnacle of traditional baking — crafted from chemical-free heritage grainlets,
              premium cow butter, and pure organic palm sweeteners.
            </p>
          </div>

          {/* Featured Products Grid */}
          <div className="flex flex-wrap justify-center gap-7">
            {featuredProducts.map((item, index) => (
              <motion.article
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="group relative flex flex-col w-full sm:w-[calc(50%-14px)] lg:w-[calc(25%-21px)] max-w-[320px] min-w-[240px] rounded-[2rem] overflow-hidden
                  bg-white/80 backdrop-blur-xl
                  border border-white/80 hover:border-rose-500/40
                  shadow-[0_12px_32px_-8px_rgba(0,0,0,0.08),0_4px_12px_rgba(146,0,117,0.05)]
                  hover:shadow-[0_24px_50px_-12px_rgba(146,0,117,0.22),0_8px_24px_rgba(0,0,0,0.08)]
                  hover:-translate-y-2 hover:scale-[1.02]
                  transition-all duration-500 ease-out"
              >
                {/* Product Image */}
                <div className="relative w-full overflow-hidden bg-gray-50 shrink-0" style={{ aspectRatio: '4/3' }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-[1.07] transition-transform duration-700 ease-out"
                    loading="lazy"
                    decoding="async"
                  />
                  {/* Glass shimmer overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-white/10 opacity-90 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Product name on image */}
                  <div className="absolute bottom-0 left-0 right-0 p-4.5 z-20 text-center flex flex-col items-center">
                    <h3 className="font-display font-bold text-white text-xl leading-tight drop-shadow-sm text-center">
                      {item.name}
                    </h3>
                    <p className="text-white/80 text-[9px] font-semibold uppercase tracking-[0.2em] mt-0.5 text-center">{item.tagline}</p>
                  </div>
                </div>

                {/* Card Body — Translucent Glass Finish */}
                <div className="p-5 flex-1 flex flex-col items-center text-center gap-4 bg-gradient-to-b from-white/70 to-white/95 backdrop-blur-md">
                  <p className="text-gray-600 text-[13px] leading-relaxed line-clamp-2 font-medium text-center">{item.desc}</p>

                  {/* Glass Pill Badges */}
                  <div className="flex flex-wrap justify-center gap-1.5 mt-auto">
                    {(item.badges || []).slice(0, 3).map((badge, bIdx) => (
                      <span
                        key={bIdx}
                        className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-gray-200/70 text-[10px] font-bold text-gray-700 shadow-xs hover:border-rose-700/30 hover:bg-rose-700/5 hover:text-rose-700 hover:shadow-sm transition-all duration-300"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ⸻ TRADITIONAL NOURISHMENT CATALOG ⸻ */}
      <section id="products" ref={registerSectionRef} className="py-24 sm:py-32 relative z-10 font-sans overflow-hidden bg-gradient-to-b from-[#FDFBF7] via-[#FAF6F0] to-[#FDFBF7]">

        {/* ── Floating particles ── */}
        <ParticleCanvas count={60} colors={['#920075', '#D4AF37', '#F59E0B', '#E91E8C', '#FDE047']} minSize={0.8} maxSize={3.2} speed={0.7} interactive={false} />

        {/* ── BG LAYER 1: Subtle luxury ambient glows ── */}
        <div className="absolute top-0 left-[5%] w-[600px] h-[600px] rounded-full bg-rose-700/[0.05] blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[5%] w-[550px] h-[550px] rounded-full bg-orange-500/[0.07] blur-[130px] pointer-events-none" />
        <div className="absolute top-[50%] left-[20%] w-[400px] h-[400px] rounded-full bg-[#D4AF37]/[0.05] blur-[120px] pointer-events-none" />

        {/* ── BG LAYER 2: Delicate ring outlines ── */}
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full border border-rose-700/10 pointer-events-none" />
        <div className="absolute bottom-[-50px] right-[-50px] w-[380px] h-[380px] rounded-full border border-[#D4AF37]/12 pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-8 lg:px-10 max-w-[1440px] w-full">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-20 space-y-3 sm:space-y-4">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] text-rose-700 bg-rose-700/10 border border-rose-700/20 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full inline-block shadow-xs backdrop-blur-md">
              Organic Treats
            </span>
            <h2 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#0a0806] leading-tight tracking-tight">
              Traditional <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-700 via-[#D4AF37] to-[#E91E8C]">Nourishment Catalog</span>
            </h2>
            <p className="text-gray-600 text-xs sm:text-base max-w-xl mx-auto leading-relaxed font-medium px-2">
              Delicious, clean snacks thoughtfully crafted for your mindful wellness lifestyle.
            </p>
          </div>

          {/* Category Filter Bar (Touch horizontal scroll on mobile, arrow buttons on desktop) */}
          <div className="relative max-w-4xl mx-auto mb-10 sm:mb-16 sm:px-12">
            {/* Desktop Left Scroll Arrow */}
            <button
              onClick={() => scrollCategoryBar('left')}
              className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md border border-gray-200 shadow-md items-center justify-center text-rose-700 hover:bg-rose-700 hover:text-white hover:border-rose-700 transition-all cursor-pointer"
              aria-label="Scroll categories left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div
              ref={categoryBarRef}
              className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-none py-2 px-1 sm:px-2 scroll-smooth snap-x"
            >
              {allCategoryTabs.map((category) => {
                const isAll = category === 'All Products' || category === 'All';
                const isSelected = (activeCategory === 'All' && isAll) || activeCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(isAll ? 'All' : category)}
                    className={`shrink-0 px-4 py-2 sm:px-6 sm:py-2.5 rounded-full text-[9.5px] sm:text-[10.5px] font-bold uppercase tracking-[0.18em] sm:tracking-[0.22em] transition-all duration-300 border backdrop-blur-md cursor-pointer snap-start ${isSelected
                      ? 'bg-rose-700 border-rose-700 text-white shadow-[0_6px_20px_rgba(146,0,117,0.3)] scale-[1.02]'
                      : 'bg-white/90 border-gray-200/80 text-gray-700 hover:bg-white hover:border-rose-700/40 hover:text-rose-700 shadow-2xs'
                      }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            {/* Desktop Right Scroll Arrow */}
            <button
              onClick={() => scrollCategoryBar('right')}
              className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md border border-gray-200 shadow-md items-center justify-center text-rose-700 hover:bg-rose-700 hover:text-white hover:border-rose-700 transition-all cursor-pointer"
              aria-label="Scroll categories right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="py-12">
              <Loader fullScreen={false} text="Loading pure treats" />
            </div>
          ) : activeCategory === 'All' ? (
            <div className="space-y-20 sm:space-y-24">
              {DEFAULT_CATEGORIES.map((catName) => {
                const catProducts = products.filter(p =>
                  p.category?.toLowerCase() === catName.toLowerCase() ||
                  (catName === 'Cookies' && (!p.category || p.category.toLowerCase() === 'biscuit' || p.category.toLowerCase() === 'cookies'))
                );
                const displayProducts = catProducts.length > 0 ? catProducts : products.slice(0, 4);
                const meta = getCategoryMeta(catName);
                const IconComp = meta.icon;

                return (
                  <div key={catName} className="relative group/catBox">

                    {/* ── Editorial Section Header ── */}
                    <div className="flex items-end justify-between mb-6 sm:mb-10 pb-4 sm:pb-5 border-b border-gray-900/10 relative">

                      {/* Accent line on top of the border */}
                      <div className="absolute bottom-[-1px] left-0 w-12 sm:w-20 h-[2px] bg-gradient-to-r from-rose-600 to-orange-400 rounded-full" />

                      {/* Left: Large editorial label */}
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <p className="text-[8.5px] sm:text-[9px] font-bold uppercase tracking-[0.28em] text-rose-600 flex items-center gap-1.5">
                          <IconComp className="w-3 h-3" /> {meta.desc.split(' ').slice(0, 4).join(' ')}
                        </p>
                        <div className="flex items-baseline gap-2 sm:gap-4 flex-wrap">
                          <h3 className="font-display font-bold text-3xl sm:text-5xl md:text-6xl text-[#0a0806] tracking-tight leading-none">
                            {catName}
                          </h3>
                          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400 self-end mb-0.5 sm:mb-1">
                            {displayProducts.length} {displayProducts.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                      </div>

                      {/* Right: Controls */}
                      <div className="flex items-center gap-2 shrink-0 pb-0.5">
                        <button
                          onClick={() => scrollCategoryRow(catName, 'left')}
                          className="hidden sm:flex w-9 h-9 rounded-full bg-white border border-gray-200 items-center justify-center text-gray-500 hover:bg-[#0a0806] hover:text-white hover:border-[#0a0806] transition-all duration-200 cursor-pointer shadow-sm"
                          aria-label={`Scroll ${catName} left`}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => scrollCategoryRow(catName, 'right')}
                          className="hidden sm:flex w-9 h-9 rounded-full bg-white border border-gray-200 items-center justify-center text-gray-500 hover:bg-[#0a0806] hover:text-white hover:border-[#0a0806] transition-all duration-200 cursor-pointer shadow-sm"
                          aria-label={`Scroll ${catName} right`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        {displayProducts.length > 1 && (
                          <div className="sm:hidden flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-[9px] font-semibold uppercase tracking-wider select-none">
                            <span>Swipe</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* One-by-One Touch Carousel (w-full on mobile for 100% non-clipped fit) */}
                    <div className="relative w-full overflow-hidden">
                      <div
                        ref={el => categoryRowRefs.current[catName] = el}
                        className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto scrollbar-none py-1 sm:py-3 px-0.5 sm:px-2 scroll-smooth snap-x snap-mandatory sm:pr-24 w-full"
                      >
                        {displayProducts.map((item, idx) => (
                          <div key={item.id || item._id} className="w-full sm:w-[calc(25%-16px)] sm:min-w-[245px] sm:max-w-[290px] shrink-0 flex snap-center">
                            <motion.article
                              layout
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, delay: idx * 0.04 }}
                              className="relative flex flex-col w-full rounded-3xl overflow-hidden group
                                bg-white/85 backdrop-blur-xl border border-white/80
                                shadow-[0_8px_24px_-6px_rgba(0,0,0,0.06),0_2px_8px_rgba(146,0,117,0.04)]
                                hover:shadow-[0_20px_45px_-10px_rgba(146,0,117,0.18),0_6px_20px_rgba(0,0,0,0.06)]
                                hover:border-rose-500/30 hover:-translate-y-1.5 transition-all duration-400 min-w-0"
                            >
                              {/* Image Container with Rounded Inset */}
                              <div className="relative aspect-square w-full overflow-hidden bg-[#FDFBF7] shrink-0">
                                {!loadedImages[item.id || item._id] && (
                                  <div className="absolute inset-0 bg-[#F5F1EC] animate-pulse" />
                                )}
                                <img
                                  src={item.image || lan}
                                  alt={item.name || item.title}
                                  className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${loadedImages[item.id || item._id] ? 'opacity-100' : 'opacity-0'}`}
                                  loading="lazy"
                                  onLoad={() => handleImageLoad(item.id || item._id)}
                                />
                                <span className="absolute top-3 left-3 inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-[8px] sm:text-[8.5px] font-bold text-[#0a0806] uppercase tracking-wider border border-white/40 shadow-xs z-20">
                                  <Sparkles className="h-2.5 w-2.5 text-[#D4AF37]" /> Pure
                                </span>
                                <button
                                  onClick={() => {
                                    const itemId = item.id || item._id;
                                    if (isInWishlist(itemId)) { toggleWishlist(item); }
                                    else { openQuickAdd(item, 'wishlist'); }
                                  }}
                                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all border border-white/40 shadow-xs z-20"
                                  aria-label="Toggle Wishlist"
                                >
                                  <Heart className={`h-3.5 w-3.5 transition-all duration-300 ${isInWishlist(item.id || item._id) ? 'fill-rose-700 text-rose-700' : 'text-gray-500 hover:text-rose-700'}`} />
                                </button>
                                {item.stock === 0 && (
                                  <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] flex items-center justify-center z-10">
                                    <span className="px-3.5 py-1.5 rounded-lg bg-black/80 text-[8.5px] sm:text-[9px] font-bold text-white uppercase tracking-wider">Sold Out</span>
                                  </div>
                                )}
                              </div>

                              {/* Card Body with Non-Overflowing Min-W-0 Layout */}
                              <div className="p-4 flex-1 flex flex-col gap-2 min-w-0">
                                <div className="flex items-center justify-between gap-2 min-w-0">
                                  <span className="text-[8px] font-bold uppercase tracking-wider text-rose-700 bg-rose-700/8 px-2 py-0.5 rounded-md truncate max-w-[120px]">{item.category || catName}</span>
                                  <span className="flex items-center gap-0.5 text-[#D4AF37] font-bold text-[9.5px] sm:text-[10px] shrink-0">★ {item.rating || 4.8}</span>
                                </div>
                                <Link to={`/product/${item.id || item._id}`}>
                                  <h3 className="font-display font-bold text-[#0a0806] text-sm sm:text-[15px] leading-snug hover:text-rose-700 transition-colors line-clamp-1">{item.name || item.title}</h3>
                                </Link>
                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed flex-1 font-medium">{item.description}</p>

                                <div className="pt-4 border-t border-gray-100 space-y-3 mt-auto w-full">
                                  <div className="flex items-baseline justify-between">
                                    <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider">Price</span>
                                    <span className="font-bold text-[#0a0806] text-base sm:text-lg tracking-tight">
                                      {item.variants && item.variants.length > 0
                                        ? `From ₹${Math.min(...item.variants.map(v => Number(v.price)))}`
                                        : `₹${item.price}`}
                                    </span>
                                  </div>
                                  <div className="flex gap-2 w-full">
                                    <Link
                                      to={`/product/${item.id || item._id}`}
                                      className="flex-1 h-9 rounded-xl text-[9px] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-1 border border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-500 bg-white transition-all shadow-sm"
                                    >
                                      View
                                    </Link>
                                    <motion.button
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => openQuickAdd(item, 'cart')}
                                      disabled={item.stock === 0}
                                      className={`flex-1 h-9 rounded-xl text-[9px] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-1.5 transition-all shadow-sm ${item.stock === 0
                                        ? 'bg-gray-50 border border-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-rose-700 text-white hover:bg-rose-800'
                                        }`}
                                    >
                                      <ShoppingCart className="h-3.5 w-3.5" />
                                      <span>{item.stock === 0 ? 'Sold Out' : 'Add'}</span>
                                    </motion.button>
                                  </div>
                                </div>
                              </div>
                            </motion.article>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* SINGLE CATEGORY GRID VIEW */
            <div className="space-y-8">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200/60">
                <div>
                  <h3 className="font-display font-bold text-3xl text-[#0a0806] tracking-tight">{activeCategory}</h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">Showing all products in {activeCategory}</p>
                </div>
                <button
                  onClick={() => setActiveCategory('All')}
                  className="px-5 py-2.5 rounded-full bg-white border border-gray-200 text-xs font-bold text-rose-700 hover:bg-rose-700 hover:text-white transition-all cursor-pointer shadow-xs"
                >
                  ← Show All Categories
                </button>
              </div>

              <div className="flex flex-wrap justify-start gap-6">
                {filteredProducts.map((item) => (
                  <div key={item.id || item._id} className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] xl:w-[calc(25%-18px)] max-w-[320px] min-w-[220px]">
                    <motion.article
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative flex flex-col w-full rounded-3xl overflow-hidden group
                        bg-white/85 backdrop-blur-xl border border-white/80
                        shadow-[0_8px_24px_-6px_rgba(0,0,0,0.06),0_2px_8px_rgba(146,0,117,0.04)]
                        hover:shadow-[0_20px_45px_-10px_rgba(146,0,117,0.18),0_6px_20px_rgba(0,0,0,0.06)]
                        hover:border-rose-500/30 hover:-translate-y-1.5 transition-all duration-400"
                    >
                      <div className="relative aspect-square w-full overflow-hidden bg-[#FDFBF7] shrink-0">
                        <img
                          src={item.image || lan}
                          alt={item.name || item.title}
                          className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500"
                        />
                        <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/92 backdrop-blur-md text-[8.5px] font-bold text-[#0a0806] uppercase tracking-widest border border-white/30 shadow-xs z-20">
                          <Sparkles className="h-2.5 w-2.5 text-[#D4AF37]" /> Pure
                        </span>
                        <button
                          onClick={() => {
                            const itemId = item.id || item._id;
                            if (isInWishlist(itemId)) { toggleWishlist(item); }
                            else { openQuickAdd(item, 'wishlist'); }
                          }}
                          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/92 backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all border border-white/30 shadow-xs z-20"
                        >
                          <Heart className={`h-3.5 w-3.5 transition-all duration-300 ${isInWishlist(item.id || item._id) ? 'fill-rose-700 text-rose-700' : 'text-gray-500 hover:text-rose-700'}`} />
                        </button>
                      </div>

                      <div className="relative p-5 flex-1 flex flex-col gap-3 bg-white/60 backdrop-blur-sm z-20">
                        <div className="flex items-center justify-between">
                          <span className="text-[8.5px] font-bold uppercase tracking-[0.18em] text-rose-700 bg-rose-700/8 px-2.5 py-1 rounded-full">{item.category || activeCategory}</span>
                          <span className="flex items-center gap-0.5 text-[#D4AF37] font-bold text-[10px]">★ {item.rating || 4.8}</span>
                        </div>
                        <Link to={`/product/${item.id || item._id}`}>
                          <h3 className="font-display font-bold text-[#0a0806] text-base leading-snug group-hover:text-rose-700 transition-colors line-clamp-1">{item.name || item.title}</h3>
                        </Link>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed font-medium flex-1">{item.description}</p>

                        <div className="pt-4 border-t border-gray-100 space-y-3 mt-auto w-full">
                          <div className="flex items-baseline justify-between">
                            <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider">Price</span>
                            <span className="font-bold text-[#0a0806] text-lg tracking-tight">
                              {item.variants && item.variants.length > 0
                                ? `From ₹${Math.min(...item.variants.map(v => Number(v.price)))}`
                                : `₹${item.price}`}
                            </span>
                          </div>
                          <div className="flex gap-2 w-full">
                            <Link
                              to={`/product/${item.id || item._id}`}
                              className="flex-1 h-9 rounded-xl text-[9px] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-1 border border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-500 bg-white transition-all shadow-sm"
                            >
                              View
                            </Link>
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => openQuickAdd(item, 'cart')}
                              disabled={item.stock === 0}
                              className={`flex-1 h-9 rounded-xl text-[9px] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-1.5 transition-all shadow-sm ${item.stock === 0
                                ? 'bg-gray-50 border border-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-rose-700 text-white hover:bg-rose-800'
                                }`}
                            >
                              <ShoppingCart className="h-3.5 w-3.5" />
                              <span>{item.stock === 0 ? 'Sold Out' : 'Add'}</span>
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ⸻ 3. WHY CHOOSE ALIMENTURE (Trust Pillars Checklist Cards) ⸻ */}
      <section id="trust-pillars" className="py-28 px-6 bg-gradient-to-b from-[#FDFBF7] via-[#FAF6F0] to-[#FDFBF7] relative border-b border-gray-200/60 overflow-hidden font-sans">
        {/* ── Floating particles ── */}
        <div className="max-w-7xl mx-auto space-y-12 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] text-orange-500 bg-orange-500/10 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full inline-block border border-orange-500/20 shadow-xs backdrop-blur-md">
              Trust Pillars
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-[#0a0806] tracking-tight leading-tight">
              Why Families Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-700 via-rose-600 to-orange-500">Alimenture</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: '100% Natural Ingredients',
                desc: 'Made with carefully selected ingredients sourced directly from nature.'
              },
              {
                title: 'No Maida • No White Sugar • No Refined Oil',
                desc: 'Pure, clean-label recipes free from maida, white sugar, and refined oils — only wholesome ingredients.'
              },
              {
                title: 'Sustainable Practices',
                desc: 'Eco-friendly packaging and responsible sourcing reducing environmental impact.'
              },
              {
                title: 'Farmer Empowerment',
                desc: 'Ethical partnerships with farming communities encouraging natural agriculture.'
              }
            ].map(item => (
              <div
                key={item.title}
                className="relative p-7 bg-white/90 backdrop-blur-xl border border-gray-200/80 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(146,0,117,0.10)] hover:border-rose-700/30 hover:-translate-y-1.5 transition-all duration-300 space-y-4 group overflow-hidden"
              >
                <div className="h-12 w-12 rounded-2xl bg-white/80 backdrop-blur-md text-rose-700 border border-rose-700/20 flex items-center justify-center shrink-0 font-bold group-hover:scale-110 group-hover:bg-white/95 group-hover:border-rose-700/40 group-hover:shadow-[0_8px_20px_rgba(146,0,117,0.18)] transition-all duration-300 shadow-2xs">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-display font-bold text-lg text-[#0a0806] group-hover:text-rose-700 transition-colors leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-xs text-gray-600 font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ⸻ 4. HEALTHY SNACKING FOR MODERN LIVING ⸻ */}
      <section id="company" ref={registerSectionRef} className="py-32 relative z-10 bg-[#FDFBF7] border-t border-gray-200/60 overflow-hidden font-sans">
        {/* ── Floating particles ── */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-6 lg:px-12 max-w-[1400px] space-y-28 relative z-10">
          <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 items-center">
            <div className="lg:col-span-6 relative group px-2 sm:px-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-rose-700/12 rounded-3xl sm:rounded-[4rem] rounded-tr-[6rem] sm:rounded-tr-[10rem] rounded-bl-[6rem] sm:rounded-bl-[10rem] blur-2xl -z-10 group-hover:scale-105 transition-transform duration-700" />

              {/* Certified Pure Badge — Kept safely inside on mobile */}
              <div className="absolute top-2 right-2 sm:-top-8 sm:-right-8 h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-gradient-to-br from-[#FAF8F5]/95 to-white/90 backdrop-blur-md border border-[#D4AF37]/30 shadow-[0_20px_45px_-10px_rgba(212,175,55,0.3)] flex flex-col items-center justify-center text-center p-2 sm:p-3 animate-[spin_25s_linear_infinite] group-hover:scale-110 transition-all duration-500 z-30 pointer-events-none">
                <span className="text-[6.5px] sm:text-[7.5px] font-bold tracking-[0.2em] text-[#D4AF37] uppercase">Alimenture</span>
                <span className="text-[7px] sm:text-[8px] font-bold text-[#0a0806] tracking-[0.1em] mt-1 sm:mt-1.5">CERTIFIED PURE</span>
                <span className="text-[5.5px] sm:text-[6.5px] text-gray-500 mt-0.5 sm:mt-1">★ ★ ★ ★ ★</span>
              </div>

              {/* Main Artwork Container */}
              <div className="relative overflow-hidden rounded-3xl sm:rounded-[4rem] rounded-tr-[6rem] sm:rounded-tr-[10rem] rounded-bl-[6rem] sm:rounded-bl-[10rem] border-[4px] sm:border-[6px] border-white shadow-[0_25px_60px_-15px_rgba(212,175,55,0.18)] hover:shadow-[0_35px_70px_-15px_rgba(146,0,117,0.24)] transition-all duration-700 ease-[0.16,1,0.3,1] z-20">
                <img
                  src={womenImage}
                  alt="Healthy & Mindful Living"
                  className="w-full h-[380px] sm:h-[520px] object-cover scale-[1.01] group-hover:scale-[1.06] transition-transform duration-1000 ease-[0.16,1,0.3,1]"
                  loading="lazy"
                  decoding="async"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500 pointer-events-none" />

                {/* In-Image Feature Badges */}
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8 flex items-center justify-between gap-2 z-20 flex-wrap">
                  <span className="inline-flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/95 backdrop-blur-md text-[8.5px] sm:text-[9.5px] font-bold text-[#0a0806] uppercase tracking-wider border border-white/20 shadow-sm">
                    <Leaf className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600" /> 100% Native Base
                  </span>
                  <span className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/95 backdrop-blur-md text-[8.5px] sm:text-[9.5px] font-bold text-rose-700 uppercase tracking-wider border border-white/20 shadow-sm">
                    Honest Baking
                  </span>
                </div>
              </div>

              {/* Selected Grains Card — Positioned inside image frame on mobile to prevent chat icon overlap */}
              <div className="relative mt-3 sm:mt-0 sm:absolute sm:-bottom-8 sm:-left-8 bg-white/95 backdrop-blur-xl border border-gray-200/80 sm:border-white/80 rounded-2xl sm:rounded-2xl p-3.5 sm:p-5 shadow-[0_20px_45px_-10px_rgba(0,0,0,0.08)] hover:border-rose-700/20 transition-all duration-300 z-30 flex items-center gap-3 sm:gap-4 max-w-full sm:max-w-[250px] group/card">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-rose-700/10 flex items-center justify-center text-rose-700 shrink-0 font-bold group-hover/card:scale-110 transition-all duration-500">
                  <Leaf className="h-5 w-5 sm:h-6 sm:w-6 text-rose-700" />
                </div>
                <div>
                  <p className="text-[8.5px] sm:text-[9px] font-bold text-rose-700 uppercase tracking-widest">Selected Grains</p>
                  <p className="text-xs sm:text-sm font-bold text-[#0a0806] mt-0.5">Ragi, Thinai & Kambu</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6 sm:space-y-8 flex flex-col items-center lg:items-start text-center lg:text-left z-10 pt-4 lg:pt-0">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] text-rose-700 border-2 border-rose-700/20 bg-rose-700/5 px-5 py-2 rounded-full inline-block shadow-xs text-center">
                Clean Snack Lineup
              </span>

              <h3 className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#0a0806] leading-[1.1] tracking-tight text-center lg:text-left">
                Aliment <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-700 via-rose-600 to-[#D4AF37]">Cookies</span>
              </h3>

              <div className="h-1 w-24 bg-gradient-to-r from-rose-700 via-[#D4AF37] to-transparent rounded-full mx-auto lg:mx-0" />

              <div className="space-y-6 text-[#555555] text-base md:text-lg leading-relaxed">
                <p className="font-bold text-[#0a0806] text-justify">
                  A line of healthy, clean-label cookies prepared without maida, refined sugar, or synthetic preservatives.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 w-full text-left">
                {[
                  {
                    title: 'Sustained Low-GI Energy',
                    desc: 'Slow release, no glycemic crash',
                    accent: '#920075'
                  },
                  {
                    title: 'Prebiotic Gut Support',
                    desc: 'Rich in prebiotic ancient fibers',
                    accent: '#F59E0B'
                  },
                  {
                    title: '10 Heritage Super Grains',
                    desc: 'Pure native millets & raw seeds',
                    accent: '#F59E0B'
                  },
                  {
                    title: '0% Processed Sugar',
                    desc: 'Naturally sweetened with palm sugar',
                    accent: '#920075'
                  }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 sm:p-5 bg-white border border-gray-150 rounded-[1.75rem] shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-rose-700/35 hover:shadow-[0_12px_30px_rgba(146,0,117,0.1)] hover:-translate-y-1 transition-all duration-300 group/pill"
                  >
                    <div className={`h-10 w-10 rounded-2xl ${item.accent === '#920075' ? 'bg-rose-700/10 text-rose-700 border border-rose-700/20 group-hover/pill:bg-rose-700' : 'bg-orange-500/10 text-[#B45309] border border-orange-500/20 group-hover/pill:bg-orange-500'} flex items-center justify-center shrink-0 font-bold group-hover/pill:text-white transition-all duration-300 shadow-xs`}>
                      <Check className="h-4 w-4 stroke-[3px]" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-[#0a0806] tracking-wide block group-hover/pill:text-rose-700 transition-colors">
                        {item.title}
                      </span>
                      <span className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5 block">
                        {item.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-12 pt-4">
            <div className="flex flex-col items-center text-center space-y-4 sm:space-y-6 group cursor-default bg-white p-6 sm:p-10 md:p-12 rounded-[2rem] sm:rounded-[3rem] border border-rose-700/10 shadow-[0_15px_40px_rgba(0,0,0,0.02)] hover:shadow-[0_30px_60px_rgba(146,0,117,0.1)] hover:border-rose-700/25 hover:-translate-y-1 transition-all duration-500">
              <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-2xl sm:rounded-[2.5rem] bg-white/80 backdrop-blur-md border border-rose-700/20 flex items-center justify-center text-rose-700 shadow-xs group-hover:scale-110 group-hover:bg-white/95 group-hover:border-rose-700/40 group-hover:rotate-6 transition-all duration-500">
                <Heart className="h-7 w-7 sm:h-10 sm:w-10" />
              </div>
              <h4 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-[#0a0806] group-hover:text-rose-700 transition-colors tracking-tight leading-snug text-center">Why Aliment Cookies Matter</h4>
              <p className="text-[#555555] leading-relaxed text-justify text-xs sm:text-base font-medium">
                Modern snacks are often loaded with processed ingredients that provide taste without nourishment. Aliment Cookies were created to change that. Our products combine traditional nutrition wisdom with premium food innovation to create snacks that genuinely support healthier lifestyles. Every ingredient is intentionally selected to deliver better nutritional value, cleaner ingredients, traditional wellness benefits, and everyday healthy snacking.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4 sm:space-y-6 group cursor-default bg-white p-6 sm:p-10 md:p-12 rounded-[2rem] sm:rounded-[3rem] border border-[#D4AF37]/15 shadow-[0_15px_40px_rgba(0,0,0,0.02)] hover:shadow-[0_30px_60px_rgba(212,175,55,0.06)] hover:border-[#D4AF37]/30 hover:-translate-y-1 transition-all duration-500">
              <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-2xl sm:rounded-[2.5rem] bg-white/80 backdrop-blur-md border border-[#D4AF37]/25 flex items-center justify-center text-[#D4AF37] shadow-xs group-hover:scale-110 group-hover:bg-white/95 group-hover:border-[#D4AF37]/50 group-hover:rotate-6 transition-all duration-500">
                <Zap className="h-7 w-7 sm:h-10 sm:w-10" />
              </div>
              <h4 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-[#0a0806] group-hover:text-[#D4AF37] transition-colors tracking-tight leading-snug text-center">Healthy Snacking for Modern Living</h4>
              <p className="text-[#555555] leading-relaxed text-justify text-xs sm:text-base font-medium">
                Whether you are a fitness enthusiast, working professional, parent, or health-conscious consumer, Aliment Cookies are designed to become part of your daily wellness lifestyle. Perfect for morning nutrition, evening snacks, fitness-friendly diets, clean eating habits, and family wellness routines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ⸻ 5. POWERED BY ANCIENT SUPER GRAINS ⸻ */}
      <section id="sustainability" ref={registerSectionRef} className="py-32 bg-[#FAF8F5]/30 border-t border-brand-pink/5 relative z-10 overflow-hidden font-sans">
        <div className="absolute right-0 top-1/3 w-[500px] h-[500px] bg-rose-700/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-20 space-y-3 sm:space-y-4">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] text-rose-700 bg-rose-700/5 border border-rose-700/15 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full inline-block shadow-xs">
              Nutritional Blueprint
            </span>
            <h2 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#0a0806] leading-tight tracking-tight">
              Powered by Ancient Super Grains
            </h2>
            <div className="h-1 w-20 sm:w-24 bg-gradient-to-r from-rose-700 via-[#D4AF37] to-transparent rounded-full mx-auto" />
            <p className="text-gray-600 text-xs sm:text-base leading-relaxed text-center px-2 font-medium text-pretty">
              Our cookies are enriched with ancient grains and traditional rice varieties that have been trusted for generations for their nutritional richness and wellness benefits. These grains naturally provide fiber-rich nourishment, essential minerals, long-lasting energy, better digestion support, and wholesome nutrition.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            {superGrains.map((millet, idx) => (
              <div key={idx}
                className="group relative bg-gradient-to-br from-white/85 via-amber-50/20 to-white/80 backdrop-blur-xl border border-gray-200/60 rounded-2xl p-5 pb-8 shadow-sm hover:shadow-lg hover:shadow-rose-900/8 hover:border-rose-700/20 hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col justify-between w-full sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)] min-w-[260px] max-w-[310px]"
              >
                {/* Liquid sheen */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
                <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-violet-300/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />

                <div className="relative aspect-square w-full overflow-hidden bg-violet-50/50 border border-violet-100/40 rounded-[1.85rem] animate-pulse">
                  <img
                    src={millet.image}
                    alt={millet.name}
                    className="w-full h-full object-cover scale-[1.01] group-hover:scale-105 transition-all duration-1000 ease-[0.16,1,0.3,1] opacity-0"
                    loading="lazy"
                    decoding="async"
                    onLoad={(e) => {
                      e.target.classList.remove('opacity-0');
                      e.target.parentElement.classList.remove('animate-pulse');
                      e.target.parentElement.classList.add('bg-transparent');
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70 pointer-events-none" />

                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                    <span className="h-7 w-7 rounded-lg bg-white/90 backdrop-blur-md flex items-center justify-center text-[10px] font-bold text-rose-700 shadow-sm group-hover:scale-110 group-hover:border group-hover:border-rose-700/30 transition-all duration-300">
                      0{idx + 1}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-rose-700 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm border border-rose-100/40">
                      {millet.local}
                    </span>
                  </div>
                </div>

                <div className="pt-6 px-2 flex-1 flex flex-col justify-between text-center">
                  <div className="space-y-4 flex flex-col items-center">
                    <h3 className="text-2xl font-display font-bold text-[#0a0806] leading-tight group-hover:text-rose-700 transition-colors text-center">
                      {millet.name}
                    </h3>
                    <div className="h-[2px] w-12 bg-gradient-to-r from-rose-700 via-amber-500 to-transparent group-hover:w-20 transition-all duration-500 mx-auto" />
                    <p className="text-sm text-gray-500 leading-relaxed font-medium text-center">
                      {millet.benefit}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ⸻ 6. WHO WE ARE ⸻ */}
      <section id="about" ref={registerSectionRef} className="py-32 relative z-10 bg-[#FDFBF7] overflow-hidden font-sans">
        <div className="absolute right-0 top-10 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute left-0 bottom-10 w-96 h-96 bg-rose-700/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10 lg:pr-6 flex flex-col items-center text-center lg:items-start lg:text-left">
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-rose-700 border border-rose-700/20 bg-rose-700/5 px-5 py-2 rounded-full inline-block shadow-sm">
                Our Story
              </span>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0a0806] leading-[1.05] tracking-tight text-balance">
                Built on a Mission.<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-700 to-orange-500">Not a Trend.</span>
              </h2>
              <div className="h-1 w-28 bg-gradient-to-r from-rose-700 via-[#D4AF37] to-transparent rounded-full" />

              <div className="space-y-6 pt-2 text-justify w-full">
                <p className="text-[#333333] leading-relaxed text-base sm:text-lg font-medium text-justify">
                  Alimenture Industries Private Limited was incorporated in Chennai in December 2023 by visionary entrepreneurs Pavin Saminathan and Magesh Mohan.
                </p>
                <p className="text-[#555555] leading-relaxed text-xs sm:text-base font-medium text-justify">
                  Driven by the vision of building a self-reliant economy through sustainable food systems, Alimenture was founded with a mission to redefine healthy living through natural, toxin-free nutrition. More than a food manufacturing company, Alimenture is a movement dedicated to creating healthier communities by reconnecting people with authentic, wholesome food. Inspired by the philosophy of the legendary green crusader Nammalvar, we believe that food should nourish people without adding preservatives. Every product we create reflects our commitment to purity, sustainability, and the well-being of future generations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {trustPillars.map((pillar, idx) => (
                <div key={idx}
                  className="group relative bg-gradient-to-br from-white to-gray-50/50 border border-gray-200/60 rounded-2xl p-8 space-y-6 shadow-sm hover:shadow-xl hover:shadow-rose-900/8 hover:border-rose-700/20 transition-all duration-400 hover:-translate-y-2 overflow-hidden">
                  {/* Liquid sheen top */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />
                  <div className="absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-br from-rose-300/10 to-amber-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />

                  <div className="h-16 w-16 rounded-2xl bg-white/80 backdrop-blur-md border border-gray-200/60 flex items-center justify-center text-rose-700 group-hover:scale-110 group-hover:bg-white/95 group-hover:border-rose-700/30 group-hover:shadow-[0_12px_28px_rgba(146,0,117,0.2)] group-hover:rotate-6 transition-all duration-500 shadow-sm shrink-0 relative z-10">
                    {pillar.icon}
                  </div>

                  <div className="space-y-2 relative z-10">
                    <h3 className="font-display font-bold text-[#0a0806] text-xl leading-tight tracking-wide group-hover:text-rose-700 transition-colors">{pillar.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">{pillar.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ⸻ 7. OUR PURPOSE ⸻ */}
      <section id="purpose" className="py-24 px-6 bg-white relative font-sans">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-rose-700 bg-rose-700/10 px-4 py-1.5 rounded-full inline-block border border-rose-700/20">
              Our Purpose
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-5xl text-[#1F1F1F] tracking-tight text-balance">
              Why We Started
            </h2>
            <p className="text-base text-[#1F1F1F]/80 leading-relaxed font-medium max-w-2xl mx-auto">
              At Alimenture, every decision begins with a simple belief—food should nourish lives, empower communities, and protect nature.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 relative group">
              <div className="relative rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl z-10">
                <img
                  src={focusImage}
                  alt="Alimenture Purpose & Empowering Farmers"
                  className="w-full h-[420px] object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              </div>

              <div className="absolute -bottom-12 -right-4 sm:-right-6 bg-gradient-to-br from-white/90 via-violet-50/60 to-white/80 backdrop-blur-2xl border border-violet-200/50 rounded-2xl p-6 shadow-[0_20px_50px_rgba(109,40,217,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] max-w-xs z-20">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-violet-400/50 to-transparent rounded-t-3xl" />
                <Quote className="h-7 w-7 text-violet-500 mb-2 opacity-80" />
                <p className="font-display font-bold text-sm text-[#1F1F1F] leading-snug italic">
                  "Food should nourish people without adding preservatives."
                </p>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6 text-justify">
              <p className="text-base sm:text-lg text-[#1F1F1F]/90 leading-relaxed font-medium text-justify">
                Driven by the vision of building a self-reliant economy through sustainable food systems, Alimenture was founded with a mission to redefine healthy living through natural, toxin-free nutrition.
              </p>
              <p className="text-xs sm:text-base text-[#1F1F1F]/80 leading-relaxed font-medium text-justify">
                More than a food manufacturing company, Alimenture is a movement dedicated to creating healthier communities by reconnecting people with authentic, wholesome food. Inspired by the philosophy of the legendary green crusader Nammalvar, we believe that food should nourish people without adding preservatives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ⸻ 8. THE 3S PHILOSOPHY OF ALIMENTURE ⸻ */}
      <section id="philosophy-3s" className="pt-10 pb-28 px-6 bg-gradient-to-b from-[#FDFBF7] via-[#FAF6F0] to-[#FDFBF7] relative font-sans border-t border-gray-200/60 overflow-hidden">
        {/* ── Floating particles removed for performance ── */}
        <div className="max-w-7xl mx-auto space-y-20 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-rose-700 bg-rose-700/10 px-5 py-2 rounded-full inline-block border border-rose-700/20 shadow-xs backdrop-blur-md">
              Foundational Pillars
            </span>
            <h2 className="font-display font-bold text-4xl sm:text-6xl text-[#0a0806] tracking-tight">
              The 3S Philosophy of <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-700 via-rose-600 to-orange-500">Alimenture</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Sprout className="h-7 w-7 text-rose-700" />,
                title: 'Sustenance',
                desc: 'Creating wholesome foods that support everyday health, energy, and overall well-being through natural ingredients and traditional nutrition.'
              },
              {
                icon: <Globe className="h-7 w-7 text-orange-500" />,
                title: 'Sustainability',
                desc: 'Promoting farming and food production methods that protect the environment, preserve biodiversity, and ensure a healthier planet for future generations.'
              },
              {
                icon: <Users className="h-7 w-7 text-rose-700" />,
                title: 'Self-Reliance',
                desc: 'Building a stronger and more sustainable economy by empowering local farmers, encouraging natural cultivation, and delivering toxin-free nourishment.'
              }
            ].map(card => (
              <div
                key={card.title}
                className="relative p-6 sm:p-10 bg-white/90 backdrop-blur-xl border border-gray-200/80 rounded-[2.5rem] shadow-[0_10px_35px_rgba(0,0,0,0.03)] hover:shadow-[0_25px_50px_rgba(146,0,117,0.12)] hover:border-rose-700/30 hover:-translate-y-2 transition-all duration-500 space-y-5 group overflow-hidden flex flex-col items-center sm:items-start text-center sm:text-left"
              >
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-700/40 via-[#D4AF37]/50 to-transparent" />
                <div className="h-16 w-16 rounded-2xl bg-white/80 backdrop-blur-md border border-rose-700/20 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 group-hover:bg-white/95 group-hover:border-rose-700/40 group-hover:shadow-[0_12px_28px_rgba(146,0,117,0.2)] transition-all duration-500 mx-auto sm:mx-0">
                  {card.icon}
                </div>
                <div className="space-y-3 w-full">
                  <h4 className="font-display font-bold text-xl sm:text-2xl text-[#0a0806] group-hover:text-rose-700 transition-colors leading-tight text-center sm:text-left tracking-tight">
                    {card.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium text-justify">
                    {card.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ⸻ 9. BUILDING A SUSTAINABLE FOOD FUTURE ⸻ */}
      <section id="philosophy" ref={registerSectionRef} className="py-20 lg:py-28 relative z-10 overflow-hidden font-sans w-full">
        <div className="absolute inset-0 z-0">
          <img
            src={bgImage}
            alt="Crafting Grains Into Gold Background"
            className="w-full h-full object-cover object-center opacity-90 scale-105"
            loading="lazy"
            decoding="async"
          />
          {/* Subtle light vignette gradient keeping bg.png crisp & vibrant */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/20 to-white/50 backdrop-blur-[1px]" />
        </div>

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl space-y-12">
          <div className="bg-white/85 backdrop-blur-xl border border-white/90 rounded-[3rem] p-6 sm:p-12 lg:p-16 shadow-[0_25px_60px_rgba(0,0,0,0.12)] relative overflow-hidden">
            <div className="absolute -top-32 -left-32 w-80 h-80 bg-rose-700/12 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-orange-500/15 rounded-full blur-[80px] pointer-events-none" />

            <div className="text-center max-w-3xl mx-auto mb-16 relative z-10 space-y-4">
              <span className="font-sans font-bold text-xs uppercase tracking-[0.3em] text-rose-700 bg-rose-700/10 px-5 py-2 rounded-full inline-block border border-rose-700/20 shadow-sm">
                Alchemi's Grainlets
              </span>
              <h2 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-[#0a0806] uppercase tracking-tight leading-[1.05]">
                Crafting Grains <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-700 via-rose-600 to-orange-500">Into Gold</span>
              </h2>
              <p className="text-sm sm:text-base text-gray-700 font-sans tracking-wide leading-relaxed max-w-2xl mx-auto font-bold uppercase">
                We don't bake compromises. We break the scam of Maida, Sugar, and Refined Oil.
              </p>

              <div className="pt-2">
                <span className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.25em] border border-orange-500/40 text-[#B45309] bg-orange-500/10 shadow-xs">
                  What We Refuse To Bake In
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 relative z-10">
              {refuseList.map((item, idx) => (
                <div
                  key={idx}
                  className="relative flex flex-col items-center sm:items-start text-center sm:text-left gap-4 sm:gap-5 p-6 rounded-[2rem] bg-gradient-to-br from-white to-gray-50/30 border border-gray-200/60 shadow-sm hover:shadow-lg hover:shadow-rose-900/8 hover:border-rose-700/20 hover:-translate-y-1.5 transition-all duration-300 group/refuse cursor-pointer overflow-hidden"
                >
                  <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-rose-500/20 to-transparent" />
                  <div className="h-16 w-16 rounded-2xl bg-white/80 backdrop-blur-md border border-gray-200/60 flex items-center justify-center text-rose-700 group-hover/refuse:scale-110 group-hover/refuse:bg-rose-50 group-hover/refuse:border-rose-700/30 transition-all duration-300 shadow-sm shrink-0 mx-auto sm:mx-0">
                    {item.icon}
                  </div>

                  <div className="flex flex-col flex-1 space-y-1 w-full">
                    <h3 className="font-display font-bold text-base sm:text-lg tracking-wide text-[#0a0806] group-hover/refuse:text-violet-700 transition-colors leading-tight text-center sm:text-left">
                      {item.title}
                    </h3>
                    <p className="font-sans font-medium text-xs sm:text-sm text-gray-600 leading-relaxed text-justify">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="relative group bg-gradient-to-br bg-white border border-gray-200/60 text-[#1F1F1F] p-6 sm:p-10 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-gray-900/5 hover:border-rose-700/20 hover:-translate-y-1.5 transition-all duration-400 space-y-5 overflow-hidden flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />
              <div className="h-14 w-14 rounded-2xl bg-white/80 backdrop-blur-md border border-violet-200/50 flex items-center justify-center text-rose-700 group-hover:scale-110 group-hover:bg-white/95 group-hover:border-rose-700/40 group-hover:shadow-[0_10px_24px_rgba(146,0,117,0.2)] transition-all duration-500 mx-auto sm:mx-0">
                <Leaf className="h-7 w-7" />
              </div>
              <div className="space-y-3 w-full">
                <h3 className="font-display text-xl sm:text-3xl font-bold text-[#1F1F1F] group-hover:text-rose-700 transition-colors text-center sm:text-left tracking-tight">Building a Sustainable Food Future</h3>
                <p className="text-gray-600 font-medium leading-relaxed text-xs sm:text-base text-justify">
                  Alimenture Industries believes healthy food should support both people and the planet. We are committed to promoting sustainable food systems, farmer-friendly ecosystems, traditional agriculture, natural ingredient sourcing, and conscious nourishment practices.
                </p>
              </div>
            </div>

            <div className="relative group bg-gradient-to-br bg-white border border-gray-200/60 p-6 sm:p-10 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-amber-900/5 hover:border-amber-500/20 hover:-translate-y-1.5 transition-all duration-400 space-y-5 overflow-hidden flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
              <div className="h-14 w-14 rounded-2xl bg-white/80 backdrop-blur-md border border-amber-200/50 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 group-hover:bg-white/95 group-hover:border-[#D4AF37]/50 group-hover:shadow-[0_10px_24px_rgba(212,175,55,0.25)] transition-all duration-500 mx-auto sm:mx-0">
                <Shield className="h-7 w-7" />
              </div>
              <div className="space-y-3 w-full">
                <h3 className="font-display text-xl sm:text-3xl font-bold text-[#1F1F1F] group-hover:text-rose-700 transition-colors text-center sm:text-left tracking-tight">Food You Can Trust</h3>
                <p className="text-gray-600 font-medium leading-relaxed text-xs sm:text-base text-justify">
                  Every Alimenture product is crafted with transparency, care, and commitment to quality. We believe consumers deserve honest ingredients, better nutrition, cleaner food choices, and authentic nourishment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ⸻ 10. OUR COMMITMENT ⸻ */}
      <section id="commitment" className="py-16 px-6 bg-[#FAF8F2] relative font-sans">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-[2.5rem] overflow-hidden border-2 border-white shadow-2xl bg-gradient-to-br from-[#1F0320] via-[#2B062C] to-[#150216] text-white p-8 sm:p-14 space-y-8">
            <div className="absolute inset-0 pointer-events-none opacity-40 z-0">
              <img src={bg1Image} alt="Heritage grain background" className="w-full h-full object-cover" />
            </div>

            <div className="absolute -top-20 -right-20 w-80 h-80 bg-rose-700/40 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-orange-500/25 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 space-y-6 max-w-4xl text-center sm:text-left flex flex-col items-center sm:items-start">
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 bg-white/10 px-4 py-1.5 rounded-full inline-block border border-white/20 shadow-xs text-center">
                Our Commitment
              </span>
              <h3 className="font-display font-bold text-2xl sm:text-4xl lg:text-5xl text-white leading-tight tracking-tight text-center sm:text-left">
                Every product we craft is a step toward a healthier India.
              </h3>

              <p className="text-xs sm:text-base text-purple-100/90 leading-relaxed font-medium text-justify">
                We are committed to delivering food that is nutrient-rich, toxin-free, and deeply rooted in tradition. From responsibly sourcing ingredients to supporting farming communities, every decision reflects our dedication to quality, sustainability, and trust.
              </p>

              <p className="text-xs sm:text-base text-purple-100/90 leading-relaxed font-medium text-justify">
                At Alimenture, we don't just produce food—we cultivate healthier lifestyles, strengthen local communities, and build a future where nutrition, nature, and responsibility grow together.
              </p>
            </div>

            <div className="relative z-10 pt-4">
              <div className="bg-gradient-to-r from-black/50 via-purple-950/70 to-black/50 backdrop-blur-2xl border border-white/25 p-6 sm:p-9 rounded-[2rem] text-center shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden group">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#FDE047] via-[#F472B6] to-transparent opacity-80" />
                <p className="font-display font-bold text-lg sm:text-2xl text-white leading-snug tracking-wide">
                  "At Alimenture, we don't just produce food—we produce <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F472B6] to-[#E91E8C]">trust</span>, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FDE047] to-orange-500">health</span>, and <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F472B6] to-[#FDE047]">sustainability</span>."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>



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
                <div className="relative h-44 w-full overflow-hidden bg-[#FDFBF7]">
                  {item.image && (
                    <img src={item.image} alt={name} className="w-full h-full object-cover" />
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
                  <span className="absolute top-4 left-4 text-[9px] font-bold uppercase tracking-[0.25em] text-white bg-white/15 border border-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    {quickAddMode === 'cart' ? '🛒 Add to Cart' : '❤️ Save to Wishlist'}
                  </span>
                  {/* Name overlay */}
                  <div className="absolute bottom-4 left-5 right-5">
                    <h3 className="font-display font-bold text-white text-xl leading-tight">{name}</h3>
                    {item.category && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#D4AF37] mt-0.5 block">{item.category}</span>
                    )}
                  </div>
                </div>

                <div className="px-6 py-5 space-y-5">
                  {/* Variant Selector */}
                  {hasVariants && (
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Choose Pack Size</p>
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
                                ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50 line-through'
                                : active
                                  ? 'border-rose-700 bg-rose-700/6 text-rose-700 shadow-[0_4px_12px_rgba(146,0,117,0.15)]'
                                  : 'border-gray-200 text-gray-600 hover:border-rose-700/40 hover:bg-rose-700/3 bg-white'
                                }`}
                            >
                              {v.weight}
                              <span className={`block text-[8px] mt-0.5 font-bold ${active ? 'text-rose-700' : 'text-gray-400'}`}>₹{v.price}</span>
                              {sold && <span className="block text-[7px] text-gray-400">Out of stock</span>}
                              {!sold && v.stock < 10 && (
                                <span className="absolute -top-1.5 -right-1.5 text-[7px] bg-red-500 text-white rounded-full px-1.5 py-0.5 font-bold">{v.stock} left</span>
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
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Quantity</p>
                        <div className="flex items-center gap-0 border border-gray-200 rounded-2xl bg-gray-50 overflow-hidden">
                          <button
                            onClick={() => setQaQty(q => Math.max(1, q - 1))}
                            disabled={qaQty <= 1}
                            className="w-11 h-11 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-30 text-gray-600"
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
                            className="w-12 text-center text-sm font-bold text-[#0a0806] bg-transparent border-none outline-none focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            onClick={() => setQaQty(q => Math.min(maxQty, q + 1))}
                            disabled={qaQty >= maxQty}
                            className="w-11 h-11 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-30 text-gray-600"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      {totalPrice && (
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total</p>
                          <span className="text-2xl font-bold text-[#0a0806]">₹{totalPrice}</span>
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
                      className="h-12 px-5 rounded-2xl border border-gray-200 text-gray-500 font-bold text-[10px] uppercase tracking-wider hover:border-gray-300 hover:bg-gray-50 transition-all bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmQuickAdd}
                      disabled={isOutOfStock}
                      className={`flex-1 h-12 rounded-2xl font-bold text-[10px] uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${isOutOfStock
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : quickAddMode === 'cart'
                          ? 'bg-gradient-to-r from-rose-700 to-[#E91E8C] text-white shadow-[0_8px_24px_rgba(146,0,117,0.3)] hover:shadow-[0_12px_32px_rgba(146,0,117,0.45)] hover:opacity-95'
                          : 'bg-gradient-to-r from-[#E91E8C] to-rose-700 text-white shadow-[0_8px_24px_rgba(233,30,140,0.3)] hover:opacity-95'
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