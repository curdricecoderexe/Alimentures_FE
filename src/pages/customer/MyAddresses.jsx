import React, { useState, useEffect, useCallback } from 'react';
import { authenticatedFetch } from '../../lib/api';
import { toast } from 'sonner';
import { Plus, Trash2, MapPin, Pencil, Check, X, Star, Home } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import AddressSkeleton from '../../components/skeletons/AddressSkeleton';
import useSkeletonLoader from '../../hooks/useSkeletonLoader';
import SearchableSelect from '../../components/ui/SearchableSelect';
import { INDIA_STATES } from '../../data/indiaStates';
import { getCities } from '../../lib/deliveryApi';

const EASE = [0.16, 1, 0.3, 1];
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const EMPTY = { fullName: '', phone: '', street: '', city: '', state: '', pincode: '', isDefault: false };

// text inputs only — state/city/pincode are rendered separately below
const FIELDS = [
  { name: 'fullName', label: 'Full name', span: 1, placeholder: 'Sriram' },
  { name: 'phone', label: 'Phone', span: 1, placeholder: '+91 98847 33453' },
  { name: 'street', label: 'Street address', span: 2, placeholder: 'Flat 4B, 12 Green Avenue' },
];

export default function MyAddresses() {
  const still = useReducedMotion();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useSkeletonLoader(loading);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [formData, setFormData] = useState(EMPTY);
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);

  useEffect(() => {
    if (!formData.state) { setCities([]); return; }
    let alive = true;
    setCitiesLoading(true);
    getCities(formData.state).then((list) => {
      if (!alive) return;
      setCities(list);
      setCitiesLoading(false);
      if (formData.city && !list.some((c) => c.toLowerCase() === formData.city.toLowerCase())) {
        setFormData((p) => ({ ...p, city: '' }));
      }
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.state]);

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await authenticatedFetch(`${API_URL}/addresses`);
      if (!res) return; // 401 -> redirected
      const data = await res.json();
      if (data.success) {
        setAddresses(
          [...(data.data || [])].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0)),
        );
      } else {
        toast.error(data.error || 'Failed to load addresses');
      }
    } catch {
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const openAdd = () => { setEditingId(null); setFormData(EMPTY); setShowForm(true); };
  const openEdit = (addr) => {
    setEditingId(addr.id);
    setFormData({
      fullName: addr.fullName || '', phone: addr.phone || '', street: addr.street || '',
      city: addr.city || '', state: addr.state || '', pincode: addr.pincode || '',
      isDefault: !!addr.isDefault,
    });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); setFormData(EMPTY); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const res = await authenticatedFetch(
        `${API_URL}/addresses${editingId ? `/${editingId}` : ''}`,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        },
      );
      if (!res) return;
      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? 'Address updated' : 'Address added');
        closeForm();
        fetchAddresses();
      } else {
        toast.error(data.error || 'Could not save address');
      }
    } catch {
      toast.error('Could not save address');
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (id) => {
    setBusyId(id);
    try {
      const res = await authenticatedFetch(`${API_URL}/addresses/${id}`, { method: 'DELETE' });
      if (!res) return;
      const data = await res.json();
      if (data.success) {
        toast.success('Address removed');
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      } else {
        toast.error(data.error || 'Could not remove address');
      }
    } catch {
      toast.error('Could not remove address');
    } finally {
      setBusyId(null);
    }
  };

  const setDefault = async (id) => {
    setBusyId(id);
    try {
      const res = await authenticatedFetch(`${API_URL}/addresses/${id}/default`, { method: 'PATCH' });
      if (!res) return;
      const data = await res.json();
      if (data.success) {
        toast.success('Default address updated');
        fetchAddresses();
      } else {
        toast.error(data.error || 'Could not update default');
      }
    } catch {
      toast.error('Could not update default');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="relative min-h-screen font-sans text-ink overflow-hidden">
      <div className="relative z-[2] container mx-auto px-4 sm:px-6 py-24 sm:py-28 max-w-5xl">
        {/* header */}
        <motion.div
          initial={still ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-10"
        >
          <div className="flex flex-col gap-3">
            <span className="kicker text-berry">Your account</span>
            <div className="flex items-center gap-3.5">
              <span className="ico-chip h-11 w-11 rounded-2xl">
                <Home className="h-5 w-5" />
              </span>
              <h1 className="display-lg text-[2.3rem] sm:text-[2.6rem]">
                My <span className="accent-text">addresses</span>
              </h1>
            </div>
            <span className="rule-berry" />
          </div>

          {!showForm && (
            <button
              onClick={openAdd}
              className="btn-berry self-start sm:self-auto inline-flex items-center gap-2 h-11 px-5 rounded-full text-[11px] font-extrabold uppercase tracking-[0.14em]"
            >
              <Plus className="h-4 w-4" /> Add address
            </button>
          )}
        </motion.div>

        {/* form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={still ? false : { opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={still ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: EASE }}
              onSubmit={handleSubmit}
              className="glass foil-top rounded-panel p-6 sm:p-8 mb-10"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="display-md text-xl">{editingId ? 'Edit address' : 'New address'}</h2>
                <button type="button" onClick={closeForm} aria-label="Close" className="text-ink-muted hover:text-berry transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {FIELDS.map((f) => (
                  <label key={f.name} className={f.span === 2 ? 'sm:col-span-2 block' : 'block'}>
                    <span className="kicker text-ink-soft text-[9.5px] mb-1.5 block">{f.label}</span>
                    <input
                      required
                      value={formData[f.name]}
                      onChange={(e) => setFormData({ ...formData, [f.name]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full h-[50px] px-4 rounded-2xl bg-paper border border-hairline outline-none text-[14.5px] font-medium placeholder:text-ink-muted transition-all focus:border-berry/50 focus:ring-4 focus:ring-berry/10"
                    />
                  </label>
                ))}

                <label className="sm:col-span-2 block">
                  <span className="kicker text-ink-soft text-[9.5px] mb-1.5 block">State</span>
                  <SearchableSelect
                    value={formData.state}
                    onChange={(v) => setFormData((p) => ({ ...p, state: v, city: '' }))}
                    options={INDIA_STATES}
                    placeholder="Select State" searchPlaceholder="Search states…"
                    triggerClassName="!h-[50px]" ariaLabel="State"
                  />
                </label>
                <label className="block">
                  <span className="kicker text-ink-soft text-[9.5px] mb-1.5 block">City</span>
                  <SearchableSelect
                    value={formData.city}
                    onChange={(v) => setFormData((p) => ({ ...p, city: v }))}
                    options={cities} loading={citiesLoading} disabled={!formData.state}
                    placeholder={formData.state ? 'Select City' : 'Pick a state first'}
                    searchPlaceholder="Search cities…"
                    emptyText={formData.state ? 'No cities found' : 'Select a state first'}
                    triggerClassName="!h-[50px]" ariaLabel="City"
                  />
                </label>
                <label className="block">
                  <span className="kicker text-ink-soft text-[9.5px] mb-1.5 block">PIN code</span>
                  <input
                    required inputMode="numeric" maxLength={6}
                    value={formData.pincode}
                    onChange={(e) => setFormData((p) => ({ ...p, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    placeholder="600001"
                    className="w-full h-[50px] px-4 rounded-2xl bg-paper border border-hairline outline-none text-[14.5px] font-medium tracking-[0.15em] placeholder:tracking-normal placeholder:text-ink-muted transition-all focus:border-berry/50 focus:ring-4 focus:ring-berry/10"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
                className="flex items-center gap-2.5 mt-5 group/d"
              >
                <span
                  className={`h-[18px] w-[18px] rounded-[6px] border flex items-center justify-center transition-all ${
                    formData.isDefault ? 'bg-berry border-berry' : 'bg-paper border-hairline group-hover/d:border-berry/50'
                  }`}
                >
                  {formData.isDefault && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </span>
                <span className="text-[13px] font-medium text-ink-soft">Set as default shipping address</span>
              </button>

              <div className="flex gap-3 mt-7">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-berry h-[46px] px-7 rounded-full text-[11px] font-extrabold uppercase tracking-[0.14em] disabled:opacity-70"
                >
                  {saving ? 'Saving…' : editingId ? 'Save changes' : 'Save address'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="btn-glass h-[46px] px-7 rounded-full text-[11px] font-extrabold uppercase tracking-[0.14em]"
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* list */}
        {loading ? (
          showSkeleton ? <AddressSkeleton /> : <div className="h-40" />
        ) : addresses.length === 0 ? (
          <div className="glass rounded-panel text-center py-20 px-6">
            <span className="ico-chip h-14 w-14 rounded-2xl mx-auto mb-5">
              <MapPin className="h-6 w-6" />
            </span>
            <p className="display-md text-lg mb-1.5">No saved addresses yet</p>
            <p className="text-ink-soft text-sm mb-6">Add an address to check out faster next time.</p>
            {!showForm && (
              <button
                onClick={openAdd}
                className="btn-berry inline-flex items-center gap-2 h-11 px-6 rounded-full text-[11px] font-extrabold uppercase tracking-[0.14em]"
              >
                <Plus className="h-4 w-4" /> Add your first address
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <AnimatePresence mode="popLayout">
              {addresses.map((addr) => (
                <motion.div
                  key={addr.id}
                  layout={!still}
                  initial={still ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={still ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className={`relative rounded-panel p-6 border transition-all ${
                    addr.isDefault
                      ? 'border-berry/40 bg-berry-tint/60 shadow-glass-sm'
                      : 'border-hairline bg-paper hover:border-berry/25 hover:shadow-glass-sm'
                  }`}
                >
                  {addr.isDefault && (
                    <span className="pill-berry-soft absolute top-5 right-5 inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[9px] font-extrabold uppercase tracking-[0.12em]">
                      <Star className="h-3 w-3" style={{ fill: 'currentColor' }} /> Default
                    </span>
                  )}

                  <p className="font-bold text-ink text-[15px]">{addr.fullName}</p>
                  <p className="text-[12.5px] text-ink-muted font-medium mt-0.5">{addr.phone}</p>

                  <p className="text-[13.5px] text-ink-soft leading-relaxed mt-3">
                    {addr.street}
                    <br />
                    {addr.city}, {addr.state} — {addr.pincode}
                  </p>

                  <div className="mt-5 pt-4 border-t border-hairline flex items-center gap-4 text-[11.5px] font-bold">
                    {!addr.isDefault && (
                      <button
                        onClick={() => setDefault(addr.id)}
                        disabled={busyId === addr.id}
                        className="text-berry hover:opacity-70 transition-opacity disabled:opacity-40"
                      >
                        Set as default
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(addr)}
                      className="inline-flex items-center gap-1 text-ink-soft hover:text-ink transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => deleteAddress(addr.id)}
                      disabled={busyId === addr.id}
                      className="inline-flex items-center gap-1 text-danger hover:opacity-70 transition-opacity ml-auto disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
