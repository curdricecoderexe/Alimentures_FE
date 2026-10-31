import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Contact, Search, Download, Phone, MessageCircle, Trash2, Check, RefreshCw, Users, CalendarDays, CalendarClock, Fingerprint, BookOpen, FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { authenticatedFetch, API_BASE } from '../../lib/api';
import DashboardSkeleton from '../../components/skeletons/DashboardSkeleton';
import useSkeletonLoader from '../../hooks/useSkeletonLoader';

const DAY = 24 * 60 * 60 * 1000;
const RANGES = [
  { key: 'all', label: 'All time' },
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
];

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
const inRange = (iso, key) => {
  if (key === 'all') return true;
  const t = iso ? new Date(iso).getTime() : 0;
  if (key === 'today') return t >= startOfToday();
  return t >= Date.now() - (key === '7d' ? 7 : 30) * DAY;
};
const formatDate = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const formatMobile = (m) => `+91 ${m.slice(0, 5)} ${m.slice(5)}`;

function toCsv(rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return ['Name,Mobile,Catalogue,Requested at',
    ...rows.map((r) => [r.name, `+91 ${r.mobile}`, r.catalogueFile || 'Requested (no PDF yet)', formatDate(r.createdAt)].map(esc).join(','))].join('\n');
}

function Stat({ icon: Icon, label, value, tint }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex items-center gap-3.5 min-w-0">
      <span className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${tint}`}>
        <Icon className="w-5 h-5" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mt-1.5 truncate">{label}</p>
      </div>
    </div>
  );
}

export default function AdminLeads() {
  const [leads, setLeads] = useState([]);
  const [query, setQuery] = useState('');
  const [range, setRange] = useState('all');
  const [confirmId, setConfirmId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const showSkeleton = useSkeletonLoader(isLoading);

  const load = useCallback(async () => {
    try {
      const res = await authenticatedFetch(`${API_BASE}/catalogue/admin/leads`);
      if (!res) return;
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load leads');
      setLeads(json.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => ({
    total: leads.length,
    today: leads.filter((l) => inRange(l.createdAt, 'today')).length,
    week: leads.filter((l) => inRange(l.createdAt, '7d')).length,
    unique: new Set(leads.map((l) => l.mobile)).size,
  }), [leads]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, '');
    return leads.filter((l) => inRange(l.createdAt, range)
      && (!q || l.name.toLowerCase().includes(q) || (digits && l.mobile.includes(digits))));
  }, [leads, query, range]);

  const exportCsv = () => {
    const blob = new Blob([toCsv(filtered)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alimenture-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteLead = async (id) => {
    setBusy(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/catalogue/admin/leads/${id}`, { method: 'DELETE' });
      if (!res) return;
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Delete failed');
      setLeads((prev) => prev.filter((l) => l.id !== id));
      toast.success('Lead deleted');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
      setConfirmId(null);
    }
  };

  if (isLoading) {
    if (showSkeleton) return <DashboardSkeleton />;
    return <div className="min-h-screen" />;
  }

  const actionBtn = 'h-9 w-9 rounded-xl border border-gray-200 text-gray-500 flex items-center justify-center transition-colors shrink-0';

  return (
    <div className="p-3 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 bg-transparent min-h-screen font-sans">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="w-11 h-11 rounded-2xl bg-[#C41E6B]/10 flex items-center justify-center text-[#C41E6B] shrink-0">
            <Contact className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Leads</h1>
            <p className="text-xs sm:text-sm text-gray-400 font-medium mt-0.5">
              Visitors who downloaded the catalogue from the homepage.
            </p>
          </div>
        </div>
        <div className="flex gap-2 self-start">
          <button
            onClick={() => { setRefreshing(true); load(); }}
            className="h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-gray-600 text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 hover:border-[#C41E6B] hover:text-[#C41E6B] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={exportCsv}
            disabled={!filtered.length}
            className="h-10 px-3.5 rounded-xl bg-[#221B1F] text-white text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 hover:bg-black transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat icon={Users} label="Total leads" value={stats.total} tint="bg-[#C41E6B]/10 text-[#C41E6B]" />
        <Stat icon={CalendarDays} label="Today" value={stats.today} tint="bg-emerald-50 text-emerald-600" />
        <Stat icon={CalendarClock} label="Last 7 days" value={stats.week} tint="bg-amber-50 text-amber-600" />
        <Stat icon={Fingerprint} label="Unique numbers" value={stats.unique} tint="bg-indigo-50 text-indigo-600" />
      </div>

      {/* list */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-gray-100">
          <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1 lg:pb-0">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`h-9 px-3.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors ${
                  range === r.key ? 'bg-[#C41E6B] text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <span className="flex items-center gap-2 h-10 px-3 rounded-xl border border-gray-200 focus-within:border-[#C41E6B] lg:w-72">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or mobile" className="flex-1 min-w-0 bg-transparent outline-none text-sm" />
          </span>
        </div>

        {filtered.length ? (
          <>
            {/* table header (desktop) */}
            <div className="hidden md:grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 px-5 py-2.5 bg-gray-50/70 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <span>Name</span><span>Mobile</span><span>Catalogue</span><span>Requested</span><span className="w-[124px] text-right">Actions</span>
            </div>
            <ul className="divide-y divide-gray-50">
              {filtered.map((l) => (
                <li key={l.id} className="px-4 sm:px-5 py-3.5 md:grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:gap-4 md:items-center flex flex-col gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-full bg-[#C41E6B]/10 text-[#C41E6B] text-xs font-bold flex items-center justify-center shrink-0">
                      {l.name.slice(0, 1).toUpperCase()}
                    </span>
                    <p className="font-bold text-sm text-gray-900 truncate">{l.name}</p>
                  </div>
                  <a href={`tel:+91${l.mobile}`} className="text-sm font-semibold text-gray-700 hover:text-[#C41E6B] md:pl-0 pl-12">{formatMobile(l.mobile)}</a>
                  <p className="text-[12px] text-gray-500 truncate md:pl-0 pl-12 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    {l.catalogueFile
                      ? <span className="truncate">{l.catalogueFile}</span>
                      : <span className="truncate text-amber-600 font-semibold">Requested — send manually</span>}
                  </p>
                  <p className="text-[12px] text-gray-400 md:pl-0 pl-12">{formatDate(l.createdAt)}</p>
                  <div className="flex items-center gap-1.5 md:justify-end md:w-[124px] pl-12 md:pl-0">
                    <a href={`tel:+91${l.mobile}`} aria-label={`Call ${l.name}`} title="Call" className={`${actionBtn} hover:border-[#C41E6B] hover:text-[#C41E6B]`}>
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a href={`https://wa.me/91${l.mobile}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${l.name}`} title="WhatsApp" className={`${actionBtn} hover:border-emerald-500 hover:text-emerald-600`}>
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                    {confirmId === l.id ? (
                      <button onClick={() => deleteLead(l.id)} disabled={busy} className="h-9 px-2.5 rounded-xl bg-red-500 text-white text-[10px] font-bold uppercase inline-flex items-center gap-1 shrink-0 disabled:opacity-50">
                        <Check className="w-3 h-3" /> Delete
                      </button>
                    ) : (
                      <button onClick={() => setConfirmId(l.id)} aria-label={`Delete lead ${l.name}`} title="Delete" className={`${actionBtn} hover:border-red-400 hover:text-red-500`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <p className="px-5 py-3 text-[11px] text-gray-400 border-t border-gray-50">
              Showing {filtered.length} of {leads.length} lead{leads.length === 1 ? '' : 's'}
            </p>
          </>
        ) : leads.length ? (
          <p className="text-center text-sm text-gray-400 py-14">No leads match these filters.</p>
        ) : (
          <div className="text-center py-14 px-6">
            <span className="mx-auto w-14 h-14 rounded-2xl bg-[#C41E6B]/10 text-[#C41E6B] flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </span>
            <p className="mt-4 font-bold text-gray-900">No leads yet</p>
            <p className="mt-1 text-sm text-gray-400 max-w-sm mx-auto">
              Leads appear here when visitors fill in the catalogue form on the homepage. Upload a PDF so they can download it instantly.
            </p>
            <Link to="/admin/catalogue" className="mt-5 inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#C41E6B] text-white text-[11px] font-bold uppercase tracking-wider hover:brightness-110 transition">
              <BookOpen className="w-3.5 h-3.5" /> Go to Catalogue
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
