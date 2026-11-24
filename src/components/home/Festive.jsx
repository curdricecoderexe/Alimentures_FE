import { useEffect, useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '../ui/motion';

/*
 * Christmas touches for the home page (switched by src/data/seasonal.js):
 *   <Snowfall />          soft canvas snow, sized to its parent
 *   <HangingOrnaments />  glossy baubles + a star on gold threads (hero)
 *   <ChristmasBand />     mulberry greeting panel with an illustrated scene
 * Modern flat illustrations with soft gradients, drawn only in the brand
 * palette (tailwind.config.js). Decorative (aria-hidden); still under
 * "reduce motion".
 */

const C = {
  berry: '#B0128F', berryBright: '#D4148F', berryDeep: '#6A1A8A',
  mulberry: '#7C276E', mulberryDeep: '#5F1C54',
  gold: '#C7801A', goldLight: '#F8A830', goldTint: '#FEF3E0',
  paper: '#FFFDF9', cream: '#F7F0E3', creamDeep: '#EBDDC3', cocoa: '#5C3410',
};

/* ── Illustrations ─────────────────────────────────────────────────── */

/** Glossy bauble. tone: 'berry' | 'gold' | 'plum'. */
export function Bauble({ className = '', tone = 'berry', style }) {
  const id = useId().replace(/:/g, '');
  const [a, b] = tone === 'gold' ? [C.goldLight, C.gold] : tone === 'plum' ? [C.mulberry, C.berryDeep] : [C.berryBright, C.berryDeep];
  const band = tone === 'gold' ? C.berry : C.goldLight;
  return (
    <svg viewBox="0 0 60 74" className={className} style={style} aria-hidden="true">
      <defs>
        <radialGradient id={`b${id}`} cx="35%" cy="32%" r="75%">
          <stop offset="0%" stopColor={a} />
          <stop offset="100%" stopColor={b} />
        </radialGradient>
        <linearGradient id={`c${id}`} x1="0" x2="1">
          <stop offset="0%" stopColor={C.gold} /><stop offset="50%" stopColor={C.goldLight} /><stop offset="100%" stopColor={C.gold} />
        </linearGradient>
      </defs>
      <circle cx="30" cy="10" r="4.5" fill="none" stroke={C.goldLight} strokeWidth="1.6" />
      <rect x="23" y="13" width="14" height="8" rx="2" fill={`url(#c${id})`} />
      <circle cx="30" cy="46" r="26" fill={`url(#b${id})`} />
      <path d="M5.5 42c8 5 41 5 49 0v8c-8 5-41 5-49 0z" fill={band} opacity="0.9" />
      {[12, 21, 30, 39, 48].map((x) => <circle key={x} cx={x} cy="46" r="1.6" fill={C.paper} opacity="0.9" />)}
      <ellipse cx="20" cy="33" rx="7" ry="4.5" fill={C.paper} opacity="0.35" transform="rotate(-30 20 33)" />
      <circle cx="16" cy="38" r="1.8" fill={C.paper} opacity="0.55" />
    </svg>
  );
}

export function Star({ className = '', style, glow = true }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden="true">
      <defs>
        <radialGradient id={`g${id}`}><stop offset="0%" stopColor={C.goldLight} stopOpacity="0.55" /><stop offset="100%" stopColor={C.goldLight} stopOpacity="0" /></radialGradient>
        <linearGradient id={`s${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={C.goldTint} /><stop offset="45%" stopColor={C.goldLight} /><stop offset="100%" stopColor={C.gold} /></linearGradient>
      </defs>
      {glow && <circle cx="32" cy="33" r="30" fill={`url(#g${id})`} />}
      <path d="M32 8l6.6 14.4 15.7 1.7-11.7 10.6 3.3 15.5L32 42.4l-13.9 7.8 3.3-15.5L9.7 24.1l15.7-1.7z" fill={`url(#s${id})`} />
      <path d="M32 8l6.6 14.4L32 32z" fill={C.paper} opacity="0.35" />
    </svg>
  );
}

/** Four-point twinkle. */
export function Sparkle({ className = '', color = C.goldLight, style }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden="true">
      <path d="M12 0c.7 6.4 5.6 11.3 12 12-6.4.7-11.3 5.6-12 12-.7-6.4-5.6-11.3-12-12C6.4 11.3 11.3 6.4 12 0z" fill={color} />
    </svg>
  );
}

/** Modern cream tree with gold garland, baubles and a glowing star. */
export function ChristmasTree({ className = '' }) {
  const id = useId().replace(/:/g, '');
  const tiers = [
    'M100 44 L64 98 Q100 106 136 98 Z',
    'M100 74 L50 142 Q100 152 150 142 Z',
    'M100 108 L34 194 Q100 206 166 194 Z',
  ];
  const ornaments = [
    [86, 90, C.berry], [114, 92, C.goldLight], [72, 132, C.goldLight], [104, 138, C.berry], [130, 130, C.mulberry],
    [58, 182, C.berry], [88, 188, C.mulberry], [120, 186, C.goldLight], [146, 180, C.berry],
  ];
  return (
    <svg viewBox="0 0 200 250" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`t${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={C.paper} /><stop offset="100%" stopColor={C.creamDeep} />
        </linearGradient>
        <linearGradient id={`k${id}`} x1="0" x2="1"><stop offset="0%" stopColor={C.cocoa} /><stop offset="100%" stopColor={C.gold} /></linearGradient>
        <linearGradient id={`s${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={C.goldTint} /><stop offset="45%" stopColor={C.goldLight} /><stop offset="100%" stopColor={C.gold} /></linearGradient>
        <radialGradient id={`h${id}`}><stop offset="0%" stopColor={C.goldLight} stopOpacity="0.6" /><stop offset="100%" stopColor={C.goldLight} stopOpacity="0" /></radialGradient>
        <clipPath id={`r${id}`}><rect x="100" y="0" width="100" height="250" /></clipPath>
      </defs>
      <rect x="90" y="196" width="20" height="26" rx="3" fill={`url(#k${id})`} />
      <ellipse cx="100" cy="226" rx="62" ry="7" fill={C.goldLight} opacity="0.18" />
      {tiers.map((d, i) => (
        <g key={i}>
          <path d={d} fill={`url(#t${id})`} />
          <path d={d} fill={C.creamDeep} opacity="0.6" clipPath={`url(#r${id})`} />
        </g>
      ))}
      {/* garland */}
      <path d="M70 100 Q100 116 132 98" fill="none" stroke={C.goldLight} strokeWidth="2" strokeLinecap="round" />
      <path d="M56 140 Q100 162 146 138" fill="none" stroke={C.goldLight} strokeWidth="2" strokeLinecap="round" />
      <path d="M42 190 Q100 214 160 188" fill="none" stroke={C.goldLight} strokeWidth="2" strokeLinecap="round" />
      {ornaments.map(([x, y, fill]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="5.2" fill={fill} />
          <circle cx={x - 1.6} cy={y - 1.8} r="1.6" fill={C.paper} opacity="0.6" />
        </g>
      ))}
      {/* star topper with glow */}
      <circle cx="100" cy="30" r="26" fill={`url(#h${id})`} />
      <path d="M100 10l5.6 12.2 13.3 1.5-9.9 9 2.8 13.1L100 39.2l-11.8 6.6 2.8-13.1-9.9-9 13.3-1.5z" fill={`url(#s${id})`} />
      <path d="M100 10l5.6 12.2L100 30z" fill={C.paper} opacity="0.4" />
    </svg>
  );
}

/** Stack of three wrapped gifts. */
export function GiftStack({ className = '' }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 170 150" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`a${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={C.berryBright} /><stop offset="100%" stopColor={C.berryDeep} /></linearGradient>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={C.goldLight} /><stop offset="100%" stopColor={C.gold} /></linearGradient>
        <linearGradient id={`c${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={C.paper} /><stop offset="100%" stopColor={C.creamDeep} /></linearGradient>
      </defs>
      <ellipse cx="85" cy="143" rx="78" ry="6" fill="#000" opacity="0.18" />
      {/* large berry box */}
      <rect x="10" y="78" width="96" height="62" rx="5" fill={`url(#a${id})`} />
      <rect x="6" y="70" width="104" height="16" rx="4" fill={C.berry} />
      <rect x="52" y="70" width="12" height="70" fill={C.goldLight} />
      {/* gold box */}
      <rect x="98" y="92" width="62" height="48" rx="5" fill={`url(#b${id})`} />
      <rect x="95" y="86" width="68" height="12" rx="3" fill={C.gold} />
      <rect x="124" y="86" width="9" height="54" fill={C.berryBright} />
      <path d="M128.5 86c-5-11-19-12-19-4 0 5 10 5 19 4zM128.5 86c5-11 19-12 19-4 0 5-10 5-19 4z" fill={C.berryBright} />
      {/* small cream box on top */}
      <rect x="30" y="36" width="52" height="36" rx="4" fill={`url(#c${id})`} />
      <rect x="27" y="30" width="58" height="10" rx="3" fill={C.cream} />
      <rect x="52" y="30" width="8" height="42" fill={C.berry} />
      <path d="M56 30c-5-10-17-11-17-4 0 4 9 5 17 4zM56 30c5-10 17-11 17-4 0 4-9 5-17 4z" fill={C.berry} />
      <rect x="14" y="80" width="40" height="3" rx="1.5" fill={C.paper} opacity="0.25" />
    </svg>
  );
}

/* ── Snowfall ──────────────────────────────────────────────────────── */

/** Soft snow drawn on a canvas that fills its (positioned) parent. Pauses off-screen and in background tabs. */
export function Snowfall({ density = 1, className = '' }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return undefined;
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return undefined;

    let w = 0;
    let h = 0;
    let flakes = [];
    let raf = 0;
    let visible = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const make = (anywhere) => {
      const r = 0.6 + Math.random() ** 2.2 * 2.6; // mostly fine flakes, a few larger
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : -10,
        r,
        vy: 0.25 + r * 0.32,
        sway: 0.4 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
        a: 0.35 + Math.random() * 0.55,
      };
    };

    const resize = () => {
      const box = canvas.parentElement.getBoundingClientRect();
      w = box.width;
      h = box.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.min(160, Math.round(((w * h) / 9000) * density));
      flakes = Array.from({ length: target }, () => make(true));
    };

    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(48, now - last) / 16.67;
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        f.phase += 0.012 * dt;
        f.y += f.vy * dt;
        f.x += Math.sin(f.phase) * f.sway * 0.35 * dt + 0.08 * dt;
        if (f.y > h + 6 || f.x > w + 6) Object.assign(f, make(false), { x: Math.random() * w });
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 1.8);
        g.addColorStop(0, `rgba(255,253,249,${f.a})`);
        g.addColorStop(1, 'rgba(255,253,249,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(tick); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };

    resize();
    start();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) start(); else stop(); });
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [density, reduce]);

  if (reduce) return null;
  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`} />;
}

/* ── Twinkles ──────────────────────────────────────────────────────── */

function Twinkle({ className, size = 14, delay = 0, color }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      aria-hidden="true"
      className={`pointer-events-none absolute ${className}`}
      animate={reduce ? undefined : { opacity: [0.25, 1, 0.25], scale: [0.7, 1, 0.7], rotate: [0, 45, 0] }}
      transition={{ duration: 3.2, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Sparkle color={color} style={{ width: size, height: size }} />
    </motion.span>
  );
}

/* ── Hanging ornaments (hero, wide screens) ────────────────────────── */

const ORNAMENTS = [
  // kept clear of the floating nav pills (logo pill left, account pill right)
  { right: '22%', len: 130, size: 50, delay: 0, kind: 'berry' },
  { right: '28%', len: 190, size: 46, delay: 0.6, kind: 'star' },
  { right: '34%', len: 104, size: 42, delay: 1.1, kind: 'gold' },
];

export function HangingOrnaments() {
  const reduce = useReducedMotion();
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 hidden xl:block z-[2]">
      {ORNAMENTS.map((o) => (
        <motion.div
          key={o.right}
          className="absolute top-0 flex flex-col items-center origin-top"
          style={{ right: o.right }}
          initial={{ y: reduce ? 0 : -o.len - 80 }}
          animate={reduce ? { y: 0 } : { y: 0, rotate: [-3, 3, -3] }}
          transition={{
            y: { duration: 1.4, delay: 0.4 + o.delay * 0.4, ease: [0.16, 1, 0.3, 1] },
            rotate: { duration: 5 + o.delay, repeat: Infinity, ease: 'easeInOut', delay: 1.8 },
          }}
        >
          <span className="block w-px bg-gradient-to-b from-gold-light/0 via-gold-light/80 to-gold-light" style={{ height: o.len }} />
          <span className="block -mt-1 drop-shadow-[0_14px_18px_rgba(0,0,0,0.45)]">
            {o.kind === 'star'
              ? <Star style={{ width: o.size, height: o.size }} />
              : <Bauble tone={o.kind} style={{ width: o.size, height: o.size * 1.23 }} />}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Greeting band ─────────────────────────────────────────────────── */

function seasonLine(now = new Date()) {
  const y = now.getFullYear();
  const xmas = new Date(y, 11, 25);
  const day = 24 * 60 * 60 * 1000;
  const today = new Date(y, now.getMonth(), now.getDate());
  const left = Math.round((xmas - today) / day);
  if (left > 1) return `${left} days to Christmas`;
  if (left === 1) return 'Christmas is tomorrow';
  if (left === 0) return 'Merry Christmas';
  return now.getMonth() === 0 || now.getDate() >= 31 ? 'Happy New Year' : 'Season’s greetings';
}

export function ChristmasBand({ to = '/shop', cta = 'Shop Christmas gifts' }) {
  const reduce = useReducedMotion();
  const float = (delay, dist = 6) => (reduce ? {} : {
    animate: { y: [0, -dist, 0] },
    transition: { duration: 4.5, delay, repeat: Infinity, ease: 'easeInOut' },
  });

  return (
    <section aria-label="Christmas at Alimenture" className="relative z-10 px-2 sm:px-3 pt-3 sm:pt-4 font-sans">
      <Reveal
        className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] bg-mulberry-deep text-paper isolate"
        style={{ backgroundImage: 'radial-gradient(90% 120% at 100% 100%, rgba(248,168,48,0.22) 0%, transparent 55%), radial-gradient(110% 90% at 0% 0%, #7C276E 0%, transparent 62%)' }}
      >
        <Snowfall density={0.55} className="-z-10" />
        <Twinkle className="left-[8%] top-[14%]" size={12} delay={0.2} />
        <Twinkle className="left-[44%] top-[10%]" size={9} delay={1.4} color={C.paper} />
        <Twinkle className="right-[6%] top-[18%]" size={16} delay={0.8} />
        <Twinkle className="right-[40%] bottom-[16%]" size={10} delay={2} color={C.paper} />

        <div className="relative mx-auto max-w-[1240px] grid md:grid-cols-[1.15fr_1fr] items-center gap-6 px-6 sm:px-10 lg:px-14">
          {/* copy */}
          <div className="py-10 sm:py-14 md:py-16">
            <span className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full border border-gold-light/40 bg-paper/[0.06] text-[11px] font-display uppercase tracking-[0.18em] text-gold-light">
              <Sparkle style={{ width: 10, height: 10 }} /> {seasonLine()}
            </span>
            <h2 className="headline text-paper mt-5 text-[2.1rem] sm:text-5xl lg:text-[3.4rem] leading-[1.04]">
              A wholesome Christmas, <em className="!text-gold-light">gift-wrapped.</em>
            </h2>
            <p className="mt-4 text-[15px] sm:text-base text-paper/75 leading-relaxed max-w-md">
              Festive hampers and millet treats, hand-packed in Chennai — the thoughtful way to say Merry Christmas.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link to={to} className="btn-light">{cta} <ArrowRight className="h-4 w-4" strokeWidth={1.75} /></Link>
              <Link to="/shop" className="link-arrow link-arrow-light">Shop all treats</Link>
            </div>
          </div>

          {/* illustrated scene */}
          <div className="relative h-[230px] sm:h-[300px] md:h-[360px] -mx-2 md:mx-0">
            <div className="absolute left-1/2 bottom-3 -translate-x-1/2 h-10 w-[85%] rounded-[50%] bg-gold-light/20 blur-xl" aria-hidden="true" />
            <ChristmasTree className="absolute right-[6%] sm:right-[10%] bottom-0 h-[96%] w-auto drop-shadow-[0_24px_30px_rgba(0,0,0,0.35)]" />
            <motion.div className="absolute left-[2%] sm:left-[6%] bottom-0 w-[46%] max-w-[230px]" {...float(0.3, 3)}>
              <GiftStack className="w-full h-auto drop-shadow-[0_18px_24px_rgba(0,0,0,0.35)]" />
            </motion.div>
            {/* hanging baubles */}
            {[
              { left: '18%', len: 46, size: 34, tone: 'gold', d: 0 },
              { left: '36%', len: 78, size: 40, tone: 'berry', d: 0.7 },
            ].map((b) => (
              <motion.div
                key={b.left}
                aria-hidden="true"
                className="absolute top-0 flex flex-col items-center origin-top"
                style={{ left: b.left }}
                animate={reduce ? undefined : { rotate: [-4, 4, -4] }}
                transition={{ duration: 4.8 + b.d, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="block w-px bg-gold-light/70" style={{ height: b.len }} />
                <Bauble tone={b.tone} style={{ width: b.size, height: b.size * 1.23 }} className="-mt-1 drop-shadow-[0_10px_14px_rgba(0,0,0,0.4)]" />
              </motion.div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
