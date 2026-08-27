import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import DashboardSkeleton from '../../components/skeletons/DashboardSkeleton';
import useSkeletonLoader from '../../hooks/useSkeletonLoader';
import {
  ShoppingBag, Package, Users, TrendingUp,
  AlertTriangle, DollarSign, ArrowUpRight,
  Layers, Activity, Bell
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie,
  Cell, AreaChart, Area
} from 'recharts';
import { authenticatedFetch } from '../../lib/api';





// Animation Variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const DashboardTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 dark:bg-[#1A1021]/95 backdrop-blur border border-gray-100 dark:border-white/10 rounded-xl shadow-xl p-3 text-xs font-bold text-gray-900 dark:text-gray-100 z-[100]">
      {label && <p className="text-gray-500 dark:text-gray-400 mb-1 text-[10px] uppercase tracking-wider">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center justify-between gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color || p.fill }} />
            {p.name || 'Value'}
          </span>
          <span className="font-bold text-[#E83D6E]">
            {typeof p.value === 'number' && (p.dataKey === 'sales' || p.name?.toLowerCase().includes('revenue')) ? `₹${p.value.toLocaleString()}` : p.value}
          </span>
        </p>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeProducts: 0,
    totalCustomers: 0
  });
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
          authenticatedFetch(`${import.meta.env.VITE_API_URL}/orders?limit=100`)
        ]);

        if (!usersRes || !productsRes || !ordersRes) return;

        const usersResData = await usersRes.json();
        const productsResData = await productsRes.json();
        const ordersResData = await ordersRes.json();

        const users = usersResData.data || [];
        const products = productsResData.data || [];
        const orders = ordersResData.data || [];

        // 1. Basic Stats
        const totalCustomers = users.filter(u => u.role?.toLowerCase() === 'customer').length;
        const activeProducts = products.length;
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        setStats({ totalRevenue, totalOrders, activeProducts, totalCustomers });

        // 2. Sales Trend (Last 6 Months) - Chronological Order
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const trendData = [];
        
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          trendData.push({ 
            month: monthNames[d.getMonth()], 
            sales: 0,
            monthIdx: d.getMonth(),
            year: d.getFullYear()
          });
        }

        orders.forEach(order => {
          const date = order.createdAt?._seconds ? new Date(order.createdAt._seconds * 1000) : new Date();
          const month = monthNames[date.getMonth()];
          const year = date.getFullYear();
          
          const monthBucket = trendData.find(t => t.month === month && t.year === year);
          if (monthBucket) {
            monthBucket.sales += (order.totalAmount || 0);
          }
        });

        setSalesTrend(trendData);

        // 3. Category Distribution
        const catCounts = {};
        products.forEach(p => {
          const cat = p.category || 'General';
          catCounts[cat] = (catCounts[cat] || 0) + 1;
        });

        const colors = ['#E83D6E', '#1A1A1A', '#4F46E5', '#F59E0B', '#10B981', '#6366F1'];
        const dist = Object.keys(catCounts).map((cat, i) => ({
          name: cat,
          value: catCounts[cat],
          color: colors[i % colors.length]
        }));
        setCategoryDistribution(dist.length > 0 ? dist : [{ name: 'No Products', value: 1, color: '#F3F4F6' }]);

        // 4. Top Products (By Order Frequency)
        const productFrequency = {};
        orders.forEach(order => {
          (order.items || []).forEach(item => {
            const title = item.name || item.title || 'Unknown Product';
            if (!productFrequency[title]) {
              productFrequency[title] = { sold: 0, revenue: 0 };
            }
            productFrequency[title].sold += (Number(item.quantity) || 1);
            productFrequency[title].revenue += (Number(item.price || 0) * Number(item.quantity || 1));
          });
        });

        const top = Object.keys(productFrequency)
          .map(title => ({
            name: title,
            sold: productFrequency[title].sold,
            revenue: `₹${productFrequency[title].revenue.toLocaleString()}`,
            progress: Math.min(100, (productFrequency[title].sold / 20) * 100) 
          }))
          .sort((a, b) => b.sold - a.sold)
          .slice(0, 4);
        
        setTopProducts(top);

        // 5. Critical Stock (Variant-Sensitive)
        const lowStock = [];
        products.forEach(p => {
          const totalStock = p.stock !== undefined ? p.stock : (p.variants ? p.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0) : 0);
          
          // Find if any specific variant is low
          const lowVariants = (p.variants || []).filter(v => Number(v.stock) < 10);
          
          if (totalStock < 10 || lowVariants.length > 0) {
            lowStock.push({
              title: p.title || p.name || 'Unknown Product',
              stock: totalStock,
              isVariantLow: lowVariants.length > 0 && totalStock >= 10,
              lowVariantCount: lowVariants.length
            });
          }
        });

        setCriticalStock(lowStock.sort((a, b) => a.stock - b.stock).slice(0, 5));

      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    if (showSkeleton) return <DashboardSkeleton />;
    return <div className="min-h-screen bg-transparent"></div>;
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-3 sm:p-6 lg:p-10 space-y-6 sm:space-y-10 bg-transparent min-h-screen"
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-center sm:text-left gap-4">
        <motion.div variants={item}>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Analytics Dashboard</h1>
          <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5 sm:mt-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Live System Status</p>
          </div>
        </motion.div>
      </div>

      {/* High-Impact Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { title: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-rose-600 bg-rose-50 group-hover:bg-rose-100', trend: '+12.5%', trendColor: 'text-emerald-700 bg-emerald-50' },
          { title: 'Total Orders', value: stats.totalOrders.toString(), icon: ShoppingBag, color: 'text-indigo-600 bg-indigo-50 group-hover:bg-indigo-100', trend: '+8.2%', trendColor: 'text-emerald-700 bg-emerald-50' },
          { title: 'Active Products', value: stats.activeProducts.toString(), icon: Package, color: 'text-amber-600 bg-amber-50 group-hover:bg-amber-100', trend: 'Stable', trendColor: 'text-gray-600 bg-gray-100' },
          { title: 'Total Customers', value: stats.totalCustomers.toString(), icon: Users, color: 'text-emerald-600 bg-emerald-50 group-hover:bg-emerald-100', trend: '+15.3%', trendColor: 'text-emerald-700 bg-emerald-50' },
        ].map((stat, i) => (
          <motion.div key={i} variants={item} whileHover={{ y: -4 }} className="group">
            <Card className="shadow-sm hover:shadow-md border border-gray-200/60 rounded-2xl overflow-hidden bg-white transition-shadow duration-300">
              <CardContent className="p-5 sm:p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl transition-colors ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${stat.trendColor}`}>
                    {stat.trend}
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.title}</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1.5">{stat.value}</h3>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Sales Trend (Spans 2 columns) */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="shadow-sm border border-gray-200/60 rounded-2xl bg-white p-2 sm:p-4 overflow-hidden">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold">Revenue Growth</CardTitle>
                <p className="text-xs text-gray-500 mt-1">Monthly sales performance</p>
              </div>
              <TrendingUp className="h-5 w-5 text-rose-500" />
            </CardHeader>
            <CardContent className="p-1 sm:p-4">
              <div className="h-[240px] sm:h-[350px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E83D6E" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#E83D6E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} dy={6} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                    <Tooltip content={<DashboardTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#E83D6E"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorSales)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Distribution */}
        <motion.div variants={item}>
          <Card className="shadow-sm border border-gray-200/60 rounded-2xl bg-white h-full p-2 sm:p-4 overflow-hidden">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-base sm:text-lg font-bold">Category Share</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center p-2 sm:p-4">
              <div className="h-[210px] sm:h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      innerRadius="55%"
                      outerRadius="80%"
                      paddingAngle={6}
                      dataKey="value"
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<DashboardTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 w-full mt-2 sm:mt-4">
                {categoryDistribution.slice(0, 4).map((cat, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-xs font-bold text-gray-600 whitespace-nowrap">{cat.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Top Products */}
        <motion.div variants={item}>
          <Card className="shadow-sm border border-gray-200/60 rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-5 sm:p-6 pb-2">
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-500" /> Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 pt-2">
              <div className="space-y-4 sm:space-y-5">
                {topProducts.map((product, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-end gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{product.name}</p>
                        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{product.sold} units</p>
                      </div>
                      <p className="font-bold text-gray-900 text-xs sm:text-sm shrink-0">{product.revenue}</p>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${product.progress}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="bg-[#1A1A1A] h-full rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Improved Low Stock Alert */}
        <motion.div variants={item}>
          <Card className="bg-white border border-rose-200 shadow-sm rounded-2xl h-full overflow-hidden">
            <CardHeader className="p-5 sm:p-6 pb-2 border-b border-rose-50 bg-rose-50/30">
              <CardTitle className="flex items-center gap-2 text-rose-600 font-bold text-base sm:text-lg">
                <AlertTriangle className="h-5 w-5" /> Critical Stock
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 pt-4">
              <div className="space-y-3">
                {criticalStock.length > 0 ? criticalStock.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-white border border-rose-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${item.isVariantLow ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                        {item.stock}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{item.title}</p>
                        <p className={`text-[9px] sm:text-[10px] font-bold uppercase ${item.isVariantLow ? 'text-amber-500' : 'text-rose-500'}`}>
                          {item.isVariantLow ? `LOW ON ${item.lowVariantCount} VARIANT(S)` : 'Total Stock Critical'}
                        </p>
                      </div>
                    </div>
                    <button className="text-[10px] font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 px-3.5 py-1.5 sm:py-2 rounded-lg transition-all self-end sm:self-auto shrink-0 shadow-sm">
                      Reorder
                    </button>
                  </div>
                )) : (
                  <div className="text-xs sm:text-sm font-bold text-gray-500 text-center py-4">All stock levels are healthy.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}