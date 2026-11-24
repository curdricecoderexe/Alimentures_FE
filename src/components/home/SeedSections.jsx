import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { Reveal } from '../ui/motion';
import { categoryPath, displayName } from '../../lib/seo';
import { IconGrains, IconNoMaida, IconNoSugar, IconCertified } from './BenefitIcons';
import { useHomeVideo } from '../../lib/homeVideo';
import craftBgDefault from '../../assets/bf.webp';
import craftCookieImg from '../../assets/fav/penta_bite.webp';

/*
 * Seed.com-inspired landing sections (see designs.md → "Section patterns").
 * Pure presentation: every fact shown here is already stated elsewhere on the site.
 */

/* ── Benefit band ────────────────────────────────────────────────────
   Seed pattern: "DS-01® benefits you can feel in as little as 7 days" —
   headline left, four small rounded tiles right. Illustrated in the
   engraved botanical style of the Alimenture catalogue (BotanicalArt.jsx). */
const BENEFITS = [
  { Icon: IconGrains, tone: 'plum', label: '10 grains', title: 'Heritage millets & native rice' },
  { Icon: IconNoMaida, tone: 'gold', label: '0% maida', title: 'Whole grains, never refined flour' },
  { Icon: IconNoSugar, tone: 'plum', label: '0% white sugar', title: 'Sweetened with country sugar' },
  { Icon: IconCertified, tone: 'gold', label: 'FSSAI', title: 'Registered kitchen in Chennai' },
];

/* Quiet tinted badge — soft brand tint, hairline border, icon in brand colour. */
const BADGE_TONES = {
  plum: 'bg-berry-tint/70 text-berry border-berry/15',
  gold: 'bg-gold-tint text-gold border-gold/20',
};

export function BenefitBand() {
  return (
    <section className="relative z-10 overflow-hidden bg-cream font-sans">

      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 pt-14 pb-24 sm:py-20 lg:py-24 grid xl:grid-cols-12 gap-6 sm:gap-8 xl:gap-10 items-center">
        {/* heading stacks above the tiles until xl, so it never gets squeezed into a narrow column */}
        <Reveal className="xl:col-span-4 xl:pl-10 2xl:pl-32">
          <h2 className="headline text-[1.6rem] leading-[1.15] sm:text-[2rem] lg:text-[2.1rem] max-w-[22rem] lg:max-w-[30rem] xl:max-w-[22rem]">
            Alimenture bakes you can feel good about, <em>from the first bite.</em>
          </h2>
        </Reveal>

        {/* Seed: four small rounded tiles — art, small label, medium title.
            Phones: 2×2 grid; desktop: 4-up. */}
        <ul className="xl:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {BENEFITS.map(({ Icon, tone, label, title }, i) => (
            <Reveal
              as="li"
              key={label}
              delay={i * 0.06}
              className="group flex flex-col rounded-[20px] bg-paper/90 backdrop-blur-sm border border-hairline/70 p-4 sm:p-5 min-h-[11rem] sm:min-h-[12rem] transition-colors duration-300 hover:bg-paper hover:border-hairline"
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-[14px] border transition-colors duration-300 ${BADGE_TONES[tone]}`}>
                <Icon className="h-[26px] w-[26px]" />
              </span>
              <span className="mt-auto pt-5 font-display text-[16px] sm:text-[17px] font-medium tracking-[-0.01em] text-ink">{label}</span>
              <span className="mt-1 text-[13px] sm:text-[14px] leading-snug text-ink-soft">{title}</span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ── Craft spotlight ─────────────────────────────────────────────────
   Seed pattern: "● ViaCap® Technology — Most probiotics don't survive
   digestion". Full-bleed photo, a frosted glass panel with big curves,
   headline + pill + glass stat card on the left, and a product "anatomy"
   on the right with dotted leader lines to labelled layers. */

/**
 * Brand film: autoplays muted on a loop with no visible controls; the only
 * control is a mute / unmute button. Pauses while off-screen. With
 * "reduce motion" on it doesn't autoplay; the same button starts it with sound.
 * Without a film (disabled in admin) the poster image is shown instead.
 */
function CraftFilm({ src, poster }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const [muted, setMuted] = useState(true);
  // The film fades in once its first frame is decoded. No poster image, so the
  // cookie photo never flashes before the video starts.
  const [readySrc, setReadySrc] = useState(null);
  const ready = readySrc === src;

  useEffect(() => {
    const v = ref.current;
    if (!v) return undefined;
    v.muted = true; // React doesn't reflect the `muted` attribute; set it so autoplay is allowed
    if (reduce || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) v.play().catch(() => {});
      else v.pause();
    }, { threshold: 0.25 });
    io.observe(v);
    return () => io.disconnect();
  }, [src, reduce]);

  const toggleSound = () => {
    const v = ref.current;
    if (!v) return;
    const next = !v.muted;
    v.muted = next;
    setMuted(next);
    if (!next && v.paused) v.play().catch(() => {});
  };

  return (
    <div className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] ring-1 ring-white/20 bg-night shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)] aspect-video">
      {src ? (
        <video
          ref={ref}
          key={src}
          src={src}
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={() => setReadySrc(src)}
          onPlaying={() => setReadySrc(src)}
          disablePictureInPicture
          controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
          aria-label="Alimenture brand film: how our millet bakes are made"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}
        />
      ) : (
        <img src={poster} alt="Alimenture millet cookies" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      )}

      {/* soft vignette so the button always reads */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

      {src && (
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={!muted}
          aria-label={muted ? 'Unmute video' : 'Mute video'}
          className="group/sound absolute bottom-4 right-4 sm:bottom-5 sm:right-5 inline-flex items-center gap-2 h-11 rounded-full bg-white/15 backdrop-blur-md ring-1 ring-white/35 pl-3 pr-4 text-white text-[13px] font-medium transition-colors hover:bg-white/25"
        >
          {muted ? <VolumeX className="h-[18px] w-[18px]" /> : <Volume2 className="h-[18px] w-[18px]" />}
          <span>{muted ? 'Sound on' : 'Mute'}</span>
          {!muted && (
            <span aria-hidden="true" className="flex items-end gap-[2px] h-3 ml-0.5">
              {[0, 1, 2].map((b) => (
                <span key={b} className="w-[2px] rounded-full bg-gold-light motion-safe:animate-[soundbar_0.9s_ease-in-out_infinite]" style={{ height: '100%', transformOrigin: 'bottom', animationDelay: `${b * 0.15}s` }} />
              ))}
            </span>
          )}
        </button>
      )}
    </div>
  );
}

export function CraftSpotlight({ bgImage, productImage }) {
  const film = useHomeVideo();
  const bg = bgImage || craftBgDefault;
  const product = productImage || craftCookieImg;
  return (
    <section className="relative z-10 overflow-hidden font-sans">
      {/* full-bleed photo with a slow drift (Seed uses a looping video here) */}
      <div aria-hidden="true" className="absolute inset-0">
        <img src={bg} alt="" className="h-full w-full object-cover motion-safe:animate-ken-burns" loading="lazy" decoding="async" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(0,0,0,0.28),rgba(0,0,0,0.10))]" />
      </div>

      <div className="relative mx-auto max-w-[1440px] px-3 sm:px-6 lg:px-8 py-10 sm:py-20">
        <Reveal className="liquid-glass relative overflow-hidden rounded-[28px] sm:rounded-hero text-white">
          {/* specular sheen + edge light — the "liquid" part of the glass */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_15%_0%,rgba(255,255,255,0.22)_0%,transparent_45%)]" />

          <div className="relative grid lg:grid-cols-12 gap-10 lg:gap-6 items-center px-6 sm:px-12 lg:px-16 py-10 sm:py-16 lg:py-20">
            {/* left: statement */}
            <div className="lg:col-span-5 flex flex-col items-start gap-6 sm:gap-8">
              <h2 className="headline headline-on-dark text-[2.2rem] sm:text-5xl lg:text-[3.6rem] [&_em]:[background:none] [&_em]:text-[#FFE2A8]">
                Most cookies start with maida. <em>Ours start with millets.</em>
              </h2>
              <Link to="/shop" className="btn-light btn-pill-sm">
                Shop cookies <ArrowRight className="h-4 w-4" />
              </Link>

              {/* glass stat card */}
              <div className="mt-2 sm:mt-6 flex items-center gap-6 sm:gap-10 rounded-[22px] bg-white/[0.12] backdrop-blur-md ring-1 ring-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] px-5 sm:px-7 py-4 sm:py-5">
                <p className="text-[14px] sm:text-base leading-snug text-white">
                  <span className="chip-code text-gold-light mr-1.5">Alimenture</span>
                  bakes with <br className="hidden sm:block" />heritage grains
                </p>
                <p className="flex items-center gap-2 font-display text-4xl sm:text-5xl font-light tracking-tight">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-night">
                    <ArrowRight className="h-4 w-4 -rotate-90" />
                  </span>
                  10
                </p>
              </div>
            </div>

            {/* right: brand film in a rounded stage (Seed's animated capsule) */}
            <div className="lg:col-span-7 relative">
              <div className="relative">
                <div aria-hidden="true" className="absolute -inset-8 rounded-[48px] bg-gold-light/20 blur-3xl" />
                <CraftFilm src={film.enabled ? film.src : null} poster={product} />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Shop-by-category rows ───────────────────────────────────────────
   Seed pattern: "Whole-body benefits start here." — a stacked list,
   each row = name + one line + "Shop now →", hairline between.
   Fully data-driven: `rows` = [{ name, items }] built from the live
   catalogue, so every category, count, photo, line and price is real. */
const productLabel = (p) => displayName(p.name || p.title || '');

const fromPriceOf = (items) => {
  const prices = items.flatMap((p) => (
    Array.isArray(p.variants) && p.variants.length ? p.variants.map((v) => Number(v.price)) : [Number(p.price)]
  )).filter((n) => n > 0);
  return prices.length ? Math.min(...prices) : 0;
};

const summaryOf = (items) => {
  // "Red Millets Mate — Premium" + "— Elite" → one "Red Millets Mate"
  const names = [...new Set(items.map((p) => productLabel(p).split(/\s+[—–-]\s+/)[0].trim()).filter(Boolean))];
  if (names.length <= 3) return names.join(', ');
  return `${names.slice(0, 3).join(', ')} & ${names.length - 3} more`;
};

export function CategoryRows({ rows }) {
  if (!rows.length) return null;
  return (
    <section className="relative z-10 overflow-clip bg-cream pt-16 pb-28 sm:py-28 font-sans">

      <div className="relative mx-auto max-w-[1240px] 2xl:max-w-[1400px] px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-10 lg:gap-16">
        <Reveal className="lg:col-span-4 space-y-5 lg:sticky lg:top-28 self-start">
          <h2 className="headline text-4xl sm:text-5xl lg:text-[3.4rem]">
            Daily nourishment <em>starts here.</em>
          </h2>
          <Link to="/shop" className="link-arrow">Shop all <ArrowRight className="h-4 w-4" /></Link>
        </Reveal>

        <ul className="lg:col-span-8 border-t border-ink/10">
          {rows.map(({ name, items }, i) => {
            const thumbs = items.filter((p) => p.image).slice(0, 3);
            const from = fromPriceOf(items);
            return (
              <Reveal as="li" key={name} delay={i * 0.05} className="border-b border-ink/10">
                <Link to={categoryPath(name)} className="group flex items-center gap-4 sm:gap-7 py-5 sm:py-7">
                  {/* stacked product photos */}
                  <span className="relative flex shrink-0 items-center" aria-hidden="true">
                    {thumbs.length ? thumbs.map((p, k) => (
                      <img
                        key={p.id || p._id || k}
                        src={p.image}
                        alt=""
                        loading="lazy"
                        className={`h-14 w-14 sm:h-16 sm:w-16 rounded-full object-cover ring-[3px] ring-cream bg-cream-deep transition-transform duration-500 ease-soft ${k ? '-ml-5 sm:-ml-6' : ''} ${k === 1 ? 'group-hover:translate-x-1.5' : ''} ${k === 2 ? 'group-hover:translate-x-3' : ''}`}
                        style={{ zIndex: 3 - k }}
                      />
                    )) : (
                      <span className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-berry-tint" />
                    )}
                  </span>

                  <span className="flex-1 min-w-0">
                    <span className="headline block text-2xl sm:text-4xl transition-colors group-hover:text-berry">
                      {name}
                      <span className="ml-2 align-top text-xs sm:text-sm font-semibold tracking-normal text-ink-muted">{items.length}</span>
                    </span>
                    <span className="mt-1.5 text-[13px] sm:text-[15px] text-ink-soft line-clamp-1">{summaryOf(items)}</span>
                    {from > 0 && <span className="mt-1 block text-[12.5px] sm:text-[13px] text-ink-muted">From ₹{from.toLocaleString('en-IN')}</span>}
                  </span>

                  <span className="link-arrow shrink-0 text-[13px] sm:text-sm">
                    <span className="hidden sm:inline">Shop now</span> <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ── Numbered process timeline ───────────────────────────────────────
   Seed pattern: "benefits you can feel in 7 days / 2 weeks / 4 weeks…"
   — big step labels on a connecting rail. Here: farm → pantry. */
