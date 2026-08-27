import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { 
  ShoppingBag, Package, AlertTriangle, CheckCircle, 
  ArrowUpRight, Activity, PieChart as PieIcon 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { authenticatedFetch } from '../../lib/api';

import DashboardSkeleton from '../../components/skeletons/DashboardSkeleton';
import useSkeletonLoader from '../../hooks/useSkeletonLoader';

export default function StaffDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const showSkeleton = useSkeletonLoader(loading);
  const [stats, setStats] = useState({
    pending: 0,
    completed: 0,
    lowStock: 0,
    assigned: 0,
    performanceData: [],
    stockDistribution: [],
    recentOrders: [],
    deliveryPersonnel: []
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [oRes, pRes, dRes] = await Promise.all([
        authenticatedFetch(`${import.meta.env.VITE_API_URL}/orders?limit=100`).catch(() => null),
        authenticatedFetch(`${import.meta.env.VITE_API_URL}/products?limit=100`).catch(() => null),
        authenticatedFetch(`${import.meta.env.VITE_API_URL}/users/delivery`).catch(() => null)
      ]);

      let orderList = [];
      let prodList = [];
      let deliveryStaff = [];

      if (oRes && oRes.ok) {
        const oData = await oRes.json();
        if (oData.success) orderList = oData.data || [];
      }
      
      if (pRes && pRes.ok) {
        const pData = await pRes.json();
        if (pData.success) prodList = pData.data || [];
      }

      if (dRes && dRes.ok) {
        const dData = await dRes.json();
        if (dData.success) deliveryStaff = dData.data || [];
      }

      // Process Stats
      const pending = orderList.filter(o => o.status === 'pending' || o.status === 'processing').length;
      const completed = orderList.filter(o => o.status === 'delivered').length;
      const assigned = orderList.filter(o => o.status === 'shipped').length;
      const recentOrders = orderList.slice(0, 5);

      const lowStock = prodList.filter(p => (p.stock || 0) < 10).length;
      const critical = prodList.filter(p => (p.stock || 0) < 5).length;
      const healthy = Math.max(0, prodList.length - lowStock);

      const perf = [
        { name: '08:00', orders: Math.floor(Math.random() * 10) + 5 },
        { name: '12:00', orders: pending || 2 },
        { name: '16:00', orders: assigned || 4 },
        { name: '20:00', orders: completed || 1 },
      ];

      setStats({
        pending,
        completed,
        lowStock,
        assigned,
        performanceData: perf,
        recentOrders,
        deliveryPersonnel: deliveryStaff,
        stockDistribution: [
          { name: 'Healthy', value: healthy || 1, color: '#10b981' },
          { name: 'Low', value: lowStock - critical, color: '#f59e0b' },
          { name: 'Critical', value: critical, color: '#C41E6B' },
        ]
      });
    } catch (err) {
      console.error("Dashboard Global Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    if (showSkeleton) return <div className="p-4 sm:p-6 lg:p-10 bg-transparent min-h-screen"><DashboardSkeleton /></div>;
    return <div className="min-h-screen bg-transparent"></div>;
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 bg-[#FAFAFA] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter italic text-gray-900">Staff Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-400 font-bold mt-1 sm:mt-2">Today's overview and tasks</p>
        </div>
      </div>

      {/* --- TOP STATS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Pending Orders', value: stats.pending, icon: ShoppingBag, color: 'text-amber-500' },
          { label: 'Completed Today', value: stats.completed, icon: CheckCircle, color: 'text-emerald-500' },
          { label: 'Low Stock Alerts', value: stats.lowStock, icon: AlertTriangle, color: 'text-red-500' },
          { label: 'Deliveries Assigned', value: stats.assigned, icon: Package, color: 'text-[#C41E6B]' },
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm rounded-[2rem] bg-white p-2 transition-transform hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs sm:text-sm font-bold text-gray-500">{stat.label}</span>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-4xl sm:text-5xl font-black tracking-tighter ${stat.color}`}>{stat.value}</div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2">Current Count</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* --- ANALYTICS SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <Card className="lg:col-span-2 border-0 shadow-sm rounded-[2rem] sm:rounded-[2.5rem] bg-white p-4 sm:p-6">
          <CardHeader className="px-2 sm:px-4 pb-6 flex flex-row items-center justify-between">
            <CardTitle className="text-lg sm:text-xl font-black italic">Order Velocity</CardTitle>
            <Activity className="h-5 w-5 text-[#C41E6B]" />
          </CardHeader>
          <CardContent className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.performanceData || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: '#9ca3af'}} />
                <Tooltip cursor={{fill: '#fdf2f8'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="orders" radius={[10, 10, 10, 10]} barSize={36}>
                  {(stats.performanceData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#C41E6B' : '#1A1A1A'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-[2rem] sm:rounded-[2.5rem] bg-white p-4 sm:p-6">
          <CardHeader className="px-2 sm:px-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg sm:text-xl font-black italic">Stock Health</CardTitle>
            <PieIcon className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[200px] sm:h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.stockDistribution || []} innerRadius={55} outerRadius={75} paddingAngle={8} dataKey="value">
                    {(stats.stockDistribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full space-y-3 mt-4">
              {(stats.stockDistribution || []).map((item) => (
                <div key={item.name} className="flex justify-between items-center text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-400 uppercase tracking-widest">{item.name}</span>
                  </div>
                  <span className="text-gray-900">{item.value} Units</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- QUICK ACTIONS & FEED --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button onClick={() => navigate('/staff/orders')} className="h-28 sm:h-32 bg-black hover:bg-zinc-800 text-white rounded-[2rem] flex flex-col gap-2 sm:gap-3 items-start p-6 sm:p-8 shadow-xl">
            <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-white/40" />
            <div className="text-left">
              <span className="font-black text-lg sm:text-xl italic block">Process Orders</span>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Go to Module</span>
            </div>
          </Button>

          <Button onClick={() => navigate('/staff/inventory')} className="h-28 sm:h-32 bg-white border-2 border-gray-100 hover:border-pink-200 text-gray-900 rounded-[2rem] flex flex-col gap-2 sm:gap-3 items-start p-6 sm:p-8 shadow-sm transition-all">
            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-[#C41E6B]" />
            <div className="text-left">
              <span className="font-black text-lg sm:text-xl italic block">Update Stock</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Manage Inventory</span>
            </div>
          </Button>
        </div>

        <Card className="border-0 shadow-sm rounded-[2rem] sm:rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-5 sm:p-7 border-b border-gray-50 flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-base sm:text-lg lg:text-xl font-black italic whitespace-nowrap">Delivery Personnel</CardTitle>
            <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold uppercase tracking-widest text-[10px] px-3 py-1.5 whitespace-nowrap shrink-0 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{stats.deliveryPersonnel?.length || 0} Online</span>
            </Badge>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {stats.deliveryPersonnel?.length > 0 ? (
                stats.deliveryPersonnel.map(person => (
                  <div key={person.uid} className="flex items-center justify-between p-3.5 sm:p-4 bg-gray-50/50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-xl flex items-center justify-center text-[10px] font-black italic border border-gray-100">DP</div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-black text-gray-900 leading-none text-xs sm:text-sm truncate">{person.name}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1 truncate">{person.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase">Available</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 sm:py-10">
                  <p className="text-gray-400 font-bold italic text-sm">No delivery staff found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}