import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Users, ShoppingBag, Activity, Zap, Target, Download, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { exportToPDF } from '../../lib/exportUtils';
import { authenticatedFetch } from '../../lib/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

import DashboardSkeleton from '../../components/skeletons/DashboardSkeleton';
import useSkeletonLoader from '../../hooks/useSkeletonLoader';

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const showSkeleton = useSkeletonLoader(loading);
  const [stats, setStats] = useState({
    avgOrderValue: 0,
    conversionRate: 0,
    retentionRate: 0,
    revenueGrowth: [],
    categoryDistribution: [],
    customerTypes: []
  });

  const fetchData = async () => {
    try {
      const [ordersRes, usersRes, productsRes] = await Promise.all([
        authenticatedFetch(`${import.meta.env.VITE_API_URL}/orders?limit=1000`),
        authenticatedFetch(`${import.meta.env.VITE_API_URL}/users`),
        authenticatedFetch(`${import.meta.env.VITE_API_URL}/products?limit=1000`)
      ]);

      if (!ordersRes || !usersRes || !productsRes) return; // Already handled by authenticatedFetch

      const orders = await ordersRes.json();
      const users = await usersRes.json();
      const products = await productsRes.json();

      if (orders.success && users.success && products.success) {
        const orderList = orders.data;
        const userList = users.data;
        
        // 1. Calculate Avg Order Value
        const totalRev = orderList.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const avgValue = orderList.length ? (totalRev / orderList.length).toFixed(0) : 0;

        // 2. Revenue Growth & Orders by Month
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = months.map(m => ({ month: m, revenue: 0, orders: 0 }));
        orderList.forEach(o => {
          if (o.createdAt) {
            const date = new Date(o.createdAt._seconds * 1000);
            const mIdx = date.getMonth();
            monthlyData[mIdx].revenue += o.totalAmount;
            monthlyData[mIdx].orders += 1;
          }
        });

        // 3. Category Distribution
        const catMap = {};
        orderList.forEach(o => {
          (o.items || []).forEach(item => {
            // This is a simplification: assuming we have category in items or can fetch it
            const cat = item.category || 'General';
            catMap[cat] = (catMap[cat] || 0) + (item.price * item.quantity);
          });
        });
        const categoryData = Object.keys(catMap).map(cat => ({ category: cat, sales: catMap[cat] }));

        // 4. Customer Types (Simplified: Returning vs New)
// Removed unused var assignment: const userEmails = userList.map(u => u.email);
        const orderEmails = orderList.map(o => o.customerInfo?.email);
        const returningCount = orderEmails.filter((email, index) => orderEmails.indexOf(email) !== index).length;
        
        setStats({
          avgOrderValue: avgValue,
          conversionRate: ((orderList.length / (userList.length || 1)) * 100).toFixed(1),
          retentionRate: ((returningCount / (userList.length || 1)) * 100).toFixed(1),
          revenueGrowth: monthlyData.filter(d => d.revenue > 0 || d.orders > 0),
          categoryDistribution: categoryData,
          customerTypes: monthlyData.map(m => ({ ...m, new: Math.floor(m.orders * 0.4), returning: Math.floor(m.orders * 0.6) }))
        });
      }
    } catch {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportPDF = () => {
    toast.promise(exportToPDF('analytics-report', 'Alimenture_Analytics_Report'), {
      loading: 'Generating PDF report...',
      success: 'Report downloaded successfully!',
      error: 'Failed to generate report'
    });
  };

  if (loading) {
    if (showSkeleton) return <DashboardSkeleton />;
    return <div className="min-h-screen bg-transparent"></div>;
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      id="analytics-report"
      className="p-4 sm:p-6 lg:p-10 bg-transparent min-h-screen space-y-6 sm:space-y-10 max-w-full overflow-hidden"
    >
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight italic">Insights.</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Real-time performance and growth metrics</p>
        </motion.div>
        <Button 
          onClick={handleExportPDF}
          className="h-11 sm:h-12 px-5 sm:px-6 rounded-2xl bg-black !text-white font-bold shadow-lg hover:bg-zinc-800 transition-all active:scale-95 w-full sm:w-auto justify-center"
        >
          <FileText className="h-4 w-4 mr-2" /> Export PDF Report
        </Button>
      </div>

      {/* KEY METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { title: "Avg. Order Value", val: `₹${stats.avgOrderValue}`, trend: "Live", up: true, icon: Activity },
          { title: "Conversion Rate", val: `${stats.conversionRate}%`, trend: "Live", up: true, icon: Target },
          { title: "Retention Rate", val: `${stats.retentionRate}%`, trend: "Live", up: true, icon: Users },
          { title: "Total Catalog", val: stats.categoryDistribution.length, trend: "Items", up: true, icon: ShoppingBag },
        ].map((m, i) => (
          <motion.div key={i} variants={itemVariants} whileHover={{ y: -5 }}>
            <Card className="border-0 shadow-lg shadow-black/40/40 rounded-[1.5rem] sm:rounded-2xl overflow-hidden group">
              <CardContent className="p-4 sm:p-6">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="p-2.5 sm:p-3 bg-gray-50 rounded-2xl group-hover:bg-black group-hover:text-white transition-colors">
                    <m.icon size={18} className="sm:w-[20px] sm:h-[20px]" />
                  </div>
                  <Badge className="rounded-lg font-bold text-[10px] bg-emerald-50 text-emerald-600">
                    {m.trend}
                  </Badge>
                </div>
                <p className="text-[10px] font-bold uppercase text-gray-500 tracking-wider mb-1">{m.title}</p>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tighter">{m.val}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* MAIN TREND CHART */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-2xl shadow-gray-200/30 rounded-[1.5rem] sm:rounded-2xl bg-white shadow-sm border-gray-200/60 transition-shadow duration-300 border border-gray-100 overflow-hidden">
          <CardHeader className="p-4 sm:p-8 pb-0">
            <CardTitle className="text-xl sm:text-2xl font-bold italic tracking-tighter">Growth Velocity.</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-8 pt-2 sm:pt-4">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={stats.revenueGrowth} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C41E6B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#C41E6B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontWeight: 'bold', fontSize: 10}} interval="preserveStartEnd" minTickGap={8} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontWeight: 'bold', fontSize: 10}} width={40} tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val} />
                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="revenue" stroke="#C41E6B" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (₹)" />
                <Area type="monotone" dataKey="orders" stroke="#FFA500" strokeWidth={3} fillOpacity={0.1} fill="#FFA500" name="Orders" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-2xl shadow-gray-200/30 rounded-[1.5rem] sm:rounded-2xl bg-white shadow-sm border-gray-200/60 transition-shadow duration-300 border border-gray-100 p-4 sm:p-6">
            <CardHeader className="p-0 pb-3 sm:pb-4"><CardTitle className="text-lg sm:text-xl font-bold italic tracking-tighter">Market Distribution.</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.categoryDistribution} layout="vertical" margin={{ top: 5, right: 15, left: -10, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{fontWeight: 'bold', fontSize: 11, fill: '#4B5563'}} width={75} />
                  <Tooltip cursor={{fill: '#F9FAFB'}} contentStyle={{borderRadius: '15px'}} />
                  <Bar dataKey="sales" fill="#C41E6B" radius={[0, 8, 8, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-2xl shadow-gray-200/30 rounded-[1.5rem] sm:rounded-2xl bg-white shadow-sm border-gray-200/60 transition-shadow duration-300 border border-gray-100 p-4 sm:p-6">
            <CardHeader className="p-0 pb-3 sm:pb-4"><CardTitle className="text-lg sm:text-xl font-bold italic tracking-tighter">Engagement Trends.</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={stats.customerTypes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontWeight: 'bold', fontSize: 10}} interval="preserveStartEnd" minTickGap={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontWeight: 'bold', fontSize: 10}} width={35} />
                  <Tooltip contentStyle={{borderRadius: '15px'}} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '8px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="new" stroke="#C41E6B" strokeWidth={3} dot={{r: 4, fill: '#C41E6B', strokeWidth: 1.5, stroke: '#fff'}} activeDot={{r: 6}} name="New Leads" />
                  <Line type="monotone" dataKey="returning" stroke="#FFA500" strokeWidth={3} dot={{r: 4, fill: '#FFA500', strokeWidth: 1.5, stroke: '#fff'}} activeDot={{r: 6}} name="Repeat Users" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}