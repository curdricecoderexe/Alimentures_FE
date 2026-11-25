import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Truck, Search, ShieldCheck, Wheat, Leaf, ArrowRight, Check, Loader2, Store, Phone, Mail } from 'lucide-react';
import SEO from '../../components/SEO';
import NotFound from '../NotFound';
import { API_BASE, cachedFetch } from '../../lib/api';
import { useCategories } from '../../lib/categories';
import { useDeliverySummary } from '../../lib/delivery';
import { useStorefrontSettings, hampersVisibleIn } from '../../lib/storefrontSettings';
import {
  categoryPath, productPath, displayName, offerSummary,
  breadcrumbJsonLd, faqJsonLd, localPageJsonLd,
} from '../../lib/seo';
import {
  TN_CITIES, cityBySlug, cityPath, cityMeta, cityFaqs, HUB_META, LOCATIONS_PATH, TAMIL_TERMS,
} from '../../data/localSeo';
import { SUPPORT_CONTACT } from '../../data/policies';
import { ShopHero, ShopSectionHead, CARD, CARD_HOVER, LABEL } from '../../components/shop/ShopSections';

const EASE = [0.16, 1, 0.3, 1];

/**
 * Tamil Nadu local landing pages.
 *   /locations         → state hub (every city)
 *   /locations/:city   → one city (unknown slug → 404)
 * Facts only — see src/data/localSeo.js.
 */
export default function LocationCity() {
  const { city: slug } = useParams();
  const city = slug ? cityBySlug(slug) : null;
  const delivery = useDeliverySummary();
  const { settings } = useStorefrontSettings();
  const categories = useCategories().filter((c) => c.visible !== false && c.productCount > 0);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let alive = true;
    cachedFetch(`${API_BASE}/products?limit=100`)
      .then((d) => { if (alive && d?.success && Array.isArray(d.data)) setProducts(d.data.filter((p) => p.image).slice(0, 8)); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (slug && !city) return <NotFound />;

  const freeAbove = delivery?.freeDeliveryEnabled ? delivery.freeDeliveryThreshold : null;
  const hampersVisible = hampersVisibleIn(settings);
  const isHub = !city;
  const meta = isHub ? HUB_META : cityMeta(city);
  const path = isHub ? LOCATIONS_PATH : cityPath(city.slug);
  const faqs = isHub
    ? cityFaqs({ name: 'Tamil Nadu', slug: 'tamil-nadu' }, { freeAbove, hampersVisible })
    : cityFaqs(city, { freeAbove, hampersVisible });
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Tamil Nadu', path: LOCATIONS_PATH },
    ...(city ? [{ name: city.name, path }] : []),
  ];
  const places = isHub
    ? [{ type: 'State', name: 'Tamil Nadu' }, ...TN_CITIES.map((c) => ({ name: c.fullName || c.name, containedIn: 'Tamil Nadu' }))]
    : [{ name: city.fullName || city.name, containedIn: 'Tamil Nadu' }];
  const others = TN_CITIES.filter((c) => c.slug !== city?.slug);

  return (
    <div className="relative min-h-screen bg-cream font-sans text-ink overflow-x-hidden">
      <SEO
        title={meta.title}
        description={meta.description}
        url={path}
        jsonLd={[breadcrumbJsonLd(crumbs), localPageJsonLd({ path, title: meta.title, description: meta.description, places }), faqJsonLd(faqs)]}
      />

      <ShopHero
        eyebrow={isHub ? 'Delivering across Tamil Nadu' : `${city.name} · ${city.tamil}`}
        title={isHub
          ? <>Healthy millet snacks, <em>across Tamil Nadu</em></>
          : <>Millet cookies &amp; healthy snacks in <em>{city.name}</em></>}
        text={isHub
          ? 'Heritage-grain cookies, A2 ghee, raw honey and country-sugar bakes — made in our Chennai kitchen and shipped to homes across Tamil Nadu.'
          : city.intro}
      >
        <nav aria-label="Breadcrumb" className="mt-6 flex flex-wrap items-center justify-center gap-1.5 text-[13px] text-ink-muted">
          {crumbs.map((c, i) => (
            <span key={c.path} className="inline-flex items-center gap-1.5">
              {i > 0 && <span aria-hidden="true">/</span>}
              {i === crumbs.length - 1 ? <span className="text-ink">{c.name}</span> : <Link to={c.path} className="hover:text-mulberry">{c.name}</Link>}
            </span>
          ))}
        </nav>
      </ShopHero>

      <section className="relative z-10 bg-cream pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="mx-auto max-w-[1240px] lg:px-2 space-y-12 sm:space-y-16">

          {/* PIN check + facts */}
          <div className="grid lg:grid-cols-5 gap-4 sm:gap-5">
            <PinCheck city={city} className="lg:col-span-3" />
            <div className={`${CARD} lg:col-span-2 p-6 sm:p-7`}>
              <p className={LABEL}>{isHub ? 'Why Alimenture' : `Ordering in ${city.name}`}</p>
              <ul className="mt-4 space-y-3.5 text-[14.5px] text-ink-soft">
                <Fact icon={Store}>Made in our FSSAI-registered kitchen in Chennai</Fact>
                <Fact icon={Wheat}>Ten heritage millets &amp; native rice — 0% maida</Fact>
                <Fact icon={Leaf}>Sweetened with country sugar — 0% white sugar</Fact>
                <Fact icon={Truck}>
                  {city?.eta ? `Usually delivered in ${city.eta}` : 'Delivery charge shown for your PIN code at checkout'}
                  {freeAbove ? ` · free above ₹${freeAbove}` : ''}
                </Fact>
                <Fact icon={ShieldCheck}>Secure online payment</Fact>
              </ul>
            </div>
          </div>

          {/* Pickup (only when confirmed) */}
          {city?.pickup && (
            <div className={`${CARD} p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-4`}>
              <span className="h-11 w-11 rounded-2xl bg-mulberry-tint text-mulberry flex items-center justify-center shrink-0"><MapPin className="h-5 w-5" strokeWidth={1.6} /></span>
              <div className="flex-1">
                <h2 className="font-display text-[18px] text-ink">Pickup in {city.name}</h2>
                <p className="text-[14px] text-ink-soft">{city.pickup.address}{city.pickup.hours ? ` · ${city.pickup.hours}` : ''}</p>
              </div>
              {city.pickup.mapUrl && <a href={city.pickup.mapUrl} target="_blank" rel="noopener noreferrer" className="btn-outline">Get directions</a>}
            </div>
          )}

          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <ShopSectionHead eyebrow="Shop by category" title={isHub ? <>What you can <em>order</em></> : <>Order in <em>{city.name}</em></>} />
              <div className="flex flex-wrap gap-2.5">
                {categories.map((c) => (
                  <Link key={c.id} to={categoryPath(c.name)} className="h-11 px-5 rounded-full bg-white border border-hairline text-[14px] text-ink-soft hover:border-mulberry/40 hover:text-mulberry transition-colors inline-flex items-center">
                    {c.name}
                  </Link>
                ))}
                <Link to="/shop" className="btn-pill btn-pill-sm">All products <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </div>
          )}

          {/* Products */}
          {products.length > 0 && (
            <div>
              <ShopSectionHead eyebrow="Customer favourites" title={<>Popular {isHub ? 'across Tamil Nadu' : `in ${city.name}`}</>} />
              <ul className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {products.map((p, i) => {
                  const { low, count } = offerSummary(p);
                  return (
                    <motion.li key={p.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.04, ease: EASE }}>
                      <Link to={productPath(p)} className={`${CARD} ${CARD_HOVER} block overflow-hidden`}>
                        <span className="block aspect-square bg-cream overflow-hidden">
                          <img src={p.image} alt={displayName(p.title || p.name)} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                        </span>
                        <span className="block p-3.5">
                          <span className="block text-[14px] text-ink leading-snug line-clamp-2">{displayName(p.title || p.name)}</span>
                          {low > 0 && <span className="mt-1 block text-[13.5px] font-semibold text-mulberry-deep">{count > 1 ? 'from ' : ''}₹{low}</span>}
                        </span>
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Cities (hub: all; city: others) */}
          <div>
            <ShopSectionHead eyebrow="Tamil Nadu" title={isHub ? <>Find your <em>city</em></> : <>We also deliver to</>} />
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {(isHub ? TN_CITIES : others).map((c) => (
                <li key={c.slug}>
                  <Link to={cityPath(c.slug)} className={`${CARD} ${CARD_HOVER} flex items-center gap-2.5 px-4 py-3`}>
                    <MapPin className="h-4 w-4 text-mulberry shrink-0" strokeWidth={1.6} />
                    <span className="min-w-0">
                      <span className="block text-[14px] text-ink truncate">{c.name}</span>
                      <span className="block text-[12px] text-ink-muted truncate">{c.tamil}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {!isHub && <Link to={LOCATIONS_PATH} className="mt-4 inline-flex items-center gap-1.5 text-[14px] text-mulberry hover:underline">All of Tamil Nadu <ArrowRight className="h-3.5 w-3.5" /></Link>}
          </div>

          {/* Areas + Tamil search terms */}
          <div className={`${CARD} p-6 sm:p-8 grid md:grid-cols-2 gap-8`}>
            {city?.areas?.length > 0 && (
              <div>
                <h2 className="font-display text-[19px] text-ink">Ordering from {city.name}?</h2>
                <p className="mt-2 text-[14.5px] text-ink-soft leading-relaxed">
                  Whether you&rsquo;re in {city.areas.slice(0, -1).join(', ')} or {city.areas[city.areas.length - 1]}, enter your PIN code above to see delivery to your address.
                </p>
              </div>
            )}
            <div className={city?.areas?.length ? '' : 'md:col-span-2'}>
              <h2 className="font-display text-[19px] text-ink">சிறுதானிய உணவுகள் — <span className="text-ink-soft">in Tamil</span></h2>
              <ul className="mt-3 flex flex-wrap gap-2" lang="ta">
                {TAMIL_TERMS.map((t) => (
                  <li key={t.ta} className="h-9 px-3.5 rounded-full bg-cream/70 border border-hairline text-[13.5px] text-ink-soft inline-flex items-center gap-1.5">
                    <span className="text-ink">{t.ta}</span><span className="text-ink-muted" lang="en">· {t.en}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* FAQ */}
          <div>
            <ShopSectionHead eyebrow="Good to know" title={<>Questions from <em>{isHub ? 'Tamil Nadu' : city.name}</em></>} />
            <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
              {faqs.map((f) => (
                <div key={f.q} className={`${CARD} p-5 sm:p-6`}>
                  <h3 className="font-display text-[16px] text-ink">{f.q}</h3>
                  <p className="mt-1.5 text-[14px] text-ink-soft leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-[22px] bg-mulberry-deep text-paper p-6 sm:p-8 flex flex-col md:flex-row md:items-center gap-5" style={{ backgroundImage: 'radial-gradient(90% 140% at 100% 0%, rgba(248,168,48,0.2) 0%, transparent 55%)' }}>
            <div className="flex-1">
              <h2 className="font-display text-[22px]">Questions before you order?</h2>
              <p className="mt-1 text-[14.5px] text-paper/75">Our Chennai team answers calls and email in English and Tamil.</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {SUPPORT_CONTACT.phones.slice(0, 1).map((ph) => (
                <a key={ph} href={`tel:${ph.replace(/\s+/g, '')}`} className="btn-light"><Phone className="h-4 w-4" strokeWidth={1.75} /> {ph}</a>
              ))}
              <a href={`mailto:${SUPPORT_CONTACT.email}`} className="h-[3.25rem] px-5 rounded-full border border-paper/30 text-paper inline-flex items-center gap-2 hover:bg-paper/10 transition-colors"><Mail className="h-4 w-4" strokeWidth={1.75} /> Email us</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Fact({ icon: Icon, children }) {
  return (
    <li className="flex items-start gap-3">
      <span className="h-8 w-8 shrink-0 rounded-xl bg-mulberry-tint text-mulberry flex items-center justify-center"><Icon className="h-4 w-4" strokeWidth={1.6} /></span>
      <span className="pt-1">{children}</span>
    </li>
  );
}

/** Live PIN-code delivery check (the source of truth for "do you deliver here?"). */
function PinCheck({ city, className = '' }) {
  const [pin, setPin] = useState('');
  const [result, setResult] = useState(null); // null | 'loading' | { ok, text }

  const check = async (e) => {
    e.preventDefault();
    if (!/^[1-9][0-9]{5}$/.test(pin)) { setResult({ ok: false, text: 'Enter a valid 6-digit PIN code.' }); return; }
    setResult('loading');
    try {
      const res = await fetch(`${API_BASE}/delivery/pincode/${pin}`);
      const json = await res.json();
      const ok = json.success && json.data?.deliveryAvailable;
      setResult({ ok, text: ok ? `Great — we deliver to ${pin}.` : (json.data?.reason || `Sorry, we don't deliver to ${pin} yet.`) });
    } catch {
      setResult({ ok: false, text: 'Could not check right now — please try again.' });
    }
  };

  return (
    <div className={`${CARD} p-6 sm:p-7 ${className}`}>
      <span className="h-11 w-11 rounded-2xl bg-mulberry text-paper flex items-center justify-center"><Search className="h-5 w-5" strokeWidth={1.6} /></span>
      <h2 className="mt-4 font-display text-[22px] text-ink">Check delivery to your PIN code</h2>
      <p className="mt-1 text-[14px] text-ink-muted">{city ? `Anywhere in ${city.name} — ` : 'Anywhere in Tamil Nadu — '}we&rsquo;ll confirm instantly.</p>
      <form onSubmit={check} className="mt-5 flex gap-2.5">
        <input
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setResult(null); }}
          placeholder={`e.g. ${city?.samplePin || '600001'}`}
          aria-label="PIN code"
          className="flex-1 min-w-0 h-12 px-4 rounded-xl bg-white border border-[#E8E1D4] outline-none text-[15px] tracking-[0.12em] placeholder:tracking-normal placeholder:text-ink-muted focus:border-mulberry/50 focus:ring-4 focus:ring-mulberry/10"
        />
        <button type="submit" disabled={result === 'loading'} className="btn-pill shrink-0">
          {result === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check'}
        </button>
      </form>
      {result && result !== 'loading' && (
        <p className={`mt-3 flex items-center gap-2 text-[14px] ${result.ok ? 'text-leaf' : 'text-danger'}`}>
          {result.ok && <Check className="h-4 w-4" />} {result.text}
        </p>
      )}
    </div>
  );
}
