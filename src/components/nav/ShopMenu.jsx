import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Cookie, Sprout, Droplet, Leaf, Award } from 'lucide-react';
import { cachedFetch, API_BASE } from '../../lib/api';
import { productPath, categoryPath, displayName } from '../../lib/seo';
import FallbackImg from '../../assets/lan.webp';

/*
 * Seed-style "Shop" mega menu (see designs.md → Navigation).
 * Seed opens a frosted panel listing every product with a thumbnail, code and
 * name, plus "Shop All Products →". Alimenture has more products, so the panel
 * is split: categories on the left (Admin → Categories, with counts), and the
 * hovered category's products on the right.
 */

const DEFAULT_CATEGORIES = ['Cookies', 'Health Mixtures', 'Honey', 'Jaggery'];
const COOKIE_ALIASES = ['biscuit', 'biscuits', 'cookie', 'cookies'];

const inCategory = (p, cat) => {
  const pc = String(p.category || '').trim().toLowerCase();
  if (cat.toLowerCase() === 'cookies') return !pc || COOKIE_ALIASES.includes(pc);
  return pc === cat.toLowerCase();
};

const fromPrice = (p) => {
  const vs = Array.isArray(p.variants) ? p.variants.filter((v) => Number(v.price) > 0) : [];
  if (vs.length) return { price: Math.min(...vs.map((v) => Number(v.price))), from: vs.length > 1 };
  return { price: Number(p.price) || 0, from: false };
};

const categoryIcon = (name) => {
  const c = name.toLowerCase();
  if (c.includes('cookie') || c.includes('biscuit')) return Cookie;
  if (c.includes('mix') || c.includes('health')) return Sprout;
  if (c.includes('honey')) return Droplet;
  if (c.includes('jaggery') || c.includes('sugar')) return Leaf;
  return Award;
};

export default function ShopMenu({ categories, onNavigate, onMouseEnter, onMouseLeave }) {
  const still = useReducedMotion();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    cachedFetch(`${API_BASE}/products?limit=100`)
      .then((d) => { if (alive && d?.success && Array.isArray(d.data)) setProducts(d.data); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  // Admin order first, then any category only found on products; hide empty shelves.
  const cats = useMemo(() => {
    const names = (categories.length ? categories.map((c) => c.name) : DEFAULT_CATEGORIES)
      .map((n) => String(n || '').trim())
      .filter((n, i, arr) => n && arr.findIndex((x) => x.toLowerCase() === n.toLowerCase()) === i);
    const withItems = names
      .map((name) => ({ name, items: products.filter((p) => inCategory(p, name)) }))
      .filter((c) => c.items.length > 0 || products.length === 0);
    return withItems;
  }, [categories, products]);

  const [active, setActive] = useState(null);
  const current = cats.find((c) => c.name === active) || cats[0];

  return (
    <motion.div
      initial={still ? false : { opacity: 0, y: -6, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={still ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.985 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="absolute left-0 top-full pt-2 z-[120] origin-top-left"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        id="shop-menu"
        role="region"
        aria-label="Shop by category"
        className="w-[min(820px,calc(100vw-2.5rem))] overflow-hidden rounded-[28px] bg-paper/95 backdrop-blur-2xl ring-1 ring-black/5 shadow-[0_30px_70px_-30px_rgba(43,11,51,0.45)]"
      >
        <div className="grid grid-cols-[260px_1fr]">
          {/* categories */}
          <ul className="border-r border-hairline/80 p-3 space-y-1 bg-cream/60">
            <li className="px-3 pt-2 pb-3">
              <span className="eyebrow">Shop by category</span>
            </li>
            {cats.map(({ name, items }) => {
              const Icon = categoryIcon(name);
              const thumb = items.find((p) => p.image)?.image;
              const isActive = current?.name === name;
              return (
                <li key={name}>
                  <Link
                    to={categoryPath(name)}
                    onClick={onNavigate}
                    onMouseEnter={() => setActive(name)}
                    onFocus={() => setActive(name)}
                    className={`group flex items-center gap-3 rounded-2xl p-2 pr-3 transition-colors ${isActive ? 'bg-paper shadow-[0_6px_18px_-12px_rgba(43,11,51,0.35)]' : 'hover:bg-paper/70'}`}
                  >
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl plate-sandal flex items-center justify-center">
                      {thumb
                        ? <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
                        : <Icon className="h-5 w-5 text-berry" strokeWidth={1.6} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11.5px] text-ink-muted">
                        {items.length ? `${items.length} product${items.length === 1 ? '' : 's'}` : 'Category'}
                      </span>
                      <span className={`block truncate font-display text-[15px] font-medium ${isActive ? 'text-berry' : 'text-ink'}`}>{name}</span>
                    </span>
                    <ArrowRight className={`h-4 w-4 shrink-0 transition-all ${isActive ? 'text-berry translate-x-0 opacity-100' : 'opacity-0 -translate-x-1'}`} />
                  </Link>
                </li>
              );
            })}
            <li className="pt-2">
              <Link to="/shop" onClick={onNavigate} className="flex items-center justify-between rounded-2xl px-3 py-3 text-[14px] font-medium text-ink hover:bg-paper/70 transition-colors">
                All products <span className="text-ink-muted">{products.length || ''}</span>
              </Link>
            </li>
          </ul>

          {/* products of the hovered category */}
          <div className="p-5 sm:p-6 flex flex-col">
            <div className="flex items-baseline justify-between gap-4 mb-4">
              <p className="headline text-2xl">{current?.name || 'Our range'}</p>
              {current && (
                <Link to={categoryPath(current.name)} onClick={onNavigate} className="link-arrow text-[13px] shrink-0">
                  Shop all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((i) => <div key={i} className="h-[150px] rounded-2xl skeleton" />)}
              </div>
            ) : current?.items.length ? (
              <ul className="grid grid-cols-2 gap-3">
                {current.items.slice(0, 4).map((p) => {
                  const { price, from } = fromPrice(p);
                  return (
                    <li key={p.id || p._id}>
                      <Link to={productPath(p)} onClick={onNavigate} className="group flex flex-col rounded-2xl p-1.5 hover:bg-cream/70 transition-colors">
                        <span className="relative block aspect-[16/10] overflow-hidden rounded-xl plate-sandal">
                          <img src={p.image || FallbackImg} alt="" className="h-full w-full object-cover transition-transform duration-700 ease-soft group-hover:scale-105" loading="lazy" />
                        </span>
                        <span className="mt-2 px-1 flex items-baseline justify-between gap-2">
                          <span className="truncate font-display text-[14px] font-medium text-ink group-hover:text-berry transition-colors">{displayName(p.name || p.title)}</span>
                          {price > 0 && (
                            <span className="shrink-0 text-[12.5px] text-ink-soft">{from ? 'from ' : ''}₹{price}</span>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-ink-soft py-8">Browse the full range in the shop.</p>
            )}

            <div className="mt-auto pt-5 flex items-center justify-between gap-4 border-t border-hairline/80">
              <p className="text-[12.5px] text-ink-muted">No maida · no white sugar · baked in Chennai</p>
              <Link to="/shop" onClick={onNavigate} className="btn-pill btn-pill-sm">
                Shop all products <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
