import React, { useState, useEffect, useCallback } from 'react';
import { authenticatedFetch } from '../../lib/api';
import { toast } from 'sonner';
import { Plus, Trash2, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AddressSkeleton from '../../components/skeletons/AddressSkeleton';
import useSkeletonLoader from '../../hooks/useSkeletonLoader';

export default function MyAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useSkeletonLoader(loading);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', phone: '', street: '', city: '', state: '', pincode: '', isDefault: false });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await authenticatedFetch(`${API_URL}/addresses`);
      if (res.success) setAddresses(res.data);
    } catch {
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await authenticatedFetch(`${API_URL}/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.success) {
        toast.success('Address added successfully');
        setShowForm(false);
        setFormData({ fullName: '', phone: '', street: '', city: '', state: '', pincode: '', isDefault: false });
        fetchAddresses();
      }
    } catch {
      toast.error('Failed to add address');
    }
  };

  const deleteAddress = async (id) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/addresses/${id}`, { method: 'DELETE' });
      if (res.success) {
        toast.success('Address deleted');
        setAddresses(addresses.filter(a => a.id !== id));
      }
    } catch {
      toast.error('Failed to delete address');
    }
  };

  const setDefault = async (id) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/addresses/${id}/default`, { method: 'PATCH' });
      if (res.success) {
        toast.success('Default address updated');
        fetchAddresses();
      }
    } catch {
      toast.error('Failed to update default address');
    }
  };

  return (
    <div className="container mx-auto px-4 py-24 max-w-5xl font-sans min-h-screen bg-[#FDFBF7]">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-black font-display text-gray-900 tracking-tight">My Addresses</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-[#920075] text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#7a0062] transition-colors">
          <Plus className="w-4 h-4" /> Add Address
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm mb-12 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 mb-2 block">Full Name</label>
                <input required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#920075]" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 mb-2 block">Phone</label>
                <input required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#920075]" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 mb-2 block">Street Address</label>
                <input required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#920075]" value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 mb-2 block">City</label>
                <input required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#920075]" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 mb-2 block">State</label>
                <input required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#920075]" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 mb-2 block">Pincode</label>
                <input required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#920075]" value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-3 py-2">
              <input type="checkbox" id="isDefault" checked={formData.isDefault} onChange={e => setFormData({ ...formData, isDefault: e.target.checked })} className="w-4 h-4 accent-[#920075]" />
              <label htmlFor="isDefault" className="text-sm font-medium text-gray-700 cursor-pointer">Set as default shipping address</label>
            </div>
            <div className="flex gap-4">
              <button type="submit" className="bg-black text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors">Save Address</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-100 text-gray-600 px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors">Cancel</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        showSkeleton ? <AddressSkeleton /> : <div className="h-40"></div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">You haven't added any addresses yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map(addr => (
            <div key={addr.id} className={`p-6 rounded-3xl border transition-all ${addr.isDefault ? 'border-[#920075] bg-[#920075]/5 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">{addr.fullName}</h3>
                  <p className="text-xs text-gray-500 mt-1">{addr.phone}</p>
                </div>
                {addr.isDefault && (
                  <span className="bg-[#920075] text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full">Default</span>
                )}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {addr.street}<br/>
                {addr.city}, {addr.state} {addr.pincode}
              </p>
              <div className="mt-6 flex items-center gap-4 pt-4 border-t border-gray-100">
                {!addr.isDefault && (
                  <button onClick={() => setDefault(addr.id)} className="text-xs font-bold text-[#D4AF37] hover:text-[#b59223]">Set as Default</button>
                )}
                <button onClick={() => deleteAddress(addr.id)} className="text-xs font-bold text-red-500 hover:text-red-700 ml-auto flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
