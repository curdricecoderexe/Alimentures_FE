import { createContext, useContext, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Check, PenLine, Truck, Building2, HandHeart, MessageCircle, Plus, Minus,
  Droplet, Package, Wheat, Gift, Tag, Loader2, Receipt, Send,
} from 'lucide-react';
import SEO from '../../components/SEO';
import { HAMPERS_SEO } from '../../lib/seo';
import { Reveal } from '../../components/ui/motion';
import { PantryStillLife, EngravedBee } from '../../components/home/BotanicalArt';
import { HAMPERS, HAMPER_OCCASIONS, hamperEnquiryUrl } from '../../data/hampers';
import { usePageAppearance } from '../../lib/appearance';
import { useStorefrontSettings, hampersVisibleIn } from '../../lib/storefrontSettings';
import { API_BASE } from '../../lib/api';
import banner from '../../assets/cas/banner.webp';
import festive from '../../assets/product/4.jpg';
import pentaBite from '../../assets/fav/penta_bite.webp';
import triGrain from '../../assets/fav/tri_grain_gain.webp';
import redMillets from '../../assets/fav/red_millets_mate.webp';
import coclets from '../../assets/fav/classic_coclets.webp';
import heritage from '../../assets/fav/mappillai_samba.webp';

/*
 * Gift Hampers — full-width banner (admin image), an illustrated intro, the
 * curated collection with what's inside each box, the Grainlets line-up, how
 * gifting works, a bulk / corporate order form (→ Admin → Gift Hampers), FAQ.
 */

/*
 * Every photo on this page can be replaced in Admin → Gift Hampers (appearance
 * slots served with ?page=hampers). The bundled images below are the defaults.
 */
const HAMPER_IMAGES = { banner, feature: festive, cookies: pentaBite, grains: triGrain, coclets, heritage };

const GRAINLETS = [
  { key: 'red-millets-mate', name: 'Red Millets Mate', img: redMillets, note: 'Finger millet & red sorghum' },
  { key: 'penta-bite', name: 'Penta Bite', img: pentaBite, note: 'Five millets, seed-studded' },
  { key: 'tri-grain-gain', name: 'Tri-Grain Gain', img: triGrain, note: 'Heritage rice with millet' },
  { key: 'classic-coclets', name: 'Classic Coclets', img: coclets, note: 'Ragi, sorghum & coconut' },
];

const PageImages = createContext({});
const usePageImages = () => useContext(PageImages);
const grainletImg = (imgs, key) => imgs[`grainlet-${key}`] || GRAINLETS.find((g) => g.key === key).img;
const hamperImg = (imgs, hamper) => imgs[`hamper-${hamper.id}`] || HAMPER_IMAGES[hamper.image] || banner;

/** Thumbnail (product photo) or thin-line icon for a "what's inside" item. */
function itemVisual(item, imgs) {
  const t = item.toLowerCase();
  if (t.includes('red millets')) return { img: grainletImg(imgs, 'red-millets-mate') };
  if (t.includes('penta')) return { img: grainletImg(imgs, 'penta-bite') };
  if (t.includes('tri-grain')) return { img: grainletImg(imgs, 'tri-grain-gain') };
  if (t.includes('coclets')) return { img: grainletImg(imgs, 'classic-coclets') };
  if (t.includes('cookies') || t.includes('grainlets')) return { img: grainletImg(imgs, 'penta-bite') };
  if (t.includes('honey')) return { Icon: Droplet };
  if (t.includes('jaggery')) return { Icon: Package };
  if (t.includes('health mix') || t.includes('rice')) return { Icon: Wheat };
  if (t.includes('card') || t.includes('note') || t.includes('tag')) return { Icon: PenLine };
  if (t.includes('logo') || t.includes('sleeve')) return { Icon: Tag };
  if (t.includes('dispatch')) return { Icon: Truck };
  return { Icon: Gift };
}

const PERKS = [
  { icon: HandHeart, title: 'Hand-packed', text: 'Every box is assembled by hand in Chennai.' },
  { icon: PenLine, title: 'Personal note', text: 'A handwritten message card, free with every hamper.' },
  { icon: Building2, title: 'Bulk & branded', text: 'Your logo, your colours — from 10 to 1,000 boxes.' },
  { icon: Truck, title: 'Pan-India delivery', text: 'Shipped to one address or many, tracked end to end.' },
];

const STEPS = [
  { n: '01', title: 'Pick a hamper', text: 'Choose a curated box below, or tell us your budget and we’ll build one.' },
  { n: '02', title: 'Make it personal', text: 'Add a message, branding or swap items to suit the person and the moment.' },
  { n: '03', title: 'We pack & ship', text: 'Fresh from our kitchen, packed with care and delivered across India.' },
];

const FAQS = [
  { q: 'Can I customise what goes inside a hamper?', a: 'Yes. Every hamper can be adjusted — swap cookies, add honey or jaggery, or build one from scratch around your budget.' },
  { q: 'Do you take bulk or corporate orders?', a: 'Absolutely. We regularly pack hampers for teams, clients and events, with branded sleeves and a single GST invoice.' },
  { q: 'How far in advance should I order?', a: 'For up to 20 hampers, 3–5 working days is usually enough. For larger or branded orders, reach out 2–3 weeks ahead — especially around festivals.' },
  { q: 'Can you ship to multiple addresses?', a: 'Yes. Share a list of recipients and we’ll dispatch each hamper individually with tracking.' },
  { q: 'How long do the products stay fresh?', a: 'Our cookies are packed in airtight jars and keep well for several weeks. Each jar carries its best-before date.' },
];

const BUDGETS = ['Under ₹500', '₹500 – ₹1,000', '₹1,000 – ₹2,000', '₹2,000 +', 'Not sure yet'];

const scrollToId = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  if (window.lenis) window.lenis.scrollTo(el, { offset: -90, duration: 1.2 });
  else el.scrollIntoView({ behavior: 'smooth' });
};

function SectionHead({ eyebrow, title, text, gold = false, className = '' }) {
  return (
    <Reveal className={`grid lg:grid-cols-12 gap-6 lg:gap-10 items-end mb-10 sm:mb-14 ${className}`}>
      <div className="lg:col-span-8 space-y-5">
        <span className={`eyebrow ${gold ? 'eyebrow-gold' : ''}`}>{eyebrow}</span>
        <h2 className="headline text-[2.3rem] sm:text-6xl">{title}</h2>
      </div>
      {text && <p className="lg:col-span-4 text-[15px] text-ink-soft leading-relaxed">{text}</p>}
    </Reveal>
  );
}

/* ── Top banner — full-width image only (Admin → Gift Hampers / Templates) ── */
function HeroBanner() {
  const src = usePageImages().hampersHero || banner;
  return (
    <section aria-label="Gift hampers" className="relative w-full overflow-hidden bg-cream-deep">
      <h1 className="sr-only">Gift hampers</h1>
      <img
        src={src}
        alt="Alimenture gift hampers"
        fetchpriority="high"
        className="block w-full aspect-[4/3] sm:aspect-[16/9] lg:aspect-[12/5] max-h-[88vh] object-cover object-center"
      />
    </section>
  );
}

/* ── Illustrated introduction ─────────────────────────────────────────── */
function Intro() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24 bg-paper border-b border-hairline">
      <div className="max-w-[1240px] mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <Reveal className="lg:col-span-7 space-y-7">
          <span className="eyebrow eyebrow-gold">Gifting by Alimenture</span>
          <h2 className="headline text-[2.6rem] sm:text-6xl lg:text-[4.4rem]">Gifts that <em>nourish,</em> not just impress.</h2>
          <p className="text-[15.5px] sm:text-lg text-ink-soft leading-relaxed max-w-xl">
            Curated hampers of millet cookies, raw honey, jaggery and heritage-grain goodness — hand-packed in Chennai and
            personalised for every occasion, from a single thank-you to a thousand branded boxes.
          </p>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-4 pt-1">
            <button type="button" onClick={() => scrollToId('collection')} className="btn-pill">
              Explore the collection <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button type="button" onClick={() => scrollToId('bulk')} className="link-arrow">Bulk &amp; corporate orders</button>
          </div>
          <ul className="flex flex-wrap gap-x-8 gap-y-2 border-t border-hairline pt-6 text-[13px] text-ink-soft">
            {['No preservatives', 'Free message card', 'Ships across India'].map((t) => (
              <li key={t} className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-berry" strokeWidth={1.75} /> {t}</li>
            ))}
          </ul>
        </Reveal>

        {/* engraved illustration */}
        <Reveal delay={0.1} className="lg:col-span-5">
          <div className="relative mx-auto w-full max-w-[440px] aspect-square">
            <div className="absolute inset-0 rounded-full plate-sandal" />
            <div className="absolute -inset-3 rounded-full border border-gold/30" />
            <div className="absolute -inset-7 rounded-full border border-dashed border-ink/10" />
            <PantryStillLife className="absolute inset-[12%] w-[76%] h-[76%]" />
            <EngravedBee className="absolute -top-2 right-6 w-24 sm:w-28" />
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-paper border border-hairline px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-ink shadow-[0_18px_40px_-28px_rgba(43,11,51,0.5)]">
              Hand-packed in Chennai
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Perks — hairline index ──────────────────────────────────────────── */
function Perks() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20">
      <div className="max-w-[1240px] mx-auto grid sm:grid-cols-2 lg:grid-cols-4 border-y border-hairline sm:divide-x divide-hairline">
        {PERKS.map(({ icon: Icon, title, text }, i) => (
          <Reveal key={title} delay={i * 0.05} className={`group py-7 sm:px-7 ${i > 0 ? 'border-t sm:border-t-0' : ''} ${i === 2 ? 'sm:border-t lg:border-t-0' : ''} ${i === 3 ? 'sm:border-t lg:border-t-0' : ''} border-hairline`}>
            <span className="h-11 w-11 rounded-full border border-hairline text-berry flex items-center justify-center transition-colors duration-500 group-hover:bg-berry group-hover:border-berry group-hover:text-paper">
              <Icon className="h-5 w-5" strokeWidth={1.4} />
            </span>
            <h3 className="headline mt-5 text-xl">{title}</h3>
            <p className="mt-1.5 text-[14px] text-ink-soft leading-relaxed">{text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── Collection ──────────────────────────────────────────────────────── */
function HamperCard({ hamper, onBulk }) {
  const imgs = usePageImages();
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col rounded-[26px] bg-paper border border-hairline overflow-hidden transition-shadow duration-500 hover:shadow-[0_40px_80px_-50px_rgba(43,11,51,0.5)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden plate-sandal">
        <img src={hamperImg(imgs, hamper)} alt={hamper.name} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-soft group-hover:scale-[1.04]" />
        {hamper.badge && (
          <span className="absolute top-4 left-4 rounded-full bg-paper/95 px-3 py-1.5 text-[10.5px] font-display font-medium uppercase tracking-[0.16em] text-gold">{hamper.badge}</span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-6 sm:p-7">
        <p className="text-[11px] uppercase tracking-[0.18em] text-berry">{hamper.occasion}</p>
        <h3 className="headline mt-2 text-[1.6rem] leading-tight">{hamper.name}</h3>
        <p className="mt-2 text-[14.5px] text-ink-soft leading-relaxed">{hamper.tagline}</p>

        <p className="mt-6 text-[10.5px] uppercase tracking-[0.2em] text-ink-muted">Inside the box</p>
        <ul className="mt-3 divide-y divide-hairline border-y border-hairline">
          {hamper.contents.map((item) => {
            const v = itemVisual(item, imgs);
            return (
              <li key={item} className="flex items-center gap-3 py-2.5">
                {v.img
                  ? <img src={v.img} alt="" loading="lazy" className="h-8 w-8 rounded-full object-cover bg-cream-deep ring-1 ring-hairline" />
                  : <span className="h-8 w-8 rounded-full border border-hairline text-gold flex items-center justify-center"><v.Icon className="h-3.5 w-3.5" strokeWidth={1.5} /></span>}
                <span className="text-[13.5px] text-ink">{item}</span>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto pt-6 flex items-center justify-between gap-3">
          <span className="font-display text-[15px] text-ink">{hamper.price ? `From ₹${hamper.price}` : 'Custom quote'}</span>
          <div className="flex items-center gap-2">
            <a
              href={hamperEnquiryUrl({ hamper: hamper.name })}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ask about ${hamper.name} on WhatsApp`}
              className="h-10 w-10 rounded-full border border-hairline text-ink-soft flex items-center justify-center hover:text-berry hover:border-berry/40 transition-colors"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
            </a>
            <button type="button" onClick={() => onBulk(hamper.name)} className="btn-pill btn-pill-sm">Order this</button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function Collection({ onBulk }) {
  const [occasion, setOccasion] = useState('All');
  const list = useMemo(() => HAMPERS.filter((h) => occasion === 'All' || h.occasion === occasion), [occasion]);
  return (
    <section id="collection" className="scroll-mt-24 px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28">
      <div className="max-w-[1240px] mx-auto">
        <SectionHead eyebrow="The collection" title={<>Curated <em>hampers</em></>} text="Six boxes for every kind of gifting — each one adjustable, and each one packed by hand." />
        <div role="tablist" aria-label="Filter hampers by occasion" className="flex gap-1 sm:gap-2 overflow-x-auto no-scrollbar border-b border-hairline mb-10">
          {HAMPER_OCCASIONS.map((o) => {
            const active = o === occasion;
            return (
              <button
                key={o}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setOccasion(o)}
                className={`relative shrink-0 h-11 px-3 sm:px-4 font-display text-[14px] transition-colors ${active ? 'text-mulberry' : 'text-ink-soft hover:text-ink'}`}
              >
                {o}
                {active && <motion.span layoutId="hamper-tab" className="absolute left-3 right-3 sm:left-4 sm:right-4 -bottom-px h-[1.5px] bg-mulberry" />}
              </button>
            );
          })}
        </div>
        <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          <AnimatePresence mode="popLayout">
            {list.map((h) => <HamperCard key={h.id} hamper={h} onBulk={onBulk} />)}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

/* ── The Grainlets line-up ───────────────────────────────────────────── */
function Lineup() {
  const imgs = usePageImages();
  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28">
      <div className="max-w-[1240px] mx-auto rounded-[32px] sm:rounded-[40px] bg-paper border border-hairline px-6 sm:px-10 lg:px-14 py-14 sm:py-20">
        <SectionHead eyebrow="What goes inside" gold title={<>Meet the <em>Grainlets</em></>} text="Every hamper is built around our four clean-label Alchemi’s cookies — slow-baked from millets and heritage rice." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {GRAINLETS.map((g, i) => (
            <Reveal key={g.name} delay={i * 0.06} className="group text-center">
              <div className="relative mx-auto aspect-square w-full max-w-[220px]">
                <div className="absolute inset-0 rounded-full plate-sandal" />
                <div className="absolute -inset-2 rounded-full border border-gold/25 transition-transform duration-700 group-hover:scale-105" />
                <img src={grainletImg(imgs, g.key)} alt={g.name} loading="lazy" className="absolute inset-[8%] w-[84%] h-[84%] rounded-full object-cover" />
              </div>
              <h3 className="headline mt-6 text-xl">{g.name}</h3>
              <p className="mt-1 text-[13px] text-ink-soft">{g.note}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── How it works ────────────────────────────────────────────────────── */
function HowItWorks() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28">
      <div className="max-w-[1240px] mx-auto">
        <SectionHead eyebrow="How gifting works" title={<>Three steps to a <em>thoughtful</em> gift</>} />
        <ol className="relative grid md:grid-cols-3 gap-10 md:gap-0 md:divide-x divide-hairline border-t border-hairline">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.n} delay={i * 0.07} className={`pt-8 ${i === 0 ? 'md:pr-8' : i === 2 ? 'md:pl-8' : 'md:px-8'}`}>
              <span className="font-display text-xs tracking-[0.2em] tabular-nums text-gold">STEP {s.n}</span>
              <h3 className="headline mt-3 text-2xl">{s.title}</h3>
              <p className="mt-2 text-[14.5px] text-ink-soft leading-relaxed">{s.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ── Bulk / corporate order form ─────────────────────────────────────── */
const field = 'w-full h-12 rounded-xl border border-hairline bg-paper px-4 text-[14.5px] text-ink placeholder:text-ink-muted outline-none transition focus:border-mulberry/50 focus:ring-4 focus:ring-mulberry/10';
const labelCls = 'block text-[12px] font-display font-medium uppercase tracking-[0.12em] text-ink-soft mb-2';

function BulkOrder({ hamper, setHamper }) {
  const [form, setForm] = useState({ name: '', mobile: '', email: '', company: '', quantity: 25, occasion: '', deliveryDate: '', city: '', budget: '', branding: false, notes: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const today = new Date().toISOString().slice(0, 10);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.name.trim().length < 2) return setError('Please enter your name.');
    if (!/^(\+?91)?[6-9]\d{9}$/.test(form.mobile.replace(/[\s-]/g, ''))) return setError('Please enter a valid 10-digit mobile number.');
    const quantity = Number(form.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) return setError('Please enter how many hampers you need.');

    setStatus('sending');
    try {
      const body = { ...form, quantity, hamper };
      for (const k of Object.keys(body)) if (body[k] === '') delete body[k];
      const res = await fetch(`${API_BASE}/hampers/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Something went wrong. Please try again.');
      setStatus('sent');
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  };

  return (
    <section id="bulk" className="scroll-mt-24 px-2 sm:px-3 pt-20 sm:pt-28">
      <div
        className="relative overflow-hidden rounded-[28px] sm:rounded-[40px] bg-mulberry-deep"
        style={{ backgroundImage: 'radial-gradient(110% 80% at 0% 0%, var(--mulberry, #7C276E) 0%, transparent 62%)' }}
      >
        <div className="relative max-w-[1240px] mx-auto grid lg:grid-cols-12 gap-10 lg:gap-14 px-5 sm:px-10 lg:px-14 py-14 sm:py-20">
          {/* pitch */}
          <Reveal className="lg:col-span-5 text-paper space-y-7">
            <span className="eyebrow eyebrow-light">Bulk &amp; corporate</span>
            <h2 className="headline text-paper text-[2.3rem] sm:text-5xl">Gifting for teams, clients &amp; <em className="!text-gold-light">celebrations.</em></h2>
            <p className="text-[15px] text-paper/75 leading-relaxed max-w-md">
              Tell us what you have in mind and our gifting team will come back with options and a quote.
            </p>
            <ul className="border-t border-paper/15">
              {[
                [Tag, 'Your logo on the sleeve and a custom note'],
                [Receipt, 'A single GST invoice for the whole order'],
                [Truck, 'Delivered to one address or many, with tracking'],
                [HandHeart, 'Hand-packed fresh in our Chennai kitchen'],
              ].map(([Icon, text]) => (
                <li key={text} className="flex items-center gap-4 py-4 border-b border-paper/15">
                  <span className="h-10 w-10 shrink-0 rounded-full border border-gold-light/40 text-gold-light flex items-center justify-center"><Icon className="h-4 w-4" strokeWidth={1.4} /></span>
                  <span className="text-[14.5px] text-paper/85">{text}</span>
                </li>
              ))}
            </ul>
            <a href={hamperEnquiryUrl({ hamper })} target="_blank" rel="noopener noreferrer" className="link-arrow link-arrow-light">
              <MessageCircle className="h-4 w-4" strokeWidth={1.5} /> Prefer WhatsApp? Chat with us
            </a>
          </Reveal>

          {/* form */}
          <Reveal delay={0.08} className="lg:col-span-7">
            <div className="rounded-[24px] bg-paper p-6 sm:p-9 shadow-[0_40px_90px_-50px_rgba(0,0,0,0.6)]">
              {status === 'sent' ? (
                <div className="py-10 text-center">
                  <span className="mx-auto h-14 w-14 rounded-full bg-berry-tint text-berry flex items-center justify-center"><Check className="h-6 w-6" strokeWidth={1.75} /></span>
                  <h3 className="headline mt-6 text-3xl">Thank you, {form.name.split(' ')[0]}.</h3>
                  <p className="mt-3 text-ink-soft max-w-sm mx-auto">We’ve received your enquiry for {form.quantity} {Number(form.quantity) === 1 ? 'hamper' : 'hampers'}. Our gifting team will get in touch shortly.</p>
                  <button type="button" onClick={() => { setStatus('idle'); setForm((f) => ({ ...f, notes: '' })); }} className="mt-6 link-arrow">Send another enquiry</button>
                </div>
              ) : (
                <form onSubmit={submit} noValidate className="space-y-5">
                  <div className="flex items-baseline justify-between gap-4 border-b border-hairline pb-4">
                    <h3 className="headline text-2xl">Request a quote</h3>
                    <span className="text-[11.5px] text-ink-muted">* required</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="block"><span className={labelCls}>Your name *</span><input className={field} value={form.name} onChange={set('name')} autoComplete="name" maxLength={80} /></label>
                    <label className="block"><span className={labelCls}>Mobile *</span><input className={field} value={form.mobile} onChange={set('mobile')} inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" maxLength={20} /></label>
                    <label className="block"><span className={labelCls}>Email</span><input className={field} type="email" value={form.email} onChange={set('email')} autoComplete="email" maxLength={120} /></label>
                    <label className="block"><span className={labelCls}>Company</span><input className={field} value={form.company} onChange={set('company')} autoComplete="organization" maxLength={120} /></label>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <label className="block sm:col-span-2"><span className={labelCls}>Hamper</span>
                      <select className={field} value={hamper} onChange={(e) => setHamper(e.target.value)}>
                        <option value="">Help me choose / custom hamper</option>
                        {HAMPERS.map((h) => <option key={h.id} value={h.name}>{h.name}</option>)}
                      </select>
                    </label>
                    <label className="block"><span className={labelCls}>Quantity *</span>
                      <div className="flex items-center h-12 rounded-xl border border-hairline bg-paper overflow-hidden focus-within:border-mulberry/50">
                        <button type="button" aria-label="Fewer" onClick={() => setForm((f) => ({ ...f, quantity: Math.max(1, Number(f.quantity || 1) - 5) }))} className="h-full w-11 flex items-center justify-center text-ink-soft hover:text-ink"><Minus className="h-4 w-4" /></button>
                        <input className="flex-1 min-w-0 h-full text-center bg-transparent outline-none text-[15px] tabular-nums" inputMode="numeric" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value.replace(/\D/g, '').slice(0, 6) }))} aria-label="Quantity" />
                        <button type="button" aria-label="More" onClick={() => setForm((f) => ({ ...f, quantity: Number(f.quantity || 0) + 5 }))} className="h-full w-11 flex items-center justify-center text-ink-soft hover:text-ink"><Plus className="h-4 w-4" /></button>
                      </div>
                    </label>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <label className="block"><span className={labelCls}>Occasion</span>
                      <select className={field} value={form.occasion} onChange={set('occasion')}>
                        <option value="">Select</option>
                        {['Diwali / Festive', 'Pongal', 'Corporate gifting', 'Wedding', 'Birthday / Return gifts', 'Employee welcome kit', 'Other'].map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </label>
                    <label className="block"><span className={labelCls}>Needed by</span><input className={field} type="date" min={today} value={form.deliveryDate} onChange={set('deliveryDate')} /></label>
                    <label className="block"><span className={labelCls}>Budget / box</span>
                      <select className={field} value={form.budget} onChange={set('budget')}>
                        <option value="">Select</option>
                        {BUDGETS.map((b) => <option key={b}>{b}</option>)}
                      </select>
                    </label>
                  </div>
                  <label className="block"><span className={labelCls}>Delivery city / cities</span><input className={field} value={form.city} onChange={set('city')} placeholder="e.g. Chennai, Bengaluru (multiple addresses welcome)" maxLength={120} /></label>
                  <label className="block"><span className={labelCls}>Anything else?</span>
                    <textarea className={`${field} h-auto py-3 resize-none`} rows={3} value={form.notes} onChange={set('notes')} maxLength={1500} placeholder="Items to add or swap, message on the card, dietary notes…" />
                  </label>
                  <label className="flex items-start gap-3 rounded-xl border border-hairline bg-cream/50 p-4 cursor-pointer">
                    <input type="checkbox" checked={form.branding} onChange={set('branding')} className="mt-0.5 h-4 w-4 accent-[#7C276E]" />
                    <span className="text-[14px] text-ink">Add our company branding <span className="block text-[12.5px] text-ink-muted">Logo on the sleeve, branded message cards</span></span>
                  </label>
                  {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                    <p className="text-[12px] text-ink-muted max-w-xs">We’ll only use your details to reply to this enquiry.</p>
                    <button type="submit" disabled={status === 'sending'} className="btn-pill disabled:opacity-60">
                      {status === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" strokeWidth={1.75} />}
                      Send enquiry
                    </button>
                  </div>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ─────────────────────────────────────────────────────────────── */
function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-24 sm:pb-32">
      <div className="max-w-[1240px] mx-auto grid lg:grid-cols-12 gap-10 lg:gap-16">
        <Reveal className="lg:col-span-4 space-y-5 lg:sticky lg:top-32 self-start">
          <span className="eyebrow">Questions</span>
          <h2 className="headline text-[2.3rem] sm:text-5xl">Good to <em>know</em></h2>
          <p className="text-[15px] text-ink-soft">Can’t find what you’re looking for? <a href={hamperEnquiryUrl()} target="_blank" rel="noopener noreferrer" className="text-berry underline underline-offset-4">Message us on WhatsApp</a>.</p>
        </Reveal>
        <div className="lg:col-span-8 border-t border-hairline">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="border-b border-hairline">
                <button type="button" onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen} className="w-full flex items-center justify-between gap-6 py-6 text-left">
                  <span className="headline text-[1.15rem] sm:text-[1.35rem]">{f.q}</span>
                  <span className={`h-9 w-9 shrink-0 rounded-full border border-hairline flex items-center justify-center text-ink-soft transition-transform duration-300 ${isOpen ? 'rotate-45 text-berry border-berry/40' : ''}`}><Plus className="h-4 w-4" strokeWidth={1.5} /></span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                      <p className="pb-6 pr-14 text-[15px] text-ink-soft leading-relaxed">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HampersUnavailable() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-6 pt-28">
      <SEO title="Gift hampers" noindex />
      <span className="eyebrow eyebrow-gold">Gift hampers</span>
      <h1 className="headline mt-4 text-4xl sm:text-5xl">Hampers are <em>resting</em> for now.</h1>
      <p className="mt-4 text-ink-soft max-w-md">Our gift hampers aren’t available at the moment. Our cookies and pantry staples are always in the shop.</p>
      <Link to="/shop" className="btn-pill mt-8">Visit the shop <ArrowRight className="h-4 w-4" /></Link>
    </div>
  );
}

export default function Hampers() {
  const { settings, loaded } = useStorefrontSettings();
  const visible = hampersVisibleIn(settings);
  const isAdmin = (localStorage.getItem('role') || '').toLowerCase() === 'admin';
  const [hamper, setHamper] = useState('');
  const pageImages = usePageAppearance('hampers');

  const orderHamper = (name) => {
    setHamper(name);
    scrollToId('bulk');
  };

  if (!loaded) return <div className="min-h-screen" />;
  if (!visible && !isAdmin) return <HampersUnavailable />;

  return (
    <PageImages.Provider value={pageImages}>
    <div className="min-h-screen text-ink relative font-sans">
      <SEO title={HAMPERS_SEO.title} description={HAMPERS_SEO.description} url="/hampers" />
      {!visible && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[90] rounded-full bg-night text-paper text-[13px] px-5 py-2.5 shadow-lg">
          Hidden from customers — only admins can see this page. <Link to="/admin/hampers" className="underline underline-offset-2 text-gold-light">Change</Link>
        </div>
      )}
      <HeroBanner />
      <Intro />
      <Perks />
      <Collection onBulk={orderHamper} />
      <Lineup />
      <HowItWorks />
      <BulkOrder hamper={hamper} setHamper={setHamper} />
      <Faq />
    </div>
    </PageImages.Provider>
  );
}
