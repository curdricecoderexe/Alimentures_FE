import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, User, Phone, Loader2, CheckCircle2, BookOpen, ShieldCheck, Check } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '../../lib/api';
import { useAppearance } from '../../lib/appearance';
import catalogueBgDefault from '../../assets/cas/banner.webp';
import CatalogueBooklet from './CatalogueBooklet';

/* Frosted glass input shell (sits on the liquid-glass form). */
const GLASS_FIELD = 'mt-1.5 flex items-center h-12 rounded-[12px] overflow-hidden bg-white/[0.12] border border-white/25 focus-within:border-white/60 focus-within:bg-white/[0.18] focus-within:ring-4 focus-within:ring-white/15 transition-[border-color,background-color,box-shadow]';

const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');
const SAVED_KEY = 'alim_catalogue_lead_v1';

const DEFAULT_TITLE = 'Download our product catalogue';
const DEFAULT_DESCRIPTION = 'Every Alimenture product in one place — share your name and mobile number and the catalogue downloads instantly.';
const DEFAULT_DESCRIPTION_NO_FILE = 'Every Alimenture product in one place — share your name and mobile number and our team will send the catalogue to you.';

const formatMB = (n) => (n ? `${(n / (1024 * 1024)).toFixed(1)} MB` : null);

function readSaved() {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY)) || {}; } catch { return {}; }
}

function startDownload(url) {
  const a = document.createElement('a');
  a.href = url.startsWith('http') ? url : `${API_ORIGIN}${url}`;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * ⸻ CATALOGUE DOWNLOAD ⸻
 * Lead-gated PDF download (Admin → Catalogue). Shown whenever enabled; with no
 * PDF uploaded yet it still collects requests and the team follows up.
 */
export default function CatalogueDownload() {
  const [info, setInfo] = useState(null);
  const saved = readSaved();
  const [name, setName] = useState(saved.name || '');
  const [mobile, setMobile] = useState(saved.mobile || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/catalogue`)
      .then((r) => r.json())
      .then((j) => { if (alive && j.success) setInfo(j.data); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const appearance = useAppearance();
  const bgImage = appearance.catalogueBg || catalogueBgDefault;

  if (!info?.available) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const digits = mobile.replace(/\D/g, '').slice(-10);
    if (name.trim().length < 2) return setError('Please enter your name');
    if (!/^[6-9]\d{9}$/.test(digits)) return setError('Please enter a valid 10-digit mobile number');

    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/catalogue/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), mobile: digits }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Something went wrong. Please try again.');
      try { localStorage.setItem(SAVED_KEY, JSON.stringify({ name: name.trim(), mobile: digits })); } catch { /* ignore */ }
      if (json.data?.downloadUrl) {
        startDownload(json.data.downloadUrl);
        toast.success('Your catalogue download has started');
      } else {
        toast.success('Thank you! We will share the catalogue with you shortly.');
      }
      setDone(json.data?.downloadUrl ? 'downloaded' : 'requested');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const hasFile = info.hasFile !== false;
  const size = hasFile ? formatMB(info.size) : null;
  const title = info.title || DEFAULT_TITLE;
  const description = info.description || (hasFile ? DEFAULT_DESCRIPTION : DEFAULT_DESCRIPTION_NO_FILE);
  const promises = [
    'Millet cookies, ghee, honey & more',
    hasFile ? 'Instant PDF, yours to keep' : 'Sent straight to your mobile',
    'Easy to share with family & friends',
  ];
  const mobileDigits = mobile.replace(/\D/g, '').slice(-10);

  return (
    <section id="catalogue" className="relative z-10 overflow-clip font-sans text-white mb-16 sm:mb-24">
      {/* full-bleed background photo for the whole section (Admin → Appearance → Catalogue download — Background) */}
      <img src={bgImage} alt="" aria-hidden="true" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover object-center scale-105 blur-[3px]" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/25" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-[1240px] 2xl:max-w-[1400px] mx-auto"
      >
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-10 items-center px-5 py-12 sm:px-8 sm:py-14 lg:py-16">
          {/* ── Pitch + animated catalogue booklet ── */}
          <div className="lg:col-span-6 [text-shadow:0_1px_16px_rgba(0,0,0,0.35)]">
            <span className="inline-flex items-center gap-2 h-8 px-3 rounded-full bg-white/15 backdrop-blur-md ring-1 ring-white/30 text-[12px] font-semibold text-white">
              <BookOpen className="h-4 w-4 text-gold-light" /> Free product catalogue
            </span>
            <h2 className="mt-4 headline headline-on-dark text-[1.9rem] leading-[1.08] sm:text-[2.4rem] lg:text-[2.6rem] [&_em]:[background:none] [&_em]:text-[#FFE2A8]">
              {title}
            </h2>
            <p className="mt-2.5 text-[14.5px] sm:text-[15px] leading-relaxed text-white/85 max-w-[32rem]">{description}</p>

            <div className="mt-14 sm:mt-16 [text-shadow:none]">
              <CatalogueBooklet />
            </div>

          </div>

          {/* ── Liquid-glass form ── */}
          <div className="lg:col-span-6 lg:pl-6 xl:pl-12">
            <div className="liquid-glass rounded-[24px] p-5 sm:p-7">
              <AnimatePresence mode="wait" initial={false}>
                {done ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-3 sm:py-5"
                  >
                    <span className="mx-auto h-14 w-14 rounded-full bg-white/20 ring-1 ring-white/40 text-white flex items-center justify-center">
                      <CheckCircle2 className="h-7 w-7" />
                    </span>
                    <h3 className="mt-4 text-[20px] font-semibold text-white">Thank you, {name.trim().split(' ')[0]}!</h3>
                    <p className="mt-1.5 text-[14px] text-white/80">
                      {done === 'downloaded'
                        ? 'Your catalogue download has started. Check your downloads folder.'
                        : `Our team will share the catalogue with you on +91 ${mobileDigits} shortly.`}
                    </p>
                    <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
                      {done === 'downloaded' && (
                        <button
                          type="button"
                          onClick={submit}
                          disabled={busy}
                          className="h-11 px-5 rounded-[12px] bg-gold-light text-ink text-[14px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#F0A020] disabled:opacity-60 transition-colors [text-shadow:none]"
                        >
                          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download again
                        </button>
                      )}
                      <Link to="/shop" className="h-11 px-5 rounded-[12px] bg-white/10 ring-1 ring-white/35 text-white text-[14px] font-semibold inline-flex items-center justify-center hover:bg-white/20 transition-colors">
                        Shop now
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={submit} noValidate>
                    {/* 2-step hint */}
                    <ol className="flex items-center gap-2 text-[12px] font-medium text-white/70">
                      <li className="inline-flex items-center gap-1.5 text-white">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-ink text-[11px] [text-shadow:none]">1</span> Your details
                      </li>
                      <span aria-hidden="true" className="h-px w-6 bg-white/30" />
                      <li className="inline-flex items-center gap-1.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30 text-white text-[11px]">2</span>
                        {hasFile ? 'Instant PDF' : 'We send it to you'}
                      </li>
                    </ol>

                    <h3 className="mt-4 text-[22px] sm:text-[24px] font-semibold tracking-[-0.01em] text-white">Get your free copy</h3>
                    <p className="mt-1 text-[13.5px] text-white/70">Takes 10 seconds. No spam, ever.</p>

                    <label className="block mt-5">
                      <span className="text-[13px] font-semibold text-white">Your name</span>
                      <span className={GLASS_FIELD}>
                        <User className="h-[18px] w-[18px] text-white/60 shrink-0 ml-3.5" />
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          maxLength={60}
                          autoComplete="name"
                          placeholder="Full name"
                          className="flex-1 min-w-0 h-full bg-transparent px-3 outline-none text-[15px] text-white placeholder:text-white/50"
                        />
                      </span>
                    </label>

                    <label className="block mt-4">
                      <span className="text-[13px] font-semibold text-white">Mobile number</span>
                      <span className={GLASS_FIELD}>
                        <span className="flex items-center gap-1.5 h-full px-3 bg-white/10 border-r border-white/20 text-[14px] font-medium text-white/85 shrink-0">
                          <Phone className="h-4 w-4 text-white/60" /> +91
                        </span>
                        <input
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value.replace(/[^\d\s]/g, '').slice(0, 12))}
                          inputMode="numeric"
                          autoComplete="tel-national"
                          placeholder="98765 43210"
                          className="flex-1 min-w-0 h-full bg-transparent px-3 outline-none text-[15px] tracking-wide text-white placeholder:text-white/50"
                        />
                      </span>
                    </label>

                    {error && <p className="mt-3 text-[13px] font-semibold text-[#FFD1CC]" role="alert">{error}</p>}

                    <button
                      type="submit"
                      disabled={busy}
                      className="group mt-5 w-full h-12 rounded-[12px] bg-gold-light text-ink text-[15px] font-semibold inline-flex items-center justify-center gap-2 shadow-[0_12px_24px_-12px_rgba(0,0,0,0.5)] hover:bg-[#F0A020] active:scale-[0.99] disabled:opacity-60 transition-[background-color,transform] [text-shadow:none]"
                    >
                      {busy ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Download className="h-[18px] w-[18px] transition-transform group-hover:translate-y-0.5" />}
                      {busy ? (hasFile ? 'Preparing…' : 'Sending…') : (hasFile ? 'Download catalogue' : 'Request catalogue')}
                    </button>

                    <p className="mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-white/70">
                      <ShieldCheck className="h-4 w-4 mt-px text-white/80 shrink-0" />
                      <span>
                        By {hasFile ? 'downloading' : 'submitting'} you agree that Alimenture may contact you about our products. See our{' '}
                        <Link to="/policies" className="font-semibold text-white underline underline-offset-2 decoration-white/40 hover:decoration-white">privacy policy</Link>.
                      </span>
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
            <ul className="mt-4 flex flex-wrap justify-center gap-2">
              {[...promises, size && `PDF · ${size}`].filter(Boolean).map((line) => (
                <li key={line} className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-black/25 backdrop-blur-md ring-1 ring-white/20 text-[12px] text-white/90">
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.4} /> {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
