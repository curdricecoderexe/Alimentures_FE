import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingBag, Package, AlertTriangle, CheckCircle, Truck,
  Activity, PieChart as PieIcon, ArrowUpRight, LayoutGrid,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';
import { authenticatedFetch } from '../../lib/api';
import { Field, ORB_BERRY, ORB_GOLD } from '../../components/ui/motion';
import DashboardSkeleton from '../../components/skeletons/DashboardSkeleton';
import useSkeletonLoader from '../../hooks/useSkeletonLoader';

const EASE = [0.16, 1, 0.3, 1];

const C = {
  ink: '#221B1F', muted: '#8E848B', grid: '#EEE6D6',
  berry: '#A50D5A',
  status: { good: '#2E7D51', warn: '#D98A1E', crit: '#C0392B' },
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } } };

function ChartTip({ active, payload, label, suffix = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-sm rounded-xl px-3.5 py-2.5 text-[12px]">
      {label && <p className="kicker text-[9px] text-ink-muted mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-ink-soft">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.payload?.color || p.fill }} />
            {p.name || 'Orders'}
          </span>
          <span className="display-md text-[12.5px]">{p.value}{suffix}</span>
        </p>
      ))}
    </div>
  );
}

export default function StaffDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const showSkeleton = useSkeletonLoader(loading);
  const [stats, setStats] = useState({
    pending: 0, completed: 0, lowStock: 0, inTransit: 0,
    weeklyOrders: [], stockDistribution: [], criticalStock: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [oRes, pRes] = await Promise.all([
          authenticatedFetch(`${import.meta.env.VITE_API_URL}/orders?limit=100`).catch(() => null),
          authenticatedFetch(`${import.meta.env.VITE_API_URL}/products?limit=100`).catch(() => null),
        ]);

        let orderList = [];
        let prodList = [];
        if (oRes && oRes.ok) { const d = await oRes.json(); if (d.success) orderList = d.data || []; }
        if (pRes && pRes.ok) { const d = await pRes.json(); if (d.success) prodList = d.data || []; }

        const pending = orderList.filter((o) => o.status === 'pending' || o.status === 'processing').length;
        const completed = orderList.filter((o) => o.status === 'delivered').length;
        const inTransit = orderList.filter((o) => o.status === 'shipped' || o.status === 'out_for_delivery').length;

        // Variant-aware low-stock check — matches admin Dashboard exactly: a
        // product counts as low/critical if its TOTAL is low, or if any single
        // variant (pack size) is low even while the total still looks healthy.
        const critical = [];
        prodList.forEach((p) => {
          const totalStock = p.stock !== undefined ? p.stock : (p.variants ? p.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0) : 0);
          const lowVariants = (p.variants || []).filter((v) => Number(v.stock) < 10);
          if (totalStock < 10 || lowVariants.length > 0) {
            critical.push({ title: p.title || p.name || 'Unknown', stock: totalStock, isVariantLow: lowVariants.length > 0 && totalStock >= 10, lowVariantCount: lowVariants.length });
          }
        });
        const lowStock = critical.length;
        const criticalCount = critical.filter((c) => !c.isVariantLow && c.stock < 5).length;
        const healthy = Math.max(0, prodList.length - lowStock);

        // real order volume for the last 7 days
        const days = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
          days.push({ key: d.toISOString().slice(0, 10), label: d.toLocaleDateString('en-IN', { weekday: 'short' }), orders: 0 });
        }
        orderList.forEach((o) => {
          const ts = o.createdAt?._seconds ? new Date(o.createdAt._seconds * 1000) : null;
          if (!ts) return;
          const key = new Date(ts.getFullYear(), ts.getMonth(), ts.getDate()).toISOString().slice(0, 10);
          const b = days.find((x) => x.key === key);
          if (b) b.orders += 1;
        });

        setStats({
          pending, completed, lowStock, inTransit,
          weeklyOrders: days,
          criticalStock: critical.sort((a, b) => a.stock - b.stock).slice(0, 5),
          stockDistribution: [
            { name: 'Healthy', value: healthy || 0, color: C.status.good },
            { name: 'Low', value: Math.max(0, lowStock - criticalCount), color: C.status.warn },
            { name: 'Critical', value: criticalCount, color: C.status.crit },
          ],
        });
      } catch (err) {
        console.error('Dashboard Global Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    if (showSkeleton) return <DashboardSkeleton />;
    return <div className="min-h-screen" />;
  }

  const STATS = [
    { label: 'Pending orders', value: stats.pending, icon: ShoppingBag, chip: '' },
    { label: 'Completed today', value: stats.completed, icon: CheckCircle, chip: 'ico-chip-gold' },
    { label: 'Low stock alerts', value: stats.lowStock, icon: AlertTriangle, chip: '', danger: true },
    { label: 'In transit', value: stats.inTransit, icon: Truck, chip: 'ico-chip-gold' },
  ];
  const stockTotal = stats.stockDistribution.reduce((s, x) => s + x.value, 0) || 1;

  return (
    <div className="relative min-h-screen font-sans text-ink">
      <Field orbs={[{ size: 520, color: ORB_BERRY, top: -180, right: -160 }, { size: 460, color: ORB_GOLD, bottom: -160, left: -140 }]} />

      <motion.div variants={container} initial="hidden" animate="show" className="relative z-[2] p-4 sm:p-6 lg:p-8 space-y-7">

        <motion.div variants={item} className="flex flex-col gap-3.5">
          <span className="kicker text-berry">Operations</span>
          <div className="flex items-center gap-3.5">
            <span className="ico-chip h-11 w-11 rounded-2xl"><LayoutGrid className="h-5 w-5" /></span>
            <h1 className="display-lg text-[2.3rem] sm:text-[2.6rem]">Staff <span className="accent-text">dashboard</span></h1>
          </div>
          <span className="rule-berry" />
          <p className="text-[12.5px] text-ink-soft">Today&rsquo;s overview and tasks</p>
        </motion.div>

        {/* stat tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {STATS.map((s, i) => (
            <motion.div key={i} variants={item} className="glass rounded-panel p-5 sm:p-6 group">
              <div className="flex items-start justify-between mb-4">
                <span className={`ico-chip ${s.chip} h-11 w-11 rounded-2xl ${s.danger ? 'text-danger' : ''}`}><s.icon className="h-5 w-5" /></span>
              </div>
              <p className="kicker text-[9.5px] text-ink-soft">{s.label}</p>
              <p className={`display-lg text-[2.1rem] sm:text-[2.4rem] mt-1.5 ${s.danger && s.value > 0 ? 'text-danger' : ''}`}>{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <motion.div variants={item} className="relative lg:col-span-2 glass foil-top rounded-panel p-5 sm:p-7">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="display-md text-lg">Order velocity</p>
                <p className="text-[11.5px] text-ink-muted mt-0.5">Orders received · last 7 days</p>
              </div>
              <span className="ico-chip h-9 w-9 rounded-xl"><Activity className="h-4 w-4" /></span>
            </div>
            <div className="h-[240px] sm:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyOrders} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={C.grid} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: C.muted }} dy={6} />
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 10, fill: C.muted }} width={32} />
                  <Tooltip cursor={{ fill: 'rgba(165,13,90,0.06)' }} content={<ChartTip />} />
                  <Bar dataKey="orders" name="Orders" fill={C.berry} radius={[6, 6, 0, 0]} barSize={34} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={item} className="glass rounded-panel p-5 sm:p-7">
            <div className="flex items-start justify-between mb-3">
              <p className="display-md text-lg">Stock health</p>
              <span className="ico-chip ico-chip-gold h-9 w-9 rounded-xl"><PieIcon className="h-4 w-4" /></span>
            </div>
            <div className="h-[180px] sm:h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.stockDistribution} innerRadius="58%" outerRadius="86%" paddingAngle={3} dataKey="value" stroke="#fff" strokeWidth={2}>
                    {stats.stockDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTip suffix=" units" />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 mt-3">
              {stats.stockDistribution.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-[12px]">
                  <span className="flex items-center gap-2 text-ink-soft">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </span>
                  <span className="display-md text-[12px]">{s.value} · {Math.round((s.value / stockTotal) * 100)}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* quick actions + personnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={() => navigate('/staff/orders')}
              className="relative glass foil-top rounded-panel p-6 text-left flex flex-col justify-between min-h-[9rem] group transition-transform hover:-translate-y-1">
              <span className="ico-chip h-10 w-10 rounded-xl"><ShoppingBag className="h-5 w-5" /></span>
              <span>
                <span className="display-md text-lg block flex items-center gap-1.5">Process orders <ArrowUpRight className="h-4 w-4 text-berry" /></span>
                <span className="kicker text-[9px] text-ink-muted">Go to module</span>
              </span>
            </button>
            <button onClick={() => navigate('/staff/inventory')}
              className="glass rounded-panel p-6 text-left flex flex-col justify-between min-h-[9rem] group transition-transform hover:-translate-y-1">
              <span className="ico-chip ico-chip-gold h-10 w-10 rounded-xl"><Package className="h-5 w-5" /></span>
              <span>
                <span className="display-md text-lg block flex items-center gap-1.5">Update stock <ArrowUpRight className="h-4 w-4 text-gold" /></span>
                <span className="kicker text-[9px] text-ink-muted">Manage inventory</span>
              </span>
            </button>
          </div>

          <motion.div variants={item} className="glass rounded-panel p-5 sm:p-7">
            <div className="flex items-center gap-3 mb-5">
              <span className="ico-chip h-9 w-9 rounded-xl text-danger"><AlertTriangle className="h-4 w-4" /></span>
              <p className="display-md text-lg">Critical stock</p>
            </div>
            <div className="flex flex-col gap-2.5">
              {stats.criticalStock.length === 0 ? (
                <p className="text-[13px] text-leaf font-medium">All stock levels are healthy.</p>
              ) : stats.criticalStock.map((it, i) => (
                <div key={i} className="glass-sm rounded-2xl p-3.5 flex items-center gap-3.5">
                  <span className={`h-10 w-10 rounded-xl flex items-center justify-center display-md text-[13px] shrink-0 ${
                    it.isVariantLow ? 'bg-gold-tint text-gold' : 'bg-danger/10 text-danger'
                  }`}>{it.stock}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-ink truncate">{it.title}</p>
                    <p className={`kicker text-[8.5px] ${it.isVariantLow ? 'text-gold' : 'text-danger'}`}>
                      {it.isVariantLow ? `Low on ${it.lowVariantCount} variant(s)` : 'Total stock critical'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
