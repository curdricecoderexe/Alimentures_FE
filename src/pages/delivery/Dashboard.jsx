import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { authenticatedFetch } from '../../lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Navigation, 
  AlertCircle,
  Calendar
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area 
} from 'recharts';



const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.1 } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function DeliveryDashboard() {
  const [deliveries, setDeliveries] = useState([]);
  const navigate = useNavigate();

  const fetchDeliveries = async () => {
    try {
      const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/orders?limit=50`);
      if (!res) return;
      const data = await res.json();
      if (data.success) {
        setDeliveries(data.data);
      }
    } catch {
      toast.error('Failed to load shipments');
      // setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDeliveries();
  }, []);

  const pendingAssignments = deliveries.filter(d => d.deliveryPerson?.status === 'pending');
  const activeDeliveries = deliveries.filter(d => (!d.deliveryPerson?.status || d.deliveryPerson?.status === 'accepted') && d.status !== 'delivered');
  const completedDeliveries = deliveries.filter(d => (!d.deliveryPerson?.status || d.deliveryPerson?.status === 'accepted') && d.status === 'delivered');

  const handleAcceptReject = async (orderId, action) => {
    const toastId = toast.loading(`Processing...`);
    try {
      const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/orders/${orderId}/accept-delivery`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (!res) return;
      if (res.ok) {
        toast.success(`Order ${action}ed!`, { id: toastId });
        fetchDeliveries();
      } else {
        toast.error('Failed to update', { id: toastId });
      }
    } catch {
      toast.error('Network Error', { id: toastId });
    }
  };

  const handleViewMap = () => {
    if (activeDeliveries.length > 0) {
      const order = activeDeliveries[0];
      if (order.customerInfo?.coords) {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${order.customerInfo.coords.lat},${order.customerInfo.coords.lng}`, '_blank');
      } else {
        // Fallback to address search
        const query = encodeURIComponent(`${order.customerInfo?.address}, ${order.customerInfo?.city}`);
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
      }
    } else {
      toast.error('No active shipments available to map!');
    }
  };

  const performanceData = [
    { day: 'Mon', completed: 0 },
    { day: 'Tue', completed: 0 },
    { day: 'Wed', completed: 0 },
    { day: 'Thu', completed: 0 },
    { day: 'Fri', completed: 0 },
    { day: 'Sat', completed: 0 },
    { day: 'Sun', completed: 0 },
  ];

  completedDeliveries.forEach(order => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const date = order.updatedAt?._seconds ? new Date(order.updatedAt._seconds * 1000) : new Date();
    const dayStr = days[date.getDay()];
    const index = performanceData.findIndex(d => d.day === dayStr);
    if (index !== -1) {
      performanceData[index].completed += 1;
    }
  });

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-10 pb-12"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Badge className="bg-pink-50 text-[#C41E6B] border-none mb-3 font-black uppercase tracking-widest text-[10px]">
            Route Efficiency
          </Badge>
          <h1 className="text-5xl font-black tracking-tighter italic text-gray-900">Driver Hub.</h1>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
           <Calendar className="h-4 w-4 text-[#C41E6B] ml-2" />
           <span className="text-sm font-bold text-gray-600 pr-4">March 26, 2026</span>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Assigned', val: deliveries.length < 10 ? `0${deliveries.length}` : deliveries.length, icon: Truck, color: 'text-gray-900', bg: 'bg-white' },
          { label: 'Completed', val: completedDeliveries.length < 10 ? `0${completedDeliveries.length}` : completedDeliveries.length, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-white' },
          { label: 'Remaining', val: activeDeliveries.length < 10 ? `0${activeDeliveries.length}` : activeDeliveries.length, icon: Clock, color: 'text-[#C41E6B]', bg: 'bg-white' },
          { label: 'Efficiency', val: deliveries.length > 0 ? `${Math.round((completedDeliveries.length / deliveries.length) * 100)}%` : '0%', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-white' },
        ].map((stat, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className="border-0 shadow-sm rounded-[2rem] overflow-hidden group hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
                  <stat.icon className={`h-5 w-5 ${stat.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
                </div>
                <div className={`text-4xl font-black tracking-tighter italic ${stat.color}`}>{stat.val}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Graph */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="border-0 shadow-sm rounded-[2.5rem] bg-white p-8 h-full">
            <div className="flex justify-between items-center mb-8">
              <CardTitle className="text-xl font-black italic tracking-tight">Delivery Velocity</CardTitle>
              <Badge variant="outline" className="border-gray-100 font-bold text-gray-400 uppercase text-[9px]">Last 7 Days</Badge>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C41E6B" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#C41E6B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fontWeight: 700, fill: '#9CA3AF'}}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#C41E6B" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions Bento */}
        <motion.div variants={itemVariants} className="space-y-6">
          <Card className="border-0 shadow-sm rounded-[2.5rem] bg-black text-white p-8">
            <CardTitle className="text-xl font-black italic mb-6">Dispatch Tools</CardTitle>
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={() => navigate('/delivery/orders')} className="h-28 rounded-3xl bg-[#C41E6B] hover:bg-[#A31859] border-none flex flex-col gap-2 transition-transform active:scale-95">
                <Navigation className="h-6 w-6" />
                <span className="font-black italic text-xs uppercase">Start Route</span>
              </Button>
              <Button onClick={handleViewMap} variant="outline" className="h-28 rounded-3xl bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white flex flex-col gap-2">
                <MapPin className="h-6 w-6" />
                <span className="font-black italic text-xs uppercase">View Map</span>
              </Button>
              <Button onClick={() => toast.info('Schedule feature coming soon!')} variant="outline" className="h-28 rounded-3xl bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white flex flex-col gap-2">
                <Calendar className="h-6 w-6" />
                <span className="font-black italic text-xs uppercase">Schedule</span>
              </Button>
              <Button onClick={() => toast.error('Emergency SOS alert transmitted!')} variant="outline" className="h-28 rounded-3xl bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white flex flex-col gap-2 group">
                <AlertCircle className="h-6 w-6 group-hover:text-red-500 transition-colors" />
                <span className="font-black italic text-xs uppercase">SOS Report</span>
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      {pendingAssignments.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm rounded-[2.5rem] bg-[#C41E6B]/5 border-2 border-[#C41E6B]/20 overflow-hidden">
            <div className="p-8 border-b border-[#C41E6B]/10">
              <CardTitle className="text-2xl font-black italic tracking-tight text-[#C41E6B]">Pending Assignments.</CardTitle>
            </div>
            <div className="divide-y divide-[#C41E6B]/10">
              {pendingAssignments.map((order) => (
                <div key={order.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-8 gap-4">
                  <div>
                    <p className="font-black text-gray-900 text-xl tracking-tight mb-1">New Delivery for {order.customerInfo?.name}</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                      <MapPin className="h-4 w-4 text-[#C41E6B]" />
                      <span>{order.customerInfo?.address}, {order.customerInfo?.city}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => handleAcceptReject(order.id, 'reject')} variant="outline" className="rounded-xl border-gray-200 hover:bg-red-50 hover:text-red-600 font-bold">
                      Decline
                    </Button>
                    <Button onClick={() => handleAcceptReject(order.id, 'accept')} className="rounded-xl bg-[#C41E6B] hover:bg-[#A31859] text-white font-black italic px-8 shadow-md shadow-pink-500/20">
                      Accept Order
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Deliveries List */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm rounded-[2.5rem] bg-white overflow-hidden h-full">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
              <CardTitle className="text-2xl font-black italic tracking-tight">Active Shipments.</CardTitle>
            </div>
            <div className="divide-y divide-gray-50">
              {activeDeliveries.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-8 hover:bg-gray-50/50 transition-all group cursor-pointer"
                  onClick={() => navigate('/delivery/orders')}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="font-black text-xl italic text-[#C41E6B]">#{order.id.slice(-6).toUpperCase()}</span>
                      <Badge className={`rounded-full px-4 py-1 font-bold border shadow-none ${
                        order.status === 'shipped' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {order.status}
                      </Badge>
                    </div>
                    <p className="font-black text-gray-900 text-lg tracking-tight mb-1">{order.customerInfo?.name || 'Customer'}</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
                      <MapPin className="h-4 w-4 text-gray-300" />
                      <span>{order.customerInfo?.address}, {order.customerInfo?.city}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-4">
                    <Button className="rounded-xl bg-black hover:bg-zinc-800 text-white font-black italic px-6" onClick={(e) => { e.stopPropagation(); navigate('/delivery/orders'); }}>
                      Update
                    </Button>
                  </div>
                </div>
              ))}
              {activeDeliveries.length === 0 && (
                <div className="p-8 text-center text-gray-500 font-bold italic">No active shipments right now.</div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* History List */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm rounded-[2.5rem] bg-white overflow-hidden h-full">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
              <CardTitle className="text-2xl font-black italic tracking-tight text-gray-400">Delivery History.</CardTitle>
            </div>
            <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
              {completedDeliveries.slice(0, 10).map((order) => (
                <div key={order.id} className="p-6 hover:bg-gray-50/50 transition-all flex items-center justify-between">
                   <div>
                     <p className="font-black text-gray-400 italic">#{order.id.slice(-6).toUpperCase()}</p>
                     <p className="font-bold text-gray-900 mt-1">{order.customerInfo?.name}</p>
                   </div>
                   <div className="text-right">
                     <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold uppercase tracking-widest text-[9px]">Delivered</Badge>
                     <p className="text-[10px] text-gray-400 font-bold mt-2">
                       {order.updatedAt?._seconds ? new Date(order.updatedAt._seconds * 1000).toLocaleDateString() : 'Recent'}
                     </p>
                   </div>
                </div>
              ))}
              {completedDeliveries.length === 0 && (
                <div className="p-8 text-center text-gray-400 font-bold italic">No deliveries completed yet.</div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}