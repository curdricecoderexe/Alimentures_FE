/* eslint-disable react-refresh/only-export-components -- shares a scroll hook with its section components */
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import { ArrowRight, Check, Wheat, Shield, Leaf, ShieldCheck, Sprout, Globe, X, Dumbbell, Briefcase, Baby, HeartPulse, Sunrise, Coffee, Home, Flame, Truck, Handshake } from 'lucide-react';
import { useAppearance } from '../../lib/appearance';
import { Reveal } from '../ui/motion';
import { useStorefrontSettings } from '../../lib/storefrontSettings';
import { MilletSpray, WheatSpray } from '../home/BotanicalArt';
import lineupDefaultImage from '../../assets/cas/banner.webp';
import nammalvarImage from '../../assets/nammalvar.jpg';
import craftingBgDefault from '../../assets/Munnar.jpg';
import superGrainsBgDefault from '../../assets/bf.webp';
import commitmentBgDefault from '../../assets/commitment-millets.webp';

import fingerMilletImg from '../../assets/fav/finger.webp';
import foxtailMilletImg from '../../assets/fav/foxtail.webp';
import pearlMilletImg from '../../assets/fav/pearl.webp';
import sorghumImg from '../../assets/fav/sorghum.webp';
import sorghumRedImg from '../../assets/fav/sorghum-red.webp';
import kodoMilletImg from '../../assets/fav/kodo.webp';
import karuppuKavaniImg from '../../assets/fav/karuppu_kavani.webp';
import kattuYaanamImg from '../../assets/fav/kattu-yaanam.webp';
import karunguruvaiImg from '../../assets/fav/karunguruvai.webp';
import mappillaiSambaImg from '../../assets/fav/mappillai_samba.webp';

/*
 * Brand-story sections shared by the About Us, Our Story and Why Choose Us
 * pages. Each section keeps its original id so pages can deep-link (#story,
 * #philosophy-3s, #philosophy, #sustainability, #company, #alchemis-matters,
 * #farm-to-pantry, #trust-pillars, #about, #commitment).
 */

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
  { icon: ShieldCheck, title: 'Purity', desc: 'Preserving the natural integrity of every ingredient without harmful chemicals or artificial additives.' },
  { icon: Leaf,        title: 'Sustainability', desc: 'Consciously sourcing ingredients to protect our ecosystems, farming communities, and the planet.' },
  { icon: HeartPulse,  title: 'Wellness', desc: 'Crafting wholesome snacks that actively support a balanced, vibrant, and genuinely healthy lifestyle.' },
  { icon: Wheat,       title: 'Authentic Nourishment', desc: 'Reviving traditional nutritional wisdom for modern, fast-paced generations.' },
];

/** Clean Snack Lineup photo — admin slots lineupImage1-3, crossfading with a slow zoom when more than one is set. */
function LineupSlides({ images, active }) {
  return (
    <div className="absolute inset-0">
      {images.map((src, i) => (
        <motion.img
          key={src}
          src={src}
          alt="Healthy & Mindful Living"
          initial={{ opacity: i === active ? 1 : 0, scale: 1 }}
          animate={{ opacity: i === active ? 1 : 0, scale: i === active ? 1.08 : 1 }}
          transition={{ opacity: { duration: 1.2, ease: 'easeInOut' }, scale: { duration: 7, ease: 'easeOut' } }}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ))}
    </div>
  );
}

const LINEUP_SLIDE_MS = 5500;
const LINEUP_WITHOUT = ['Preservatives', 'Artificial colours', 'Artificial flavours'];

/** Arch-framed, layered artwork for the Alchemi's / Clean Snack Lineup block. */
function LineupArtwork({ images }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (images.length < 2) return undefined;
    const id = setInterval(() => setActive((i) => (i + 1) % images.length), LINEUP_SLIDE_MS);
    return () => clearInterval(id);
  }, [images.length]);
  const current = active % images.length;

  return (
    <Reveal className="relative mx-auto w-full max-w-[440px] lg:max-w-[480px]">
      {/* sandal plate + fine gold outline */}
      <div aria-hidden="true" className="absolute inset-0 translate-x-4 translate-y-4 sm:translate-x-5 sm:translate-y-5 rounded-t-[999px] rounded-b-[2.5rem] bg-sandal/60" />
      <div aria-hidden="true" className="absolute -inset-3 sm:-inset-4 rounded-t-[999px] rounded-b-[3rem] border border-gold/30 pointer-events-none" />

      {/* the arch */}
      <div className="relative aspect-[4/5] rounded-t-[999px] rounded-b-[2.5rem] overflow-hidden bg-cream-deep ring-[6px] ring-paper shadow-[0_40px_80px_-45px_rgba(43,11,51,0.45)]">
        <LineupSlides images={images} active={current} />
        <div className="absolute inset-0 bg-gradient-to-t from-night/55 via-night/0 to-transparent pointer-events-none" />

        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-7 flex flex-col items-center gap-3.5">
          <div className="flex flex-wrap justify-center gap-2">
            {[[Leaf, '100% Native Base'], [Wheat, 'Honest Baking']].map(([Icon, label]) => (
              <span key={label} className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-paper/90 backdrop-blur-md text-ink text-[11px] font-medium uppercase tracking-[0.14em] whitespace-nowrap">
                <Icon className="h-3.5 w-3.5 text-gold" strokeWidth={1.5} /> {label}
              </span>
            ))}
          </div>
          {images.length > 1 && (
            <div className="flex gap-1.5">
              {images.map((src, i) => (
                <button key={src} onClick={() => setActive(i)} aria-label={`Show image ${i + 1}`} className="relative h-1 w-8 sm:w-10 rounded-full bg-paper/30 overflow-hidden">
                  {i === current && (
                    <motion.span
                      key={`${current}-${src}`}
                      className="absolute inset-y-0 left-0 bg-paper rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: LINEUP_SLIDE_MS / 1000, ease: 'linear' }}
                    />
                  )}
                  {i < current && <span className="absolute inset-0 bg-paper/80" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* seal */}
      <div className="absolute -top-3 -right-1 sm:-top-5 sm:-right-6 z-30 h-24 w-24 sm:h-28 sm:w-28 pointer-events-none">
        <div className="absolute inset-0 rounded-full bg-paper border border-gold/30 shadow-[0_18px_40px_-20px_rgba(43,11,51,0.35)]" />
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden="true">
          <defs>
            <path id="lineup-seal-path" d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
          </defs>
          <text className="fill-gold" style={{ fontSize: '8px', letterSpacing: '2.4px', fontWeight: 500, fontFamily: 'Outfit, sans-serif' }}>
            <textPath href="#lineup-seal-path">ALIMENTURE • CERTIFIED PURE • </textPath>
          </text>
        </svg>
        <div className="absolute inset-0 m-auto h-10 w-10 sm:h-11 sm:w-11 rounded-full border border-berry/25 bg-berry-tint text-berry flex items-center justify-center">
          <Sprout className="h-5 w-5" strokeWidth={1.4} />
        </div>
      </div>

      {/* "baked without" card */}
      <div className="hidden sm:block absolute -left-12 bottom-[28%] z-30 rounded-2xl bg-paper border border-hairline shadow-[0_24px_50px_-28px_rgba(43,11,51,0.4)] p-4 pr-6">
        <p className="eyebrow !text-[10px]">Baked without</p>
        <ul className="mt-2.5 space-y-1.5">
          {LINEUP_WITHOUT.map((item) => (
            <li key={item} className="flex items-center gap-2 text-[12.5px] font-medium text-ink">
              <span className="inline-flex items-center justify-center h-5 min-w-[30px] px-1.5 rounded-full border border-berry/20 text-berry text-[10.5px] font-medium tabular-nums">0%</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}

const GRAINS_CACHE = 'alim_super_grains_v1';


/** Admin-managed grains (Admin → Super Grains), cached so a slow API still shows the real list. */
function useSuperGrains() {
  const [superGrains, setSuperGrains] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(GRAINS_CACHE));
      if (Array.isArray(cached) && cached.length) return cached;
    } catch { /* ignore */ }
    return [];
  });
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/super-grains`);
        if (res.ok) {
          const data = await res.json();
          if (alive && data.success && Array.isArray(data.data) && data.data.length > 0) {
            setSuperGrains(data.data);
            try { localStorage.setItem(GRAINS_CACHE, JSON.stringify(data.data)); } catch { /* quota — fine */ }
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch super grains', err);
      }
      if (alive) setSuperGrains((cur) => (cur.length ? cur : milletsBenefitList));
    })();
    return () => { alive = false; };
  }, []);
  return superGrains;
}

/** Deep links (/page#section): lazy pages + images shift layout, so scroll after render and again once settled. */
export function useHashScroll() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return undefined;
    const go = () => {
      const el = document.getElementById(hash.slice(1));
      if (!el) return;
      if (window.lenis) window.lenis.scrollTo(el, { offset: -90, duration: 1 });
      else el.scrollIntoView({ behavior: 'smooth' });
    };
    const timers = [setTimeout(go, 300), setTimeout(go, 1400)];
    return () => timers.forEach(clearTimeout);
  }, [hash]);
}

/** Page intro: eyebrow, headline, one paragraph, quick links (in-page anchors glide; routes navigate). */
export function PageIntro({ eyebrow, title, text, links = [], compact = false }) {
  return (
    <section className={`relative z-10 overflow-clip bg-cream ${compact ? 'pt-14 sm:pt-20' : 'pt-28 sm:pt-36'} pb-14 sm:pb-20 px-4 sm:px-6`}>
      <MilletSpray className="pointer-events-none absolute -left-10 sm:-left-6 -bottom-12 w-[150px] sm:w-[210px] lg:w-[240px] opacity-90 -rotate-[8deg]" />
      <WheatSpray className="pointer-events-none absolute -right-10 sm:-right-6 -bottom-12 w-[150px] sm:w-[200px] lg:w-[230px] opacity-85 rotate-[6deg]" />
      <div className="relative mx-auto max-w-3xl text-center">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="headline mt-4 text-[2.6rem] sm:text-6xl lg:text-[4.5rem]">{title}</h1>
        {text && <p className="mt-5 text-ink-soft text-[15px] sm:text-lg leading-relaxed max-w-2xl mx-auto">{text}</p>}
        {links.length > 0 && (
          <nav aria-label="On this page" className="mt-8 flex flex-wrap justify-center gap-2">
            {links.map(([href, label]) => {
              const cls = 'inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white/80 border border-[#E2DCD0] text-[13.5px] text-ink-soft hover:border-ink/40 hover:text-ink transition-colors';
              if (!href.startsWith('#')) {
                return <Link key={href} to={href} className={cls}>{label} <ArrowRight className="h-3.5 w-3.5" /></Link>;
              }
              return (
                <a
                  key={href}
                  href={href}
                  className={cls}
                  onClick={(e) => {
                    const el = document.querySelector(href);
                    if (!el) return;
                    e.preventDefault();
                    if (window.lenis) window.lenis.scrollTo(el, { offset: -90, duration: 1.2 });
                    else el.scrollIntoView({ behavior: 'smooth' });
                    window.history.replaceState(null, '', href);
                  }}
                >
                  {label}
                </a>
              );
            })}
          </nav>
        )}
      </div>
    </section>
  );
}

const PANTRY_STEPS = [
  { step: '01', icon: Sprout, title: 'Sourced from farmers',  desc: 'Heritage millets and native rice from partner farming communities that grow them naturally.' },
  { step: '02', icon: Wheat,  title: 'Blended clean',         desc: 'Whole grains only — no maida, no white sugar, no refined oil, no preservatives.' },
  { step: '03', icon: Flame,  title: 'Slow-baked in Chennai', desc: 'Small batches with butter and country sugar, in our FSSAI-registered kitchen.' },
  { step: '04', icon: Truck,  title: 'At your door',          desc: 'Packed with care and shipped straight to your pantry.' },
];
// wave through the four column centres (x = 12.5%, 37.5%, 62.5%, 87.5% of 1200)
const PANTRY_PATH = 'M0,130 C60,130 90,60 150,60 S300,200 450,200 S600,60 750,60 S900,200 1050,200 S1170,130 1200,130';
const PANTRY_Y = [60, 200, 60, 200];

/** Farm to pantry — a winding road that draws itself as you scroll; each stop lights up. */
export function FarmToPantry() {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 60%'] });
  const draw = useSpring(scrollYProgress, { stiffness: 90, damping: 28, restDelta: 0.001 });

  return (
    <section id="farm-to-pantry" className="scroll-mt-24 relative z-10 bg-paper border-t border-hairline font-sans py-16 sm:py-28 px-4 sm:px-6 lg:px-8">
      <div ref={ref} className="max-w-[1240px] mx-auto">
        <Reveal className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-end mb-12 lg:mb-4">
          <div className="lg:col-span-8 space-y-5">
            <h2 className="headline text-4xl sm:text-6xl">Four honest steps. <em>Nothing hidden.</em></h2>
          </div>
          <p className="lg:col-span-4 text-[15px] text-ink-soft leading-relaxed">
            From a farmer&rsquo;s field to your pantry shelf — the road every Alchemi&rsquo;s bake travels.
          </p>
        </Reveal>

        {/* desktop: winding road */}
        <div className="hidden lg:block relative">
          <svg viewBox="0 0 1200 260" className="w-full h-auto overflow-visible" aria-hidden="true">
            <path d={PANTRY_PATH} fill="none" className="stroke-hairline" strokeWidth="1.5" strokeDasharray="2 8" strokeLinecap="round" />
            <motion.path d={PANTRY_PATH} fill="none" className="stroke-berry" strokeWidth="1.5" strokeLinecap="round" style={{ pathLength: reduce ? 1 : draw }} />
          </svg>
          {PANTRY_STEPS.map((s, i) => (
            <span
              key={s.step}
              className="absolute -translate-x-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-paper border border-berry/30 text-berry flex items-center justify-center shadow-[0_0_0_8px_var(--paper,#FFFDF9)]"
              style={{ left: `${12.5 + i * 25}%`, top: `${(PANTRY_Y[i] / 260) * 100}%` }}
            >
              <s.icon className="h-6 w-6" strokeWidth={1.4} />
            </span>
          ))}
        </div>

        {/* steps */}
        <ol className="relative grid lg:grid-cols-4 gap-8 lg:gap-10 pl-12 lg:pl-0 lg:mt-6">
          <span className="lg:hidden absolute left-[17px] top-2 bottom-2 w-px bg-hairline" aria-hidden="true" />
          <motion.span className="lg:hidden absolute left-[17px] top-2 bottom-2 w-px origin-top bg-berry" style={{ scaleY: reduce ? 1 : draw }} aria-hidden="true" />
          {PANTRY_STEPS.map((s, i) => (
            <Reveal as="li" key={s.step} delay={i * 0.07} className="relative">
              <span className="lg:hidden absolute -left-12 top-0 h-9 w-9 rounded-full bg-paper border border-berry/30 text-berry flex items-center justify-center" aria-hidden="true">
                <s.icon className="h-4 w-4" strokeWidth={1.5} />
              </span>
              <span className="font-display text-xs tracking-[0.2em] tabular-nums text-gold">STEP {s.step}</span>
              <h3 className="headline mt-3 text-2xl">{s.title}</h3>
              <p className="mt-2 text-sm text-ink-soft leading-relaxed">{s.desc}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

const WHY_BELIEFS = [
  { icon: Wheat,     title: 'Nourish lives',
    desc: 'Driven by the vision of building a self-reliant economy through sustainable food systems, Alimenture was founded to redefine healthy living through natural, toxin-free nutrition.' },
  { icon: Handshake, title: 'Empower communities',
    desc: 'More than a food manufacturing company, Alimenture is a movement dedicated to creating healthier communities by reconnecting people with authentic, wholesome food.' },
  { icon: Leaf,      title: 'Protect nature',
    desc: 'Inspired by the philosophy of the legendary green crusader Nammalvar, we believe that food should nourish people without adding preservatives.' },
];

/** Why We Started — 3S-style: editorial split heading, fine-line arch portrait, hairline index. */
export function WhyWeStarted({ first = false }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(null);
  const draw = (delay = 0) => ({
    initial: { pathLength: reduce ? 1 : 0 },
    whileInView: { pathLength: 1 },
    viewport: { once: true, amount: 0.4 },
    transition: { duration: 1.4, delay, ease: [0.16, 1, 0.3, 1] },
  });
  return (
    <>
      {/* ⸻ 6. OUR PURPOSE ⸻ */}
      <section id="about" className={`${first ? '-mt-20 pt-48 sm:pt-56' : 'pt-16 sm:pt-28'} pb-16 sm:pb-28 px-4 sm:px-6 lg:px-8 bg-paper relative font-sans`}>
        <div className="max-w-[1240px] mx-auto">
          <Reveal className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-end mb-12 sm:mb-20">
            <div className="lg:col-span-8 space-y-5">
              <h2 className="headline text-[2.4rem] sm:text-6xl lg:text-[4.25rem]">Why we <em>started</em></h2>
            </div>
            <p className="lg:col-span-4 text-[15px] text-ink-soft leading-relaxed">
              Every decision begins with a simple belief — food should nourish lives, empower communities, and protect nature.
            </p>
          </Reveal>

          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* fine-line arch portrait */}
            <div className="lg:col-span-5 w-full max-w-[440px] mx-auto">
              <div className="relative">
                <div className="relative">
                  <svg viewBox="0 0 400 500" preserveAspectRatio="none" className="absolute -left-4 -right-4 -top-4 -bottom-4 sm:-left-6 sm:-right-6 sm:-top-6 sm:-bottom-6 w-[calc(100%+2rem)] h-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] sm:h-[calc(100%+3rem)] pointer-events-none overflow-visible" aria-hidden="true">
                    <motion.path d="M4,500 L4,200 A196,196 0 0 1 396,200 L396,500" fill="none" stroke="#2B0B33" strokeOpacity="0.2" strokeWidth="1" vectorEffect="non-scaling-stroke" {...draw(0)} />
                  </svg>
                  <div className="relative aspect-[4/5] rounded-t-[999px] overflow-hidden bg-cream-deep">
                    <img src={nammalvarImage} alt="Nammalvar — the green crusader who inspired Alimenture" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                </div>
                <figure className="relative -mt-14 mx-6 sm:mx-10 rounded-[22px] bg-paper border border-hairline p-5 sm:p-6 shadow-[0_30px_60px_-40px_rgba(43,11,51,0.45)]">
                  <blockquote className="headline text-[1.15rem] sm:text-[1.3rem] leading-snug">&ldquo;Food should nourish people <em>without adding preservatives.</em>&rdquo;</blockquote>
                  <figcaption className="mt-3 text-[11px] uppercase tracking-[0.18em] text-gold">Inspired by Nammalvar</figcaption>
                </figure>
              </div>
            </div>

            {/* hairline index */}
            <ol className="lg:col-span-7 border-t border-ink/10">
              {WHY_BELIEFS.map((b, i) => {
                const on = active === i;
                return (
                  <Reveal
                    as="li"
                    key={b.title}
                    delay={i * 0.06}
                    tabIndex={0}
                    onMouseEnter={() => setActive(i)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    className="grid grid-cols-[2.5rem_1fr] gap-4 sm:gap-6 py-7 sm:py-8 border-b border-ink/10 outline-none"
                  >
                    <span className="pt-2 font-display text-xs tracking-[0.2em] tabular-nums text-gold">0{i + 1}</span>
                    <div>
                      <div className="flex items-center gap-3">
                        <b.icon className={`h-5 w-5 transition-colors duration-300 ${on ? 'text-berry' : 'text-ink-muted'}`} strokeWidth={1.4} />
                        <h3 className={`headline text-2xl sm:text-[2rem] transition-colors duration-300 ${on ? 'text-berry' : ''}`}>{b.title}</h3>
                      </div>
                      <p lang="en" className="mt-3 text-sm sm:text-[15px] text-ink-soft leading-relaxed text-justify hyphens-auto max-w-xl">{b.desc}</p>
                    </div>
                  </Reveal>
                );
              })}
            </ol>
          </div>
        </div>
      </section>
    </>
  );
}

export function OurStorySection() {
  const [storyOpen, setStoryOpen] = useState(false);
  return (
    <>
      {/* ⸻ 7. WHO WE ARE ⸻ */}
      <section id="story" className="py-16 sm:py-28 relative z-10 bg-[#F7F0E3] overflow-hidden font-sans">
        <div className="absolute right-0 top-10 w-96 h-96 bg-[#F8A830]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute left-0 bottom-10 w-96 h-96 bg-berry/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
            <div className="space-y-6 sm:space-y-10 lg:pr-6 flex flex-col items-center text-center lg:items-start lg:text-left">
              <h2 className="headline text-[2.4rem] sm:text-6xl lg:text-[4.25rem]">
                Built on a Mission.<br /><span className="accent-text">Not a Trend.</span>
              </h2>

              <div className="space-y-6 pt-2 w-full max-w-xl border-l-2 border-[#F8A830]/60 pl-5 sm:pl-7">
                <p lang="en" className="text-[#1F1726] leading-relaxed text-base sm:text-lg font-medium text-justify [text-justify:inter-word] hyphens-auto">
                  Alimenture Industries Private Limited was incorporated in Chennai in December 2023 by visionary entrepreneurs Pavin Saminathan and Magesh Mohan.
                </p>
                <p lang="en" className={`text-[#574D60] leading-relaxed text-sm sm:text-base font-medium text-justify [text-justify:inter-word] hyphens-auto ${storyOpen ? '' : 'line-clamp-4 sm:line-clamp-none'}`}>
                  Driven by the vision of building a self-reliant economy through sustainable food systems, Alimenture was founded with a mission to redefine healthy living through natural, toxin-free nutrition. More than a food manufacturing company, Alimenture is a movement dedicated to creating healthier communities by reconnecting people with authentic, wholesome food. Inspired by the philosophy of the legendary green crusader Nammalvar, we believe that food should nourish people without adding preservatives. Every product we create reflects our commitment to purity, sustainability, and the well-being of future generations.
                </p>
                {!storyOpen && (
                  <button type="button" onClick={() => setStoryOpen(true)} className="sm:hidden py-2.5 -my-2.5 text-[12px] font-extrabold uppercase tracking-[0.14em] text-berry">
                    Read more
                  </button>
                )}
              </div>
            </div>

            <PillarIndex />
          </div>
        </div>
      </section>
    </>
  );
}

/** Purity · Sustainability · Wellness · Authentic Nourishment —
 *  an editorial 2×2 index on a paper panel, divided by hairlines. */
function PillarIndex() {
  return (
    <div className="w-full rounded-[28px] bg-paper border border-hairline overflow-hidden shadow-[0_40px_80px_-50px_rgba(43,11,51,0.35)]">
      <div className="grid grid-cols-1 sm:grid-cols-2">
        {trustPillars.map((p, i) => (
          <Reveal
            key={p.title}
            delay={i * 0.06}
            className={`group relative p-7 sm:p-9 border-hairline ${i % 2 === 0 ? 'sm:border-r' : ''} ${i < 2 ? 'border-b' : i === 2 ? 'border-b sm:border-b-0' : ''}`}
          >
            <span className="absolute top-0 left-0 h-px w-0 bg-berry transition-all duration-700 ease-out group-hover:w-full" aria-hidden="true" />
            <div className="flex items-start justify-between">
              <span className="h-12 w-12 rounded-full border border-hairline flex items-center justify-center text-berry transition-colors duration-500 group-hover:bg-berry group-hover:border-berry group-hover:text-paper">
                <p.icon className="h-5 w-5" strokeWidth={1.4} />
              </span>
              <span className="font-display text-xs tracking-[0.2em] tabular-nums text-gold">0{i + 1}</span>
            </div>
            <h3 className="headline mt-8 text-2xl sm:text-[1.65rem]">{p.title}</h3>
            <p className="mt-3 text-sm text-ink-soft leading-relaxed">{p.desc}</p>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

const threeS = [
  { key: 'sustenance',     title: 'Sustenance',     icon: Wheat,     cx: 200, cy: 140, lx: 200, ly: 96,
    desc: 'Creating wholesome foods that support everyday health, energy, and overall well-being through natural ingredients and traditional nutrition.' },
  { key: 'sustainability', title: 'Sustainability', icon: Leaf,      cx: 140, cy: 245, lx: 104, ly: 290,
    desc: 'Promoting farming and food production methods that protect the environment, preserve biodiversity, and ensure a healthier planet for future generations.' },
  { key: 'self-reliance',  title: 'Self-Reliance',  icon: Handshake, cx: 260, cy: 245, lx: 296, ly: 290,
    desc: 'Building a stronger and more sustainable economy by empowering local farmers, encouraging natural cultivation, and delivering toxin-free nourishment.' },
];

/** 3S Philosophy — a fine-line diagram of three overlapping circles (Alimenture
 *  at the intersection) beside a hairline index. Hovering either side links them. */
export function ThreeSPhilosophy() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(null);
  return (
    <>
      {/* ⸻ 8. THE 3S PHILOSOPHY OF ALIMENTURE ⸻ */}
      <section id="philosophy-3s" className="py-16 sm:py-28 px-4 sm:px-6 lg:px-8 bg-cream relative font-sans border-t border-hairline">
        <div className="max-w-[1240px] mx-auto">
          <Reveal className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-end mb-12 sm:mb-20">
            <div className="lg:col-span-8 space-y-5">
              <h2 className="headline text-[2.4rem] sm:text-6xl lg:text-[4.25rem]">
                The 3S philosophy of <em>Alimenture</em>
              </h2>
            </div>
            <p className="lg:col-span-4 text-[15px] text-ink-soft leading-relaxed">
              Three ideas, one intersection. Everything we make lives where they overlap.
            </p>
          </Reveal>

          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* diagram */}
            <div className="lg:col-span-6 w-full max-w-[500px] mx-auto" onMouseLeave={() => setActive(null)}>
              <svg viewBox="0 0 400 420" className="w-full h-auto" role="img" aria-label="Sustenance, Sustainability and Self-Reliance overlap at Alimenture">
                <circle cx="200" cy="210" r="196" fill="none" stroke="#2B0B33" strokeOpacity="0.12" strokeDasharray="1 5" />
                {threeS.map((c, i) => {
                  const on = active === c.key;
                  return (
                    <g key={c.key} onMouseEnter={() => setActive(c.key)} onClick={() => setActive(c.key)} className="cursor-pointer">
                      <circle cx={c.cx} cy={c.cy} r="112" fill="#B0128F" style={{ fillOpacity: on ? 0.06 : 0, transition: 'fill-opacity .5s' }} />
                      <motion.circle
                        cx={c.cx} cy={c.cy} r="112" fill="none"
                        stroke={on ? '#B0128F' : '#2B0B33'}
                        strokeOpacity={on ? 1 : 0.28}
                        strokeWidth={on ? 1.5 : 1}
                        initial={{ pathLength: reduce ? 1 : 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{ duration: 1.4, delay: i * 0.18, ease: [0.16, 1, 0.3, 1] }}
                        style={{ transition: 'stroke .4s, stroke-opacity .4s' }}
                      />
                      <text
                        x={c.lx} y={c.ly} textAnchor="middle"
                        style={{ fontFamily: 'Outfit, sans-serif', fontSize: 11.5, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', fill: on ? '#B0128F' : '#1F1726', transition: 'fill .4s' }}
                      >
                        {c.title}
                      </text>
                    </g>
                  );
                })}
                {/* intersection */}
                <g className="pointer-events-none">
                  <circle cx="200" cy="212" r="40" fill="#2B0B33" />
                  <circle cx="200" cy="212" r="46" fill="none" stroke="#C7801A" strokeOpacity="0.55" />
                  <text x="200" y="216" textAnchor="middle" style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, fontWeight: 400, letterSpacing: '0.02em', fill: '#FFFDF9' }}>Alimenture</text>
                </g>
              </svg>
            </div>

            {/* index */}
            <ol className="lg:col-span-6 border-t border-ink/10">
              {threeS.map((c, i) => {
                const on = active === c.key;
                return (
                  <Reveal
                    as="li"
                    key={c.key}
                    delay={i * 0.06}
                    tabIndex={0}
                    onMouseEnter={() => setActive(c.key)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(c.key)}
                    onBlur={() => setActive(null)}
                    className="grid grid-cols-[2.5rem_1fr] gap-4 sm:gap-6 py-7 sm:py-8 border-b border-ink/10 outline-none focus-visible:bg-paper"
                  >
                    <span className="pt-2 font-display text-xs tracking-[0.2em] tabular-nums text-gold">0{i + 1}</span>
                    <div>
                      <div className="flex items-center gap-3">
                        <c.icon className={`h-5 w-5 transition-colors duration-300 ${on ? 'text-berry' : 'text-ink-muted'}`} strokeWidth={1.4} />
                        <h3 className={`headline text-2xl sm:text-[2rem] transition-colors duration-300 ${on ? 'text-berry' : ''}`}>{c.title}</h3>
                      </div>
                      <p lang="en" className="mt-3 text-sm sm:text-[15px] text-ink-soft leading-relaxed text-justify hyphens-auto max-w-lg">{c.desc}</p>
                    </div>
                  </Reveal>
                );
              })}
            </ol>
          </div>
        </div>
      </section>
    </>
  );
}

const CRAFT_PILLARS = [
  { icon: Leaf,   title: 'Building a sustainable food future',
    desc: 'Healthy food should serve people and the planet alike. We back sustainable food systems, farmer-friendly ecosystems and traditional agriculture — from sourcing to plate.' },
  { icon: Shield, title: 'Food you can trust',
    desc: 'Every product is made with transparency and care — honest ingredients, real nutrition and cleaner choices, with nothing to hide on the label.' },
];

/** Crafting grains into gold — photo backdrop, centred heading, two bordered boxes. */
export function CraftingGold() {
  const appearance = useAppearance();
  const craftingBg = appearance.craftingBg || craftingBgDefault;
  return (
    <>
      {/* ⸻ 9. CRAFTING GRAINS INTO GOLD ⸻ */}
      <section id="philosophy" className="relative z-10 overflow-hidden font-sans py-16 sm:py-28 border-t border-hairline">
        {/* admin photo, lightly washed — a softer cream pool behind the heading keeps it readable */}
        <div className="absolute inset-0 -z-10">
          <img src={craftingBg} alt="" aria-hidden="true" className="w-full h-full object-cover object-center" loading="lazy" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-b from-cream/70 via-cream/35 to-cream/25" />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(60% 42% at 50% 22%, rgba(247,240,227,0.75) 0%, rgba(247,240,227,0) 100%)' }} />
        </div>

        <div className="relative mx-auto max-w-[1080px] px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-3xl mx-auto flex flex-col items-center gap-5">
            <h2 className="headline text-[2.6rem] sm:text-6xl lg:text-[4.5rem]">Crafting grains <em>into gold</em></h2>
            <p className="text-[15px] sm:text-lg text-ink-soft leading-relaxed max-w-xl">
              We don&rsquo;t bake compromises. Every recipe is thoughtfully crafted with superior ingredients, exceptional taste, and honest goodness.
            </p>
            <ul className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-ink-muted">
              {['Superior ingredients', 'Exceptional taste', 'Honest goodness'].map((t, i) => (
                <li key={t} className="inline-flex items-center gap-6">
                  {i > 0 && <span className="h-1 w-1 rounded-full bg-gold" aria-hidden="true" />}
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>

          <div className="mt-12 sm:mt-16 grid md:grid-cols-2 gap-4 sm:gap-6">
            {CRAFT_PILLARS.map((c, i) => (
              <Reveal
                key={c.title}
                delay={i * 0.08}
                className="group relative rounded-[26px] bg-paper border border-hairline p-7 sm:p-10 transition-all duration-500 hover:border-gold/40 hover:shadow-[0_40px_80px_-50px_rgba(43,11,51,0.45)]"
              >
                {/* fine gold rule that draws across the top on hover */}
                <span className="absolute top-0 left-10 right-10 h-px origin-left scale-x-0 bg-gradient-to-r from-transparent via-gold to-transparent transition-transform duration-700 group-hover:scale-x-100" aria-hidden="true" />
                <div className="flex items-start justify-between">
                  <span className="h-12 w-12 rounded-full border border-hairline text-berry flex items-center justify-center transition-colors duration-500 group-hover:bg-berry group-hover:border-berry group-hover:text-paper">
                    <c.icon className="h-5 w-5" strokeWidth={1.4} />
                  </span>
                  <span className="font-display text-xs tracking-[0.2em] tabular-nums text-gold">0{i + 1}</span>
                </div>
                <h3 className="headline mt-8 text-2xl sm:text-[1.85rem] leading-tight">{c.title}</h3>
                <div className="mt-4 h-px w-12 bg-gold/50" aria-hidden="true" />
                <p lang="en" className="mt-4 text-[14.5px] sm:text-[15px] text-ink-soft leading-relaxed text-justify hyphens-auto">{c.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/** Pick column counts that leave no empty cells on the last row (admin decides how many grains). */
const MD_COLS = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3' };
const LG_COLS = { 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5' };
function gridColsFor(n) {
  const pick = (options) => options.find((c) => n % c === 0) ?? options[0];
  const lg = n <= 5 ? Math.max(2, n) : pick([5, 4, 3]);
  const md = n <= 3 ? Math.max(2, n) : pick([3, 2]);
  return { md: MD_COLS[md], lg: LG_COLS[lg] };
}

export function SuperGrains() {
  const appearance = useAppearance();
  const superGrainsBg = appearance.superGrainsBg || superGrainsBgDefault;
  const superGrains = useSuperGrains();
  const grainCols = gridColsFor(superGrains.length);
  return (
    <>
      {/* ⸻ 5. POWERED BY ANCIENT SUPER GRAINS ⸻ */}
      <section id="sustainability" className="py-16 sm:py-28 px-4 sm:px-6 lg:px-8 border-t border-hairline relative z-10 overflow-hidden font-sans">
        <div className="absolute inset-0 -z-10">
          <img src={superGrainsBg} alt="" aria-hidden="true" className="w-full h-full object-cover object-center" loading="lazy" decoding="async" />
          <div className="absolute inset-0 bg-cream/[0.93]" />
        </div>

        <div className="max-w-[1240px] mx-auto">
          <Reveal className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-end mb-12 sm:mb-16">
            <div className="lg:col-span-7 space-y-5">
              <h2 className="headline text-[2.3rem] sm:text-6xl">Powered by ancient <em>super grains</em></h2>
            </div>
            <p lang="en" className="lg:col-span-5 text-[15px] text-ink-soft leading-relaxed text-justify hyphens-auto">
              Our cookies are enriched with ancient grains and traditional rice varieties that have been trusted for generations for their nutritional richness and wellness benefits. These grains naturally provide fiber-rich nourishment, essential minerals, long-lasting energy, better digestion support, and wholesome nutrition.
            </p>
          </Reveal>

          <div className={`grid grid-cols-2 ${grainCols.md} ${grainCols.lg} gap-3 sm:gap-5`}>
            {superGrains.map((millet, idx) => (
              <Reveal
                key={idx}
                delay={(idx % 5) * 0.05}
                className={`${superGrains.length % 2 === 1 && idx === superGrains.length - 1 ? 'col-span-2 md:col-span-1' : ''} group flex flex-col rounded-[22px] bg-paper border border-hairline overflow-hidden transition-all duration-500 hover:border-berry/25 hover:shadow-[0_30px_60px_-40px_rgba(43,11,51,0.45)]`}
              >
                <div className="relative aspect-square w-full overflow-hidden plate-sandal">
                  {millet.image && (
                    <img
                      src={millet.image}
                      alt={millet.name}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  )}
                  <span className="absolute top-3 left-3 font-display text-[11px] tracking-[0.18em] tabular-nums text-ink bg-paper/90 backdrop-blur-sm rounded-full px-2.5 py-1">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="flex flex-col gap-2 p-4 sm:p-5">
                  {millet.local && <span className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-gold">{millet.local}</span>}
                  <h3 className="headline text-lg sm:text-xl leading-tight transition-colors group-hover:text-berry">{millet.name}</h3>
                  <p className="text-[12.5px] sm:text-[13px] text-ink-soft leading-relaxed">{millet.benefit}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

const FAMILY_REASONS = [
  { Icon: Leaf,        title: '100% Natural Ingredients', desc: 'Made with carefully selected ingredients sourced directly from nature.' },
  { Icon: ShieldCheck, title: 'No Maida · No White Sugar · No Refined Oil', desc: 'Pure, clean-label recipes made only with wholesome ingredients.' },
  { Icon: Globe,       title: 'Sustainable Practices', desc: 'Eco-friendly packaging and responsible sourcing reducing environmental impact.' },
  { Icon: Handshake,   title: 'Farmer Empowerment', desc: 'Ethical partnerships with farming communities encouraging natural agriculture.' },
];

export function WhyFamilies() {
  return (
    <>
      {/* ⸻ WHY FAMILIES CHOOSE ALIMENTURE (Trust Pillars) ⸻ */}
      <section id="trust-pillars" className="py-16 sm:py-28 px-4 sm:px-6 lg:px-8 bg-paper border-t border-hairline font-sans">
        <div className="max-w-[1240px] mx-auto">
          <Reveal className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-end mb-12 sm:mb-16">
            <div className="lg:col-span-8 space-y-5">
              <h2 className="headline text-[2.3rem] sm:text-6xl">Why families choose <em>Alimenture</em></h2>
            </div>
            <p className="lg:col-span-4 text-[15px] text-ink-soft leading-relaxed">
              Four promises behind every pack — the same ones we hold ourselves to in our own kitchens.
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 border-t border-hairline">
            {FAMILY_REASONS.map(({ Icon, title, desc }, i) => (
              <Reveal
                key={title}
                delay={i * 0.06}
                className={`group relative pt-8 pb-8 sm:pb-2 sm:pr-8 lg:px-8 ${i === 0 ? 'lg:pl-0' : ''} ${i > 0 ? 'border-t sm:border-t-0' : ''} ${i % 2 === 1 ? 'sm:pl-8 lg:pl-8' : ''} ${i === 2 ? 'sm:border-t lg:border-t-0' : ''} ${i === 3 ? 'sm:border-t lg:border-t-0' : ''} ${i < 3 ? 'lg:border-r' : ''} ${i % 2 === 0 ? 'sm:border-r lg:border-r' : ''} ${i === 3 ? 'lg:border-r-0' : ''} border-hairline`}
              >
                <span className="absolute top-[-1px] left-0 h-px w-0 bg-berry transition-all duration-700 ease-out group-hover:w-full" aria-hidden="true" />
                <div className="flex items-start justify-between">
                  <span className="h-12 w-12 rounded-full border border-hairline flex items-center justify-center text-berry transition-colors duration-500 group-hover:bg-berry group-hover:border-berry group-hover:text-paper">
                    <Icon className="h-5 w-5" strokeWidth={1.4} />
                  </span>
                  <span className="font-display text-xs tracking-[0.2em] tabular-nums text-gold">0{i + 1}</span>
                </div>
                <h3 className="headline mt-7 text-xl sm:text-[1.4rem] leading-snug">{title}</h3>
                <p className="mt-3 text-sm text-ink-soft leading-relaxed">{desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

const commitmentPledges = [
  { icon: Wheat,       title: 'Nutrient-rich by design', desc: 'Whole grains and clean recipes, built around real nutrition.' },
  { icon: ShieldCheck, title: 'Toxin-free, always',       desc: 'Honest ingredients and transparent sourcing you can actually verify.' },
  { icon: Handshake,   title: 'Farmer-first ecosystems',  desc: 'Traditional agriculture and fair partnerships that strengthen local communities.' },
];

/** Our Commitment — an inset night panel: statement left, hairline index of
 *  three commitments right, closing pull-quote below. */
/** Default copy for the commitment band — Admin → About Page can override every line. */
export const COMMITMENT_DEFAULTS = {
  eyebrow: 'Our commitment',
  headline: 'Every product we craft is a step toward a',
  highlight: 'healthier India.',
  pledges: commitmentPledges.map((p) => p.title),
  ctaLabel: 'Shop',
  ctaLink: '/shop',
};
const PLEDGE_ICONS = [Wheat, ShieldCheck, Handshake];

export function OurCommitment() {
  const appearance = useAppearance();
  const commitmentBg = appearance.commitmentBg || commitmentBgDefault;
  const { settings } = useStorefrontSettings();
  const copy = { ...COMMITMENT_DEFAULTS, ...(settings?.commitment || {}) };
  const pledges = (copy.pledges?.length ? copy.pledges : COMMITMENT_DEFAULTS.pledges).slice(0, 3);
  return (
    <>
      {/* ⸻ OUR COMMITMENT — compact mulberry band ⸻ */}
      <section id="commitment" className="relative bg-cream px-2 sm:px-3 py-2 sm:py-3 font-sans">
        <div
          className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] bg-mulberry-deep text-paper"
          style={{ backgroundImage: 'radial-gradient(110% 90% at 0% 0%, var(--mulberry, #7C276E) 0%, transparent 62%)' }}
        >
          <WheatSpray color="#F8A830" accent="#F8A830" className="absolute -right-12 -bottom-20 w-64 opacity-[0.10] pointer-events-none" />
          <div className="relative max-w-[1240px] mx-auto px-6 sm:px-10 lg:px-12 py-10 sm:py-14 grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <Reveal className="lg:col-span-5 flex items-center gap-5 sm:gap-6">
              <img src={commitmentBg} alt="" aria-hidden="true" loading="lazy" decoding="async" className="hidden sm:block h-24 w-24 lg:h-28 lg:w-28 shrink-0 rounded-full object-cover ring-1 ring-gold-light/40 ring-offset-4 ring-offset-mulberry-deep" />
              <div className="space-y-3">
                <h2 className="headline text-paper text-[1.75rem] sm:text-[2.25rem] leading-tight">
                  {copy.headline}{copy.highlight && <> <em className="!text-gold-light">{copy.highlight}</em></>}
                </h2>
              </div>
            </Reveal>

            <ul className="lg:col-span-5 grid sm:grid-cols-3 lg:grid-cols-1 gap-x-6 border-t border-paper/15 lg:border-t-0 lg:border-l lg:pl-10">
              {pledges.map((title, i) => {
                const Icon = PLEDGE_ICONS[i % PLEDGE_ICONS.length];
                return (
                <Reveal as="li" key={`${i}-${title}`} delay={i * 0.05} className="flex items-center gap-3 py-3 border-b border-paper/10 last:border-b-0 sm:border-b-0 lg:border-b lg:last:border-b-0">
                  <span className="h-9 w-9 shrink-0 rounded-full border border-gold-light/40 text-gold-light flex items-center justify-center">
                    <Icon className="h-4 w-4" strokeWidth={1.4} />
                  </span>
                  <span className="text-[14px] text-paper/85">{title}</span>
                </Reveal>
                );
              })}
            </ul>

            <Reveal delay={0.1} className="lg:col-span-2 lg:justify-self-end">
              <Link to={copy.ctaLink || '/shop'} className="btn-light">
                {copy.ctaLabel || 'Shop'} <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}

const LINEUP_FEATURES = [
  { title: 'Sustained Low-GI Energy', desc: 'Slow release, no glycemic crash' },
  { title: 'Prebiotic Gut Support',   desc: 'Rich in prebiotic ancient fibers' },
  { title: '10 Heritage Super Grains', desc: 'Pure native millets & raw seeds' },
  { title: '0% Processed Sugar',      desc: 'Naturally sweetened with palm sugar' },
];

export function CleanSnackLineup({ first = false }) {
  const appearance = useAppearance();
  const lineupCustom = [appearance.lineupImage1, appearance.lineupImage2, appearance.lineupImage3].filter(Boolean);
  const lineupImages = lineupCustom.length ? lineupCustom : [lineupDefaultImage];
  return (
    <>
      {/* ⸻ CLEAN SNACK LINEUP · ALCHEMI'S ⸻ */}
      <section id="company" className={`${first ? 'pt-28 sm:pt-36' : 'pt-16 sm:pt-28 border-t border-hairline'} pb-16 sm:pb-28 px-4 sm:px-6 lg:px-8 relative z-10 bg-cream font-sans`}>
        <div className="max-w-[1240px] mx-auto grid lg:grid-cols-12 gap-16 lg:gap-20 items-center">
          <div className="lg:col-span-6 px-4 sm:px-10 lg:px-4 pt-4">
            <LineupArtwork images={lineupImages} />
          </div>

          <Reveal className="lg:col-span-6 space-y-7">
            <h2 className="headline text-[3rem] sm:text-7xl lg:text-[5.25rem]"><em>Alchemi&rsquo;s</em></h2>
            <p className="font-display text-xl sm:text-2xl text-ink leading-snug max-w-md">
              A line of healthy, clean-label cookies made from wholesome grains.
            </p>

            <ul className="grid sm:grid-cols-2 border-t border-hairline">
              {LINEUP_FEATURES.map((item, i) => (
                <li
                  key={item.title}
                  className={`group flex items-start gap-4 py-5 border-b border-hairline ${i % 2 === 0 ? 'sm:pr-6 sm:border-r' : 'sm:pl-6'}`}
                >
                  <span className="mt-0.5 h-8 w-8 shrink-0 rounded-full border border-berry/25 text-berry flex items-center justify-center transition-colors duration-500 group-hover:bg-berry group-hover:border-berry group-hover:text-paper">
                    <Check className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <span className="block font-display text-[15px] sm:text-base text-ink">{item.title}</span>
                    <span className="block mt-0.5 text-[13px] text-ink-muted">{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    </>
  );
}

const SNACK_VS = {
  typical: ['Heavily processed ingredients', 'Taste without nourishment', 'Refined flour & white sugar', 'Additives you can’t pronounce'],
  alchemis: ['Better nutritional value', 'Cleaner, intentional ingredients', 'Traditional wellness benefits', 'Everyday healthy snacking'],
};
const SNACK_PEOPLE = [
  { icon: Dumbbell,   label: 'Fitness enthusiasts' },
  { icon: Briefcase,  label: 'Working professionals' },
  { icon: Baby,       label: 'Parents & families' },
  { icon: HeartPulse, label: 'Health-conscious eaters' },
];
const SNACK_MOMENTS = [
  { icon: Sunrise,  label: 'Morning nutrition' },
  { icon: Coffee,   label: 'Evening snacks' },
  { icon: Dumbbell, label: 'Fitness-friendly diets' },
  { icon: Leaf,     label: 'Clean eating habits' },
  { icon: Home,     label: 'Family wellness routines' },
];

/** Why Alchemi's Matters (typical vs Alchemi's) · Healthy Snacking for Modern Living (bento). */
export function AlchemisMatters() {
  return (
    <>
      {/* ⸻ WHY ALCHEMI'S MATTERS · HEALTHY SNACKING FOR MODERN LIVING ⸻ */}
      <section id="alchemis-matters" className="py-16 sm:py-28 px-4 sm:px-6 lg:px-8 bg-cream border-t border-hairline font-sans">
        <div className="max-w-[1240px] mx-auto space-y-24 sm:space-y-32">

          {/* ── Why Alchemi's Matters ── */}
          <div>
            <Reveal className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-end mb-12 sm:mb-16">
              <div className="lg:col-span-6 space-y-5">
                <h2 className="headline text-[2.3rem] sm:text-6xl">Why <em>Alchemi&rsquo;s</em> matters</h2>
              </div>
              <p lang="en" className="lg:col-span-6 text-[15px] text-ink-soft leading-relaxed text-justify hyphens-auto">
                Modern snacks are often loaded with processed ingredients that provide taste without nourishment. Alchemi&rsquo;s was created to change that — combining traditional nutrition wisdom with premium food innovation to create snacks that genuinely support healthier lifestyles. Every ingredient is intentionally selected.
              </p>
            </Reveal>

            <div className="relative grid md:grid-cols-2 rounded-[28px] border border-hairline bg-paper overflow-hidden">
              <Reveal className="p-7 sm:p-10 border-b md:border-b-0 md:border-r border-hairline bg-cream/40">
                <p className="eyebrow !text-ink-muted">A typical snack</p>
                <ul className="mt-7 divide-y divide-hairline">
                  {SNACK_VS.typical.map((t) => (
                    <li key={t} className="flex items-center gap-4 py-4 text-ink-muted">
                      <span className="h-8 w-8 shrink-0 rounded-full border border-hairline flex items-center justify-center"><X className="h-3.5 w-3.5" strokeWidth={1.5} /></span>
                      <span className="text-[15px] line-through decoration-ink-muted/50">{t}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>

              <span className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-paper border border-hairline items-center justify-center font-display text-xs tracking-[0.14em] text-ink-soft" aria-hidden="true">VS</span>

              <Reveal delay={0.08} className="p-7 sm:p-10">
                <p className="eyebrow">Alchemi&rsquo;s</p>
                <ul className="mt-7 divide-y divide-hairline">
                  {SNACK_VS.alchemis.map((t) => (
                    <li key={t} className="flex items-center gap-4 py-4">
                      <span className="h-8 w-8 shrink-0 rounded-full bg-berry text-paper flex items-center justify-center"><Check className="h-3.5 w-3.5" strokeWidth={1.75} /></span>
                      <span className="font-display text-[16px] text-ink">{t}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>

          {/* ── Healthy Snacking for Modern Living ── */}
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
            <Reveal className="lg:col-span-5 space-y-6 lg:sticky lg:top-32 self-start">
              <h2 className="headline text-[2.3rem] sm:text-6xl">Healthy snacking for <em>modern living</em></h2>
              <p lang="en" className="text-[15px] text-ink-soft leading-relaxed max-w-md text-justify hyphens-auto">
                Whether you are a fitness enthusiast, working professional, parent, or health-conscious consumer, Alchemi&rsquo;s is designed to become part of your daily wellness lifestyle.
              </p>
            </Reveal>

            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-2 rounded-[28px] border border-hairline bg-paper overflow-hidden">
                {SNACK_PEOPLE.map((p, i) => (
                  <Reveal
                    key={p.label}
                    delay={i * 0.05}
                    className={`group p-6 sm:p-8 border-hairline ${i % 2 === 0 ? 'border-r' : ''} ${i < 2 ? 'border-b' : ''}`}
                  >
                    <span className="h-11 w-11 rounded-full border border-hairline text-berry flex items-center justify-center transition-colors duration-500 group-hover:bg-berry group-hover:border-berry group-hover:text-paper">
                      <p.icon className="h-5 w-5" strokeWidth={1.4} />
                    </span>
                    <p className="mt-6 text-[10.5px] font-medium uppercase tracking-[0.2em] text-ink-muted">Made for</p>
                    <p className="mt-1 headline text-lg sm:text-[1.35rem] leading-tight">{p.label}</p>
                  </Reveal>
                ))}
              </div>

              <Reveal delay={0.1} className="rounded-[28px] border border-hairline bg-paper p-6 sm:p-8">
                <p className="eyebrow eyebrow-gold mb-5">Perfect for</p>
                <div className="flex flex-wrap gap-2.5">
                  {SNACK_MOMENTS.map((m) => (
                    <span key={m.label} className="inline-flex items-center gap-2 h-10 pl-3 pr-4 rounded-full bg-cream border border-hairline text-[13px] font-medium text-ink transition-colors hover:border-gold/40">
                      <m.icon className="h-4 w-4 text-gold" strokeWidth={1.5} />
                      {m.label}
                    </span>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
