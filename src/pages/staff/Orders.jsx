import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
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
  DialogFooter,
  DialogDescription
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Search, Filter, Package, ChevronRight, MapPin, Check } from 'lucide-react';
import { toast } from 'sonner';
import { authenticatedFetch } from '../../lib/api';

const StatusBadge = ({ status }) => {
  const normalizedStatus = (status || '').toLowerCase();

  const badgeClassMap = {
    'delivered': 'badge-delivered',
    'out_for_delivery': 'badge-shipped',
    'shipped': 'badge-shipped',
    'packed': 'badge-packed',
    'processing': 'badge-pending',
    'pending': 'badge-pending',
    'payment_pending': 'badge-pending',
    'payment_failed': 'badge-failed',
  };

  const labelMap = {
    'delivered': 'Delivered',
    'out_for_delivery': 'Out for Delivery',
    'shipped': 'Shipped',
    'packed': 'Packed',
    'processing': 'Processing',
    'pending': 'Placed',
    'payment_pending': 'Pending',
    'payment_failed': 'Failed',
  };

  return (
    <Badge variant="outline" className={`px-2.5 py-1 rounded-xl border font-bold text-[9.5px] uppercase tracking-wider shrink-0 max-w-max shadow-none ${badgeClassMap[normalizedStatus] || 'badge-pending'}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5 animate-pulse shrink-0" />
      <span className="truncate">{labelMap[normalizedStatus] || status}</span>
    </Badge>
  );
};

import TableSkeleton from '../../components/skeletons/TableSkeleton';
import useSkeletonLoader from '../../hooks/useSkeletonLoader';

const METHOD_LABELS = { upi: 'UPI', card: 'Card', netbanking: 'Netbanking', wallet: 'Wallet', emi: 'EMI', paylater: 'Pay Later' };

/** Human-readable payment type for an order (COD / UPI / Card / Online …). */
const paymentLabel = (order) => {
  const pm = order?.customerInfo?.paymentMethod;
  if (pm === 'cod') return 'Cash on Delivery';
  if (pm === 'razorpay') {
    const d = order?.paymentDetails;
    if (d?.method) {
      const m = METHOD_LABELS[d.method] || d.method;
      return d.detail ? `${m} · ${d.detail}` : m;
    }
    return 'Online (Razorpay)';
  }
  return pm || '—';
};

/** Short tag for tables: COD / UPI / CARD / ONLINE. */
const paymentTag = (order) => {
  const pm = order?.customerInfo?.paymentMethod;
  if (pm === 'cod') return 'COD';
  if (pm === 'razorpay') return (METHOD_LABELS[order?.paymentDetails?.method] || 'Online').toUpperCase();
  return (pm || '—').toUpperCase();
};

const STATUS_STEPS = [
  { id: 'pending', label: 'Placed' },
  { id: 'processing', label: 'Processing' },
  { id: 'packed', label: 'Packed' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'out_for_delivery', label: 'Out for Delivery' },
  { id: 'delivered', label: 'Delivered' },
];

export default function StaffOrders() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const showSkeleton = useSkeletonLoader(isLoading);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/orders?limit=100`);
      if (!res) return;
      const data = await res.json();
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (newStatus) => {
    try {
      const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res) return;
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: newStatus } : o));
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : prev);
        toast.success(`Order ${selectedOrder.id} status updated to ${newStatus}`);
      } else {
        let msg = 'Failed to update status';
        try { const d = await res.json(); if (d?.error) msg = d.error; } catch { /* ignore */ }
        toast.error(msg);
      }
    } catch {
      toast.error('Network Error');
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesQuery =
      ((o.customerInfo?.name || o.customer || '').toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.id.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || (o.status || '').toLowerCase() === statusFilter;
    return matchesQuery && matchesStatus;
  });

  if (isLoading) {
    if (showSkeleton) return <div className="p-3 sm:p-6 lg:p-10 bg-transparent min-h-screen"><TableSkeleton /></div>;
    return <div className="min-h-screen bg-transparent"></div>;
  }

  return (
    <div className="p-3 sm:p-6 lg:p-10 bg-transparent min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-center sm:text-left gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight italic">Orders.</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Update fulfillment status and review customer details</p>
        </div>
      </div>

      <Card className="border-0 shadow-2xl shadow-gray-200/40 rounded-2xl bg-white shadow-sm border-gray-200/60 transition-shadow duration-300 border border-gray-100 overflow-visible">
        <CardContent className="p-0">
          {/* SEARCH & FILTER BAR */}
          <div className="p-6 border-b border-gray-50 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 rounded-2xl border-gray-100 bg-gray-100 focus:bg-white shadow-sm border-gray-200/60 transition-shadow duration-300 border border-gray-100 focus:ring-2 focus:ring-gray-100"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] h-12 rounded-2xl border-gray-100 bg-gray-100 focus:ring-0 font-bold text-gray-500">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <SelectValue placeholder="All Orders" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-gray-100 shadow-2xl z-[100]">
                <SelectItem value="all" className="rounded-lg py-2.5 font-medium">All Statuses</SelectItem>
                <SelectItem value="pending" className="rounded-lg py-2.5 font-medium">Placed</SelectItem>
                <SelectItem value="processing" className="rounded-lg py-2.5 font-medium">Processing</SelectItem>
                <SelectItem value="packed" className="rounded-lg py-2.5 font-medium">Packed</SelectItem>
                <SelectItem value="shipped" className="rounded-lg py-2.5 font-medium">Shipped</SelectItem>
                <SelectItem value="out_for_delivery" className="rounded-lg py-2.5 font-medium">Out for Delivery</SelectItem>
                <SelectItem value="delivered" className="rounded-lg py-2.5 font-medium">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mobile Card List View (< 768px) */}
          <div className="block md:hidden divide-y divide-gray-100">
            {filteredOrders.map((order) => (
              <div key={order.id} className="p-4 space-y-3 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 leading-tight truncate">{order.customerInfo?.name || order.customer || 'Unknown'}</p>
                    <p className="text-[9.5px] font-bold text-[#E83D6E] uppercase tracking-wider mt-0.5 truncate max-w-[160px]">{order.id}</p>
                  </div>
                  <div className="shrink-0 pt-0.5">
                    <StatusBadge status={order.status} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-xs text-gray-500 font-bold">
                      {order.items?.length || order.items || 0} Items
                      <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                        order.customerInfo?.paymentMethod === 'cod'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>{paymentTag(order)}</span>
                    </p>
                    <p className="text-base font-bold text-gray-900">₹{order.totalAmount || order.total || 0}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 rounded-xl font-bold text-xs"
                    onClick={() => setSelectedOrder(order)}
                  >
                    View Details <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow className="border-0">
                  <TableHead className="h-14 text-[11px] font-bold uppercase text-gray-500 tracking-[0.2em] pl-8">Recipient</TableHead>
                  <TableHead className="h-14 text-[11px] font-bold uppercase text-gray-500 tracking-[0.2em]">Summary</TableHead>
                  <TableHead className="h-14 text-[11px] font-bold uppercase text-gray-500 tracking-[0.2em]">Logistics</TableHead>
                  <TableHead className="h-14 text-[11px] font-bold uppercase text-gray-500 tracking-[0.2em] text-right pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {filteredOrders.map((order) => (
                    <motion.tr
                      layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      key={order.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50/20 group transition-colors"
                    >
                      <TableCell className="py-6 pl-8">
                        <div>
                          <p className="text-base font-bold text-gray-900 leading-tight">{order.customerInfo?.name || order.customer || 'Unknown'}</p>
                          <p className="text-[10px] font-bold text-[#E83D6E] uppercase tracking-wider mt-1">{order.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-gray-700">{order.items?.length || order.items || 0} Items</p>
                          <p className="text-lg font-bold text-gray-900 tracking-tight">₹{order.totalAmount || order.total || 0}</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                            order.customerInfo?.paymentMethod === 'cod'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>{paymentTag(order)}</span>
                        </div>
                      </TableCell>
                      <TableCell><StatusBadge status={order.status} /></TableCell>
                      <TableCell className="text-right pr-8">
                        <Button
                          variant="ghost"
                          className="h-11 px-5 rounded-xl font-bold text-xs text-gray-500 hover:text-black hover:bg-white shadow-sm border-gray-200/60 transition-shadow duration-300 border border-gray-100 border border-transparent hover:border-gray-100 shadow-sm transition-all"
                          onClick={() => setSelectedOrder(order)}
                        >
                          View Details <ChevronRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* --- VIEW DETAILS / UPDATE STATUS MODAL --- */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg rounded-2xl p-4 sm:p-8 border-0 shadow-2xl bg-white dark:bg-[#1A1021] text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-white/10 overflow-y-auto max-h-[90vh] w-[95vw]">
          <DialogHeader className="mb-4 sm:mb-6">
            <div className="flex items-center gap-3 mb-1 sm:mb-2">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-[#E83D6E]" />
              <DialogTitle className="text-xl sm:text-3xl font-bold italic tracking-tighter">Order Context.</DialogTitle>
            </div>
            <DialogDescription className="font-medium text-xs sm:text-sm text-gray-500 dark:text-gray-400">Customer details and fulfillment status.</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 sm:space-y-8">
              {/* ORDER SUMMARY CARD */}
              <div className="p-4 sm:p-6 rounded-2xl sm:rounded-2xl bg-gray-50 dark:bg-[#24162E] border border-gray-100 dark:border-white/10 relative overflow-hidden">
                <div className="grid grid-cols-2 gap-4 sm:gap-6 relative z-10">
                  <div className="space-y-1 min-w-0">
                    <Label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Recipient</Label>
                    <p className="text-base sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{selectedOrder.customerInfo?.name || selectedOrder.customer || 'Unknown'}</p>
                  </div>
                  <div className="text-right space-y-1 min-w-0">
                    <Label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Tracking ID</Label>
                    <p className="text-xs sm:text-sm font-bold text-[#E83D6E] truncate">{selectedOrder.id}</p>
                  </div>
                  <div className="pt-3 sm:pt-4 border-t border-gray-200/50 dark:border-white/10">
                    <Label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Value</Label>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">₹{selectedOrder.totalAmount || selectedOrder.total || 0}</p>
                  </div>
                  <div className="pt-3 sm:pt-4 border-t border-gray-200/50 dark:border-white/10 text-right">
                    <Label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Items Count</Label>
                    <p className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300">{selectedOrder.items?.length || selectedOrder.items || 0} Units</p>
                  </div>
                  <div className="col-span-2 pt-3 sm:pt-4 border-t border-gray-200/50 dark:border-white/10 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Payment</Label>
                      <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{paymentLabel(selectedOrder)}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 px-2.5 py-1 rounded-xl border font-bold text-[9.5px] uppercase tracking-wider shadow-none ${
                        selectedOrder.customerInfo?.paymentMethod === 'cod'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900'
                      }`}
                    >
                      {paymentTag(selectedOrder)}
                    </Badge>
                  </div>

                  <div className="col-span-2 pt-3 sm:pt-4 border-t border-gray-200/50 dark:border-white/10 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Delivery</Label>
                      <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                        {selectedOrder.deliveryMethod === 'fastest' ? 'Fastest' : 'Standard'}
                        {selectedOrder.deliveryPincode ? ` · ${selectedOrder.deliveryPincode}` : ''}
                        {selectedOrder.deliveryEstimate ? ` · ${selectedOrder.deliveryEstimate}` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-gray-900 dark:text-gray-100">
                      {(selectedOrder.deliveryFee ?? selectedOrder.shipping ?? 0) === 0 ? 'Free' : `₹${selectedOrder.deliveryFee ?? selectedOrder.shipping}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* STATUS UPDATE SECTION — the only mutating action on this page */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between ml-1">
                  <Label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Fulfillment Progress</Label>
                  <Badge variant="secondary" className="text-[9px] font-bold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300">TAP A STEP TO UPDATE</Badge>
                </div>

                <div className="bg-gray-50 dark:bg-[#1A1021] rounded-2xl p-5 sm:p-8 border border-gray-100 dark:border-white/10">
                  <div className="flex justify-between items-center relative">
                    <div className="absolute top-3 sm:top-4 left-4 right-4 h-1 bg-gray-200 dark:bg-zinc-800 z-0 rounded-full" />

                    {STATUS_STEPS.map((step, index, arr) => {
                      const allStatuses = arr.map(s => s.id);
                      // Fallback to 0 if status is unknown
                      let currentIdx = allStatuses.indexOf((selectedOrder.status || 'pending').toLowerCase());
                      if (currentIdx === -1) currentIdx = 0;

                      const isCompleted = index <= currentIdx;
                      const isActive = index === currentIdx;

                      return (
                        <div
                          key={step.id}
                          className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer"
                          onClick={() => handleUpdateStatus(step.id)}
                        >
                           <div className={`h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs transition-all shadow-sm
                              ${isActive ? 'bg-black dark:bg-white text-white dark:text-black ring-4 ring-black/10 dark:ring-white/10 scale-110' :
                                isCompleted ? 'bg-gray-900 dark:bg-gray-300 text-white dark:text-black' : 'bg-white dark:bg-[#24162E] border-2 border-gray-200 dark:border-white/10 text-gray-400 group-hover:border-gray-400'}
                           `}>
                              {isCompleted && !isActive ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : index + 1}
                           </div>
                           <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wider absolute top-8 sm:top-11 whitespace-nowrap transition-colors
                             ${isActive ? 'text-black dark:text-white' : isCompleted ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}
                           `}>
                             {step.label}
                           </span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="h-6 sm:h-8"></div>
                </div>
              </div>

              {/* ITEMS LIST */}
              <div className="space-y-3 sm:space-y-4">
                <Label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider ml-1">Purchased Items</Label>
                <div className="space-y-2.5 sm:space-y-3">
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-[#24162E] rounded-2xl border border-gray-100 dark:border-white/10">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white dark:bg-[#1A1021] border border-gray-100 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                          {item.image && <img src={item.image} className="h-full w-full object-cover" alt="" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm truncate">{item.name || item.title}</p>
                          <p className="text-[9.5px] font-bold text-[#E83D6E] uppercase tracking-wider">{item.selectedWeight} × {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm shrink-0 ml-2">₹{item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SHIPPING / CUSTOMER DETAILS */}
              <div className="space-y-3 sm:space-y-4">
                <Label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider ml-1">Shipping Logistics</Label>
                <div className="p-4 sm:p-5 bg-white dark:bg-[#24162E] border border-gray-100 dark:border-white/10 rounded-2xl flex items-start gap-3 sm:gap-4">
                  <div className="p-2.5 sm:p-3 bg-gray-50 dark:bg-[#1A1021] rounded-xl text-gray-500 dark:text-gray-400 shrink-0">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm leading-snug">
                      {selectedOrder.customerInfo?.address}
                    </p>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {selectedOrder.customerInfo?.city}, {selectedOrder.customerInfo?.state} - {selectedOrder.customerInfo?.pincode}
                    </p>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                      {selectedOrder.customerInfo?.phone || selectedOrder.customerInfo?.email}
                    </p>

                    {selectedOrder.customerInfo?.coords && (
                      <div className="mt-4 space-y-2">
                        <div className="w-full h-36 sm:h-40 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 relative group/staff-map">
                          <iframe
                            title="Delivery location"
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            style={{ border: 0 }}
                            src={`https://maps.google.com/maps?q=${selectedOrder.customerInfo.coords.lat},${selectedOrder.customerInfo.coords.lng}&z=15&output=embed`}
                            allowFullScreen
                          ></iframe>
                          <div
                            className="absolute inset-0 bg-black/0 group-hover/staff-map:bg-black/5 transition-colors cursor-pointer"
                            onClick={() => {
                              const info = selectedOrder.customerInfo;
                              window.open(`https://www.google.com/maps/search/?api=1&query=${info.coords.lat},${info.coords.lng}`, '_blank');
                            }}
                          />
                        </div>
                        <p className="text-[9.5px] font-bold text-gray-500 dark:text-gray-400 italic">Click map for turn-by-turn navigation</p>
                      </div>
                    )}

                    {!selectedOrder.customerInfo?.coords && (
                      <Button
                        onClick={() => {
                          const info = selectedOrder.customerInfo;
                          const query = encodeURIComponent(`${info.address}, ${info.city}, ${info.state} ${info.pincode}`);
                          window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                        }}
                        className="mt-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 border-0 rounded-xl font-bold h-9 px-3.5 text-xs"
                      >
                        🚀 Open Address in Maps
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  className="h-14 rounded-2xl bg-black !text-white font-bold shadow-xl w-full active:scale-95 transition-all"
                  onClick={() => setSelectedOrder(null)}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
