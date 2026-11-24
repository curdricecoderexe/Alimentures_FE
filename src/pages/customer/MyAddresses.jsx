import React, { useState, useEffect, useCallback } from 'react';
import { authenticatedFetch } from '../../lib/api';
import { toast } from 'sonner';
import { Plus, Trash2, MapPin, Pencil, Check, X, Star, Phone, Truck, ShieldCheck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import AddressSkeleton from '../../components/skeletons/AddressSkeleton';
import useSkeletonLoader from '../../hooks/useSkeletonLoader';
import SearchableSelect from '../../components/ui/SearchableSelect';
import { INDIA_STATES } from '../../data/indiaStates';
import SEO from '../../components/SEO';
import { ShopHero, CARD, CARD_HOVER, LABEL } from '../../components/shop/ShopSections';

const EASE = [0.16, 1, 0.3, 1];
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const EMPTY = { fullName: '', phone: '', street: '', city: '', state: '', pincode: '', isDefault: false };

// simple text inputs — state/city/pincode are rendered separately below
const FIELDS = [
  { name: 'fullName', label: 'Full name', span: 1, placeholder: 'Your name' },
  { name: 'phone', label: 'Phone', span: 1, placeholder: '+91 98765 43210' },
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
  const [confirmId, setConfirmId] = useState(null); // address awaiting "remove?" confirmation

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
        setConfirmId(null);
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

  // Close the form with Esc; lock page scroll while it is open.
  useEffect(() => {
    if (!showForm) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeForm(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [showForm]);

  const inputCls = 'w-full h-12 px-4 rounded-xl bg-white border border-[#E8E1D4] outline-none text-[15px] text-ink placeholder:text-ink-muted transition-[border-color,box-shadow] focus:border-mulberry/50 focus:ring-4 focus:ring-mulberry/10';

  return (
    <div className="relative min-h-screen bg-cream font-sans text-ink overflow-x-hidden">
      <SEO title="Your addresses" noindex />

      <ShopHero
        eyebrow="Your account"
        title={<>Saved <em>addresses</em></>}
        text="Where should your millet bakes go? Save your addresses once and check out in a few taps."
        aside={addresses.length > 0 && (
          <motion.button
            type="button"
            onClick={openAdd}
            initial={still ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
            className="btn-pill self-start lg:self-auto lg:mb-2"
          >
            <Plus className="h-4 w-4" strokeWidth={1.75} /> Add address
          </motion.button>
        )}
      />

      <section className="relative z-10 bg-cream pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="mx-auto max-w-[1240px] lg:px-2">
          {loading ? (
            showSkeleton ? <AddressSkeleton /> : <div className="h-40" />
          ) : addresses.length === 0 ? (
            /* ── empty state ── */
            <motion.div
              initial={still ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}
              className={`${CARD} mx-auto max-w-xl text-center px-6 py-14 sm:py-16`}
            >
              <span className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-mulberry-tint" />
                {!still && <motion.span className="absolute inset-0 rounded-full border border-mulberry/25" animate={{ scale: [1, 1.35], opacity: [0.8, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }} />}
                <MapPin className="relative h-6 w-6 text-mulberry" strokeWidth={1.6} />
              </span>
              <h2 className="headline text-[1.9rem] sm:text-[2.2rem]">No addresses <em>yet</em></h2>
              <p className="mt-2 text-ink-soft text-[15px] leading-relaxed max-w-sm mx-auto">Add your first address and we&rsquo;ll have it ready at checkout every time.</p>
              <button type="button" onClick={openAdd} className="btn-pill mt-7"><Plus className="h-4 w-4" strokeWidth={1.75} /> Add your first address</button>
            </motion.div>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-4 mb-5">
                <p className={LABEL}>{addresses.length} saved {addresses.length === 1 ? 'address' : 'addresses'}</p>
                <p className="hidden sm:block text-[13px] text-ink-muted">Your default address is pre-selected at checkout.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                <AnimatePresence mode="popLayout">
                  {addresses.map((addr, i) => (
                    <motion.article
                      key={addr.id}
                      layout={!still}
                      initial={still ? false : { opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={still ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.45, delay: still ? 0 : Math.min(i, 6) * 0.05, ease: EASE }}
                      className={`${CARD} ${CARD_HOVER} relative flex flex-col p-5 sm:p-6 ${addr.isDefault ? '!border-mulberry/35 shadow-[0_18px_40px_-30px_rgba(124,39,110,0.6)]' : ''}`}
                    >
                      {addr.isDefault && <span aria-hidden="true" className="absolute inset-x-6 top-0 h-[2px] rounded-b-full bg-gradient-to-r from-mulberry via-berry to-gold-light" />}

                      <div className="flex items-start justify-between gap-3">
                        <span className={`h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center ${addr.isDefault ? 'bg-mulberry text-paper' : 'bg-mulberry-tint text-mulberry'}`}>
                          <MapPin className="h-5 w-5" strokeWidth={1.6} />
                        </span>
                        {addr.isDefault ? (
                          <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-gold-tint text-gold text-[12px] font-medium">
                            <Star className="h-3 w-3" style={{ fill: 'currentColor' }} /> Default
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDefault(addr.id)}
                            disabled={busyId === addr.id}
                            className="h-7 px-3 rounded-full border border-hairline text-[12px] text-ink-soft hover:border-mulberry/40 hover:text-mulberry transition-colors disabled:opacity-40"
                          >
                            Set as default
                          </button>
                        )}
                      </div>

                      <h3 className="mt-4 font-display text-[17px] font-medium text-ink tracking-[-0.01em]">{addr.fullName}</h3>
                      <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-muted"><Phone className="h-3.5 w-3.5" strokeWidth={1.6} /> {addr.phone}</p>
                      <p className="mt-3 text-[14px] text-ink-soft leading-relaxed">
                        {addr.street}
                        <br />
                        {addr.city}, {addr.state} <span className="text-ink-muted">·</span> <span className="tabular-nums tracking-wide">{addr.pincode}</span>
                      </p>

                      <div className="mt-auto pt-5">
                        <div className="pt-4 border-t border-hairline flex items-center gap-2 min-h-[36px]">
                          <AnimatePresence mode="wait" initial={false}>
                            {confirmId === addr.id ? (
                              <motion.div key="confirm" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="flex w-full items-center gap-2">
                                <span className="text-[13px] text-ink-soft mr-auto">Remove this address?</span>
                                <button type="button" onClick={() => setConfirmId(null)} className="h-8 px-3 rounded-full text-[12.5px] text-ink-soft hover:bg-ink/5">Keep</button>
                                <button type="button" onClick={() => deleteAddress(addr.id)} disabled={busyId === addr.id} className="h-8 px-3.5 rounded-full bg-danger text-white text-[12.5px] font-medium inline-flex items-center gap-1.5 disabled:opacity-60">
                                  {busyId === addr.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Remove
                                </button>
                              </motion.div>
                            ) : (
                              <motion.div key="actions" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="flex w-full items-center gap-2">
                                <button type="button" onClick={() => openEdit(addr)} className="h-8 px-3 rounded-full inline-flex items-center gap-1.5 text-[13px] text-ink-soft hover:bg-mulberry-tint hover:text-mulberry transition-colors">
                                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} /> Edit
                                </button>
                                <button type="button" onClick={() => setConfirmId(addr.id)} className="ml-auto h-8 px-3 rounded-full inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:bg-danger/5 hover:text-danger transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Remove
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.article>
                  ))}

                  {/* add tile */}
                  <motion.button
                    key="add-tile"
                    type="button"
                    layout={!still}
                    onClick={openAdd}
                    initial={still ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }}
                    className="group min-h-[220px] rounded-[22px] border border-dashed border-mulberry/30 bg-white/40 hover:bg-white hover:border-mulberry/50 transition-colors flex flex-col items-center justify-center gap-3 text-center p-6"
                  >
                    <span className="h-12 w-12 rounded-full bg-mulberry-tint text-mulberry flex items-center justify-center transition-transform group-hover:scale-110 group-hover:bg-mulberry group-hover:text-paper">
                      <Plus className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <span className="font-display text-[16px] text-ink">Add a new address</span>
                    <span className="text-[13px] text-ink-muted">Home, work or a gift recipient</span>
                  </motion.button>
                </AnimatePresence>
              </div>
            </>
          )}

          {/* reassurance */}
          {!loading && (
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: Truck, title: 'Delivered across India', text: 'Shipped fresh from our Chennai kitchen.' },
                { icon: Star, title: 'Default at checkout', text: 'Your starred address is picked automatically.' },
                { icon: ShieldCheck, title: 'Private & secure', text: 'Used only to deliver your orders.' },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex items-start gap-3 rounded-2xl px-4 py-3.5">
                  <span className="h-9 w-9 shrink-0 rounded-xl bg-white border border-hairline text-mulberry flex items-center justify-center"><Icon className="h-4 w-4" strokeWidth={1.6} /></span>
                  <span>
                    <span className="block text-[14px] text-ink">{title}</span>
                    <span className="block text-[12.5px] text-ink-muted leading-snug">{text}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── add / edit form ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            key="address-form"
            className="fixed inset-0 z-[9990] flex items-end sm:items-center justify-center sm:p-4"
            role="dialog" data-own-style="" aria-modal="true" aria-labelledby="address-form-title"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-night/50 backdrop-blur-sm" onClick={closeForm} />
            <motion.form
              onSubmit={handleSubmit}
              initial={still ? false : { y: 40, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={still ? { opacity: 0 } : { y: 30, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="relative w-full sm:max-w-[560px] max-h-[92dvh] flex flex-col rounded-t-[28px] sm:rounded-[28px] bg-paper shadow-[0_40px_100px_-30px_rgba(43,11,51,0.6)] overflow-hidden"
            >
              <div className="flex items-start justify-between gap-4 px-6 sm:px-7 pt-6 pb-4 border-b border-hairline">
                <div className="flex items-center gap-3">
                  <span className="h-11 w-11 rounded-2xl bg-mulberry-tint text-mulberry flex items-center justify-center"><MapPin className="h-5 w-5" strokeWidth={1.6} /></span>
                  <div>
                    <h2 id="address-form-title" className="font-display text-[20px] text-ink tracking-[-0.01em]">{editingId ? 'Edit address' : 'New address'}</h2>
                    <p className="text-[13px] text-ink-muted">{editingId ? 'Update where we deliver.' : 'Where should we deliver?'}</p>
                  </div>
                </div>
                <button type="button" onClick={closeForm} aria-label="Close" className="h-9 w-9 rounded-full flex items-center justify-center text-ink-muted hover:bg-ink/5 hover:text-ink transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 sm:px-7 py-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {FIELDS.map((f) => (
                    <label key={f.name} className={f.span === 2 ? 'sm:col-span-2 block' : 'block'}>
                      <span className="mb-1.5 block text-[13px] text-ink-soft">{f.label}</span>
                      <input
                        required
                        value={formData[f.name]}
                        onChange={(e) => setFormData({ ...formData, [f.name]: e.target.value })}
                        placeholder={f.placeholder}
                        inputMode={f.name === 'phone' ? 'tel' : undefined}
                        autoComplete={{ fullName: 'name', phone: 'tel', street: 'street-address' }[f.name]}
                        className={inputCls}
                      />
                    </label>
                  ))}

                  <label className="sm:col-span-2 block">
                    <span className="mb-1.5 block text-[13px] text-ink-soft">State</span>
                    <SearchableSelect
                      value={formData.state}
                      onChange={(v) => setFormData((p) => ({ ...p, state: v }))}
                      options={INDIA_STATES}
                      placeholder="Select state" searchPlaceholder="Search states…"
                      triggerClassName="!h-12 !rounded-xl" ariaLabel="State"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[13px] text-ink-soft">City</span>
                    <input required autoComplete="address-level2" value={formData.city} onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))} placeholder="Chennai" className={inputCls} />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[13px] text-ink-soft">PIN code</span>
                    <input
                      required inputMode="numeric" maxLength={6} autoComplete="postal-code"
                      value={formData.pincode}
                      onChange={(e) => setFormData((p) => ({ ...p, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                      placeholder="600001"
                      className={`${inputCls} tracking-[0.15em] placeholder:tracking-normal`}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.isDefault}
                  onClick={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
                  className={`mt-5 w-full flex items-center justify-between gap-4 rounded-2xl border px-4 py-3.5 text-left transition-colors ${formData.isDefault ? 'border-mulberry/35 bg-mulberry-tint/60' : 'border-hairline bg-white hover:border-mulberry/25'}`}
                >
                  <span>
                    <span className="block text-[14px] text-ink">Make this my default address</span>
                    <span className="block text-[12.5px] text-ink-muted">Pre-selected every time you check out.</span>
                  </span>
                  <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${formData.isDefault ? 'bg-mulberry' : 'bg-[#DCD3C3]'}`}>
                    <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 32 }} className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow flex items-center justify-center ${formData.isDefault ? 'right-0.5' : 'left-0.5'}`}>
                      {formData.isDefault && <Check className="h-3 w-3 text-mulberry" strokeWidth={3} />}
                    </motion.span>
                  </span>
                </button>
              </div>

              <div className="flex gap-3 px-6 sm:px-7 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-5 border-t border-hairline bg-paper">
                <button type="button" onClick={closeForm} className="btn-outline flex-1 sm:flex-none">Cancel</button>
                <button type="submit" disabled={saving} className="btn-pill flex-[1.6] sm:flex-1 disabled:opacity-70">
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : editingId ? 'Save changes' : 'Save address'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
