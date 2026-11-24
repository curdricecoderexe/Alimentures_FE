import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, animate, useMotionValue, useTransform, useReducedMotion } from 'framer-motion';
import { cachedFetch, API_BASE } from '../../lib/api';
import { displayName } from '../../lib/seo';
import { useCategories } from '../../lib/categories';
import { EngravedBee, SpotMillet } from './BotanicalArt';
import logo from '../../assets/logo.png';
import imgPenta from '../../assets/fav/penta_bite.webp';
import imgRedMillets from '../../assets/fav/red_millets_mate.webp';
import imgTriGrain from '../../assets/fav/tri_grain_gain.webp';
import imgCoclets from '../../assets/fav/classic_coclets.webp';

/* Used only if the catalogue API is unreachable. */
const FALLBACK = [
  { name: 'Red Millets Mate', category: 'Cookies', image: imgRedMillets },
  { name: 'Penta Bites', category: 'Cookies', image: imgPenta },
  { name: 'Tri-Grain Gain', category: 'Cookies', image: imgTriGrain },
  { name: 'Classic Coclets', category: 'Cookies', image: imgCoclets },
];
const TURN_EVERY_MS = 2600;
const TURN_EASE = [0.645, 0.045, 0.355, 1]; // ease-in-out, like a hand turning a page

const fromPrice = (p) => {
  const vs = Array.isArray(p.variants) ? p.variants.map((v) => Number(v.price)).filter((n) => n > 0) : [];
  return vs.length ? Math.min(...vs) : Number(p.price) || 0;
};
const packSizes = (p) => (Array.isArray(p.variants) ? p.variants.map((v) => v.weight).filter(Boolean) : []);
const nameOf = (p) => displayName(p.name || p.title || '');
const keyOf = (p) => p.id || p._id || p.name;
const pad = (n) => String(n).padStart(2, '0');

const PAPER = 'bg-[#FBF6EC]';

/* ── Page faces ──────────────────────────────────────────────────── */

function CoverPage({ categories, count }) {
  return (
    <div className="flex h-full flex-col p-5 text-ink">
      <img src={logo} alt="" className="h-9 w-auto self-start" draggable="false" />
      <p className="mt-4 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-cocoa/70">Product catalogue</p>
      <p className="mt-1 font-display text-[22px] leading-tight font-medium">Heritage grains,<br />honest bakes.</p>
      <ul className="mt-4 space-y-1.5 text-[12.5px] text-ink-soft">
        {categories.map((c) => (
          <li key={c} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-gold-light" /> {c}</li>
        ))}
      </ul>
      <p className="mt-auto pt-4 border-t border-[#E8DCC6] text-[11.5px] text-ink-muted">{count} products inside</p>
    </div>
  );
}

/** Back of a turned leaf: product notes. It lands on the left page. */
function NotesPage({ product }) {
  const sizes = packSizes(product);
  const price = fromPrice(product);
  return (
    <div className="relative flex h-full flex-col p-5 text-ink">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-cocoa/70">Product notes</p>
      <p className="mt-1.5 pr-10 font-display text-[19px] leading-snug font-medium line-clamp-2">{nameOf(product)}</p>
      {product.description && (
        <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft line-clamp-4">{product.description}</p>
      )}
      <dl className="mt-auto pt-3 border-t border-[#E8DCC6] grid grid-cols-2 gap-2 text-[11.5px]">
        {sizes.length > 0 && (
          <div><dt className="text-ink-muted">Pack sizes</dt><dd className="text-ink font-medium">{sizes.slice(0, 3).join(' · ')}</dd></div>
        )}
        {price > 0 && (
          <div><dt className="text-ink-muted">Price</dt><dd className="text-ink font-medium">from ₹{price.toLocaleString('en-IN')}</dd></div>
        )}
      </dl>
      <SpotMillet className="pointer-events-none absolute right-4 top-4 h-10 w-10 opacity-40" color="#5C3410" />
    </div>
  );
}

/** Front of a leaf: the product photo page. */
function ProductPage({ product, n, count }) {
  return (
    <div className="flex h-full flex-col p-3 sm:p-4">
      <div className="relative flex flex-1 flex-col overflow-hidden rounded-[10px] bg-[#FFFDF8] ring-1 ring-[#EFE4D1]">
        <div className="relative aspect-[16/10] overflow-hidden bg-cream">
          <img src={product.image} alt={nameOf(product)} className="h-full w-full object-cover" loading="lazy" draggable="false" />
          <span className="absolute top-2 right-2 h-6 px-2 inline-flex items-center rounded-full bg-white/90 text-[11px] font-semibold text-ink tabular-nums">
            {pad(n)} / {pad(count)}
          </span>
        </div>
        <div className="flex flex-1 flex-col justify-center px-3.5 py-2.5">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#A09A92]">{product.category || 'Alimenture'}</span>
          <span className="mt-0.5 text-[15px] font-semibold leading-snug text-ink line-clamp-1">{nameOf(product)}</span>
          {fromPrice(product) > 0 && <span className="mt-0.5 text-[13px] text-ink-soft">from ₹{fromPrice(product).toLocaleString('en-IN')}</span>}
        </div>
      </div>
    </div>
  );
}

/**
 * Animated catalogue booklet with a realistic 3D page turn.
 * The right-hand leaf (product photo on the front, product notes on the back)
 * lifts at the spine, swings over in 3D and lands on the left page, revealing
 * the next product underneath. Lighting, a cast shadow and a slight lift
 * follow the turn. Auto-turns; hover/focus pauses; the folded corner turns on
 * click. Phones: the single page turns away. Reduced motion: no 3D, instant swap.
 */
export default function CatalogueBooklet() {
  const still = useReducedMotion();
  const managed = useCategories().filter((c) => c.visible !== false && c.productCount > 0);
  const [products, setProducts] = useState(FALLBACK);
  const [right, setRight] = useState(0); // product on the right-hand page
  const [left, setLeft] = useState(-1);  // -1 = cover, otherwise notes of products[left]
  const [turning, setTurning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches);

  useEffect(() => {
    let alive = true;
    cachedFetch(`${API_BASE}/products?limit=100`)
      .then((d) => {
        if (!alive || !d?.success || !Array.isArray(d.data)) return;
        const withPhotos = d.data.filter((p) => p.image);
        if (withPhotos.length) { setProducts(withPhotos); setRight(0); setLeft(-1); }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const onChange = () => setWide(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const count = products.length;
  const next = (right + 1) % count;
  const categories = useMemo(
    () => (managed.length ? managed.map((c) => c.name) : [...new Set(products.map((p) => p.category).filter(Boolean))]).slice(0, 4),
    [managed, products],
  );

  // ── the turning leaf ──
  const rot = useMotionValue(0);                                                  // 0 → -180deg
  const lift = useTransform(rot, [0, -90, -180], [0, 40, 0]);                      // rises off the book mid-turn
  const frontShade = useTransform(rot, [0, -90], [0, 0.42]);                       // front darkens turning away from the light
  const backShade = useTransform(rot, [-90, -180], [0.32, 0]);                     // back brightens as it lands
  const castShadow = useTransform(rot, [0, -35, -120, -180], [0, 0.4, 0.22, 0]);  // shadow sweeping the page beneath
  const fadeAway = useTransform(rot, [-55, -100], [1, 0]);                         // phones: the single page turns away

  // After a turn commits, snap the leaf back before paint — its front now equals the page beneath.
  useLayoutEffect(() => { rot.set(0); }, [right, rot]);

  const turn = useCallback(() => {
    if (turning || count < 2) return;
    if (still) { setLeft(right); setRight(next); return; }
    setTurning(true);
    animate(rot, wide ? -180 : -100, {
      duration: wide ? 0.75 : 0.55,
      ease: TURN_EASE,
      onComplete: () => { setLeft(right); setRight(next); setTurning(false); },
    });
  }, [turning, count, still, right, next, rot, wide]);

  const turnRef = useRef(turn);
  useEffect(() => { turnRef.current = turn; }, [turn]);
  useEffect(() => {
    if (paused || count < 2) return undefined;
    const id = setInterval(() => turnRef.current(), TURN_EVERY_MS);
    return () => clearInterval(id);
  }, [paused, count]);

  const jumpTo = (i) => {
    if (turning || i === right) return;
    setRight(i);
    setLeft(i === 0 ? -1 : i - 1);
  };

  const current = products[right] || products[0];
  const upcoming = products[next] || products[0];
  const beneath = turning ? upcoming : current; // revealed under the leaf while it turns

  return (
    <div
      className="relative mx-auto w-full max-w-[560px] select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >

      {/* flying bee on a dotted loop */}
      <svg aria-hidden="true" viewBox="0 0 560 90" className="pointer-events-none absolute -top-12 left-0 w-full h-[90px] overflow-visible">
        <path d="M20 70 C120 10 220 10 300 45 S470 85 540 22" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="1.6" strokeDasharray="2 7" fill="none" strokeLinecap="round" />
      </svg>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -top-[3.6rem] left-0 z-30 w-11 sm:w-12"
        animate={still ? undefined : { x: ['0%', '480%', '880%', '480%', '0%'], y: [30, -6, 22, 42, 30], rotate: [-10, 6, -4, 10, -10], scaleX: [-1, -1, -1, 1, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', times: [0, 0.3, 0.5, 0.75, 1] }}
        style={{ x: '0%', y: 30 }}
      >
        <EngravedBee className="w-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]" flap={!still} />
      </motion.div>

      {/* ── the book ── */}
      <div className="relative" style={{ perspective: 2200 }}>
        {/* page-stack edges (book thickness) */}
        <span aria-hidden="true" className="absolute top-1.5 bottom-1.5 -right-[5px] w-[5px] rounded-r-[6px] bg-[repeating-linear-gradient(90deg,#EFE5D2_0px,#EFE5D2_1px,#D9CBB0_1px,#D9CBB0_2px)] shadow-[2px_6px_12px_-6px_rgba(0,0,0,0.5)]" />
        <span aria-hidden="true" className="hidden sm:block absolute top-1.5 bottom-1.5 -left-[5px] w-[5px] rounded-l-[6px] bg-[repeating-linear-gradient(90deg,#D9CBB0_0px,#D9CBB0_1px,#EFE5D2_1px,#EFE5D2_2px)] shadow-[-2px_6px_12px_-6px_rgba(0,0,0,0.5)]" />

        <div
          className={`relative grid grid-cols-1 sm:grid-cols-2 min-h-[260px] sm:min-h-[290px] rounded-[16px] ${PAPER} shadow-[0_40px_80px_-30px_rgba(0,0,0,0.65)] ring-1 ring-black/10`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* left page: the cover, then the notes of the last turned leaf */}
          <div className="relative hidden sm:block">
            {left === -1 ? <CoverPage categories={categories} count={count} /> : <NotesPage product={products[left] || products[0]} />}
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/[0.12] to-transparent" />
          </div>

          {/* right page beneath the leaf */}
          <div className="relative">
            <ProductPage product={still ? current : beneath} n={(still ? right : (turning ? next : right)) + 1} count={count} />
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/[0.12] to-transparent" />
            {/* shadow cast by the turning leaf */}
            <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" style={{ opacity: castShadow }} />
          </div>

          {/* the leaf: front = product, back = notes */}
          {!still && (
            <motion.div
              className="absolute inset-y-0 right-0 w-full sm:w-1/2 z-20"
              style={{ rotateY: rot, z: lift, transformStyle: 'preserve-3d', transformOrigin: 'left center', opacity: wide ? 1 : fadeAway }}
            >
              {/* front */}
              <div className={`absolute inset-0 ${PAPER} rounded-[16px] sm:rounded-l-none overflow-hidden`} style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                <ProductPage product={current} n={right + 1} count={count} />
                <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/[0.12] to-transparent" />
                <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-l from-black/55 via-black/15 to-transparent" style={{ opacity: frontShade }} />
                {/* folded corner — click to turn */}
                <button type="button" onClick={turn} aria-label="Turn the page" className="group/corner absolute bottom-0 right-0 h-12 w-12">
                  <span className="absolute bottom-0 right-0 h-7 w-7 bg-gradient-to-tl from-[#D8C7A6] via-[#F1E6D2] to-white shadow-[-4px_-4px_10px_-4px_rgba(0,0,0,0.45)] [clip-path:polygon(0_100%,100%_0,0_0)] transition-all duration-300 ease-soft group-hover/corner:h-10 group-hover/corner:w-10" />
                </button>
              </div>
              {/* back */}
              <div className={`absolute inset-0 ${PAPER} rounded-l-[16px] overflow-hidden`} style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                <NotesPage product={current} />
                <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/[0.12] to-transparent" />
                <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent" style={{ opacity: backShade }} />
              </div>
            </motion.div>
          )}

          {/* spine */}
          <span aria-hidden="true" className="hidden sm:block pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-black/10 z-10" />
        </div>
      </div>

      {/* page dots */}
      {count > 1 && (
        <div className="mt-1 flex flex-wrap items-center justify-center" role="tablist" aria-label="Catalogue pages">
          {products.slice(0, 12).map((p, i) => (
            <button
              key={keyOf(p)}
              type="button"
              role="tab"
              aria-selected={i === right}
              aria-label={`Show ${nameOf(p)}`}
              onClick={() => jumpTo(i)}
              className="h-8 min-w-[22px] px-[5px] flex items-center justify-center"
            >
              <span className={`block h-1.5 rounded-full transition-all duration-500 ${i === right ? 'w-6 bg-white' : 'w-1.5 bg-white/45 hover:bg-white/75'}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
