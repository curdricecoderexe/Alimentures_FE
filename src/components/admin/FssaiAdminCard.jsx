import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BadgeCheck, Upload, Eye, Save, Loader2, RotateCcw, Users, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { authenticatedFetch, API_BASE } from '../../lib/api';
import { uploadPdf } from '../../lib/uploadPdf';

const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');
const PDF_MAX_BYTES = 25 * 1024 * 1024;
const formatKB = (n) => (n ? `${Math.round(n / 1024)} KB` : '—');

async function call(path, options = {}) {
  const res = await authenticatedFetch(`${API_BASE}${path}`, {
    ...options,
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
  });
  if (!res) return null;
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.error || 'Request failed');
  return json;
}

/**
 * Admin → Catalogue: FSSAI certificate download settings. The certificate is
 * bundled with the API; upload a renewed one here to replace it.
 */
export default function FssaiAdminCard() {
  const [info, setInfo] = useState(null);
  const [form, setForm] = useState({ title: '', registrationNo: '', validUpto: '' });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const inputRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const json = await call('/catalogue/admin/fssai');
      if (!json) return;
      setInfo(json.data);
      setForm({ title: json.data.title || '', registrationNo: json.data.registrationNo || '', validUpto: json.data.validUpto || '' });
    } catch (err) {
      toast.error(err.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async (fn, ok) => {
    setBusy(true);
    try {
      await fn();
      if (ok) toast.success(ok);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const toggle = () => run(() => call('/catalogue/admin/fssai', { method: 'PATCH', body: JSON.stringify({ enabled: !info.enabled }) }),
    info.enabled ? 'FSSAI download hidden from the homepage' : 'FSSAI download shown on the homepage');

  const save = () => run(() => call('/catalogue/admin/fssai', { method: 'PATCH', body: JSON.stringify(form) }), 'Certificate details saved');

  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.type && file.type !== 'application/pdf') return toast.error('Please choose a PDF file');
    if (file.size > PDF_MAX_BYTES) return toast.error('PDF must be under 25 MB');
    run(() => uploadPdf(file, setProgress, '/catalogue/admin/fssai/file'), 'Certificate uploaded');
  };

  const revert = () => run(() => call('/catalogue/admin/fssai/file', { method: 'DELETE' }), 'Using the bundled certificate again');

  if (!info) return null;

  const field = 'w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C41E6B]';
  const label = 'text-[10px] font-bold uppercase tracking-widest text-gray-400';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <BadgeCheck className="w-5 h-5" />
          </span>
          <div>
            <h2 className="font-bold text-gray-900">FSSAI certificate</h2>
            <p className="text-xs text-gray-400 font-medium">
              Homepage download, gated by name + mobile · {info.uploaded ? `uploaded file (${formatKB(info.size)})` : `bundled certificate (${formatKB(info.size)})`}
            </p>
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={busy}
          className={`h-9 px-3.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 ${
            info.enabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-50 text-gray-500 border border-gray-200'
          }`}
        >
          {info.enabled ? 'Shown on homepage' : 'Hidden'}
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <label className="space-y-1.5 block sm:col-span-3">
          <span className={label}>Heading</span>
          <input value={form.title} maxLength={100} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={field} />
        </label>
        <label className="space-y-1.5 block sm:col-span-2">
          <span className={label}>Registration number</span>
          <input value={form.registrationNo} inputMode="numeric" maxLength={14}
            onChange={(e) => setForm((f) => ({ ...f, registrationNo: e.target.value.replace(/\D/g, '').slice(0, 14) }))} className={`${field} tracking-wider`} />
        </label>
        <label className="space-y-1.5 block">
          <span className={label}>Valid up to</span>
          <input type="date" value={form.validUpto} onChange={(e) => setForm((f) => ({ ...f, validUpto: e.target.value }))} className={field} />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={save} disabled={busy} className="h-10 px-4 rounded-xl bg-[#C41E6B] text-white text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 hover:brightness-110 disabled:opacity-50">
          <Save className="w-3.5 h-3.5" /> Save details
        </button>
        <a href={`${API_ORIGIN}${info.previewUrl}`} target="_blank" rel="noopener noreferrer"
          className="h-10 px-4 rounded-xl border border-gray-200 text-gray-600 text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 hover:border-[#C41E6B] hover:text-[#C41E6B]">
          <Eye className="w-3.5 h-3.5" /> Preview
        </a>
        <button onClick={() => inputRef.current?.click()} disabled={busy}
          className="h-10 px-4 rounded-xl border border-gray-200 text-gray-600 text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 hover:border-[#C41E6B] hover:text-[#C41E6B] disabled:opacity-50">
          {progress != null ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {progress != null ? `Uploading ${Math.round(progress * 100)}%` : 'Upload renewed certificate'}
        </button>
        {info.uploaded && (
          <button onClick={revert} disabled={busy}
            className="h-10 px-4 rounded-xl border border-gray-200 text-gray-500 text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 hover:border-red-300 hover:text-red-500 disabled:opacity-50">
            <RotateCcw className="w-3.5 h-3.5" /> Use bundled certificate
          </button>
        )}
        <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={onFile} />
      </div>

      <Link to="/admin/leads" className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Users className="w-4 h-4 text-[#C41E6B]" /> {info.leadCount} certificate download{info.leadCount === 1 ? '' : 's'}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#C41E6B] inline-flex items-center gap-1">View in Leads <ArrowRight className="w-3.5 h-3.5" /></span>
      </Link>
    </motion.div>
  );
}
