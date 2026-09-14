import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, AreaChart, Area,
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Users, Eye, Activity, Clock, TrendingUp, TrendingDown,
  MonitorSmartphone, Globe, MousePointer, Cookie,
  BarChart3, Zap, AlertTriangle, CheckCircle2, Download,
  RefreshCw, Calendar, Shield, Target, BarChart2
} from 'lucide-react';
import DashboardSkeleton from '../../components/skeletons/DashboardSkeleton';
import { authenticatedFetch, API_BASE } from '../../lib/api';

const API = `${API_BASE}/analytics`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fmt = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
  return String(n ?? 0);
};

const fmtSec = (s) => {
  if (!s) return '0s';
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
};

const COLORS = ['#920075','#D4AF37','#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#ec4899'];

// ─── KPI CARD ─────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, trend, color = '#920075', loading }) {
  const isUp   = trend > 0;
  const isDown = trend < 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6 flex flex-col gap-3 transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center" style={{ background: color + '18' }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend !== undefined && !loading && (
          <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${isUp ? 'text-emerald-600 bg-emerald-50' : isDown ? 'text-red-500 bg-red-50' : 'text-gray-400 bg-gray-50'}`}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : null}
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-7 w-20 bg-gray-100 rounded-lg" />
          <div className="h-3 w-28 bg-gray-100 rounded" />
        </div>
      ) : (
        <>
          <p className="font-bold text-2xl sm:text-3xl text-gray-900 tracking-tight">{fmt(value)}</p>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
            {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
          </div>
        </>
      )}
    </motion.div>
  );
}

// ─── SECTION CARD ─────────────────────────────────────────────────────────────

function SectionCard({ title, subtitle, icon: Icon, color = '#920075', children, extra }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + '18' }}>
            <Icon className="w-4.5 h-4.5" style={{ color }} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900">{title}</h3>
            {subtitle && <p className="text-[10px] text-gray-400 font-medium">{subtitle}</p>}
          </div>
        </div>
        {extra}
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}

// ─── RANGE SELECTOR ───────────────────────────────────────────────────────────

function RangeSelector({ value, onChange }) {
  const opts = [
    { v: 'today', l: 'Today'  },
    { v: '7d',   l: '7 Days' },
    { v: '30d',  l: '30 Days'},
    { v: '90d',  l: '90 Days'},
  ];
  return (
    <div className="flex items-center gap-1 bg-gray-50 rounded-2xl p-1 border border-gray-100">
      {opts.map(o => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider transition-all ${
            value === o.v ? 'bg-white shadow-sm text-[#E83D6E] border border-gray-100' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

// ─── EXPORT CSV ───────────────────────────────────────────────────────────────

function exportCSV(filename, rows, headers) {
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── CUSTOM TOOLTIP ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur border border-gray-100 rounded-2xl shadow-xl p-3 text-xs font-bold text-gray-900 z-[100]">
      {label && <p className="text-gray-500 mb-1.5 text-[10px] uppercase tracking-wider">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color || p.fill }} />
          {p.name}: <strong className="text-gray-900">{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function CookiesAnalytics() {
  const [range,       setRange]       = useState('7d');
  const [overview,   setOverview]    = useState(null);
  const [pages,      setPages]       = useState([]);
  const [events,     setEvents]      = useState([]);
  const [consent,    setConsent]     = useState(null);
  const [devices,    setDevices]     = useState(null);
  const [traffic,    setTraffic]     = useState(null);
  const [perf,       setPerf]        = useState(null);
  const [activeNow,  setActiveNow]   = useState(0);
  const [loading,    setLoading]     = useState(true);
  const [tab,        setTab]         = useState('overview');
  const [refreshing, setRefreshing]  = useState(false);

  const fetchAll = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);
    try {
      const [ov, pv, ev, cs, dv, tr, pf, ac] = await Promise.all([
        authenticatedFetch(`/analytics/overview?range=${range}`).then(r => r ? r.json() : {success:false}),
        authenticatedFetch(`/analytics/pageviews?range=${range}`).then(r => r ? r.json() : {success:false}),
        authenticatedFetch(`/analytics/events?range=${range}`).then(r => r ? r.json() : {success:false}),
        authenticatedFetch(`/analytics/consent-stats?range=${range}`).then(r => r ? r.json() : {success:false}),
        authenticatedFetch(`/analytics/devices?range=${range}`).then(r => r ? r.json() : {success:false}),
        authenticatedFetch(`/analytics/traffic-sources?range=${range}`).then(r => r ? r.json() : {success:false}),
        authenticatedFetch(`/analytics/performance?range=${range}`).then(r => r ? r.json() : {success:false}),
        authenticatedFetch(`/analytics/active-visitors`).then(r => r ? r.json() : {success:false}),
      ]);
      if (ov.success)  setOverview(ov.data);
      if (pv.success)  setPages(pv.data);
      if (ev.success)  setEvents(ev.data);
      if (cs.success)  setConsent(cs.data);
      if (dv.success)  setDevices(dv.data);
      if (tr.success)  setTraffic(tr.data);
      if (pf.success)  setPerf(pf.data);
      if (ac.success)  setActiveNow(ac.data.active);
    } catch (e) { console.error('analytics fetch error', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [range]);

  useEffect(() => { fetchAll(true); }, [fetchAll]);

  // Poll active visitors every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const r = await authenticatedFetch(`/analytics/active-visitors`);
        if (r) {
          const d = await r.json();
          if (d.success) setActiveNow(d.data.active);
        }
      } catch { /* empty */ }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const TABS = [
    { id: 'overview',  label: 'Overview',    icon: BarChart3 },
    { id: 'visitors',  label: 'Visitors',    icon: Users },
    { id: 'cookies',   label: 'Cookie Consent', icon: Cookie },
    { id: 'pages',     label: 'Pages',       icon: Eye },
    { id: 'events',    label: 'Events',      icon: MousePointer },
    { id: 'perf',      label: 'Performance', icon: Zap },
  ];

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 font-sans p-3 sm:p-6 lg:p-10 bg-transparent min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between text-center md:text-left gap-4">
        <div>
          <h1 className="font-bold text-2xl sm:text-3xl text-gray-900 tracking-tight flex items-center justify-center md:justify-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#920075]/10 flex items-center justify-center shrink-0">
              <Cookie className="w-5 h-5 text-[#920075]" />
            </div>
            <span>Cookies & Analytics</span>
          </h1>
          <p className="text-xs text-gray-400 font-medium mt-1">Full analytics and cookie consent intelligence dashboard</p>
        </div>
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5 sm:gap-3">
          {/* Live indicator */}
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700">{activeNow} Live</span>
          </div>
          <button
            onClick={() => fetchAll(false)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <RangeSelector value={range} onChange={r => { setRange(r); }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-50 rounded-2xl p-1.5 border border-gray-100 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-[10.5px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                tab === t.id ? 'bg-white shadow-sm text-[#E83D6E] border border-gray-100' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* ── OVERVIEW TAB ──────────────────────────────────── */}
          {tab === 'overview' && (
            <div className="space-y-8">
              {/* KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={Eye}       label="Page Views"      value={overview?.totalPageviews} color="#920075" loading={loading} />
                <KpiCard icon={Users}     label="Unique Visitors" value={overview?.uniqueVisitors} color="#6366f1" loading={loading} />
                <KpiCard icon={Activity}  label="Total Sessions"  value={overview?.totalSessions}  color="#D4AF37" loading={loading} />
                <KpiCard icon={Activity}  label="Active Now"      value={activeNow} color="#10b981" sub="Last 5 minutes" loading={false} />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={TrendingDown} label="Bounce Rate"       value={`${overview?.bounceRate ?? 0}%`}  color="#ef4444"  loading={loading} sub="Single-page sessions" />
                <KpiCard icon={Clock}        label="Avg Duration"      value={fmtSec(overview?.avgDuration)}    color="#f59e0b"  loading={loading} />
                <KpiCard icon={MousePointer} label="Pages / Session"   value={overview?.avgPages}               color="#3b82f6"  loading={loading} />
                <KpiCard icon={Cookie}       label="Consent Requests"  value={consent?.total}                   color="#920075"  loading={loading} />
              </div>

              {/* Visitor Timeline */}
              <SectionCard title="Visitor Timeline" subtitle="Page views over time" icon={TrendingUp} color="#920075">
                {overview?.dailyData?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={overview.dailyData}>
                      <defs>
                        <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#920075" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#920075" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="views" name="Page Views" stroke="#920075" strokeWidth={2.5} fill="url(#viewsGrad)" dot={{ r: 4, fill: '#920075', strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="No page view data yet. The chart will populate as visitors arrive." />
                )}
              </SectionCard>

              {/* Traffic Sources + Devices Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Traffic Sources" subtitle="Where visitors come from" icon={Globe} color="#6366f1">
                  {traffic?.sources?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={traffic.sources} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 700 }} axisLine={false} tickLine={false} width={90} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="sessions" name="Sessions" radius={[0, 6, 6, 0]}>
                          {traffic.sources.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <EmptyState message="No traffic source data yet." />}
                </SectionCard>

                <SectionCard title="Device Breakdown" subtitle="Mobile vs Desktop vs Tablet" icon={MonitorSmartphone} color="#D4AF37">
                  {devices?.devices?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={devices.devices} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={48} paddingAngle={3} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                          {devices.devices.map((d, i) => <Cell key={i} fill={d.fill || COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <EmptyState message="No device data yet." />}
                </SectionCard>
              </div>
            </div>
          )}

          {/* ── VISITORS TAB ──────────────────────────────────── */}
          {tab === 'visitors' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={Users}        label="Unique Visitors" value={overview?.uniqueVisitors} color="#920075" />
                <KpiCard icon={Activity}     label="Total Sessions"  value={overview?.totalSessions}  color="#6366f1" />
                <KpiCard icon={TrendingDown} label="Bounce Rate"     value={`${overview?.bounceRate ?? 0}%`} color="#ef4444" />
                <KpiCard icon={Clock}        label="Avg Session"     value={fmtSec(overview?.avgDuration)} color="#f59e0b" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Browsers" subtitle="Most used browsers" icon={Globe} color="#3b82f6">
                  {devices?.browsers?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={devices.browsers} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={48} paddingAngle={3}>
                          {devices.browsers.map((d, i) => <Cell key={i} fill={d.fill || COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 10, fontWeight: 700 }}>{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <EmptyState message="No browser data yet." />}
                </SectionCard>

                <SectionCard title="Operating Systems" subtitle="User OS breakdown" icon={MonitorSmartphone} color="#10b981">
                  {devices?.os?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={devices.os}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Sessions" radius={[6, 6, 0, 0]}>
                          {devices.os.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <EmptyState message="No OS data yet." />}
                </SectionCard>
              </div>

              {/* Campaign Performance */}
              {traffic?.campaigns?.length > 0 && (
                <SectionCard title="Campaign Performance" subtitle="UTM campaign tracking" icon={Target} color="#D4AF37">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-medium">
                      <thead><tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Campaign</th>
                        <th className="text-right py-3 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sessions</th>
                      </tr></thead>
                      <tbody>
                        {traffic.campaigns.map((c, i) => (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="py-3 px-2 font-bold text-gray-900">{c.name}</td>
                            <td className="py-3 px-2 text-right font-bold text-[#920075]">{c.sessions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              )}
            </div>
          )}

          {/* ── COOKIE CONSENT TAB ────────────────────────────── */}
          {tab === 'cookies' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={Cookie}       label="Total Consents"  value={consent?.total}        color="#920075" />
                <KpiCard icon={CheckCircle2} label="Accept All"      value={consent?.acceptAll}    color="#10b981" sub={`${consent?.acceptRate ?? 0}% acceptance rate`} />
                <KpiCard icon={Shield}       label="Essential Only"  value={consent?.essentialOnly} color="#f59e0b" />
                <KpiCard icon={BarChart2}    label="Analytics On"    value={`${consent?.analyticsRate ?? 0}%`} color="#6366f1" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Consent Distribution" subtitle="How users responded" icon={Cookie} color="#920075">
                  {consent?.breakdown?.some(b => b.value > 0) ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={consent.breakdown.filter(b => b.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={48} paddingAngle={3} label={({ percent }) => `${(percent*100).toFixed(0)}%`}>
                          {consent.breakdown.filter(b => b.value > 0).map((d, i) => <Cell key={i} fill={d.fill} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 10, fontWeight: 700 }}>{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <EmptyState message="No consent data yet. Install CookieConsent on your site pages." />}
                </SectionCard>

                <SectionCard title="Cookie Consent Rates" subtitle="Per category acceptance %" icon={BarChart2} color="#6366f1">
                  <div className="space-y-4 pt-2">
                    {[
                      { label: 'Essential',   pct: 100,                        color: '#10b981', icon: Shield },
                      { label: 'Analytics',   pct: consent?.analyticsRate ?? 0,  color: '#920075', icon: BarChart2 },
                      { label: 'Marketing',   pct: consent?.marketingRate ?? 0,   color: '#D4AF37', icon: Target },
                      { label: 'Preferences', pct: consent?.preferencesRate ?? 0, color: '#6366f1', icon: Cookie },
                    ].map(({ label, pct, color, icon: Icon }) => (
                      <div key={label} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5" style={{ color }} />
                            <span className="text-xs font-bold text-gray-700">{label}</span>
                          </div>
                          <span className="text-xs font-bold" style={{ color }}>{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100">
                          <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>

              {/* Consent Trend */}
              {consent?.trend?.length > 0 && (
                <SectionCard title="Daily Consent Trend" subtitle="Accept All vs Total requests" icon={TrendingUp} color="#920075">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={consent.trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 10, fontWeight: 700 }}>{v}</span>} />
                      <Line type="monotone" dataKey="total"    name="Total"    stroke="#D4AF37" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="accepted" name="Accepted" stroke="#920075" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </SectionCard>
              )}
            </div>
          )}

          {/* ── PAGES TAB ─────────────────────────────────────── */}
          {tab === 'pages' && (
            <div className="space-y-6">
              <SectionCard
                title="Top Pages"
                subtitle="Most visited pages in selected range"
                icon={Eye}
                color="#920075"
                extra={
                  <button
                    onClick={() => exportCSV(`pages_${range}.csv`, pages, ['url','views','uniqueViews','avgTime','avgScroll'])}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-[10px] font-bold text-gray-500 hover:bg-gray-50 transition-all"
                  >
                    <Download className="w-3 h-3" /> Export CSV
                  </button>
                }
              >
                {pages.length > 0 ? (
                  <>
                    {/* Bar Chart */}
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={pages.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="url" tick={{ fontSize: 9, fill: '#9ca3af', fontWeight: 700 }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                        <YAxis tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="views" name="Views" radius={[6, 6, 0, 0]}>
                          {pages.slice(0,10).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Table */}
                    <div className="overflow-x-auto mt-6">
                      <table className="w-full text-xs">
                        <thead><tr className="border-b border-gray-100">
                          {['Page','Views','Unique','Avg Time','Avg Scroll'].map(h => (
                            <th key={h} className="text-left py-3 px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>
                          {pages.map((p, i) => (
                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="py-3 px-3 font-bold text-gray-900 max-w-[240px] truncate">{p.url || '/'}</td>
                              <td className="py-3 px-3 font-bold text-[#920075]">{p.views}</td>
                              <td className="py-3 px-3 text-gray-600">{p.uniqueViews}</td>
                              <td className="py-3 px-3 text-gray-600">{fmtSec(p.avgTime)}</td>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 max-w-[60px]">
                                    <div className="h-1.5 rounded-full bg-[#920075]" style={{ width: `${p.avgScroll}%` }} />
                                  </div>
                                  <span className="text-gray-500 text-[10px]">{p.avgScroll}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : <EmptyState message="No page view data yet. Pages appear as visitors browse the site." />}
              </SectionCard>
            </div>
          )}

          {/* ── EVENTS TAB ────────────────────────────────────── */}
          {tab === 'events' && (
            <div className="space-y-6">
              <SectionCard
                title="Event Analytics"
                subtitle="All tracked user interactions"
                icon={MousePointer}
                color="#D4AF37"
                extra={
                  <button
                    onClick={() => exportCSV(`events_${range}.csv`, events, ['name','count','uniquePages'])}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-[10px] font-bold text-gray-500 hover:bg-gray-50 transition-all"
                  >
                    <Download className="w-3 h-3" /> Export CSV
                  </button>
                }
              >
                {events.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={events.slice(0, 12)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 700 }} axisLine={false} tickLine={false} width={120} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" name="Count" radius={[0, 6, 6, 0]}>
                          {events.slice(0,12).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>

                    <div className="overflow-x-auto mt-6">
                      <table className="w-full text-xs">
                        <thead><tr className="border-b border-gray-100">
                          {['Event Name','Count','Unique Pages'].map(h => (
                            <th key={h} className="text-left py-3 px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>
                          {events.map((ev, i) => (
                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                              <td className="py-3 px-3 font-bold text-gray-900">{ev.name}</td>
                              <td className="py-3 px-3 font-bold text-[#920075]">{ev.count}</td>
                              <td className="py-3 px-3 text-gray-600">{ev.uniquePages}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : <EmptyState message="No events tracked yet. Events fire automatically on clicks once analytics consent is granted." />}
              </SectionCard>
            </div>
          )}

          {/* ── PERFORMANCE TAB ───────────────────────────────── */}
          {tab === 'perf' && (
            <div className="space-y-6">
              {/* Core Web Vitals KPI Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={Zap}          label="Avg LCP"   value={perf?.avgLcp  ? `${perf.avgLcp}ms`  : 'N/A'} color={perf?.avgLcp  < 2500 ? '#10b981' : '#ef4444'} sub="< 2500ms is Good" />
                <KpiCard icon={Zap}          label="Avg FCP"   value={perf?.avgFcp  ? `${perf.avgFcp}ms`  : 'N/A'} color={perf?.avgFcp  < 1800 ? '#10b981' : '#f59e0b'} sub="< 1800ms is Good" />
                <KpiCard icon={Zap}          label="Avg TTFB"  value={perf?.avgTtfb ? `${perf.avgTtfb}ms` : 'N/A'} color={perf?.avgTtfb < 800  ? '#10b981' : '#ef4444'} sub="< 800ms is Good" />
                <KpiCard icon={AlertTriangle} label="Avg CLS"  value={perf?.avgCls  ? perf.avgCls          : 'N/A'} color={parseFloat(perf?.avgCls) < 0.1 ? '#10b981' : '#ef4444'} sub="< 0.1 is Good" />
              </div>

              {/* Page Performance Table */}
              {perf?.pages?.length > 0 && (
                <SectionCard title="Page Performance" subtitle="Core Web Vitals per page" icon={Zap} color="#f59e0b">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-gray-100">
                        {['Page','LCP','FCP','TTFB','CLS','Samples'].map(h => (
                          <th key={h} className="text-left py-3 px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {perf.pages.map((p, i) => (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="py-3 px-3 font-bold text-gray-900 max-w-[200px] truncate">{p.url || '/'}</td>
                            <td className="py-3 px-3">
                              <span className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${p.lcp < 2500 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                                {p.lcp}ms
                              </span>
                            </td>
                            <td className="py-3 px-3 text-gray-600">{p.fcp}ms</td>
                            <td className="py-3 px-3 text-gray-600">{p.ttfb}ms</td>
                            <td className="py-3 px-3">
                              <span className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${parseFloat(p.cls) < 0.1 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                                {p.cls}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-gray-400">{p.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              )}

              {(!perf?.pages || perf.pages.length === 0) && (
                <SectionCard title="Performance Data" subtitle="Core Web Vitals" icon={Zap} color="#f59e0b">
                  <EmptyState message="No performance data yet. Metrics will appear after page loads are measured." />
                </SectionCard>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
      <div className="w-14 h-14 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-center">
        <BarChart3 className="w-6 h-6 text-gray-300" />
      </div>
      <p className="text-xs text-gray-400 font-medium max-w-xs leading-relaxed">{message}</p>
    </div>
  );
}
