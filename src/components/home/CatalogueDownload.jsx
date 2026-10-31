import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, User, Phone, Loader2, CheckCircle2, BookOpen, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '../../lib/api';

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

  return (
    <section id="catalogue" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-[1180px] mx-auto rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-berry-deep via-berry to-[#8E0E4E] shadow-[0_50px_100px_-40px_rgba(121,8,63,0.7)]"
      >
        {/* texture + glows */}
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
        <div aria-hidden="true" className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-gold-light/30 blur-[100px]" />
        <div aria-hidden="true" className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-berry-bright/40 blur-[110px]" />

        <div className="relative grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-12 items-center p-6 sm:p-10 lg:p-14">
          {/* ── Pitch + catalogue mock ── */}
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center sm:items-start lg:items-start xl:items-center gap-8 sm:gap-10 text-center sm:text-left">
            {/* stacked "booklet" */}
            <div className="relative shrink-0 w-40 sm:w-44 aspect-[3/4]" aria-hidden="true">
              <div className="absolute inset-0 translate-x-4 translate-y-3 rotate-6 rounded-2xl bg-white/25" />
              <div className="absolute inset-0 translate-x-2 translate-y-1.5 rotate-3 rounded-2xl bg-white/45" />
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 -rotate-2 rounded-2xl bg-gradient-to-br from-[#FFFDF8] to-cream-deep shadow-2xl p-4 flex flex-col"
              >
                <span className="h-1.5 w-10 rounded-full bg-gradient-to-r from-berry to-gold-light" />
                <p className="mt-3 font-display font-extrabold text-[15px] leading-tight text-ink">Alimenture</p>
                <p className="font-display font-bold text-[11px] text-berry tracking-wide uppercase">Catalogue</p>
                <div className="mt-auto space-y-1.5">
                  <span className="block h-1.5 w-full rounded-full bg-ink/10" />
                  <span className="block h-1.5 w-4/5 rounded-full bg-ink/10" />
                  <span className="block h-1.5 w-3/5 rounded-full bg-ink/10" />
                </div>
                <span className="absolute -bottom-3 -right-3 inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-gradient-to-r from-gold to-gold-light text-white text-[10px] font-extrabold shadow-lg">
                  <FileText className="h-3.5 w-3.5" /> PDF
                </span>
              </motion.div>
            </div>

            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-white/12 border border-white/20 text-white/90 text-[10px] font-extrabold uppercase tracking-[0.2em]">
                <BookOpen className="h-3.5 w-3.5 text-gold-light" /> Free catalogue
              </span>
              <h2 className="mt-4 font-display font-bold text-white text-3xl sm:text-4xl lg:text-[2.6rem] leading-[1.08] tracking-tight">
                {info.title || DEFAULT_TITLE}
              </h2>
              <p className="mt-4 text-white/80 text-[14.5px] sm:text-[15px] leading-relaxed font-medium max-w-md mx-auto sm:mx-0">
                {info.description || (hasFile ? DEFAULT_DESCRIPTION : DEFAULT_DESCRIPTION_NO_FILE)}
              </p>
              {size && (
                <p className="mt-4 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-gold-light">
                  <FileText className="h-3.5 w-3.5" /> PDF · {size}
                </p>
              )}
            </div>
          </div>

          {/* ── Form ── */}
          <div className="relative rounded-[1.6rem] bg-white/95 backdrop-blur-xl p-5 sm:p-7 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)]">
            <AnimatePresence mode="wait" initial={false}>
              {done ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-4 sm:py-6"
                >
                  <span className="mx-auto h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8" />
                  </span>
                  <h3 className="mt-4 font-display font-extrabold text-xl text-ink">Thank you, {name.trim().split(' ')[0]}!</h3>
                  <p className="mt-2 text-sm text-ink-soft font-medium">
                    {done === 'downloaded'
                      ? 'Your catalogue download has started. Check your downloads folder.'
                      : `Our team will share the catalogue with you on +91 ${mobile.replace(/\D/g, '').slice(-10)} shortly.`}
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
                    {done === 'downloaded' && (
                      <button
                        onClick={submit}
                        disabled={busy}
                        className="btn-berry h-11 px-5 rounded-xl text-[11px] font-extrabold uppercase tracking-[0.14em] inline-flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download again
                      </button>
                    )}
                    <Link
                      to="/shop"
                      className="h-11 px-5 rounded-xl border border-hairline text-ink-soft text-[11px] font-extrabold uppercase tracking-[0.14em] inline-flex items-center justify-center hover:border-berry/40 hover:text-berry transition-colors"
                    >
                      Shop now
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={submit} noValidate>
                  <h3 className="font-display font-extrabold text-xl sm:text-2xl text-ink">Get the catalogue</h3>
                  <p className="mt-1 text-[13px] text-ink-muted font-medium">
                    {hasFile ? 'Takes 10 seconds. No spam, ever.' : 'We’ll send it to your mobile. No spam, ever.'}
                  </p>

                  <label className="block mt-5">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-ink-soft">Your name</span>
                    <span className="mt-1.5 flex items-center gap-3 h-12 px-4 rounded-2xl bg-cream/60 border border-hairline focus-within:border-berry/50 focus-within:ring-4 focus-within:ring-berry/10 transition-all">
                      <User className="h-4 w-4 text-berry shrink-0" />
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={60}
                        autoComplete="name"
                        placeholder="Full name"
                        className="flex-1 min-w-0 bg-transparent outline-none text-[15px] font-medium placeholder:text-ink-muted"
                      />
                    </span>
                  </label>

                  <label className="block mt-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-ink-soft">Mobile number</span>
                    <span className="mt-1.5 flex items-center gap-3 h-12 px-4 rounded-2xl bg-cream/60 border border-hairline focus-within:border-berry/50 focus-within:ring-4 focus-within:ring-berry/10 transition-all">
                      <Phone className="h-4 w-4 text-berry shrink-0" />
                      <span className="text-[15px] font-bold text-ink-soft shrink-0">+91</span>
                      <input
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/[^\d\s]/g, '').slice(0, 12))}
                        inputMode="numeric"
                        autoComplete="tel-national"
                        placeholder="98765 43210"
                        className="flex-1 min-w-0 bg-transparent outline-none text-[15px] font-medium tracking-wide placeholder:text-ink-muted"
                      />
                    </span>
                  </label>

                  {error && <p className="mt-3 text-[12px] font-bold text-red-500" role="alert">{error}</p>}

                  <button
                    type="submit"
                    disabled={busy}
                    className="mt-5 w-full py-3.5 rounded-2xl btn-berry text-[12px] font-extrabold uppercase tracking-[0.15em] inline-flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {busy ? (hasFile ? 'Preparing…' : 'Sending…') : (hasFile ? 'Download catalogue' : 'Request catalogue')}
                  </button>

                  <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-ink-muted font-medium">
                    <ShieldCheck className="h-3.5 w-3.5 mt-0.5 text-emerald-600 shrink-0" />
                    <span>
                      By {hasFile ? 'downloading' : 'submitting'} you agree that Alimenture may contact you about our products. See our{' '}
                      <Link to="/policies" className="text-berry font-bold hover:underline">privacy policy</Link>.
                    </span>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
