import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, PackageOpen, ChevronDown, Check, Zap } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import ProductCard from '../../components/ui/ProductCard';
import ProductGridSkeleton from '../../components/skeletons/ProductGridSkeleton';
import SEO from '../../components/SEO';
import { Reveal } from '../../components/ui/motion';
import { useCategories } from '../../lib/categories';
import { useDeliverySummary } from '../../lib/delivery';
import { SHOP_SEO, categoryPath, slugify, breadcrumbJsonLd, displayName } from '../../lib/seo';
import { CATEGORY_CONTENT, genericCategoryContent } from '../../data/categoryContent';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_low_high', label: 'Price: Low to High' },
  { value: 'price_high_low', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'name', label: 'Name (A-Z)' }
];

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const still = useReducedMotion();

  // Admin-managed (Admin → Categories); "All" shows the total across them.
  const managedCategories = useCategories();
  const routeCategory = categorySlug
    ? managedCategories.find((c) => slugify(c.name) === categorySlug)
    : null;

  // URL State Extractors. Categories live at /categories/<slug>; the old
  // /shop?category=<name> form is redirected there (see effect below).
  const query = searchParams.get('q') || '';
  const legacyCategory = searchParams.get('category');
  const category = categorySlug
    ? (routeCategory?.name || categorySlug.replace(/-/g, ' '))
    : 'All';
  const sort = searchParams.get('sort') || 'relevance';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Free-shipping promo copy follows Admin → PIN Code Delivery.
  const delivery = useDeliverySummary();

  const allCount = managedCategories.reduce((n, c) => n + (c.productCount || 0), 0);
  const categoryOptions = [{ name: 'All', productCount: allCount }, ...managedCategories];
  const isActiveCategory = (name) => category.toLowerCase() === name.toLowerCase();

  // Local UI State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filter Drawer State (Mobile)
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Fetch logic with debounce
  const fetchTimeout = useRef(null);
  const abortControllerRef = useRef(null);
  
  const updateURLParams = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.keys(updates).forEach(key => {
      if (updates[key]) {
        newParams.set(key, updates[key]);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };

  useEffect(() => {
    if (!legacyCategory) return;
    const rest = new URLSearchParams(searchParams);
    rest.delete('category');
    const qs = rest.toString();
    const base = legacyCategory === 'All' ? '/shop' : categoryPath(legacyCategory);
    navigate(`${base}${qs ? `?${qs}` : ''}`, { replace: true });
  }, [legacyCategory, searchParams, navigate]);

  /** Link target for a category filter, keeping the other filters. */
  const categoryHref = (name) => {
    const rest = new URLSearchParams(searchParams);
    rest.delete('category');
    rest.delete('page');
    const qs = rest.toString();
    return `${name === 'All' ? '/shop' : categoryPath(name)}${qs ? `?${qs}` : ''}`;
  };

  const handleSearch = (e) => {
    updateURLParams({ q: e.target.value, page: '1' });
  };

  const fetchProducts = useCallback(async (append = false) => {
    setLoading(true);
    setError(false);
    
    // Abort previous request if it's still in-flight
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    try {
      const qs = new URLSearchParams();
      if (query) qs.append('q', query);
      if (category && category !== 'All') qs.append('category', category);
      if (sort) qs.append('sort', sort);
      if (minPrice) qs.append('minPrice', minPrice);
      if (maxPrice) qs.append('maxPrice', maxPrice);
      qs.append('page', page.toString());
      qs.append('limit', '12');

      const res = await fetch(`${import.meta.env.VITE_API_URL}/products/search?${qs.toString()}`, {
        signal: abortControllerRef.current.signal
      });
      const data = await res.json();
      
      if (data.success) {
        if (append) {
          setProducts(prev => [...prev, ...data.data]);
        } else {
          setProducts(data.data);
        }
        setHasMore(data.hasMore);
        setTotalCount(data.totalCount);
      } else {
        setError(true);
      }
    } catch (err) {
      if (err.name === 'AbortError') return; // Ignore aborted requests
      console.error(err);
      setError(true);
    } finally {
      // Only set loading to false if this request wasn't aborted
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [query, category, sort, minPrice, maxPrice, page]);

  useEffect(() => {
    if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
    
    // Debounce fetching to prevent excessive API calls
    fetchTimeout.current = setTimeout(() => {
      fetchProducts(page > 1);
    }, 300);

    return () => clearTimeout(fetchTimeout.current);
  }, [query, category, sort, minPrice, maxPrice, page, fetchProducts]);

  // Search results and empty/unknown categories stay out of the index; filter,
  // sort and paging parameters canonicalise to the plain listing URL.
  const categoryName = routeCategory?.name || category;
  const content = categorySlug
    ? (CATEGORY_CONTENT[categorySlug] || genericCategoryContent(categoryName, products.map((p) => displayName(p.title || p.name))))
    : null;
  const seo = query
    ? { title: `Search results for “${query.replace(/[^\p{L}\p{N} &'-]/gu, '').trim().slice(0, 40)}”`, description: SHOP_SEO.description, path: '/shop', noindex: true }
    : categorySlug
      ? {
        title: content.title,
        description: content.description,
        path: categoryPath(categoryName),
        noindex: !routeCategory || !(routeCategory.productCount > 0),
        crumbs: [{ name: 'Home', path: '/' }, { name: 'Shop', path: '/shop' }, { name: categoryName, path: categoryPath(categoryName) }],
      }
      : { title: SHOP_SEO.title, description: SHOP_SEO.description, path: '/shop', noindex: false };

  return (
    <div className="relative min-h-screen pt-24 pb-20 font-sans text-ink overflow-hidden">
      <SEO
        title={seo.title}
        description={seo.description}
        url={seo.path}
        noindex={seo.noindex}
        jsonLd={seo.crumbs ? breadcrumbJsonLd(seo.crumbs) : null}
      />

      <div className="container mx-auto px-4 max-w-[1440px] relative z-[2]">

        {/* Header & Search Bar */}
        <Reveal className="mb-9 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex flex-col gap-3.5">
            {seo.crumbs ? (
              <nav aria-label="Breadcrumb" className="kicker text-ink-muted flex items-center gap-1.5 flex-wrap">
                <Link to="/" className="hover:text-berry transition-colors">Home</Link>
                <span>/</span>
                <Link to="/shop" className="hover:text-berry transition-colors">Shop</Link>
                <span>/</span>
                <span className="text-berry">{categoryName}</span>
              </nav>
            ) : (
              <span className="kicker text-berry">
                {query ? 'Search results' : 'Organic Treats'}
              </span>
            )}
            <h1 className="display-lg text-[2.6rem] sm:text-[3.2rem]">
              {query
                ? <>Results for <span className="accent-text">&ldquo;{query}&rdquo;</span></>
                : content ? content.h1 : <>Shop every <span className="accent-text">clean bake</span></>}
            </h1>
            <span className="rule-berry" />
            <p className="text-ink-soft text-[15px] font-medium max-w-2xl">
              {content?.intro || 'Cookies, health mixes, raw honey and unrefined jaggery — all made without maida, white sugar or refined oil.'}
            </p>
          </div>

          <div className="relative w-full md:w-96 flex-shrink-0">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-berry pointer-events-none z-10" />
            <input
              type="text"
              placeholder="Search millet cookies, honey, jaggery…"
              value={query}
              onChange={handleSearch}
              className="glass-sm w-full h-14 pl-[52px] pr-5 rounded-2xl text-[14px] focus:outline-none focus:border-berry/50 focus:ring-4 focus:ring-berry/10 transition-all duration-300 font-medium placeholder:text-ink-muted"
              aria-label="Search Products"
            />
          </div>
        </Reveal>

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Mobile Filter Toggle */}
          <div className="w-full flex gap-3 lg:hidden mb-2">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="btn-glass flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters {category !== 'All' && '(1)'}
            </button>
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="btn-glass flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm"
            >
              Sort <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Desktop/Collapsible Sidebar */}
          <aside className={`w-full lg:w-[272px] flex-shrink-0 lg:block ${isFilterOpen ? 'block' : 'hidden'}`}>
            <div className="sticky top-28 flex flex-col gap-4">
              <Reveal className="glass rounded-card p-6">
                <h3 className="kicker text-ink-soft mb-4">Category</h3>
                <div className="space-y-1.5">
                  {categoryOptions.map(({ name, productCount }) => {
                    const active = isActiveCategory(name);
                    return (
                      <Link
                        key={name}
                        to={categoryHref(name)}
                        aria-current={active ? 'page' : undefined}
                        onClick={() => setIsFilterOpen(false)}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                          active
                            ? 'btn-berry'
                            : 'text-ink-soft hover:bg-berry/[0.06] hover:text-berry'
                        }`}
                      >
                        <span className="truncate text-left">{name}</span>
                        {active ? (
                          <Check className="h-4 w-4 shrink-0" />
                        ) : (
                          productCount > 0 && (
                            <span className="shrink-0 min-w-[26px] h-6 px-2 rounded-full bg-ink/[0.05] text-[11px] font-bold text-ink-muted inline-flex items-center justify-center">
                              {productCount}
                            </span>
                          )
                        )}
                      </Link>
                    );
                  })}
                </div>
              </Reveal>

              <Reveal delay={0.06} className="glass rounded-card p-6">
                <h3 className="kicker text-ink-soft mb-4">Sort by</h3>
                <div className="space-y-1.5">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => updateURLParams({ sort: opt.value, page: '1' })}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                        sort === opt.value
                          ? 'bg-ink text-white shadow-glass-sm'
                          : 'text-ink-soft hover:bg-berry/[0.06] hover:text-berry'
                      }`}
                    >
                      {opt.label}
                      {sort === opt.value && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>

                <div className="mt-6 pt-5 border-t border-hairline">
                  <button
                    onClick={() => navigate("/shop")}
                    className="w-full kicker text-berry hover:opacity-70 transition-opacity"
                  >
                    Clear all filters
                  </button>
                </div>
              </Reveal>

              {/* Free shipping promo (hidden when free delivery is switched off) */}
              {delivery.freeDeliveryEnabled && (
                <Reveal delay={0.12} className="btn-berry rounded-card p-5 text-left cursor-default">
                  <p className="kicker text-gold-light">Free shipping</p>
                  <p className="display-md text-[19px] text-white mt-2">On orders above ₹{delivery.freeDeliveryThreshold}</p>
                  <p className="text-[12.5px] text-white/75 mt-1.5 font-medium">Dispatched from Chennai in 24–48 hrs.</p>
                </Reveal>
              )}
            </div>
          </aside>

          {/* Product Grid */}
          <main className="flex-1 w-full">
            {/* Results bar */}
            {!error && products.length > 0 && (
              <div className="glass-sm rounded-2xl h-14 px-5 flex items-center justify-between mb-6">
                <p className="text-[12.5px] text-ink-soft font-medium">
                  Showing <strong className="text-ink">{products.length}</strong> of <strong className="text-ink">{totalCount}</strong> products
                </p>
                <span className="pill-berry-soft hidden sm:inline-flex items-center h-7 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {category === 'All' ? 'All products' : category}
                </span>
              </div>
            )}

            {error ? (
              <div className="glass rounded-panel flex flex-col items-center justify-center py-20 text-center">
                <span className="ico-chip w-[104px] h-[104px] rounded-full mb-5 text-danger">
                  <Zap className="h-10 w-10" />
                </span>
                <h3 className="display-md text-xl mb-2">Oops, something went wrong.</h3>
                <button onClick={() => fetchProducts(false)} className="btn-glass mt-4 h-11 px-7 rounded-full kicker">Try again</button>
              </div>
            ) : loading && page === 1 ? (
              <ProductGridSkeleton count={8} />
            ) : products.length === 0 ? (
              <div className="glass rounded-panel flex flex-col items-center justify-center py-24 px-4 text-center">
                <span className="ico-chip w-[120px] h-[120px] rounded-full mb-6">
                  <PackageOpen className="h-11 w-11" />
                </span>
                <h2 className="display-md text-2xl text-ink mb-3">No products found</h2>
                <p className="text-ink-soft font-medium mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                  We couldn&rsquo;t find any items matching &ldquo;{query}&rdquo;. Try adjusting your filters or search terms.
                </p>
                <button
                  onClick={() => navigate("/shop")}
                  className="btn-berry px-8 py-3.5 rounded-full font-extrabold text-xs uppercase tracking-[0.12em]"
                >
                  View all products
                </button>
              </div>
            ) : (
              <div className="space-y-12">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                  <AnimatePresence>
                    {products.map((product, i) => (
                      <motion.div
                        key={product.id || product._id}
                        layout
                        initial={still ? false : { opacity: 0, y: 22, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.45, delay: still ? 0 : Math.min(i, 7) * 0.05, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {hasMore && (
                  <div className="flex justify-center pt-8">
                    <button
                      onClick={() => updateURLParams({ page: (page + 1).toString() })}
                      disabled={loading}
                      className="btn-glass px-10 py-4 rounded-full font-extrabold text-xs uppercase tracking-[0.14em] disabled:opacity-50"
                    >
                      {loading ? 'Loading…' : 'Load more'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
