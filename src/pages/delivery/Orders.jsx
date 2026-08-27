import { useState, useEffect, useRef } from 'react';
import { authenticatedFetch } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Phone, 
  Package, 
  Camera, 
  CheckCircle, 
  Navigation, 
  Info, 
  Clock // Added the missing import
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
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
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';



const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const cardVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function DeliveryOrders() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proofImage, setProofImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleClose = () => {
    setSelectedOrder(null);
    setProofImage(null);
  };

  const handleCapturePhoto = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic validation for image type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          // Create canvas for compression
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Max dimension to keep file size low
          const MAX_DIM = 800; 
          if (width > height) {
            if (width > MAX_DIM) {
              height *= MAX_DIM / width;
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width *= MAX_DIM / height;
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to compressed JPEG (0.6 quality)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          setProofImage(compressedBase64);
          console.log('Image compressed. New size approx:', Math.round(compressedBase64.length / 1024), 'KB');
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchDeliveries = async () => {
    try {
      const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/orders?limit=50`);
      if (!res) return;
      const data = await res.json();
      if (data.success) {
        // Show all active shipments (anything not delivered and accepted)
        setDeliveries(data.data.filter(o => o.status !== 'delivered' && (!o.deliveryPerson?.status || o.deliveryPerson?.status === 'accepted')));
      }
    } catch {
      toast.error('Failed to load active shipments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleNavigation = (order) => {
    const info = order.customerInfo;
    const query = info.coords 
      ? `${info.coords.lat},${info.coords.lng}`
      : encodeURIComponent(`${info.address}, ${info.city}, ${info.state} ${info.pincode}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const handleUpdateStatus = async (newStatus) => {
    if (newStatus === 'delivered' && !proofImage) {
      toast.error('Please capture a proof of delivery photo first!');
      return;
    }
    try {
      console.log(`Updating status for order ${selectedOrder.id} to ${newStatus}`);
      const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus, 
          proofImage: newStatus === 'delivered' ? proofImage : undefined 
        })
      });
      
      if (res && res.ok) {
        toast.success(`Order ${newStatus.toUpperCase()}`);
        fetchDeliveries();
        handleClose();
      } else {
        const errorData = await res?.json();
        toast.error(errorData?.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Status update error:', err);
      toast.error('Failed to update status');
    }
  };

  const handleMarkDelivered = () => handleUpdateStatus('delivered');

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-8"
    >
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Badge className="bg-emerald-50 text-emerald-600 border-none mb-3 font-black uppercase tracking-widest text-[10px]">
            Active Shipments
          </Badge>
          <h1 className="text-5xl font-black tracking-tighter italic text-gray-900">Deliveries.</h1>
        </div>
        <div className="flex -space-x-2">
           <div className="w-10 h-10 rounded-full border-4 border-[#FAFAFA] bg-black text-white flex items-center justify-center text-[10px] font-black italic">
             +3
           </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 gap-6">
        {deliveries.length === 0 && !loading && (
          <div className="bg-white rounded-[2.5rem] p-16 text-center shadow-sm">
            <Package className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-2xl font-black italic text-gray-900 tracking-tight mb-2">No Active Deliveries</h3>
            <p className="text-gray-400 font-bold">You don't have any shipments assigned right now.</p>
          </div>
        )}
        {deliveries.map((delivery) => (
          <motion.div key={delivery.id} variants={cardVariants}>
            <Card className="border-0 shadow-sm rounded-[2.5rem] bg-white overflow-hidden group hover:shadow-xl transition-all duration-500">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black italic tracking-tighter text-[#C41E6B]">#{delivery.id.slice(-6).toUpperCase()}</span>
                      <Badge className="rounded-full px-4 py-1 font-black text-[10px] uppercase border bg-blue-50 text-blue-600 border-blue-100 shadow-none">
                        {delivery.status}
                      </Badge>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="h-3 w-3" /> {delivery.createdAt ? new Date(delivery.createdAt?._seconds * 1000).toLocaleTimeString() : 'ASAP'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black tracking-tighter text-gray-900">₹{delivery.totalAmount || delivery.total}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{delivery.items?.length || 0} Items</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8 pt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-5 rounded-[2rem] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-black italic text-gray-900">{delivery.customerInfo?.name || 'Customer'}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Recipient</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-5 rounded-[2rem] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                      <Phone className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-black italic text-gray-900">{delivery.customerInfo?.firstName} {delivery.customerInfo?.lastName}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Verified User</p>
                    </div>
                  </div>
                </div>

                <div className="bg-black p-6 rounded-[2.5rem] text-white relative overflow-hidden group/address">
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#C41E6B] flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div className="space-y-3 flex-1">
                      <p className="font-bold text-sm leading-relaxed text-gray-200">
                        {delivery.customerInfo?.address}, {delivery.customerInfo?.city}
                      </p>
                      {delivery.instructions && (
                        <div className="flex items-center gap-2 bg-zinc-800 w-fit px-3 py-1 rounded-full">
                          <Info className="h-3 w-3 text-[#C41E6B]" />
                          <p className="text-[10px] font-bold italic text-zinc-400">{delivery.instructions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <Navigation className="absolute -right-4 -bottom-4 h-24 w-24 text-white/5 rotate-12" />
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => setSelectedOrder(delivery)}
                    className="flex-1 h-14 rounded-2xl bg-[#C41E6B] hover:bg-[#A31859] text-white font-black italic tracking-tight"
                  >
                    Manage Step
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleNavigation(delivery)}
                    className="h-14 w-14 rounded-2xl border-gray-100 bg-gray-50 hover:bg-black hover:text-white transition-all"
                  >
                    <Navigation className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-lg rounded-[3rem] border-none p-0 overflow-hidden shadow-2xl">
          <div className="bg-black p-10 text-white">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Operational Update</p>
            <DialogTitle className="text-4xl font-black italic tracking-tighter leading-none">
              Shipment {selectedOrder?.id}.
            </DialogTitle>
          </div>

          <div className="p-10 space-y-8 bg-white">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Next Stage</Label>
              <Select onValueChange={handleUpdateStatus}>
                <SelectTrigger className="h-16 rounded-2xl border-gray-100 bg-gray-50 font-black italic text-lg focus:ring-[#C41E6B]">
                  <SelectValue placeholder="Update progress..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-xl font-bold">
                  <SelectItem value="out_for_delivery">🚀 Out for Delivery</SelectItem>
                  <SelectItem value="delivered">✅ Delivered Successfully</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Proof of Work <span className="text-[#C41E6B]">*Required for Delivery</span></Label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-100 rounded-[2rem] p-8 text-center hover:border-[#C41E6B] hover:bg-pink-50/30 cursor-pointer transition-all group overflow-hidden relative"
              >
                {proofImage ? (
                  <img src={proofImage} alt="Proof" className="w-full h-32 object-contain" />
                ) : (
                  <>
                    <Camera className="h-10 w-10 mx-auto mb-3 text-gray-300 group-hover:text-[#C41E6B] transition-colors" />
                    <p className="text-xs font-black italic text-gray-400 group-hover:text-[#C41E6B]">Capture Delivery Photo</p>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleCapturePhoto}
                />
              </div>
            </div>

            <div className="bg-emerald-500 p-6 rounded-[2rem] text-white flex items-center justify-between group cursor-pointer active:scale-95 transition-all shadow-lg shadow-emerald-500/20" onClick={handleMarkDelivered}>
              <div>
                <p className="font-black italic text-xl leading-none">Complete Job</p>
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">Finalize Order Status</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>

            <Button variant="ghost" className="w-full font-bold text-gray-400" onClick={handleClose}>
              Dismiss Panel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}