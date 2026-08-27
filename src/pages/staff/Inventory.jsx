import { useState, useEffect } from 'react';
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
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Search, Plus, Minus, AlertTriangle, Archive, Package, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { authenticatedFetch } from '../../lib/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

import TableSkeleton from '../../components/skeletons/TableSkeleton';
import useSkeletonLoader from '../../hooks/useSkeletonLoader';

export default function StaffInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useSkeletonLoader(loading);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockAdjustment, setStockAdjustment] = useState('');

  const fetchInventory = async () => {
    try {
      const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/products?limit=100`);
      if (!res) return;
      const data = await res.json();
      if (data.success) {
        setInventory(data.data.map(p => ({
          id: p.id,
          name: p.title,
          stock: p.stock || 0,
          reorder: 10, // Assuming a default reorder point
          status: (p.stock || 0) < 5 ? 'Critical' : (p.stock || 0) < 10 ? 'Low' : 'Good'
        })));
      }
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockCount = inventory.filter(item => item.stock < 10).length;

  const handleStockUpdate = async (type) => {
    const adjustment = parseInt(stockAdjustment);
    if (!adjustment || adjustment <= 0) {
      toast.error('Enter a valid quantity');
      return;
    }

    const toastId = toast.loading('Updating inventory...');
    try {
      const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/products/${selectedProduct.id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adjustment: type === 'add' ? adjustment : -adjustment
        })
      });

      if (!res) return;
      if (res.ok) {
        toast.success(`Inventory updated: ${selectedProduct.name}`, { id: toastId });
        fetchInventory();
        setSelectedProduct(null);
        setStockAdjustment('');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update stock', { id: toastId });
      }
    } catch {
      toast.error('Network error', { id: toastId });
    }
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
          {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4">
        <div>
          <Badge className="bg-pink-50 text-[#C41E6B] border-none mb-2 font-black uppercase tracking-widest text-[9px] sm:text-[10px]">
            Stock Control
          </Badge>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tighter italic text-gray-900">Inventory.</h1>
        </div>
        
        {lowStockCount > 0 && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-3 bg-red-50 border border-red-100 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl"
          >
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
            <span className="text-xs sm:text-sm font-black text-red-600 uppercase tracking-tight">
              {lowStockCount} Critical Alerts
            </span>
          </motion.div>
        )}
      </div>

      {/* --- STATS OVERVIEW --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        {[
          { label: 'Total SKUs', value: inventory.length, icon: Archive, color: 'text-gray-900', iconColor: 'text-[#E83D6E]' },
          { label: 'Low Stock', value: lowStockCount, icon: AlertTriangle, color: 'text-[#C41E6B]', iconColor: 'text-amber-500' },
          { label: 'Stock Value', value: 'High', icon: BarChart3, color: 'text-emerald-500', iconColor: 'text-emerald-500' },
        ].map((stat, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className="border-0 shadow-sm rounded-2xl sm:rounded-[2rem] bg-white border border-gray-100 overflow-hidden">
              <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                  <p className={`text-2xl sm:text-4xl font-black tracking-tighter mt-0.5 sm:mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
                <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                  <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.iconColor || stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* --- SEARCH & TABLE --- */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm rounded-2xl sm:rounded-[2.5rem] bg-white dark:bg-[#180E1D] overflow-hidden">
          <div className="p-3.5 sm:p-6 border-b border-gray-50">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 sm:h-12 rounded-xl sm:rounded-2xl border-gray-100 bg-gray-50 focus:ring-[#C41E6B] font-medium text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Mobile Card List View (< 768px) */}
          <div className="block md:hidden space-y-3.5 p-3.5 sm:p-4 bg-gray-50/40 dark:bg-transparent">
            {filteredInventory.map((item) => (
              <div key={item.id} className="p-4 space-y-3 bg-white dark:bg-[#22152B] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-gray-900 dark:text-gray-100 text-xs sm:text-sm leading-tight">{item.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 italic mt-0.5 truncate">SKU: {item.id}</p>
                  </div>
                  <div className="shrink-0">
                    <Badge className={`rounded-full px-3 py-1 text-xs font-bold border shadow-none ${
                      item.status === 'Critical' ? 'bg-red-50 text-red-600 border-red-100' :
                      item.status === 'Low' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {item.status}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-gray-50 dark:border-white/5">
                  <div>
                    <span className={`font-black text-base ${item.stock < 10 ? 'text-[#C41E6B]' : 'text-gray-900 dark:text-gray-100'}`}>
                      {item.stock} <span className="text-[10px] uppercase font-bold text-gray-400">Units</span>
                    </span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter ml-2">Min: {item.reorder}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedProduct(item)}
                    className="rounded-xl border-gray-200 font-black italic hover:bg-black hover:text-white transition-all text-xs"
                  >
                    Update
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
                  <TableHead className="px-8 py-6 font-black uppercase tracking-widest text-[10px] text-gray-400">SKU ID</TableHead>
                  <TableHead className="px-8 py-6 font-black uppercase tracking-widest text-[10px] text-gray-400">Product Name</TableHead>
                  <TableHead className="px-8 py-6 font-black uppercase tracking-widest text-[10px] text-gray-400">Stock Level</TableHead>
                  <TableHead className="px-8 py-6 font-black uppercase tracking-widest text-[10px] text-gray-400">Status</TableHead>
                  <TableHead className="px-8 py-6 text-right font-black uppercase tracking-widest text-[10px] text-gray-400">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredInventory.map((item) => (
                    <TableRow key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                      <TableCell className="px-8 py-6 font-bold text-gray-400 italic text-xs">{item.id}</TableCell>
                      <TableCell className="px-8 py-6 font-black text-gray-900 tracking-tight">{item.name}</TableCell>
                      <TableCell className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className={`font-black text-lg ${item.stock < 10 ? 'text-[#C41E6B]' : 'text-gray-900'}`}>
                            {item.stock} <span className="text-[10px] uppercase font-bold text-gray-400">Units</span>
                          </span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Min: {item.reorder}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 py-6">
                        <Badge className={`rounded-full px-4 py-1 font-bold border shadow-none ${
                          item.status === 'Critical' ? 'bg-red-50 text-red-600 border-red-100' :
                          item.status === 'Low' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-8 py-6 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedProduct(item)}
                          className="rounded-xl border-gray-200 font-black italic hover:bg-black hover:text-white transition-all shadow-sm"
                        >
                          Update
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

      {/* --- STOCK ADJUSTMENT DIALOG --- */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-black p-8 text-white">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Update Inventory</p>
            <DialogTitle className="text-3xl font-black italic tracking-tighter">
              {selectedProduct?.name}.
            </DialogTitle>
          </div>

          <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Balance</Label>
                <p className="text-4xl font-black text-gray-900 tracking-tighter">{selectedProduct?.stock} Units</p>
              </div>
              <Package className="h-12 w-12 text-gray-100" />
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Adjustment Quantity</Label>
              <Input
                type="number"
                placeholder="00"
                value={stockAdjustment}
                onChange={(e) => setStockAdjustment(e.target.value)}
                className="h-16 text-2xl font-black rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white transition-all text-center"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => handleStockUpdate('add')} 
                className="h-24 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] flex flex-col gap-1 transition-transform active:scale-95"
              >
                <Plus className="h-6 w-6 mb-1" />
                <span className="font-black italic">Restock</span>
              </Button>
              <Button 
                onClick={() => handleStockUpdate('remove')} 
                className="h-24 bg-black hover:bg-zinc-800 text-white rounded-[2rem] flex flex-col gap-1 transition-transform active:scale-95"
              >
                <Minus className="h-6 w-6 mb-1" />
                <span className="font-black italic">Dispatch</span>
              </Button>
            </div>

            <Button 
              variant="ghost" 
              className="w-full font-bold text-gray-400" 
              onClick={() => setSelectedProduct(null)}
            >
              Cancel Transaction
            </Button>
          </div>
        </DialogContent>
      </Dialog>
        </>
      )}
    </motion.div>
  );
}