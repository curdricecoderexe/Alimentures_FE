import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, PackageOpen, ChevronDown, Check, Zap, Sprout, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../../components/ui/ProductCard';
import ProductGridSkeleton from '../../components/skeletons/ProductGridSkeleton';
import SEO from '../../components/SEO';

const CATEGORIES = ['All', 'Biscuit', 'Flakes', 'Rusk', 'Millet', 'Health Mix'];
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_low_high', label: 'Price: Low to High' },
  { value: 'price_high_low', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'name', label: 'Name (A-Z)' }
];

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
    
  // URL State Extractors
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'All';
  const sort = searchParams.get('sort') || 'relevance';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

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

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-24 pb-20 font-sans text-gray-900">
      <SEO 
        title={query ? `Search: ${query}` : "Shop Our Toxin-Free Products"}
        description="Discover our premium heritage grains and toxin-free millet products."
        url="/shop"
      />
      
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Header & Search Bar */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-display font-black tracking-tight mb-2">
              {query ? `Results for "${query}"` : 'Our Collection'}
            </h1>
            <p className="text-gray-500 text-sm font-medium">
              Showing {products.length} of {totalCount} products
            </p>
          </div>
          
          <div className="relative w-full md:w-96 flex-shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={query}
              onChange={handleSearch}
              className="w-full h-14 pl-12 pr-4 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#920075]/30 focus:border-[#920075] transition-all font-semibold shadow-sm"
              aria-label="Search Products"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start">
          
          {/* Mobile Filter Toggle */}
          <div className="w-full flex gap-3 lg:hidden mb-2">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex-1 h-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters {category !== 'All' && '(1)'}
            </button>
            <button 
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex-1 h-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm"
            >
              Sort <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Desktop/Collapsible Sidebar */}
          <aside className={`w-full lg:w-64 flex-shrink-0 lg:block ${isFilterOpen ? 'block' : 'hidden'}`}>
            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm sticky top-28">
              <h3 className="font-black uppercase text-xs tracking-wider text-gray-400 mb-4">Categories</h3>
              <div className="space-y-1.5 mb-8">
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => updateURLParams({ category: cat, page: '1' })}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      category === cat ? 'bg-[#920075] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cat}
                    {category === cat && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>

              <h3 className="font-black uppercase text-xs tracking-wider text-gray-400 mb-4">Sort By</h3>
              <div className="space-y-1.5">
                {SORT_OPTIONS.map(opt => (
                  <button 
                    key={opt.value}
                    onClick={() => updateURLParams({ sort: opt.value, page: '1' })}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      sort === opt.value ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                    {sort === opt.value && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-100">
                <button 
                  onClick={() => setSearchParams(new URLSearchParams())}
                  className="w-full text-xs font-bold text-[#920075] hover:underline"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <main className="flex-1 w-full">
            {error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Zap className="h-16 w-16 text-red-400 mb-4 opacity-50" />
                <h3 className="text-xl font-black mb-2">Oops, something went wrong.</h3>
                <button onClick={() => fetchProducts(false)} className="text-[#920075] font-bold hover:underline">Try Again</button>
              </div>
            ) : loading && page === 1 ? (
              <ProductGridSkeleton count={8} />
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 px-4 bg-white rounded-[3rem] border border-gray-100 border-dashed text-center">
                <PackageOpen className="h-20 w-20 text-gray-200 mb-5" />
                <h2 className="text-2xl font-black text-gray-800 mb-3">No products found</h2>
                <p className="text-gray-500 font-medium mb-8 max-w-sm mx-auto">
                  We couldn't find any items matching "{query}". Try adjusting your filters or search terms.
                </p>
                <button 
                  onClick={() => setSearchParams(new URLSearchParams())}
                  className="px-8 py-3.5 bg-gray-900 hover:bg-[#920075] text-white rounded-full font-black text-sm uppercase tracking-wider transition-colors"
                >
                  View All Products
                </button>
              </div>
            ) : (
              <div className="space-y-12">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  <AnimatePresence>
                    {products.map((product) => (
                      <motion.div
                        key={product.id || product._id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
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
                      className="px-10 py-4 bg-white border border-gray-200 hover:border-[#920075] text-gray-800 hover:text-[#920075] rounded-full font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50 shadow-sm"
                    >
                      {loading ? 'Loading...' : 'Load More'}
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
