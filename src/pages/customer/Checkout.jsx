import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Truck, ShieldCheck, ChevronRight, MapPin, TicketPercent, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { authenticatedFetch } from '../../lib/api';

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};
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

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, clearCart, validateCartData } = useCart();
  const userEmail = localStorage.getItem('userEmail') || 'guest';
  const [loading, setLoading] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(null);
  
  React.useEffect(() => {
    validateCartData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [appliedCoupon] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('appliedCoupon')) || null; } catch { return null; }
  });
  const [formData, setFormData] = useState(() => {
    const savedAddress = localStorage.getItem(`shippingAddress_${userEmail}`);
    const base = {
      firstName: '',
      lastName: '',
      address: '',
      city: '',
      pincode: '',
      state: '',
      coords: null,
      paymentMethod: 'razorpay'
    };
    if (savedAddress) {
      try { return { ...base, ...JSON.parse(savedAddress) }; } catch { return base; }
    }
    return base;
  });

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    
    const toastId = toast.loading("Fetching your exact location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({ 
          ...prev, 
          coords: { lat: latitude, lng: longitude },
          address: prev.address || `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`
        }));
        toast.success("Location pinned for fast delivery!", { id: toastId });
      },
      () => {
        toast.error("Unable to retrieve location. Please enter manually.", { id: toastId });
      }
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 500 || subtotal === 0 ? 0 : 50;
  const discount = appliedCoupon?.discountAmount || 0;
  const total = Math.max(0, subtotal + shipping - discount);



  const handleInputChange = (e) => {
    const newData = { ...formData, [e.target.name]: e.target.value };
    setFormData(newData);
    // Auto-save address details to localStorage for THIS user
    const { paymentMethod: _, ...addressOnly } = newData;
    localStorage.setItem(`shippingAddress_${userEmail}`, JSON.stringify(addressOnly));
  };

  const handlePlaceOrder = async () => {
    if (!formData.firstName || !formData.address || !formData.city) {
      toast.error('Please fill in required shipping details');
      return;
    }

    if (formData.paymentMethod === 'razorpay') {
      const res = await loadRazorpay();
      if (!res) {
        toast.error('Razorpay SDK failed to load. Are you online?');
        return;
      }
    }

    setLoading(true);
    setCheckoutStep('creating');
// Removed unused var assignment: const token = localStorage.getItem('token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    try {
      const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString();
      
      const response = await authenticatedFetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.id || item._id || item.uid,
            name: item.name || item.title,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            category: item.category || 'Biscuit',
            selectedWeight: item.selectedWeight || ''
          })),
          totalAmount: total,
          discountAmount: discount || 0,
          couponId: appliedCoupon?.id || null,
          couponCode: appliedCoupon?.code || null,
          customerInfo: {
            ...formData,
            email: localStorage.getItem('userEmail') || 'unknown_user@alimenture.com'
          }
        })
      });

      if (!response) { setLoading(false); setCheckoutStep(null); return; }
      const data = await response.json();
      
      if (data.success) {
        if (data.isRazorpay) {
          setCheckoutStep('opening');
          const options = {
            key: data.key_id,
            amount: data.amount,
            currency: 'INR',
            name: 'Alimenture',
            description: 'Premium Order Payment',
            order_id: data.razorpayOrderId,
            handler: async function (res) {
              setLoading(true);
              setCheckoutStep('processing');
              try {
                  const verifyRes = await authenticatedFetch(`${API_URL}/orders/razorpay/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      razorpay_payment_id: res.razorpay_payment_id,
                      razorpay_order_id: res.razorpay_order_id,
                      razorpay_signature: res.razorpay_signature,
                      orderId: data.orderId
                    })
                  });
                  const verifyData = await verifyRes.json();
                  if (verifyData.success) {
                    toast.success('Payment successful! Order confirmed.');
                    clearCart();
                    sessionStorage.removeItem('appliedCoupon');
                    setTimeout(() => navigate('/orders'), 1500);
                  } else {
                    toast.error('Payment verification failed. Please contact support.');
                    setLoading(false);
                    setCheckoutStep(null);
                  }
              } catch {
                  toast.error('Payment verification encountered an error.');
                  setLoading(false);
                  setCheckoutStep(null);
              }
            },
            prefill: {
              name: formData.firstName + ' ' + formData.lastName,
              email: localStorage.getItem('userEmail') || '',
              contact: formData.phone || ''
            },
            theme: {
              color: '#D4AF37'
            }
          };
          const paymentObject = new window.Razorpay(options);
          paymentObject.on('payment.failed', function () {
             toast.error('Payment failed. Please try again.');
          });
          paymentObject.open();
          // Turn off loader once Razorpay is opened to avoid blocking the user
          setLoading(false);
          setCheckoutStep(null);
        } else {
          toast.success('Order placed successfully!');
          clearCart();
          sessionStorage.removeItem('appliedCoupon');
          setTimeout(() => navigate('/orders'), 1500);
        }
      } else {
        toast.error(data.error || 'Failed to place order');
        setLoading(false);
        setCheckoutStep(null);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Network error. Please try again.');
      setLoading(false);
      setCheckoutStep(null);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <Truck className="h-10 w-10 text-gray-200" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Your cart is empty</h2>
        <Button onClick={() => navigate('/')} className="bg-[#E83D6E] text-white rounded-xl px-8 h-12 font-bold">Go Shopping</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-24 sm:py-28 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 mb-6 text-xs font-bold text-gray-400"
        >
          <span className="cursor-pointer hover:text-gray-600 transition-colors" onClick={() => navigate('/cart')}>Cart</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-900">Checkout</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-3xl sm:text-4xl font-black mb-8 text-[#0a0806] tracking-tight"
        >
          Secure <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#920075] to-[#D4AF37]">Checkout</span>
        </motion.h1>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12"
        >
          {/* Form Section */}
          <div className="lg:col-span-8 space-y-6">
            <motion.div variants={itemVariants}>
              <div className="border border-gray-100 shadow-sm rounded-[2rem] overflow-hidden bg-gray-50/50">
                <div className="p-5 sm:p-8 border-b border-white">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 sm:p-3 bg-white rounded-2xl text-[#920075] shadow-sm shrink-0">
                        <Truck className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <h2 className="text-lg sm:text-2xl font-black text-gray-900">Shipping Address</h2>
                    </div>
                    <Button
                      type="button"
                      onClick={handleGeolocation}
                      className="w-full sm:w-auto bg-white hover:bg-gray-50 text-[#920075] border-2 border-[#920075]/15 rounded-2xl font-bold h-10 sm:h-11 px-4 shadow-sm text-sm"
                    >
                      📍 Use My Location
                    </Button>
                  </div>
                </div>
                <div className="p-5 sm:p-8 space-y-5">
                  {formData.coords && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                          <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Location Verified</p>
                        </div>
                        <Button variant="ghost" onClick={() => setFormData(prev => ({ ...prev, coords: null }))} className="h-6 text-[10px] font-bold text-gray-400 hover:text-red-500">
                          ✕ Remove
                        </Button>
                      </div>
                      <div className="w-full h-40 sm:h-48 rounded-[1.5rem] overflow-hidden border-4 border-white shadow-lg bg-gray-100">
                        <iframe width="100%" height="100%" frameBorder="0" style={{ border: 0 }}
                          src={`https://maps.google.com/maps?q=${formData.coords.lat},${formData.coords.lng}&z=16&output=embed`}
                          allowFullScreen />
                      </div>
                    </motion.div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">First Name *</Label>
                      <Input name="firstName" value={formData.firstName} onChange={handleInputChange} className="rounded-2xl h-12 sm:h-14 bg-white border-0 shadow-sm" placeholder="John" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">Last Name</Label>
                      <Input name="lastName" value={formData.lastName} onChange={handleInputChange} className="rounded-2xl h-12 sm:h-14 bg-white border-0 shadow-sm" placeholder="Doe" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">Street Address *</Label>
                    <Input name="address" value={formData.address} onChange={handleInputChange} className="rounded-2xl h-12 sm:h-14 bg-white border-0 shadow-sm" placeholder="123, Green Avenue" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">City *</Label>
                      <Input name="city" value={formData.city} onChange={handleInputChange} className="rounded-2xl h-12 sm:h-14 bg-white border-0 shadow-sm" placeholder="Chennai" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">PIN Code</Label>
                      <Input name="pincode" value={formData.pincode} onChange={handleInputChange} className="rounded-2xl h-12 sm:h-14 bg-white border-0 shadow-sm" placeholder="600113" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">State</Label>
                      <Input name="state" value={formData.state} onChange={handleInputChange} className="rounded-2xl h-12 sm:h-14 bg-white border-0 shadow-sm" placeholder="Tamil Nadu" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="border border-gray-100 shadow-sm rounded-[2rem] bg-gray-50/50">
                <div className="p-5 sm:p-8 border-b border-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 sm:p-3 bg-white rounded-2xl text-[#920075] shadow-sm">
                      <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <h2 className="text-lg sm:text-2xl font-black text-gray-900">Payment Method</h2>
                  </div>
                </div>
                <div className="p-5 sm:p-8">
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(val) => setFormData({...formData, paymentMethod: val})}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
                  >
                    <Label htmlFor="razorpay" className="flex items-start gap-3 sm:gap-4 border-2 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 cursor-pointer bg-white hover:border-[#920075]/30 [&:has(:checked)]:border-[#920075] [&:has(:checked)]:bg-[#920075]/5 transition-all">
                      <RadioGroupItem value="razorpay" id="razorpay" className="mt-0.5" />
                      <div>
                        <p className="font-black text-gray-900 text-sm sm:text-base">Online Payment</p>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter mt-0.5">Razorpay · UPI · Cards</p>
                      </div>
                    </Label>
                    <Label htmlFor="cod" className="flex items-start gap-3 sm:gap-4 border-2 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 cursor-pointer bg-white hover:border-[#920075]/30 [&:has(:checked)]:border-[#920075] [&:has(:checked)]:bg-[#920075]/5 transition-all">
                      <RadioGroupItem value="cod" id="cod" className="mt-0.5" />
                      <div>
                        <p className="font-black text-gray-900 text-sm sm:text-base">Cash on Delivery</p>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter mt-0.5">Pay on receipt</p>
                      </div>
                    </Label>
                  </RadioGroup>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-4">
            <motion.div variants={itemVariants} className="lg:sticky lg:top-24">
              <div className="relative border border-gray-100 shadow-[0_8px_40px_rgba(0,0,0,0.06)] rounded-[2rem] overflow-hidden bg-white text-gray-900 p-6 sm:p-8">
                {/* Gradient top accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#920075] via-[#D4AF37] to-[#F59E0B]" />
                <h3 className="text-xl sm:text-2xl font-display font-black mb-6 tracking-tight text-gray-900">Order Summary</h3>
                <div className="space-y-3 mb-8 text-sm">
                    <div className="flex justify-between text-gray-500 font-semibold">
                      <span>Items ({cart.length})</span>
                      <span className="text-gray-900 font-black">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-gray-400 font-semibold">
                      <span>Shipping</span>
                      {shipping === 0 ? (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/60 font-black text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full">Free</span>
                      ) : (
                        <span className="text-gray-900 font-black">₹{shipping}</span>
                      )}
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <TicketPercent className="h-3.5 w-3.5" />
                          {appliedCoupon?.code}
                        </span>
                        <span className="font-black">– ₹{discount}</span>
                      </div>
                    )}
                </div>
                <div className="border-t border-gray-100 pt-6 mb-8">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-semibold text-gray-500">Total</span>
                    <div className="text-right">
                      {discount > 0 && <p className="text-xs text-gray-400 line-through font-semibold">₹{subtotal + shipping}</p>}
                      <span className="text-3xl sm:text-4xl font-black text-[#920075]">₹{total}</span>
                    </div>
                  </div>
                </div>

                {/* Cart items list */}
                <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
                  {cart.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5 border-t border-gray-100">
                      <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover border border-gray-100 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 text-xs font-bold truncate">{item.name || item.title}</p>
                        <p className="text-gray-400 text-[10px] font-semibold">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-gray-900 text-xs font-black shrink-0">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-[#920075] to-[#c41e6b] hover:from-[#7a0062] hover:to-[#a31557] text-white h-14 rounded-xl text-sm font-black shadow-lg shadow-[#920075]/25 hover:shadow-xl hover:shadow-[#920075]/35 transition-all active:scale-95 flex items-center justify-center gap-2"
                  onClick={handlePlaceOrder}
                  disabled={loading}
                >
                  {loading && <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                  {checkoutStep === 'creating' ? 'Creating secure order...' 
                   : checkoutStep === 'opening' ? 'Opening payment gateway...' 
                   : checkoutStep === 'processing' ? 'Verifying payment...' 
                   : 'Place Order →'}
                </Button>
                <div className="flex items-center justify-center gap-2 mt-5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">100% Secure Checkout</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}