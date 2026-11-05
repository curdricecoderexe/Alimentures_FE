import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, Upload, Trash2, Loader2, Save, Eye, FileText, Users, Phone, ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { authenticatedFetch, API_BASE } from '../../lib/api';
import DashboardSkeleton from '../../components/skeletons/DashboardSkeleton';
import useSkeletonLoader from '../../hooks/useSkeletonLoader';
import FssaiAdminCard from '../../components/admin/FssaiAdminCard';
import { uploadPdf } from '../../lib/uploadPdf';

const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');
const PDF_MAX_BYTES = 25 * 1024 * 1024; // matches the API's CATALOGUE_MAX_BYTES
const formatMB = (n) => `${(n / (1024 * 1024)).toFixed(1)} MB`;
const formatDate = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

async function call(path, options = {}) {
  const res = await authenticatedFetch(`${API_BASE}${path}`, {
    ...options,
    headers: options.body && typeof options.body === 'string' ? { 'Content-Type': 'application/json', ...options.headers } : options.headers,
  });
  if (!res) return null;
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.error || 'Request failed');
  return json;
}

export default function AdminCatalogue() {
  const [info, setInfo] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', enabled: true });
  const [leads, setLeads] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const showSkeleton = useSkeletonLoader(isLoading);
  const inputRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const [meta, list] = await Promise.all([call('/catalogue/admin'), call('/catalogue/admin/leads?limit=5')]);
      if (meta) {
        setInfo(meta.data);
        setForm({ title: meta.data.title, description: meta.data.description, enabled: meta.data.enabled });
      }
      if (list) setLeads(list.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load the catalogue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);


  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) return toast.error('Please choose a PDF file');
    if (file.size > PDF_MAX_BYTES) return toast.error(`PDF is ${formatMB(file.size)} — the limit is ${formatMB(PDF_MAX_BYTES)}`);
    setProgress(0);
    const id = toast.loading('Uploading catalogue…');
    try {
      await uploadPdf(file, setProgress);
      toast.success('Catalogue uploaded', { id });
      await load();
    } catch (err) {
      toast.error(err.message || 'Upload failed', { id });
    } finally {
      setProgress(null);
    }
  };

  const saveDetails = async () => {
    setBusy(true);
    try {
      const json = await call('/catalogue/admin', { method: 'PATCH', body: JSON.stringify(form) });
      if (json) toast.success(json.message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeFile = async () => {
    setBusy(true);
    try {
      const json = await call('/catalogue/admin/file', { method: 'DELETE' });
      if (json) toast.success(json.message);
      setConfirmRemove(false);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };



  if (isLoading) {
    if (showSkeleton) return <DashboardSkeleton />;
    return <div className="min-h-screen" />;
  }

  const uploading = progress !== null;

  return (
    <div className="p-3 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 bg-transparent min-h-screen font-sans">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="w-11 h-11 rounded-2xl bg-[#C41E6B]/10 flex items-center justify-center text-[#C41E6B] shrink-0">
            <BookOpen className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Catalogue</h1>
            <p className="text-xs sm:text-sm text-gray-400 font-medium mt-0.5">
              The PDF visitors download from the homepage after sharing their name and mobile.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-3.5 py-2 rounded-xl self-start">
          <Users className="w-3.5 h-3.5 text-[#C41E6B]" /> {info?.leadCount ?? leads.length} leads
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5">
        {/* file */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 flex flex-col gap-4 min-w-0">
          <h2 className="font-bold text-sm text-gray-900">Catalogue PDF</h2>
          {info?.hasFile ? (
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 min-w-0">
              <span className="w-12 h-14 rounded-xl bg-gradient-to-br from-[#C41E6B] to-[#8E0E4E] text-white flex items-center justify-center shrink-0 shadow-sm">
                <FileText className="w-6 h-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-gray-900 truncate">{info.filename}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{formatMB(info.size)} · uploaded {formatDate(info.uploadedAt)}</p>
              </div>
              {info.previewUrl && (
                <a
                  href={`${API_ORIGIN}${info.previewUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 px-3 rounded-xl border border-gray-200 text-gray-600 text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 hover:border-[#C41E6B] hover:text-[#C41E6B] transition-colors shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </a>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-2xl border-2 border-dashed border-gray-200 text-center">
              <FileText className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="mt-2 text-sm font-bold text-gray-500">No catalogue uploaded</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Visitors download a catalogue generated automatically from your live products. Upload a PDF to use your own design instead.</p>
              {info?.previewUrl && (
                <a
                  href={`${API_ORIGIN}${info.previewUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 h-9 px-3 rounded-xl border border-gray-200 text-gray-600 text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 hover:border-[#C41E6B] hover:text-[#C41E6B] transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> View generated catalogue
                </a>
              )}
            </div>
          )}

          {uploading && (
            <div className="space-y-1.5">
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-[#C41E6B] transition-[width]" style={{ width: `${progress * 100}%` }} />
              </div>
              <p className="text-[11px] font-bold text-gray-500">{Math.round(progress * 100)}% uploaded</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={busy || uploading}
              className="h-10 px-4 rounded-xl bg-[#221B1F] text-white text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 hover:bg-black transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {info?.hasFile ? 'Replace PDF' : 'Upload PDF'}
            </button>
            {info?.hasFile && (confirmRemove ? (
              <button onClick={removeFile} disabled={busy} className="h-10 px-4 rounded-xl bg-red-500 text-white text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 disabled:opacity-50">
                <Trash2 className="w-3.5 h-3.5" /> Confirm remove
              </button>
            ) : (
              <button onClick={() => setConfirmRemove(true)} disabled={busy || uploading} className="h-10 px-4 rounded-xl border border-gray-200 text-gray-500 text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 hover:border-red-400 hover:text-red-500 transition-colors disabled:opacity-50">
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-400">PDF only, up to {formatMB(PDF_MAX_BYTES)}. Keep it compressed so it downloads quickly on mobile.</p>
          <input ref={inputRef} type="file" accept="application/pdf,.pdf" onChange={handleFile} className="hidden" />
        </motion.div>

        {/* details */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 flex flex-col gap-4 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold text-sm text-gray-900">Homepage section</h2>
            <label className="inline-flex items-center gap-2 h-8 px-3 rounded-full border border-gray-200 text-[11px] font-bold text-gray-500 cursor-pointer whitespace-nowrap">
              <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} className="accent-[#C41E6B] w-4 h-4" />
              Show on site
            </label>
          </div>
          <label className="space-y-1.5 block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Title</span>
            <input value={form.title} maxLength={100} placeholder="Download our product catalogue" onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C41E6B]" />
          </label>
          <label className="space-y-1.5 block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Description</span>
            <textarea value={form.description} maxLength={300} rows={3} placeholder="Every Alimenture product in one place…" onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-[#C41E6B]" />
          </label>
          <button onClick={saveDetails} disabled={busy} className="self-start h-10 px-4 rounded-xl bg-[#C41E6B] text-white text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 hover:brightness-110 transition disabled:opacity-50">
            <Save className="w-3.5 h-3.5" /> Save details
          </button>
        </motion.div>
      </div>

      {/* FSSAI certificate — lead-gated download on the homepage */}
      <FssaiAdminCard />

      {/* recent requests → full list on the Leads page */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-gray-100">
          <h2 className="font-bold text-sm text-gray-900">Recent download requests</h2>
          <Link to="/admin/leads" className="h-9 px-3.5 rounded-xl bg-[#C41E6B]/10 text-[#C41E6B] text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 hover:bg-[#C41E6B] hover:text-white transition-colors">
            <Users className="w-3.5 h-3.5" /> View all leads <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {leads.length ? (
          <ul className="divide-y divide-gray-50">
            {leads.slice(0, 5).map((l) => (
              <li key={l.id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                <span className="w-9 h-9 rounded-full bg-[#C41E6B]/10 text-[#C41E6B] text-xs font-bold flex items-center justify-center shrink-0">
                  {l.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0 sm:grid sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6">
                  <p className="font-bold text-sm text-gray-900 truncate">{l.name}</p>
                  <a href={`tel:+91${l.mobile}`} className="text-[12px] sm:text-sm font-semibold text-gray-600 hover:text-[#C41E6B] inline-flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> +91 {l.mobile.slice(0, 5)} {l.mobile.slice(5)}
                  </a>
                  <p className="text-[11px] text-gray-400 sm:w-40 sm:text-right">{formatDate(l.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-sm text-gray-400 py-12">No download requests yet.</p>
        )}
      </motion.div>
    </div>
  );
}
