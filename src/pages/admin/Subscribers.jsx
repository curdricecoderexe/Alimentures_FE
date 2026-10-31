import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, Search, Download, Trash2, Check, RefreshCw, Users, CalendarDays, CalendarClock, MailCheck, MailX, Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { authenticatedFetch, API_BASE } from '../../lib/api';
import DashboardSkeleton from '../../components/skeletons/DashboardSkeleton';
import useSkeletonLoader from '../../hooks/useSkeletonLoader';

const DAY = 24 * 60 * 60 * 1000;
const STATUSES = [
  { key: 'subscribed', label: 'Subscribed' },
  { key: 'unsubscribed', label: 'Unsubscribed' },
  { key: 'all', label: 'All' },
];

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
const since = (iso, ms) => (iso ? new Date(iso).getTime() : 0) >= ms;
const formatDate = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

function toCsv(rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return ['Email,Status,Source,Joined,Welcome email',
    ...rows.map((r) => [r.email, r.status, r.source, formatDate(r.subscribedAt || r.createdAt), r.welcomeSent ? 'Sent' : 'Not sent'].map(esc).join(','))].join('\n');
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

/** Newsletter ("Nourishment Circle") sign-ups from the storefront footer. */
export default function AdminSubscribers() {
  const [subs, setSubs] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('subscribed');
  const [confirmId, setConfirmId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const showSkeleton = useSkeletonLoader(isLoading);

  const load = useCallback(async () => {
    try {
      const res = await authenticatedFetch(`${API_BASE}/newsletter/admin`);
      if (!res) return;
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load subscribers');
      setSubs(json.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const active = subs.filter((s) => s.status === 'subscribed');
    return {
      active: active.length,
      today: active.filter((s) => since(s.subscribedAt || s.createdAt, startOfToday())).length,
      week: active.filter((s) => since(s.subscribedAt || s.createdAt, Date.now() - 7 * DAY)).length,
      unsubscribed: subs.length - active.length,
    };
  }, [subs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subs.filter((s) => (status === 'all' || s.status === status) && (!q || s.email.includes(q)));
  }, [subs, query, status]);

  const exportCsv = () => {
    const blob = new Blob([toCsv(filtered)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alimenture-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const remove = async (id) => {
    setBusy(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/newsletter/admin/${id}`, { method: 'DELETE' });
      if (!res) return;
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Delete failed');
      setSubs((prev) => prev.filter((s) => s.id !== id));
      toast.success('Subscriber removed');
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
            <Mail className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Subscribers</h1>
            <p className="text-xs sm:text-sm text-gray-400 font-medium mt-0.5">
              Emails collected by the &ldquo;Nourishment Circle&rdquo; form in the site footer.
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
        <Stat icon={Users} label="Active subscribers" value={stats.active} tint="bg-[#C41E6B]/10 text-[#C41E6B]" />
        <Stat icon={CalendarDays} label="Joined today" value={stats.today} tint="bg-emerald-50 text-emerald-600" />
        <Stat icon={CalendarClock} label="Last 7 days" value={stats.week} tint="bg-amber-50 text-amber-600" />
        <Stat icon={MailX} label="Unsubscribed" value={stats.unsubscribed} tint="bg-gray-100 text-gray-500" />
      </div>

      {/* list */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-gray-100">
          <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1 lg:pb-0">
            {STATUSES.map((s) => (
              <button
                key={s.key}
                onClick={() => setStatus(s.key)}
                className={`h-9 px-3.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors ${
                  status === s.key ? 'bg-[#C41E6B] text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <span className="flex items-center gap-2 h-10 px-3 rounded-xl border border-gray-200 focus-within:border-[#C41E6B] lg:w-72">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search email" className="flex-1 min-w-0 bg-transparent outline-none text-sm" />
          </span>
        </div>

        {filtered.length ? (
          <>
            <div className="hidden md:grid grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto] gap-4 px-5 py-2.5 bg-gray-50/70 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <span>Email</span><span>Status</span><span>Joined</span><span>Welcome email</span><span className="w-[88px] text-right">Actions</span>
            </div>
            <ul className="divide-y divide-gray-50">
              {filtered.map((s) => (
                <li key={s.id} className="px-4 sm:px-5 py-3.5 md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto] md:gap-4 md:items-center flex flex-col gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-full bg-[#C41E6B]/10 text-[#C41E6B] text-xs font-bold flex items-center justify-center shrink-0">
                      {s.email.slice(0, 1).toUpperCase()}
                    </span>
                    <a href={`mailto:${s.email}`} className="font-bold text-sm text-gray-900 truncate hover:text-[#C41E6B]">{s.email}</a>
                  </div>
                  <span className="pl-12 md:pl-0">
                    <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      s.status === 'subscribed' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {s.status}
                    </span>
                  </span>
                  <p className="text-[12px] text-gray-400 md:pl-0 pl-12">{formatDate(s.subscribedAt || s.createdAt)}</p>
                  <p className="text-[12px] md:pl-0 pl-12 flex items-center gap-1.5">
                    {s.welcomeSent
                      ? <><MailCheck className="w-3.5 h-3.5 text-emerald-500" /><span className="text-gray-500">Sent</span></>
                      : <><Send className="w-3.5 h-3.5 text-amber-500" /><span className="text-amber-600 font-semibold">Not sent</span></>}
                  </p>
                  <div className="flex items-center gap-1.5 md:justify-end md:w-[88px] pl-12 md:pl-0">
                    <a href={`mailto:${s.email}`} aria-label={`Email ${s.email}`} title="Email" className={`${actionBtn} hover:border-[#C41E6B] hover:text-[#C41E6B]`}>
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                    {confirmId === s.id ? (
                      <button onClick={() => remove(s.id)} disabled={busy} className="h-9 px-2.5 rounded-xl bg-red-500 text-white text-[10px] font-bold uppercase inline-flex items-center gap-1 shrink-0 disabled:opacity-50">
                        <Check className="w-3 h-3" /> Delete
                      </button>
                    ) : (
                      <button onClick={() => setConfirmId(s.id)} aria-label={`Remove ${s.email}`} title="Remove" className={`${actionBtn} hover:border-red-400 hover:text-red-500`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <p className="px-5 py-3 text-[11px] text-gray-400 border-t border-gray-50">
              Showing {filtered.length} of {subs.length} subscriber{subs.length === 1 ? '' : 's'}
            </p>
          </>
        ) : subs.length ? (
          <p className="text-center text-sm text-gray-400 py-14">No subscribers match these filters.</p>
        ) : (
          <div className="text-center py-14 px-6">
            <span className="mx-auto w-14 h-14 rounded-2xl bg-[#C41E6B]/10 text-[#C41E6B] flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </span>
            <p className="mt-4 font-bold text-gray-900">No subscribers yet</p>
            <p className="mt-1 text-sm text-gray-400 max-w-sm mx-auto">
              Emails appear here when visitors join the Nourishment Circle from the site footer. Each one gets a branded welcome email.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
