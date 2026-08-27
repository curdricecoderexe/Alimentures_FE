import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Search, Eye, CheckCircle, Package, Clock, Truck, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { authenticatedFetch } from '../../lib/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.05 } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

import TableSkeleton from '../../components/skeletons/TableSkeleton';
import useSkeletonLoader from '../../hooks/useSkeletonLoader';

export default function StaffOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useSkeletonLoader(loading);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deliveryPersonnel, setDeliveryPersonnel] = useState([]);

  const fetchOrders = async () => {
    try {
      const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/orders?limit=100`);
      if (!res) return;
      const data = await res.json();
      if (data.success) {
        // Only show orders that staff needs to handle (not delivered)
        setOrders(data.data.filter(o => o.status !== 'delivered'));
      }
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/users/delivery`);
      if (!res) return;
      const data = await res.json();
      if (data.success) {
        setDeliveryPersonnel(data.data);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchOrders();
    fetchStaff();
  }, []);

  const filteredOrders = orders.filter(o =>
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.customerInfo?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateStatus = async (newStatus) => {
    const toastId = toast.loading('Updating order status...');
    try {
      const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res) return;
      if (res.ok) {
        toast.success(`Order status updated to ${newStatus.toUpperCase()}`, { id: toastId });
        fetchOrders();
        setSelectedOrder(null);
      } else {
        toast.error('Failed to update status', { id: toastId });
      }
    } catch {
      toast.error('Network Error', { id: toastId });
    }
  };

  const handleAssignDelivery = async (deliveryUid) => {
    const person = deliveryPersonnel.find(p => p.uid === deliveryUid);
    const toastId = toast.loading(`Assigning to ${person?.name}...`);
    try {
      const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/orders/${selectedOrder.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            deliveryUid,
            deliveryName: person?.name 
        })
      });
      if (!res) return;
      if (res.ok) {
        toast.success(`Assigned to ${person?.name}`, { id: toastId });
        fetchOrders();
        setSelectedOrder(null);
      } else {
        toast.error('Failed to assign delivery', { id: toastId });
      }
    } catch {
      toast.error('Network Error', { id: toastId });
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'processing': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'packed': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'shipped': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getStatusLabel = (status) => {
    const map = {
      'pending': 'Order Placed',
      'processing': 'Processing',
      'packed': 'Packed',
      'shipped': 'Shipped',
      'delivered': 'Delivered'
    };
    return map[status] || status;
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-1 sm:p-4 lg:p-6 space-y-5 sm:space-y-8 bg-[#FAFAFA] min-h-screen"
    >
      {loading ? (
        showSkeleton ? <TableSkeleton /> : <div className="min-h-screen"></div>
      ) : (
        <>
          {/* Header */}
          <div className="flex justify-between items-end">
            <div>
              <Badge className="bg-pink-50 text-[#C41E6B] border-none mb-2 font-black uppercase tracking-widest text-[9px] sm:text-[10px]">
                Dispatch Management
              </Badge>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tighter italic text-gray-900">Manage Orders.</h1>
            </div>
          </div>

      {/* --- QUICK STATS BENTO --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
            {[
              { label: 'Unprocessed', count: orders.filter(o => o.status === 'pending' || o.status === 'processing').length, icon: Clock, color: 'text-amber-500' },
              { label: 'Ready for Pickup', count: orders.filter(o => o.status === 'packed').length, icon: Package, color: 'text-[#C41E6B]' },
              { label: 'In Transit', count: orders.filter(o => o.status === 'shipped').length, icon: Truck, color: 'text-emerald-500' },
            ].map((stat, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className="border-0 shadow-sm rounded-2xl sm:rounded-[2rem] bg-white border border-gray-100 overflow-hidden transition-transform hover:scale-[1.02]">
              <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                  <p className={`text-2xl sm:text-4xl font-black tracking-tighter mt-0.5 sm:mt-1 ${stat.color}`}>{stat.count}</p>
                </div>
                <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                  <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* --- TABLE SECTION --- */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm rounded-2xl sm:rounded-[2.5rem] bg-white overflow-hidden">
          <div className="p-3.5 sm:p-6 border-b border-gray-50 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative w-full sm:w-80 md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search ID or Customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 sm:h-12 rounded-xl sm:rounded-2xl border-gray-100 bg-gray-50 focus:ring-[#C41E6B] focus:border-[#C41E6B] font-medium text-xs sm:text-sm"
              />
            </div>
            
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-[180px] md:w-[200px] h-10 sm:h-12 rounded-xl sm:rounded-2xl border-gray-100 font-bold text-gray-500 text-xs sm:text-sm">
                <SelectValue placeholder="Status Filter" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-xl">
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Order Placed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="packed">Packed</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mobile Card List View (< 768px) */}
          <div className="block md:hidden space-y-4 p-3.5 sm:p-4 bg-gray-50/40 dark:bg-transparent">
            {filteredOrders.map((order) => (
              <div key={order.id} className="p-4 space-y-3 bg-white dark:bg-[#1A1021] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-gray-900 dark:text-gray-100 text-xs sm:text-sm leading-tight truncate">
                      {order.customerInfo?.name || 'Customer'}
                    </p>
                    <p className="text-[11px] font-bold text-gray-400 truncate">{order.customerInfo?.email}</p>
                    <p className="text-[10px] font-black text-[#C41E6B] italic mt-0.5">
                      #{order.id.slice(-6).toUpperCase()}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Badge className={`rounded-full px-3 py-1 text-xs font-bold border shadow-none ${getStatusStyle(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-gray-50 dark:border-white/5">
                  <div>
                    <p className="font-bold text-gray-500 text-xs">{(order.items || []).length} Items</p>
                    <p className="font-black text-base text-gray-900 dark:text-gray-100 tracking-tight">₹{order.totalAmount}</p>
                    {order.deliveryPerson && (
                      <Badge variant="outline" className="mt-1 text-[9px] font-bold border-emerald-100 text-emerald-600 bg-emerald-50">
                        <Truck className="h-2 w-2 mr-1" /> {order.deliveryPerson.name}
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl border-gray-200 font-bold text-xs"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="h-4 w-4 mr-1 text-gray-500" /> Details
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-50 hover:bg-transparent">
                  <TableHead className="px-8 py-6 font-black uppercase tracking-widest text-[10px] text-gray-400">Order ID</TableHead>
                  <TableHead className="px-8 py-6 font-black uppercase tracking-widest text-[10px] text-gray-400">Customer Detail</TableHead>
                  <TableHead className="px-8 py-6 font-black uppercase tracking-widest text-[10px] text-gray-400">Items / Total</TableHead>
                  <TableHead className="px-8 py-6 font-black uppercase tracking-widest text-[10px] text-gray-400">Status</TableHead>
                  <TableHead className="px-8 py-6 text-right font-black uppercase tracking-widest text-[10px] text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                      <TableCell className="px-8 py-6 font-black text-[#C41E6B] italic">#{order.id.slice(-6).toUpperCase()}</TableCell>
                      <TableCell className="px-8 py-6">
                        <p className="font-black text-gray-900 tracking-tight">{order.customerInfo?.name}</p>
                        <p className="text-xs font-bold text-gray-400">{order.customerInfo?.email}</p>
                      </TableCell>
                      <TableCell className="px-8 py-6">
                        <p className="font-bold text-gray-500 text-xs">{(order.items || []).length} Items</p>
                        <p className="font-black text-lg text-gray-900 tracking-tighter italic">₹{order.totalAmount}</p>
                        {order.deliveryPerson && (
                          <Badge variant="outline" className="mt-1 text-[9px] font-bold border-emerald-100 text-emerald-600 bg-emerald-50">
                            <Truck className="h-2 w-2 mr-1" /> {order.deliveryPerson.name}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-8 py-6">
                        <Badge className={`rounded-full px-4 py-1 font-bold border shadow-none ${getStatusStyle(order.status)}`}>
                          <div className={`w-1.5 h-1.5 rounded-full mr-2 ${getStatusStyle(order.status).split(' ')[1].replace('text', 'bg')}`} />
                          {getStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-8 py-6 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-xl hover:bg-white hover:shadow-md transition-all"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-5 w-5 text-gray-400 group-hover:text-[#C41E6B]" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </Card>
      </motion.div>

      {/* --- ORDER DETAILS MODAL --- */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-visible">
          <div className="bg-black p-8 text-white rounded-t-[2.5rem]">
            <DialogHeader>
              <div className="flex justify-between items-center">
                <DialogTitle className="text-3xl font-black italic tracking-tighter">Order Summary.</DialogTitle>
                <Badge className="bg-[#C41E6B] border-none italic">{selectedOrder?.id}</Badge>
              </div>
            </DialogHeader>
          </div>

          {selectedOrder && (
            <div className="p-8 space-y-8 bg-white rounded-b-[2.5rem]">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</Label>
                  <p className="text-xl font-black text-gray-900">{selectedOrder.customerInfo?.name}</p>
                  <p className="text-sm font-bold text-gray-500">{selectedOrder.customerInfo?.phone || selectedOrder.customerInfo?.email}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Date</Label>
                  <p className="text-xl font-black text-gray-900 italic">
                    {selectedOrder.createdAt?._seconds 
                      ? new Date(selectedOrder.createdAt._seconds * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'Recently'
                    }
                  </p>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order Status</p>
                  <p className="text-lg font-black text-gray-900 italic mt-1">{getStatusLabel(selectedOrder.status)}</p>
                </div>
                <Select onValueChange={handleUpdateStatus}>
                  <SelectTrigger className="w-[180px] rounded-xl border-2 border-white shadow-sm font-bold">
                    <SelectValue placeholder="Update Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-xl">
                    <SelectItem value="pending">Order Placed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="packed">Packed</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(selectedOrder.status === 'packed' || selectedOrder.status === 'shipped' || selectedOrder.status === 'out_for_delivery' || selectedOrder.deliveryPerson) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-4 border-t border-gray-100"
                >
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {selectedOrder.deliveryPerson ? 'Update Delivery Personnel' : 'Assign Delivery Personnel'}
                    </Label>
                    {selectedOrder.deliveryPerson && (
                      <Badge className="bg-emerald-50 text-emerald-600 border-none text-[10px] font-black italic">
                        CURRENTLY: {selectedOrder.deliveryPerson.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Select onValueChange={(val) => handleAssignDelivery(val)}>
                      <SelectTrigger className="flex-1 h-12 rounded-xl font-bold">
                        <SelectValue placeholder="Select delivery person" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-xl">
                        {deliveryPersonnel.map((person) => (
                          <SelectItem key={person.uid} value={person.uid}>{person.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}

              {selectedOrder.status === 'delivered' && selectedOrder.proofOfDelivery && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-4 border-t border-gray-100"
                >
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Proof of Delivery</Label>
                  <div className="rounded-2xl overflow-hidden border-2 border-gray-100 max-h-48 relative">
                    <img src={selectedOrder.proofOfDelivery} alt="Proof of Delivery" className="w-full h-full object-cover object-center" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-4">
                      <p className="text-white text-xs font-black italic shadow-sm tracking-widest uppercase">Verified</p>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="font-black text-2xl tracking-tighter italic">Total ₹{selectedOrder.total}</span>
                <Button variant="ghost" className="font-bold text-gray-400" onClick={() => setSelectedOrder(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
        </>
      )}
    </motion.div>
  );
}