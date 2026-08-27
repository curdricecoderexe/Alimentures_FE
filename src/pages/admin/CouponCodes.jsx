import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag, Plus, Trash2, ToggleLeft, ToggleRight, Copy, Check,
  Zap, Percent, IndianRupee, Calendar, Users, RefreshCw,
  Sparkles, AlertCircle, ChevronDown, Search, Filter, X
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${import.meta.env.VITE_API_URL}/coupons`;

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = { visible: { transition: { staggerChildren: 0.07 } } };

export default function CouponCodes() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'active' | 'inactive'
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    prefix: 'ALIM',
    customCode: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderValue: '',
    maxUsage: '1',
    expiresAt: '',
    description: '',
  });

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(API, { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success) {
        setCoupons(json.data || []);
      } else {
        toast.error(json.error || 'Failed to load coupons');
      }
    } catch {
      toast.error('Network error fetching coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.discountValue || Number(form.discountValue) <= 0) {
      toast.error('Please enter a valid discount value');
      return;
    }
    try {
      setGenerating(true);
      const res = await fetch(`${API}/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          prefix: form.prefix || 'ALIM',
          customCode: form.customCode || undefined,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          minOrderValue: Number(form.minOrderValue) || 0,
          maxUsage: Number(form.maxUsage) || 1,
          expiresAt: form.expiresAt || undefined,
          description: form.description,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Coupon "${json.coupon.code}" created!`);
        setShowForm(false);
        setForm({ prefix: 'ALIM', customCode: '', discountType: 'percentage', discountValue: '', minOrderValue: '', maxUsage: '1', expiresAt: '', description: '' });
        fetchCoupons();
      } else {
        toast.error(json.error || 'Failed to generate coupon');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success) {
        toast.success('Coupon deleted');
        setCoupons(prev => prev.filter(c => c.id !== id));
      } else {
        toast.error(json.error || 'Delete failed');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await fetch(`${API}/${id}/toggle`, { method: 'PATCH', headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success) {
        setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: json.isActive } : c));
        toast.success(json.isActive ? 'Coupon activated' : 'Coupon deactivated');
      }
    } catch {
      toast.error('Toggle failed');
    }
  };

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success(`Copied "${code}" to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredCoupons = coupons.filter(c => {
    const matchesSearch = c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || (filterStatus === 'active' ? c.isActive : !c.isActive);
    return matchesSearch && matchesFilter;
  });

  const activeCoupons = coupons.filter(c => c.isActive).length;
  const totalUsage = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);

  const parseDate = (dateVal) => {
    if (!dateVal) return null;
    if (typeof dateVal === 'object' && dateVal._seconds !== undefined) {
      return new Date(dateVal._seconds * 1000);
    }
    if (dateVal.toDate && typeof dateVal.toDate === 'function') {
      return dateVal.toDate();
    }
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
  };

  const isExpired = (coupon) => {
    const expiry = parseDate(coupon.expiresAt);
    return expiry ? expiry < new Date() : false;
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={stagger} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#C41E6B]/10 to-[#E83D6E]/10 border border-[#C41E6B]/15">
              <Tag className="w-5 h-5 text-[#C41E6B]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Coupon Codes</h1>
          </div>
          <p className="text-sm text-gray-400 font-medium ml-1">Generate and manage discount coupons for customers</p>
        </motion.div>
        <motion.div variants={fadeUp} className="flex items-center gap-3">
          <button
            onClick={fetchCoupons}
            className="p-2.5 rounded-xl border border-gray-100 bg-white text-gray-500 hover:text-[#C41E6B] hover:border-[#C41E6B]/30 transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#C41E6B] to-[#E83D6E] text-white font-bold text-sm shadow-lg shadow-[#C41E6B]/25 hover:shadow-xl hover:shadow-[#C41E6B]/35 transition-all active:scale-95"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'New Coupon'}
          </button>
        </motion.div>
      </motion.div>

      {/* Stats Row */}
      <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Coupons', value: coupons.length, icon: Tag, color: '#C41E6B' },
          { label: 'Active', value: activeCoupons, icon: Zap, color: '#10b981' },
          { label: 'Inactive', value: coupons.length - activeCoupons, icon: ToggleLeft, color: '#6b7280' },
          { label: 'Total Redeemed', value: totalUsage, icon: Users, color: '#D4AF37' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={i} variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl" style={{ background: `${stat.color}15` }}>
                  <Icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400 font-semibold mt-0.5">{stat.label}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Generator Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-[#C41E6B]/10 to-[#E83D6E]/10">
                  <Sparkles className="w-4 h-4 text-[#C41E6B]" />
                </div>
                <h2 className="font-bold text-gray-900">Generate New Coupon</h2>
              </div>
              <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Discount Type */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Discount Type</label>
                  <div className="flex gap-3">
                    {[
                      { value: 'percentage', label: '% Off', icon: Percent },
                      { value: 'flat', label: '₹ Off', icon: IndianRupee },
                    ].map(opt => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, discountType: opt.value }))}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                            form.discountType === opt.value
                              ? 'border-[#C41E6B] bg-[#C41E6B]/5 text-[#C41E6B]'
                              : 'border-gray-100 text-gray-400 hover:border-gray-200 bg-white'
                          }`}
                        >
                          <Icon className="w-4 h-4" /> {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Discount Value */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                    {form.discountType === 'percentage' ? 'Discount %' : 'Flat Amount (₹)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                      {form.discountType === 'percentage' ? '%' : '₹'}
                    </span>
                    <input
                      type="number"
                      min="1"
                      max={form.discountType === 'percentage' ? 100 : undefined}
                      value={form.discountValue}
                      onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                      placeholder={form.discountType === 'percentage' ? '10' : '100'}
                      required
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 text-gray-900 font-bold text-sm focus:outline-none focus:border-[#C41E6B]/40 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Min Order Value */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Min Order (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={form.minOrderValue}
                      onChange={e => setForm(f => ({ ...f, minOrderValue: e.target.value }))}
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 text-gray-900 font-bold text-sm focus:outline-none focus:border-[#C41E6B]/40 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Max Usage */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Max Usage (Times)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.maxUsage}
                    onChange={e => setForm(f => ({ ...f, maxUsage: e.target.value }))}
                    placeholder="1"
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 text-gray-900 font-bold text-sm focus:outline-none focus:border-[#C41E6B]/40 focus:bg-white transition-all"
                  />
                </div>

                {/* Expiry */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Expiry Date (optional)</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 text-gray-900 font-bold text-sm focus:outline-none focus:border-[#C41E6B]/40 focus:bg-white transition-all"
                  />
                </div>

                {/* Custom Code OR Prefix */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Custom Code (optional)</label>
                  <input
                    type="text"
                    value={form.customCode}
                    onChange={e => setForm(f => ({ ...f, customCode: e.target.value.toUpperCase() }))}
                    placeholder="e.g. WELCOME20 (auto-generated if blank)"
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 text-gray-900 font-bold text-sm focus:outline-none focus:border-[#C41E6B]/40 focus:bg-white transition-all uppercase placeholder:normal-case placeholder:font-normal"
                  />
                </div>

                {/* Prefix */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Code Prefix (if auto-generate)</label>
                  <input
                    type="text"
                    value={form.prefix}
                    onChange={e => setForm(f => ({ ...f, prefix: e.target.value.toUpperCase() }))}
                    placeholder="ALIM"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 text-gray-900 font-bold text-sm focus:outline-none focus:border-[#C41E6B]/40 focus:bg-white transition-all uppercase"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Description (shown to customer)</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="e.g. Welcome discount for new customers"
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 text-gray-900 font-bold text-sm focus:outline-none focus:border-[#C41E6B]/40 focus:bg-white transition-all"
                  />
                </div>

                {/* Submit */}
                <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={generating}
                    className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#C41E6B] to-[#E83D6E] text-white font-bold text-sm shadow-lg shadow-[#C41E6B]/25 hover:shadow-xl hover:shadow-[#C41E6B]/35 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {generating ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Generate Coupon</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filter */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search coupon codes or descriptions..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 bg-white text-sm text-gray-900 font-medium focus:outline-none focus:border-[#C41E6B]/40 transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'active', 'inactive'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                filterStatus === status
                  ? 'bg-gradient-to-r from-[#C41E6B] to-[#E83D6E] text-white shadow-md shadow-[#C41E6B]/20'
                  : 'bg-white border border-gray-100 text-gray-400 hover:border-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Coupons List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl border border-gray-100 p-6 animate-pulse">
              <div className="h-6 w-32 bg-gray-100 rounded-lg mb-4" />
              <div className="h-4 w-24 bg-gray-50 rounded mb-2" />
              <div className="h-4 w-40 bg-gray-50 rounded" />
            </div>
          ))}
        </div>
      ) : filteredCoupons.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-center">
          <div className="p-6 rounded-full bg-gray-50 border border-gray-100 mb-5">
            <Tag className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-lg font-bold text-gray-400">No coupons found</p>
          <p className="text-sm text-gray-300 mt-1">
            {searchQuery ? 'Try a different search term' : 'Generate your first coupon using the button above'}
          </p>
        </motion.div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCoupons.map((coupon) => {
            const expired = isExpired(coupon);
            const isCopied = copiedId === coupon.id;
            const usagePct = coupon.maxUsage > 0 ? Math.min((coupon.usedCount / coupon.maxUsage) * 100, 100) : 0;

            return (
              <motion.div
                key={coupon.id}
                variants={fadeUp}
                className={`relative bg-white rounded-3xl border shadow-sm hover:shadow-md transition-all overflow-hidden group ${
                  !coupon.isActive || expired ? 'border-gray-100 opacity-70' : 'border-[#C41E6B]/10 hover:border-[#C41E6B]/20'
                }`}
              >
                {/* Top accent */}
                {coupon.isActive && !expired && (
                  <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-[#C41E6B] to-[#E83D6E]" />
                )}

                <div className="p-6">
                  {/* Code + Copy */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-mono font-bold text-lg text-gray-900 tracking-wider">{coupon.code}</span>
                        <button
                          onClick={() => handleCopy(coupon.code, coupon.id)}
                          className="p-1 rounded-lg hover:bg-[#C41E6B]/5 text-gray-400 hover:text-[#C41E6B] transition-all"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          expired ? 'bg-gray-100 text-gray-400' :
                          coupon.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          'bg-gray-50 text-gray-400 border border-gray-100'
                        }`}>
                          {expired ? 'Expired' : coupon.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          coupon.discountType === 'percentage' ? 'bg-[#C41E6B]/5 text-[#C41E6B]' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                        </span>
                      </div>
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(coupon.id)}
                      title={coupon.isActive ? 'Deactivate' : 'Activate'}
                      className="mt-0.5 text-gray-400 hover:text-[#C41E6B] transition-all"
                    >
                      {coupon.isActive
                        ? <ToggleRight className="w-7 h-7 text-emerald-500" />
                        : <ToggleLeft className="w-7 h-7" />
                      }
                    </button>
                  </div>

                  {/* Description */}
                  {coupon.description && (
                    <p className="text-xs text-gray-400 font-medium mb-4 leading-relaxed">{coupon.description}</p>
                  )}

                  {/* Meta */}
                  <div className="space-y-2 mb-4">
                    {coupon.minOrderValue > 0 && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <IndianRupee className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span className="font-semibold">Min. order: <span className="font-bold text-gray-700">₹{coupon.minOrderValue}</span></span>
                      </div>
                    )}
                    {coupon.expiresAt && (() => {
                      const expDate = parseDate(coupon.expiresAt);
                      if (!expDate) return null;
                      return (
                        <div className={`flex items-center gap-2 text-xs ${expired ? 'text-red-400' : 'text-gray-500'}`}>
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="font-semibold">
                            {expired ? 'Expired on' : 'Expires'}: <span className="font-bold">
                              {expDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </span>
                        </div>
                      );
                    })()}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-semibold">Usage: <span className="font-bold text-gray-700">{coupon.usedCount}/{coupon.maxUsage}</span></span>
                    </div>
                  </div>

                  {/* Usage Bar */}
                  <div className="mb-4">
                    <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${usagePct >= 100 ? 'bg-red-400' : usagePct >= 70 ? 'bg-amber-400' : 'bg-gradient-to-r from-[#C41E6B] to-[#E83D6E]'}`}
                        style={{ width: `${usagePct}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-gray-300 font-bold mt-1">{Math.round(usagePct)}% used</p>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(coupon.id, coupon.code)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-gray-300 border border-dashed border-gray-100 hover:border-red-200 hover:text-red-400 hover:bg-red-50/50 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Coupon
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
