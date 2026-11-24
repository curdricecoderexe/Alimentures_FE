import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Check, Copy, X, ArrowRight } from 'lucide-react';

/*
 * Welcome-offer pieces shared by the first-login popup and checkout:
 *   <Confetti/>      – one brand-coloured burst from the centre
 *   <CountUp/>       – number that counts up on mount
 *   <CouponTicket/>  – notched ticket with a slow shimmer
 *   <GiftBox/>       – illustrated gift whose lid pops open
 *   <WelcomeOfferModal/>
 */

const COLORS = ['#F8A830', '#C7801A', '#B0128F', '#7C276E', '#FFFDF9', '#F7EDF6'];

// Deterministic "random" so renders stay pure.
const rand = (i, salt) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export function Confetti({ count = 34, spread = 190, className = '' }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 flex items-center justify-center ${className}`}>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + rand(i, 1) * 0.5;
        const dist = spread * (0.45 + rand(i, 2) * 0.55);
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist * 0.75;
        const size = 5 + rand(i, 3) * 6;
        const round = rand(i, 4) > 0.55;
        return (
          <motion.span
            key={i}
            className="absolute block"
            style={{ width: size, height: round ? size : size * 0.45, borderRadius: round ? 999 : 2, background: COLORS[i % COLORS.length] }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4, rotate: 0 }}
            animate={{ x, y: [0, y, y + 60], opacity: [0, 1, 1, 0], scale: 1, rotate: rand(i, 5) * 540 - 270 }}
            transition={{ duration: 1.5 + rand(i, 6) * 0.6, delay: 0.25 + rand(i, 7) * 0.15, ease: [0.16, 1, 0.3, 1], times: [0, 0.15, 0.7, 1] }}
          />
        );
      })}
    </div>
  );
}

export function CountUp({ to, delay = 0.3, duration = 1.1, className = '' }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(reduce ? to : 0);
  const rounded = useTransform(mv, (v) => Math.round(v));
  useEffect(() => {
    if (reduce) { mv.set(to); return undefined; }
    const c = animate(mv, to, { duration, delay, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [to, delay, duration, reduce, mv]);
  return <motion.span className={className}>{rounded}</motion.span>;
}

/** Notched coupon ticket. `notch` = colour of the surface it sits on. */
export function CouponTicket({ children, notch = '#FFFDF9', className = '', shimmer = true }) {
  const reduce = useReducedMotion();
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-dashed border-gold/50 bg-gold-tint ${className}`}>
      <span aria-hidden="true" className="absolute left-0 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-gold/50" style={{ background: notch }} />
      <span aria-hidden="true" className="absolute right-0 top-1/2 h-5 w-5 translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-gold/50" style={{ background: notch }} />
      {shimmer && !reduce && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-[-20deg]"
          animate={{ x: ['0%', '420%'] }}
          transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.4, ease: 'easeInOut', delay: 1 }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

export function GiftBox({ className = '' }) {
  const reduce = useReducedMotion();
  const pop = reduce ? {} : {
    initial: { y: 0, rotate: 0 },
    animate: { y: [0, -26, -18], rotate: [0, -10, -6] },
    transition: { duration: 0.7, delay: 0.35, ease: [0.34, 1.56, 0.64, 1] },
  };
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="wo-box" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B0128F" />
          <stop offset="1" stopColor="#7C276E" />
        </linearGradient>
        <linearGradient id="wo-lid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C21A9C" />
          <stop offset="1" stopColor="#9A1680" />
        </linearGradient>
        <radialGradient id="wo-glow">
          <stop offset="0" stopColor="#F8A830" stopOpacity="0.85" />
          <stop offset="1" stopColor="#F8A830" stopOpacity="0" />
        </radialGradient>
      </defs>
      <motion.circle cx="60" cy="58" r="40" fill="url(#wo-glow)"
        initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.45 }} style={{ transformOrigin: '60px 58px' }} />
      {/* box */}
      <rect x="26" y="58" width="68" height="46" rx="5" fill="url(#wo-box)" />
      <rect x="55" y="58" width="10" height="46" fill="#F8A830" />
      <rect x="26" y="58" width="68" height="6" fill="#000" opacity="0.12" />
      {/* lid + bow */}
      <motion.g {...pop} style={{ transformOrigin: '30px 56px' }}>
        <rect x="21" y="44" width="78" height="16" rx="4" fill="url(#wo-lid)" />
        <rect x="55" y="44" width="10" height="16" fill="#F8A830" />
        <path d="M60 44 C48 30 34 34 40 42 C44 47 54 45 60 44 Z" fill="#F8A830" />
        <path d="M60 44 C72 30 86 34 80 42 C76 47 66 45 60 44 Z" fill="#E09422" />
        <circle cx="60" cy="44" r="4" fill="#C7801A" />
      </motion.g>
    </svg>
  );
}

/* ── First-login popup ─────────────────────────────────────────────── */

const seenKey = (code) => `alim_welcome_seen_${code}`;
const hasSeenWelcome = (code) => { try { return localStorage.getItem(seenKey(code)) === '1'; } catch { return false; } };
const markSeen = (code) => { try { localStorage.setItem(seenKey(code), '1'); } catch { /* private mode */ } };

export function WelcomeOfferModal({ coupon, onClose }) {
  const [copied, setCopied] = useState(false);
  const pct = Number(coupon.discountValue) || 10;

  const close = () => { markSeen(coupon.code); onClose(); };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copy = async () => {
    try { await navigator.clipboard.writeText(coupon.code); } catch { /* clipboard blocked */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center sm:p-4 font-sans"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      role="dialog" data-own-style="" aria-modal="true" aria-labelledby="welcome-offer-title"
    >
      <div className="absolute inset-0 bg-night/55 backdrop-blur-sm" onClick={close} />

      <motion.div
        className="relative w-full sm:max-w-[420px] overflow-hidden rounded-t-[28px] sm:rounded-[28px] bg-paper shadow-[0_40px_100px_-30px_rgba(43,11,51,0.7)]"
        initial={{ y: 60, scale: 0.94, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 40, scale: 0.97, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        {/* hero */}
        <div
          className="relative h-[190px] sm:h-[200px] overflow-hidden bg-mulberry-deep"
          style={{ backgroundImage: 'radial-gradient(70% 90% at 50% 100%, rgba(248,168,48,0.35) 0%, transparent 65%), radial-gradient(90% 120% at 0% 0%, #7C276E 0%, transparent 60%)' }}
        >
          <Confetti spread={200} />
          <GiftBox className="absolute left-1/2 bottom-2 h-[150px] w-[150px] -translate-x-1/2" />
          <button type="button" onClick={close} aria-label="Close" className="absolute right-3 top-3 h-9 w-9 rounded-full bg-paper/10 text-paper/80 hover:bg-paper/20 hover:text-paper flex items-center justify-center transition-colors">
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* copy */}
        <div className="px-6 sm:px-7 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-7 text-center">
          <motion.p
            className="text-[12px] uppercase tracking-[0.18em] text-gold font-display"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          >
            A welcome gift for you
          </motion.p>
          <motion.h2
            id="welcome-offer-title"
            className="headline mt-2 text-[2rem] sm:text-[2.25rem] leading-[1.05]"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          >
            <CountUp to={pct} delay={0.7} />% off <em>your first order</em>
          </motion.h2>
          <motion.p
            className="mt-2.5 text-[14px] text-ink-soft leading-relaxed"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}
          >
            Thanks for joining Alimenture. Your code is saved to your account and suggested automatically at checkout.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, type: 'spring', stiffness: 260, damping: 24 }}>
            <CouponTicket className="mt-5 px-5 py-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-left min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Your code</p>
                  <p className="font-display text-[19px] font-semibold tracking-[0.08em] text-mulberry-deep truncate">{coupon.code}</p>
                </div>
                <button
                  type="button"
                  onClick={copy}
                  className={`h-9 shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors ${copied ? 'bg-leaf text-paper' : 'bg-paper text-mulberry border border-mulberry/25 hover:border-mulberry/50'}`}
                >
                  {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                </button>
              </div>
            </CouponTicket>
          </motion.div>

          <motion.div className="mt-5 flex flex-col gap-2.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.05 }}>
            <Link to="/shop" onClick={close} className="h-12 rounded-full bg-mulberry hover:bg-mulberry-deep text-paper font-display font-medium text-[15px] inline-flex items-center justify-center gap-2 transition-colors">
              Start shopping <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </Link>
            <button type="button" onClick={close} className="h-10 text-[13px] text-ink-muted hover:text-ink transition-colors">Maybe later</button>
          </motion.div>
          <p className="mt-1 text-[11.5px] text-ink-muted">One-time use · applies to your first order</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Mounted once in the storefront layout: shows the popup the first time a new customer is signed in. */
export function WelcomeOfferGate({ pathname, fetchCoupon }) {
  const [coupon, setCoupon] = useState(null);
  const [open, setOpen] = useState(false);
  const checkedFor = useRef(null); // token already checked — one request per sign-in

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const blocked = /^\/(checkout|login|register|forgot-password|reset-password)/.test(pathname);

  useEffect(() => {
    if (!token || blocked || checkedFor.current === token) return undefined;
    let alive = true;
    let timer;
    fetchCoupon().then((c) => {
      if (!alive) return;
      checkedFor.current = token;
      if (c?.code && !hasSeenWelcome(c.code)) {
        setCoupon(c);
        timer = setTimeout(() => { if (alive) setOpen(true); }, 900);
      }
    });
    return () => { alive = false; clearTimeout(timer); };
  }, [token, blocked, fetchCoupon]);

  return (
    <AnimatePresence>
      {open && coupon && !blocked && <WelcomeOfferModal key="welcome" coupon={coupon} onClose={() => setOpen(false)} />}
    </AnimatePresence>
  );
}
