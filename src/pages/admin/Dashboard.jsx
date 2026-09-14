import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag, Package, Users, IndianRupee, TrendingUp, AlertTriangle,
  Layers, PieChart as PieIcon,
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { authenticatedFetch } from '../../lib/api';
import { Field, ORB_BERRY, ORB_GOLD } from '../../components/ui/motion';
import DashboardSkeleton from '../../components/skeletons/DashboardSkeleton';
import useSkeletonLoader from '../../hooks/useSkeletonLoader';

const EASE = [0.16, 1, 0.3, 1];

/* Chart palette — Alimenture light-glass tokens. The categorical set
   (berry / gold / leaf / blue) is validated colour-blind-safe for ≤4 slots;
   anything past 4 folds into "Other". */
const C = {
  ink: '#221B1F', inkSoft: '#5A4F55', muted: '#8E848B', grid: '#EEE6D6',
  berry: '#A50D5A', gold: '#B27B26', leaf: '#2E7D51',
  cat: ['#A50D5A', '#D98A1E', '#1F7A4D', '#3E6DB0'],
  catOther: '#B8AEB4',
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } } };

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function ChartTip({ active, payload, label, valuePrefix = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-sm rounded-xl px-3.5 py-2.5 text-[12px]">
      {label && <p className="kicker text-[9px] text-ink-muted mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-ink-soft">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.payload?.color || p.fill }} />
            {p.name || 'Value'}
          </span>
          <span className="display-md text-[12.5px]">{valuePrefix}{Number(p.value).toLocaleString('en-IN')}</span>
        </p>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, activeProducts: 0, totalCustomers: 0 });
  const [topProducts, setTopProducts] = useState([]);
  const [criticalStock, setCriticalStock] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const showSkeleton = useSkeletonLoader(isLoading);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [usersRes, productsRes, ordersRes] = await Promise.all([
          authenticatedFetch(`${import.meta.env.VITE_API_URL}/users`),
          authenticatedFetch(`${import.meta.env.VITE_API_URL}/products?limit=100`),
          authenticatedFetch(`${import.meta.env.VITE_API_URL}/orders?limit=100`),
        ]);
        if (!usersRes || !productsRes || !ordersRes) return;

        const users = (await usersRes.json()).data || [];
        const products = (await productsRes.json()).data || [];
        const orders = (await ordersRes.json()).data || [];

        setStats({
          totalCustomers: users.filter((u) => u.role?.toLowerCase() === 'customer').length,
          activeProducts: products.length,
          totalOrders: orders.length,
          totalRevenue: orders.reduce((s, o) => s + (o.totalAmount || 0), 0),
        });

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const trend = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(); d.setMonth(d.getMonth() - i);
          trend.push({ month: monthNames[d.getMonth()], year: d.getFullYear(), sales: 0 });
        }
        orders.forEach((o) => {
          const date = o.createdAt?._seconds ? new Date(o.createdAt._seconds * 1000) : new Date();
          const b = trend.find((t) => t.month === monthNames[date.getMonth()] && t.year === date.getFullYear());
          if (b) b.sales += o.totalAmount || 0;
        });
        setSalesTrend(trend);

        const catCounts = {};
        products.forEach((p) => { const c = p.category || 'General'; catCounts[c] = (catCounts[c] || 0) + 1; });
        const sorted = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
        const top4 = sorted.slice(0, 4).map(([name, value], i) => ({ name, value, color: C.cat[i] }));
        const rest = sorted.slice(4).reduce((s, [, v]) => s + v, 0);
        if (rest > 0) top4.push({ name: 'Other', value: rest, color: C.catOther });
        setCategoryDistribution(top4.length ? top4 : [{ name: 'No products', value: 1, color: C.grid }]);

        const freq = {};
        orders.forEach((o) => (o.items || []).forEach((it) => {
          const t = it.name || it.title || 'Unknown';
          freq[t] = freq[t] || { sold: 0, revenue: 0 };
          freq[t].sold += Number(it.quantity) || 1;
          freq[t].revenue += (Number(it.price) || 0) * (Number(it.quantity) || 1);
        }));
        const maxSold = Math.max(1, ...Object.values(freq).map((f) => f.sold));
        setTopProducts(
          Object.entries(freq).map(([name, f]) => ({ name, sold: f.sold, revenue: money(f.revenue), progress: (f.sold / maxSold) * 100 }))
            .sort((a, b) => b.sold - a.sold).slice(0, 5),
        );

        const low = [];
        products.forEach((p) => {
          const totalStock = p.stock !== undefined ? p.stock : (p.variants ? p.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0) : 0);
          const lowVariants = (p.variants || []).filter((v) => Number(v.stock) < 10);
          if (totalStock < 10 || lowVariants.length) {
            low.push({ title: p.title || p.name || 'Unknown', stock: totalStock, isVariantLow: lowVariants.length > 0 && totalStock >= 10, lowVariantCount: lowVariants.length });
          }
        });
        setCriticalStock(low.sort((a, b) => a.stock - b.stock).slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    if (showSkeleton) return <DashboardSkeleton />;
    return <div className="min-h-screen" />;
  }

  const STATS = [
    { title: 'Total revenue', value: money(stats.totalRevenue), icon: IndianRupee, gold: false, sub: `${stats.totalOrders} orders` },
    { title: 'Total orders', value: stats.totalOrders.toLocaleString('en-IN'), icon: ShoppingBag, gold: true, sub: 'lifetime' },
    { title: 'Active products', value: stats.activeProducts.toLocaleString('en-IN'), icon: Package, gold: false, sub: `${categoryDistribution.length} categories` },
    { title: 'Customers', value: stats.totalCustomers.toLocaleString('en-IN'), icon: Users, gold: true, sub: 'registered' },
  ];

  return (
    <div className="relative min-h-screen font-sans text-ink">
      <Field orbs={[{ size: 520, color: ORB_BERRY, top: -180, right: -160 }, { size: 460, color: ORB_GOLD, bottom: -160, left: -140 }]} />

      <motion.div variants={container} initial="hidden" animate="show" className="relative z-[2] p-4 sm:p-6 lg:p-8 space-y-7">

        {/* header */}
        <motion.div variants={item} className="flex flex-col gap-3.5">
          <span className="kicker text-berry">Management hub</span>
          <div className="flex items-center gap-3.5">
            <span className="ico-chip h-11 w-11 rounded-2xl"><TrendingUp className="h-5 w-5" /></span>
            <h1 className="display-lg text-[2.3rem] sm:text-[2.6rem]">Analytics <span className="accent-text">dashboard</span></h1>
          </div>
          <span className="rule-berry" />
          <p className="text-[12.5px] text-ink-soft inline-flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-leaf opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-leaf" />
            </span>
            Live system status · updated just now
          </p>
        </motion.div>

        {/* stat tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {STATS.map((s, i) => (
            <motion.div key={i} variants={item} className="glass rounded-panel p-5 sm:p-6 group">
              <div className="flex items-start justify-between mb-4">
                <span className={`ico-chip ${s.gold ? 'ico-chip-gold' : ''} h-11 w-11 rounded-2xl`}><s.icon className="h-5 w-5" /></span>
                <span className="pill-berry-soft inline-flex items-center h-6 px-2.5 rounded-full text-[9px] font-bold uppercase tracking-widest">{s.sub}</span>
              </div>
              <p className="kicker text-[9.5px] text-ink-soft">{s.title}</p>
              <p className="display-lg text-[1.9rem] sm:text-[2.1rem] mt-1.5">{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <motion.div variants={item} className="relative lg:col-span-2 glass foil-top rounded-panel p-5 sm:p-7">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="display-md text-lg">Revenue growth</p>
                <p className="text-[11.5px] text-ink-muted mt-0.5">Last 6 months</p>
              </div>
              <span className="ico-chip h-9 w-9 rounded-xl"><TrendingUp className="h-4 w-4" /></span>
            </div>
            <div className="h-[240px] sm:h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.berry} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={C.berry} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={C.grid} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: C.muted, fontSize: 11, fontWeight: 600 }} dy={6} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: C.muted, fontSize: 10 }} width={54} tickFormatter={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)} />
                  <Tooltip cursor={{ stroke: C.berry, strokeOpacity: 0.35, strokeWidth: 1.5 }} content={<ChartTip valuePrefix="₹" />} />
                  <Area type="monotone" dataKey="sales" name="Revenue" stroke={C.berry} strokeWidth={2.5} fill="url(#revFill)" dot={{ r: 0 }} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: C.berry }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={item} className="glass rounded-panel p-5 sm:p-7">
            <div className="flex items-start justify-between mb-3">
              <p className="display-md text-lg">Category share</p>
              <span className="ico-chip ico-chip-gold h-9 w-9 rounded-xl"><PieIcon className="h-4 w-4" /></span>
            </div>
            <div className="h-[180px] sm:h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryDistribution} innerRadius="58%" outerRadius="86%" paddingAngle={3} dataKey="value" stroke="#fff" strokeWidth={2}>
                    {categoryDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 mt-3">
              {categoryDistribution.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-[12px]">
                  <span className="flex items-center gap-2 text-ink-soft">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                    <span className="truncate">{c.name}</span>
                  </span>
                  <span className="display-md text-[12px]">{c.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* insights row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <motion.div variants={item} className="glass rounded-panel p-5 sm:p-7">
            <div className="flex items-center gap-3 mb-5">
              <span className="ico-chip h-9 w-9 rounded-xl"><Layers className="h-4 w-4" /></span>
              <p className="display-md text-lg">Top performers</p>
            </div>
            <div className="flex flex-col gap-4">
              {topProducts.length === 0 ? (
                <p className="text-[13px] text-ink-muted">No sales yet.</p>
              ) : topProducts.map((p, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-ink truncate">{p.name}</p>
                      <p className="kicker text-[9px] text-ink-muted">{p.sold} units</p>
                    </div>
                    <p className="display-md text-[13px] shrink-0">{p.revenue}</p>
                  </div>
                  <div className="h-1.5 rounded-full bg-cream-deep overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${p.progress}%` }} transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
                      className="h-full rounded-full bg-gradient-to-r from-berry to-gold-light" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={item} className="glass rounded-panel p-5 sm:p-7">
            <div className="flex items-center gap-3 mb-5">
              <span className="ico-chip h-9 w-9 rounded-xl text-danger"><AlertTriangle className="h-4 w-4" /></span>
              <p className="display-md text-lg">Critical stock</p>
            </div>
            <div className="flex flex-col gap-2.5">
              {criticalStock.length === 0 ? (
                <p className="text-[13px] text-leaf font-medium">All stock levels are healthy.</p>
              ) : criticalStock.map((it, i) => (
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
