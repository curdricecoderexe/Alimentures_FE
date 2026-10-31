import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Truck, Store, Search } from 'lucide-react';
import SEO from '../../components/SEO';
import NotFound from '../NotFound';
import { API_BASE } from '../../lib/api';
import { useCategories } from '../../lib/categories';
import { useDeliverySummary } from '../../lib/delivery';
import { BRAND, categoryPath, breadcrumbJsonLd } from '../../lib/seo';
import { CHENNAI_PAGE } from '../../data/localSeo';

const PATH = '/locations/chennai';

/**
 * Chennai landing page. Every fact comes from src/data/localSeo.js (filled in
 * by the business) or from live delivery settings — nothing is assumed. Until
 * CHENNAI_PAGE.published is true this route is a 404.
 */
export default function LocationChennai() {
  const delivery = useDeliverySummary();
  const categories = useCategories().filter((c) => c.productCount > 0);
  const [pin, setPin] = useState('');
  const [pinResult, setPinResult] = useState(null); // null | 'loading' | { ok, text }

  if (!CHENNAI_PAGE.published) return <NotFound />;

  const { chennaiDeliveryEta: eta, pickup } = CHENNAI_PAGE;
  const freeAbove = delivery?.freeDeliveryEnabled ? delivery.freeDeliveryThreshold : null;

  const checkPin = async (e) => {
    e.preventDefault();
    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      setPinResult({ ok: false, text: 'Enter a valid 6-digit PIN code.' });
      return;
    }
    setPinResult('loading');
    try {
      const res = await fetch(`${API_BASE}/delivery/pincode/${pin}`);
      const json = await res.json();
      const ok = json.success && json.data?.deliveryAvailable;
      setPinResult({ ok, text: ok ? `We deliver to ${pin}.` : (json.data?.reason || `Sorry, we don't deliver to ${pin} yet.`) });
    } catch {
      setPinResult({ ok: false, text: 'Could not check right now — please try again.' });
    }
  };

  const faqs = [
    eta && { q: 'How long does delivery take within Chennai?', a: `Orders to Chennai PIN codes usually arrive in ${eta}.` },
    freeAbove && { q: 'Is delivery free?', a: `Delivery is free on orders above ₹${freeAbove}.` },
    pickup && { q: 'Can I collect my order in person?', a: `Yes — pickup is available at ${pickup.address}${pickup.hours ? ` (${pickup.hours})` : ''}.` },
    { q: 'Do you deliver outside Chennai?', a: 'Yes. Enter your PIN code above to check delivery to any location in India.' },
  ].filter(Boolean);

  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Chennai', path: PATH }];

  return (
    <div className="relative min-h-screen pt-28 pb-20 font-sans text-ink">
      <SEO
        title={`Millet Cookies, Ghee & Honey Delivered in Chennai | ${BRAND}`}
        description={`Order Alimenture millet cookies, A2 ghee, raw honey and bakes in Chennai${eta ? ` — delivered in ${eta}` : ''}${freeAbove ? `, free above ₹${freeAbove}` : ''}. Check delivery to your PIN code.`}
        url={PATH}
        jsonLd={breadcrumbJsonLd(crumbs)}
      />
      <div className="container mx-auto px-4 max-w-4xl space-y-10">
        <nav aria-label="Breadcrumb" className="kicker text-ink-muted flex items-center gap-1.5">
          <Link to="/" className="hover:text-berry">Home</Link><span>/</span><span className="text-berry">Chennai</span>
        </nav>

        <header className="space-y-4">
          <h1 className="display-lg text-[2.4rem] sm:text-[3rem]">Alimenture in Chennai</h1>
          <p className="text-ink-soft text-[15px] font-medium leading-relaxed">
            Alimenture is based in Chennai, where our cookies and bakes are made and every order is dispatched from.
            Order online and we&rsquo;ll deliver to your door{eta ? ` in ${eta}` : ''}.
          </p>
        </header>

        <section className="glass rounded-panel p-6 sm:p-8 space-y-4">
          <h2 className="font-display font-bold text-xl flex items-center gap-2"><Search className="h-5 w-5 text-berry" /> Check delivery to your PIN code</h2>
          <form onSubmit={checkPin} className="flex gap-3 flex-wrap">
            <input
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 600017"
              aria-label="PIN code"
              className="glass-sm h-12 px-4 rounded-xl flex-1 min-w-[160px] focus:outline-none"
            />
            <button type="submit" className="btn-berry h-12 px-6 rounded-xl text-[11px] font-extrabold uppercase tracking-[0.12em]">Check</button>
          </form>
          {pinResult === 'loading' && <p className="text-sm text-ink-muted">Checking…</p>}
          {pinResult && pinResult !== 'loading' && (
            <p className={`text-sm font-semibold ${pinResult.ok ? 'text-leaf' : 'text-danger'}`}>{pinResult.text}</p>
          )}
        </section>

        <section className="grid sm:grid-cols-2 gap-5">
          <div className="glass rounded-panel p-6 space-y-2">
            <h2 className="font-display font-bold text-lg flex items-center gap-2"><Truck className="h-5 w-5 text-berry" /> Delivery in Chennai</h2>
            <ul className="text-sm text-ink-soft space-y-1.5 font-medium">
              {eta && <li>Usual delivery time: {eta}</li>}
              {freeAbove && <li>Free delivery on orders above ₹{freeAbove}</li>}
              <li>Dispatched from our Chennai kitchen</li>
            </ul>
          </div>
          {pickup && (
            <div className="glass rounded-panel p-6 space-y-2">
              <h2 className="font-display font-bold text-lg flex items-center gap-2"><Store className="h-5 w-5 text-berry" /> Pickup</h2>
              <p className="text-sm text-ink-soft font-medium flex gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0" /> {pickup.address}</p>
              {pickup.hours && <p className="text-sm text-ink-muted">{pickup.hours}</p>}
              {pickup.mapUrl && <a href={pickup.mapUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-berry">Get directions</a>}
            </div>
          )}
        </section>

        {categories.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl">What you can order</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Link key={c.id} to={categoryPath(c.name)} className="btn-glass h-10 px-4 rounded-full text-sm font-bold inline-flex items-center">
                  {c.name}
                </Link>
              ))}
              <Link to="/shop" className="btn-glass h-10 px-4 rounded-full text-sm font-bold inline-flex items-center">All products</Link>
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="font-display font-bold text-xl">Frequently asked questions</h2>
          {faqs.map((f) => (
            <div key={f.q}>
              <h3 className="font-bold text-[15px]">{f.q}</h3>
              <p className="text-sm text-ink-soft font-medium mt-1">{f.a}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
