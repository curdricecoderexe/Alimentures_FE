import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BadgeCheck, Download, User, Phone, Loader2, CheckCircle2, ShieldCheck, X, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { API_BASE } from '../../lib/api';

const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');
// Shared with the catalogue form, so a returning visitor doesn't retype.
const SAVED_KEY = 'alim_catalogue_lead_v1';

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

const formatDate = (iso) => {
  const d = iso ? new Date(`${iso}T00:00:00`) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
};

/**
 * ⸻ FSSAI CERTIFICATE ⸻
 * Trust card with a lead-gated certificate download (name + mobile).
 * Leads appear in Admin → Leads (document: FSSAI); settings in Admin → Catalogue.
 */
export default function FssaiCertificate() {
  const [info, setInfo] = useState(null);
  const saved = readSaved();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(saved.name || '');
  const [mobile, setMobile] = useState(saved.mobile || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/catalogue/fssai`)
      .then((r) => r.json())
      .then((j) => { if (alive && j.success) setInfo(j.data); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!info?.available) return null;

  const submit = async (e) => {
    e?.preventDefault();
    setError('');
    const digits = mobile.replace(/\D/g, '').slice(-10);
    if (name.trim().length < 2) return setError('Please enter your name');
    if (!/^[6-9]\d{9}$/.test(digits)) return setError('Please enter a valid 10-digit mobile number');

    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/catalogue/fssai/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), mobile: digits }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success || !json.data?.downloadUrl) throw new Error(json.error || 'Something went wrong. Please try again.');
      try { localStorage.setItem(SAVED_KEY, JSON.stringify({ name: name.trim(), mobile: digits })); } catch { /* ignore */ }
      startDownload(json.data.downloadUrl);
      toast.success('Your FSSAI certificate download has started');
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const validTill = formatDate(info.validUpto);
  const inputWrap = 'mt-1.5 flex items-center gap-3 h-12 px-4 rounded-2xl bg-cream/60 border border-hairline focus-within:border-berry/50 focus-within:ring-4 focus-within:ring-berry/10 transition-all';

  return (
    <section id="fssai" className="relative z-10 px-4 sm:px-6 py-10 sm:py-14 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-[1180px] mx-auto rounded-[1.75rem] bg-white border border-hairline shadow-[0_30px_70px_-40px_rgba(121,8,63,0.35)] overflow-hidden"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-5 sm:gap-7 p-5 sm:p-8">
          <span className="shrink-0 mx-auto md:mx-0 h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center">
            <BadgeCheck className="h-8 w-8 sm:h-10 sm:w-10" />
          </span>

          <div className="flex-1 min-w-0 text-center md:text-left">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-emerald-700">FSSAI certified</p>
            <h2 className="mt-1.5 font-display font-bold text-ink text-xl sm:text-2xl lg:text-[1.75rem] leading-tight tracking-tight">
              {info.title}
            </h2>
            <p className="mt-2 text-[13px] sm:text-sm text-ink-soft font-medium">
              Registration No. <span className="font-bold text-ink tracking-wide">{info.registrationNo}</span>
              {validTill && <> · Valid till {validTill}</>}
            </p>
          </div>

          {!open && (
            <button
              onClick={() => { setOpen(true); setDone(false); }}
              className="shrink-0 self-center h-12 px-6 rounded-2xl btn-berry text-[11.5px] font-extrabold uppercase tracking-[0.14em] inline-flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" /> Download certificate
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-hairline bg-cream/40"
            >
              <div className="p-5 sm:p-8 relative">
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="absolute top-3 right-3 h-9 w-9 rounded-xl text-ink-muted hover:bg-white hover:text-ink flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>

                {done ? (
                  <div className="text-center py-2">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                    <p className="mt-3 font-display font-extrabold text-lg text-ink">Thank you, {name.trim().split(' ')[0]}!</p>
                    <p className="mt-1 text-sm text-ink-soft font-medium">Your certificate download has started. Check your downloads folder.</p>
                    <button
                      onClick={submit}
                      disabled={busy}
                      className="mt-4 h-10 px-5 rounded-xl border border-hairline text-ink-soft text-[11px] font-extrabold uppercase tracking-[0.14em] inline-flex items-center gap-2 hover:border-berry/40 hover:text-berry disabled:opacity-60"
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download again
                    </button>
                  </div>
                ) : (
                  <form onSubmit={submit} noValidate className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 sm:gap-4 items-end">
                    <p className="sm:col-span-3 text-[13px] text-ink-soft font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-berry shrink-0" />
                      Share your name and mobile number to download the certificate (PDF).
                    </p>
                    <label className="block">
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-ink-soft">Your name</span>
                      <span className={inputWrap}>
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
                    <label className="block">
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-ink-soft">Mobile number</span>
                      <span className={inputWrap}>
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
                    <button
                      type="submit"
                      disabled={busy}
                      className="h-12 px-6 rounded-2xl btn-berry text-[11.5px] font-extrabold uppercase tracking-[0.14em] inline-flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      {busy ? 'Preparing…' : 'Download'}
                    </button>
                    {error && <p className="sm:col-span-3 text-[12px] font-bold text-red-500" role="alert">{error}</p>}
                    <p className="sm:col-span-3 flex items-start gap-2 text-[11px] leading-relaxed text-ink-muted font-medium">
                      <ShieldCheck className="h-3.5 w-3.5 mt-0.5 text-emerald-600 shrink-0" />
                      <span>
                        By downloading you agree that Alimenture may contact you about our products. See our{' '}
                        <Link to="/policies" className="text-berry font-bold hover:underline">privacy policy</Link>.
                      </span>
                    </p>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
