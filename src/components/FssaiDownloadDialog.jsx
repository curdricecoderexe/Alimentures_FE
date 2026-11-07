import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, User, Phone, Loader2, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { API_BASE } from '../lib/api';

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
 * FSSAI certificate download, opened from the footer. Gated by name + mobile:
 * each download is saved as a lead (Admin → Leads, document: FSSAI).
 * Certificate settings live in Admin → Catalogue.
 */
export default function FssaiDownloadDialog({ open, onClose, info }) {
  const [name, setName] = useState(() => readSaved().name || '');
  const [mobile, setMobile] = useState(() => readSaved().mobile || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    setDone(false);
    setError('');
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

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

  const validTill = formatDate(info?.validUpto);
  const inputWrap = 'mt-1.5 flex items-center gap-3 h-11 px-3.5 rounded-xl bg-[#FAF6F0] border border-gray-200 focus-within:border-berry/50 focus-within:ring-4 focus-within:ring-berry/10 transition-all';

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="fssai-dialog"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm font-sans"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="fssai-dialog-title"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3.5 right-3.5 h-9 w-9 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>

            {/* header */}
            <div className="flex items-center gap-4 p-6 pb-5 border-b border-gray-100">
              <span className="h-14 w-20 shrink-0 rounded-xl border border-gray-100 bg-white flex items-center justify-center px-2">
                <img src="/fssai.png" alt="FSSAI" className="h-8 w-auto object-contain" />
              </span>
              <div className="min-w-0 pr-8">
                <h2 id="fssai-dialog-title" className="font-display font-bold text-lg text-gray-900 leading-tight">FSSAI certificate</h2>
                <p className="mt-1 text-[12.5px] text-gray-500 font-medium">
                  {info?.registrationNo ? <>Reg. No. <span className="font-mono font-semibold text-gray-800">{info.registrationNo}</span></> : 'Registered food business'}
                  {validTill && <> · Valid till {validTill}</>}
                </p>
              </div>
            </div>

            <div className="p-6">
              {done ? (
                <div className="text-center py-2">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                  <p className="mt-3 font-display font-bold text-lg text-gray-900">Thank you, {name.trim().split(' ')[0]}!</p>
                  <p className="mt-1 text-sm text-gray-500 font-medium">Your download has started. Check your downloads folder.</p>
                  <button
                    onClick={submit}
                    disabled={busy}
                    className="mt-5 h-10 px-5 rounded-xl border border-gray-200 text-gray-600 text-[11px] font-extrabold uppercase tracking-[0.14em] inline-flex items-center gap-2 hover:border-berry/40 hover:text-berry disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download again
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} noValidate className="space-y-4">
                  <p className="text-[13px] text-gray-600 font-medium">Enter your name and mobile number to download the certificate (PDF).</p>
                  <label className="block">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-gray-500">Your name</span>
                    <span className={inputWrap}>
                      <User className="h-4 w-4 text-berry shrink-0" />
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={60}
                        autoComplete="name"
                        placeholder="Full name"
                        autoFocus
                        className="flex-1 min-w-0 bg-transparent outline-none text-[14.5px] font-medium text-gray-900 placeholder:text-gray-400"
                      />
                    </span>
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-gray-500">Mobile number</span>
                    <span className={inputWrap}>
                      <Phone className="h-4 w-4 text-berry shrink-0" />
                      <span className="text-[14.5px] font-bold text-gray-500 shrink-0">+91</span>
                      <input
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/[^\d\s]/g, '').slice(0, 12))}
                        inputMode="numeric"
                        autoComplete="tel-national"
                        placeholder="98765 43210"
                        className="flex-1 min-w-0 bg-transparent outline-none text-[14.5px] font-medium tracking-wide text-gray-900 placeholder:text-gray-400"
                      />
                    </span>
                  </label>
                  {error && <p className="text-[12px] font-bold text-red-500" role="alert">{error}</p>}
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full h-12 rounded-xl btn-berry text-white text-[11.5px] font-extrabold uppercase tracking-[0.14em] inline-flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {busy ? 'Preparing…' : 'Download certificate'}
                  </button>
                  <p className="flex items-start gap-2 text-[11px] leading-relaxed text-gray-400 font-medium">
                    <ShieldCheck className="h-3.5 w-3.5 mt-0.5 text-emerald-600 shrink-0" />
                    <span>
                      By downloading you agree that Alimenture may contact you about our products. See our{' '}
                      <Link to="/policies" onClick={onClose} className="text-berry font-bold hover:underline">privacy policy</Link>.
                    </span>
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
