import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Plus, Trash2, Pencil, RefreshCw, Search, X, Zap, Rocket,
  Download, Upload, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight, Loader2,
  PackageCheck, PackageX, Settings2, ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';
import SearchableSelect from '../../components/ui/SearchableSelect';
import { INDIA_STATES } from '../../data/indiaStates';
import { getCities } from '../../lib/deliveryApi';

const API = `${import.meta.env.VITE_API_URL}/admin/delivery`;
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } };
const stagger = { visible: { transition: { staggerChildren: 0.05 } } };

const adminSelectCls = '!h-11 !rounded-xl !bg-gray-50/60 !border-gray-100 !text-sm focus:!ring-2 focus:!ring-[#C41E6B]/20 focus:!border-[#C41E6B]/40';
const inputCls = 'w-full h-11 px-3.5 rounded-xl border border-gray-100 bg-gray-50/60 text-sm text-gray-900 font-medium focus:outline-none focus:border-[#C41E6B]/40 focus:bg-white transition-all';
const labelCls = 'block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5';

const EMPTY_FORM = {
  pincode: '', state: '', city: '', deliveryAvailable: true,
  deliveryFee: '', fastestDeliveryAvailable: false, fastestDeliveryFee: '',
  standardEta: '', fastestEta: '', note: '',
};

async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, { headers: authHeaders(), ...opts });
  const isCsv = (res.headers.get('content-type') || '').includes('text/csv');
  const body = isCsv ? await res.text() : await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body && body.error) || `Request failed (${res.status})`);
  return body;
}

/* ───────────────────────── PIN-code add/edit modal ───────────────────── */

function PincodeModal({ open, editing, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editing
      ? {
        pincode: editing.pincode, state: editing.state || '', city: editing.city || '',
        deliveryAvailable: editing.deliveryAvailable !== false,
        deliveryFee: editing.standardDeliveryFee ?? '',
        fastestDeliveryAvailable: !!editing.fastestDeliveryAvailable,
        fastestDeliveryFee: editing.fastestDeliveryFee ?? '',
        standardEta: editing.standardDeliveryEta || '', fastestEta: editing.fastestDeliveryEta || '',
        note: editing.note || '',
      }
      : EMPTY_FORM);
  }, [open, editing]);

  useEffect(() => {
    if (!form.state) { setCities([]); return; }
    let alive = true;
    setCitiesLoading(true);
    getCities(form.state).then((list) => { if (alive) { setCities(list); setCitiesLoading(false); } });
    return () => { alive = false; };
  }, [form.state]);

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[1-9][0-9]{5}$/.test(form.pincode)) return toast.error('PIN code must be 6 digits');
    if (!form.state) return toast.error('Select a state');
    setSaving(true);
    try {
      const payload = {
        pincode: form.pincode, state: form.state, city: form.city,
        deliveryAvailable: form.deliveryAvailable,
        deliveryFee: Number(form.deliveryFee) || 0,
        fastestDeliveryAvailable: form.fastestDeliveryAvailable,
        fastestDeliveryFee: Number(form.fastestDeliveryFee) || 0,
        standardEta: form.standardEta, fastestEta: form.fastestEta, note: form.note,
      };
      if (editing) await api(`/pincodes/${form.pincode}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await api('/pincodes', { method: 'POST', body: JSON.stringify(payload) });
      toast.success(editing ? 'PIN code updated' : 'PIN code added');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[120] flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.form onSubmit={submit}
            initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-8 my-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">{editing ? `Edit ${editing.pincode}` : 'Add PIN code'}</h2>
              <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>PIN code *</label>
                <input value={form.pincode} disabled={!!editing} inputMode="numeric" maxLength={6}
                  onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                  placeholder="600001" className={`${inputCls} tracking-[0.15em] disabled:opacity-60`} />
              </div>
              <div className="flex items-end pb-1">
                <button type="button" onClick={() => setForm((f) => ({ ...f, deliveryAvailable: !f.deliveryAvailable }))}
                  className="flex items-center gap-2 text-sm font-bold">
                  {form.deliveryAvailable ? <ToggleRight className="w-8 h-8 text-emerald-500" /> : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                  <span className={form.deliveryAvailable ? 'text-emerald-600' : 'text-gray-400'}>
                    {form.deliveryAvailable ? 'Delivery available' : 'Not deliverable'}
                  </span>
                </button>
              </div>

              <div>
                <label className={labelCls}>State *</label>
                <SearchableSelect value={form.state} onChange={(v) => setForm((f) => ({ ...f, state: v, city: '' }))}
                  options={INDIA_STATES} placeholder="Select State" searchPlaceholder="Search states…"
                  triggerClassName={adminSelectCls} ariaLabel="State" />
              </div>
              <div>
                <label className={labelCls}>City</label>
                <SearchableSelect value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))}
                  options={cities} loading={citiesLoading} disabled={!form.state}
                  placeholder={form.state ? 'Select City' : 'Pick a state'} searchPlaceholder="Search cities…"
                  emptyText={form.state ? 'No cities found' : 'Select a state first'}
                  triggerClassName={adminSelectCls} ariaLabel="City" />
              </div>

              <div>
                <label className={labelCls}>Standard fee (₹)</label>
                <input type="number" min="0" value={form.deliveryFee}
                  onChange={(e) => setForm((f) => ({ ...f, deliveryFee: e.target.value }))} placeholder="50" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Standard ETA</label>
                <input value={form.standardEta} onChange={(e) => setForm((f) => ({ ...f, standardEta: e.target.value }))}
                  placeholder="3–5 business days" className={inputCls} />
              </div>

              <div className="col-span-2 border-t border-gray-100 pt-4">
                <button type="button" onClick={() => setForm((f) => ({ ...f, fastestDeliveryAvailable: !f.fastestDeliveryAvailable }))}
                  className="flex items-center gap-2 text-sm font-bold">
                  {form.fastestDeliveryAvailable ? <ToggleRight className="w-8 h-8 text-[#C41E6B]" /> : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                  <span className={form.fastestDeliveryAvailable ? 'text-[#C41E6B]' : 'text-gray-400'}>
                    <Rocket className="w-3.5 h-3.5 inline mr-1" />Fastest delivery {form.fastestDeliveryAvailable ? 'enabled' : 'disabled'}
                  </span>
                </button>
              </div>
              {form.fastestDeliveryAvailable && (
                <>
                  <div>
                    <label className={labelCls}>Fastest fee (₹)</label>
                    <input type="number" min="0" value={form.fastestDeliveryFee}
                      onChange={(e) => setForm((f) => ({ ...f, fastestDeliveryFee: e.target.value }))} placeholder="120" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Fastest ETA</label>
                    <input value={form.fastestEta} onChange={(e) => setForm((f) => ({ ...f, fastestEta: e.target.value }))}
                      placeholder="1–2 business days" className={inputCls} />
                  </div>
                </>
              )}

              <div className="col-span-2">
                <label className={labelCls}>Note (internal)</label>
                <input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="e.g. remote — courier surcharge" className={inputCls} />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-7">
              <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C41E6B] to-[#E83D6E] text-white font-bold text-sm shadow-lg shadow-[#C41E6B]/25 disabled:opacity-60 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}{editing ? 'Save changes' : 'Add PIN code'}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ───────────────────────── settings panels ──────────────────────────── */

function SettingsPanel({ tab, settings, onSave, saving }) {
  const [form, setForm] = useState(settings);
  useEffect(() => { setForm(settings); }, [settings]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const num = (v) => (v === '' ? 0 : Math.max(0, Number(v) || 0));

  const Row = ({ label, hint, children }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-gray-50 last:border-0">
      <div><p className="text-sm font-bold text-gray-800">{label}</p>{hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}</div>
      <div className="shrink-0">{children}</div>
    </div>
  );
  const Toggle = ({ k }) => (
    <button type="button" onClick={() => set(k, !form[k])}>
      {form[k] ? <ToggleRight className="w-9 h-9 text-emerald-500" /> : <ToggleLeft className="w-9 h-9 text-gray-300" />}
    </button>
  );
  const NumInput = ({ k, ph }) => (
    <div className="relative w-32">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₹</span>
      <input type="number" min="0" value={form[k] ?? ''} placeholder={ph}
        onChange={(e) => set(k, e.target.value)} className={`${inputCls} pl-7`} />
    </div>
  );
  const TextInput = ({ k, ph }) => (
    <input value={form[k] ?? ''} placeholder={ph} onChange={(e) => set(k, e.target.value)} className={`${inputCls} w-44`} />
  );

  const save = () => {
    const payload = tab === 'standard'
      ? {
        defaultDeliveryFee: num(form.defaultDeliveryFee),
        defaultStandardEta: form.defaultStandardEta,
        freeDeliveryEnabled: !!form.freeDeliveryEnabled,
        freeDeliveryThreshold: num(form.freeDeliveryThreshold),
        serviceByDefault: !!form.serviceByDefault,
      }
      : {
        fastestDeliveryEnabled: !!form.fastestDeliveryEnabled,
        defaultFastestDeliveryFee: num(form.defaultFastestDeliveryFee),
        defaultFastestEta: form.defaultFastestEta,
        fastestCutoffTime: form.fastestCutoffTime || '',
        fastestMinOrderValue: num(form.fastestMinOrderValue),
        fastestMaxOrderValue: num(form.fastestMaxOrderValue),
      };
    onSave(payload);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 max-w-2xl">
      {tab === 'standard' ? (
        <>
          <Row label="Default delivery fee" hint="Charged when a PIN code has no specific fee"><NumInput k="defaultDeliveryFee" ph="50" /></Row>
          <Row label="Default standard ETA"><TextInput k="defaultStandardEta" ph="3–5 business days" /></Row>
          <Row label="Free delivery over a threshold"><Toggle k="freeDeliveryEnabled" /></Row>
          {form.freeDeliveryEnabled && <Row label="Free-delivery threshold" hint="Standard delivery is free at or above this subtotal"><NumInput k="freeDeliveryThreshold" ph="500" /></Row>}
          <Row label="Deliver to unlisted PIN codes" hint="When ON, any 6-digit PIN not in the table is deliverable at the default fee"><Toggle k="serviceByDefault" /></Row>
        </>
      ) : (
        <>
          <Row label="Enable fastest delivery globally" hint="Master switch — turn off to hide fastest everywhere"><Toggle k="fastestDeliveryEnabled" /></Row>
          <Row label="Default fastest delivery fee"><NumInput k="defaultFastestDeliveryFee" ph="120" /></Row>
          <Row label="Default fastest ETA"><TextInput k="defaultFastestEta" ph="1–2 business days" /></Row>
          <Row label="Order cutoff time" hint="Display only — e.g. order before this for same-day dispatch"><TextInput k="fastestCutoffTime" ph="2:00 PM" /></Row>
          <Row label="Minimum order value" hint="0 = no minimum"><NumInput k="fastestMinOrderValue" ph="0" /></Row>
          <Row label="Maximum order value" hint="0 = no maximum"><NumInput k="fastestMaxOrderValue" ph="0" /></Row>
        </>
      )}
      <div className="flex justify-end mt-6">
        <button onClick={save} disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C41E6B] to-[#E83D6E] text-white font-bold text-sm shadow-lg shadow-[#C41E6B]/25 disabled:opacity-60 flex items-center gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}Save settings
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── main page ────────────────────────────────── */

export default function PincodeDelivery() {
  const [tab, setTab] = useState('pincodes'); // pincodes | standard | fastest
  const [summary, setSummary] = useState(null);
  const [settings, setSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // table state
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [q, setQ] = useState('');
  const [fState, setFState] = useState('');
  const [fAvail, setFAvail] = useState('');
  const [fFastest, setFFastest] = useState('');
  const [sort, setSort] = useState('updatedAt');
  const [dir, setDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [modal, setModal] = useState({ open: false, editing: null });
  const fileRef = useRef(null);

  const loadSummary = useCallback(() => { api('/summary').then((r) => setSummary(r.data)).catch(() => {}); }, []);
  const loadSettings = useCallback(() => { api('/settings').then((r) => setSettings(r.data)).catch(() => {}); }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 25, sort, dir });
      if (q.trim()) params.set('search', q.trim());
      if (fState) params.set('state', fState);
      if (fAvail) params.set('availability', fAvail);
      if (fFastest) params.set('fastest', fFastest);
      const r = await api(`/pincodes?${params}`);
      setRows(r.data || []);
      setPagination(r.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, sort, dir, q, fState, fAvail, fFastest]);

  useEffect(() => { loadSummary(); loadSettings(); }, [loadSummary, loadSettings]);
  useEffect(() => {
    const t = setTimeout(loadRows, 250); // debounce search
    return () => clearTimeout(t);
  }, [loadRows]);
  useEffect(() => { setPage(1); setSelected(new Set()); }, [q, fState, fAvail, fFastest]);

  const refreshAll = () => { loadRows(); loadSummary(); loadSettings(); };

  const toggleSort = (key) => {
    if (sort === key) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSort(key); setDir('asc'); }
  };

  const toggleRow = (pin) => setSelected((s) => { const n = new Set(s); n.has(pin) ? n.delete(pin) : n.add(pin); return n; });
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.pincode));
  const toggleAll = () => setSelected((s) => {
    const n = new Set(s);
    if (allOnPage) rows.forEach((r) => n.delete(r.pincode));
    else rows.forEach((r) => n.add(r.pincode));
    return n;
  });

  const rowStatus = async (pin, field) => {
    try {
      await api(`/pincodes/${pin}/status`, { method: 'PATCH', body: JSON.stringify({ field }) });
      loadRows(); loadSummary();
    } catch (err) { toast.error(err.message); }
  };

  const del = async (pin) => {
    if (!window.confirm(`Delete PIN code ${pin}? This cannot be undone.`)) return;
    try {
      await api(`/pincodes/${pin}`, { method: 'DELETE' });
      toast.success(`${pin} deleted`);
      loadRows(); loadSummary();
    } catch (err) { toast.error(err.message); }
  };

  const bulk = async (action) => {
    const pincodes = [...selected];
    if (!pincodes.length) return;
    const verb = { enable: 'enable', disable: 'disable', delete: 'delete', enableFastest: 'enable fastest for', disableFastest: 'disable fastest for' }[action];
    if (!window.confirm(`${verb} ${pincodes.length} PIN code(s)?`)) return;
    try {
      const r = await api('/pincodes/bulk', { method: 'POST', body: JSON.stringify({ action, pincodes }) });
      toast.success(`${r.data.processed} PIN code(s) updated`);
      setSelected(new Set());
      loadRows(); loadSummary();
    } catch (err) { toast.error(err.message); }
  };

  const exportCsv = async () => {
    try {
      const csv = await api('/pincodes/export');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `delivery-pincodes-${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { toast.error(err.message); }
  };

  const importCsv = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    try {
      const r = await api('/pincodes/import', { method: 'POST', body: JSON.stringify({ csv: text }) });
      toast.success(`Imported ${r.data.imported} PIN code(s)`);
      refreshAll();
    } catch (err) {
      const detail = err.message;
      toast.error(detail.length > 120 ? `${detail.slice(0, 120)}…` : detail);
    }
  };

  const cards = useMemo(() => ([
    { label: 'Total PIN codes', value: summary?.total ?? '—', icon: MapPin, color: '#C41E6B' },
    { label: 'Deliverable', value: summary?.deliverable ?? '—', icon: PackageCheck, color: '#10b981' },
    { label: 'Unavailable', value: summary?.unavailable ?? '—', icon: PackageX, color: '#6b7280' },
    { label: 'Fastest enabled', value: summary?.fastest ?? '—', icon: Rocket, color: '#D4AF37' },
  ]), [summary]);

  const SortHead = ({ k, children }) => (
    <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-gray-700">
      {children}<ArrowUpDown className={`w-3 h-3 ${sort === k ? 'text-[#C41E6B]' : 'text-gray-300'}`} />
    </button>
  );

  return (
    <div className="space-y-6 pb-10">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#C41E6B]/10 to-[#E83D6E]/10 border border-[#C41E6B]/15">
              <MapPin className="w-5 h-5 text-[#C41E6B]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">PIN Code Delivery</h1>
          </div>
          <p className="text-sm text-gray-400 font-medium ml-1">Serviceability, delivery fees and fastest-delivery rules by PIN code</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refreshAll} className="p-2.5 rounded-xl border border-gray-100 bg-white text-gray-500 hover:text-[#C41E6B] hover:border-[#C41E6B]/30 shadow-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setModal({ open: true, editing: null })}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#C41E6B] to-[#E83D6E] text-white font-bold text-sm shadow-lg shadow-[#C41E6B]/25 active:scale-95">
            <Plus className="w-4 h-4" /> Add PIN code
          </button>
        </div>
      </div>

      {/* summary cards */}
      <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div key={i} variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="p-2 rounded-xl w-fit mb-3" style={{ background: `${c.color}15` }}><Icon className="w-4 h-4" style={{ color: c.color }} /></div>
              <p className="text-2xl font-bold text-gray-900">{c.value}</p>
              <p className="text-xs text-gray-400 font-semibold mt-0.5">{c.label}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* tabs */}
      <div className="flex items-center gap-2 border-b border-gray-100">
        {[
          { id: 'pincodes', label: 'PIN Codes', icon: MapPin },
          { id: 'standard', label: 'Delivery Rules', icon: Settings2 },
          { id: 'fastest', label: 'Fastest Delivery', icon: Zap },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${
              tab === id ? 'border-[#C41E6B] text-[#C41E6B]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab !== 'pincodes' ? (
        settings ? <SettingsPanel tab={tab} settings={settings} saving={savingSettings}
          onSave={async (payload) => {
            setSavingSettings(true);
            try {
              const r = await api('/settings', { method: 'PUT', body: JSON.stringify(payload) });
              setSettings(r.data); loadSummary();
              toast.success('Settings saved');
            } catch (err) { toast.error(err.message); } finally { setSavingSettings(false); }
          }} />
          : <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
      ) : (
        <>
          {/* toolbar */}
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search PIN code or city…"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-100 bg-white text-sm text-gray-900 font-medium focus:outline-none focus:border-[#C41E6B]/40 shadow-sm" />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="w-44">
                <SearchableSelect value={fState}
                  onChange={setFState}
                  options={[{ value: '', label: 'All states' }, ...INDIA_STATES.map((s) => ({ value: s, label: s }))]}
                  placeholder="All states" searchPlaceholder="Filter by state…"
                  triggerClassName={`${adminSelectCls} !bg-white !shadow-sm`} ariaLabel="Filter by state" />
              </div>
              {[
                { v: fAvail, set: setFAvail, opts: [['', 'All'], ['available', 'Deliverable'], ['unavailable', 'Unavailable']] },
                { v: fFastest, set: setFFastest, opts: [['', 'Any fastest'], ['yes', 'Fastest: Yes'], ['no', 'Fastest: No']] },
              ].map((f, i) => (
                <select key={i} value={f.v} onChange={(e) => f.set(e.target.value)}
                  className="h-11 px-3 rounded-xl border border-gray-100 bg-white text-sm font-bold text-gray-500 focus:outline-none shadow-sm">
                  {f.opts.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
                </select>
              ))}
              <button onClick={exportCsv} className="h-11 px-3.5 rounded-xl border border-gray-100 bg-white text-sm font-bold text-gray-500 hover:text-[#C41E6B] shadow-sm flex items-center gap-1.5">
                <Download className="w-4 h-4" /> Export
              </button>
              <button onClick={() => fileRef.current?.click()} className="h-11 px-3.5 rounded-xl border border-gray-100 bg-white text-sm font-bold text-gray-500 hover:text-[#C41E6B] shadow-sm flex items-center gap-1.5">
                <Upload className="w-4 h-4" /> Import CSV
              </button>
              <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={importCsv} />
            </div>
          </div>

          {/* bulk bar */}
          <AnimatePresence>
            {selected.size > 0 && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl bg-[#C41E6B]/5 border border-[#C41E6B]/15">
                <span className="text-sm font-bold text-[#C41E6B]">{selected.size} selected</span>
                {[['enable', 'Enable'], ['disable', 'Disable'], ['enableFastest', 'Enable fastest'], ['disableFastest', 'Disable fastest']].map(([a, l]) => (
                  <button key={a} onClick={() => bulk(a)} className="text-xs font-bold text-gray-600 hover:text-[#C41E6B] px-2 py-1 rounded-lg hover:bg-white">{l}</button>
                ))}
                <button onClick={() => bulk('delete')} className="text-xs font-bold text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-white">Delete</button>
                <button onClick={() => setSelected(new Set())} className="ml-auto text-xs font-bold text-gray-400">Clear</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/70 text-[11px] uppercase tracking-wider text-gray-400 font-bold">
                  <tr>
                    <th className="p-4 w-10"><input type="checkbox" checked={allOnPage} onChange={toggleAll} className="accent-[#C41E6B]" /></th>
                    <th className="p-4 text-left"><SortHead k="pincode">PIN</SortHead></th>
                    <th className="p-4 text-left"><SortHead k="city">City</SortHead></th>
                    <th className="p-4 text-left"><SortHead k="state">State</SortHead></th>
                    <th className="p-4 text-right"><SortHead k="standardDeliveryFee">Std fee</SortHead></th>
                    <th className="p-4 text-center">Fastest</th>
                    <th className="p-4 text-right">Fast fee</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-left"><SortHead k="updatedAt">Updated</SortHead></th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i} className="border-t border-gray-50"><td colSpan={10} className="p-4"><div className="h-5 bg-gray-50 rounded animate-pulse" /></td></tr>
                    ))
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={10} className="p-16 text-center">
                      <MapPin className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="font-bold text-gray-400">No PIN codes found</p>
                      <p className="text-xs text-gray-300 mt-1">{q || fState ? 'Try a different search / filter' : 'Add your first PIN code or import a CSV'}</p>
                    </td></tr>
                  ) : (
                    rows.map((r) => {
                      const inactive = r.isActive === false;
                      return (
                        <tr key={r.pincode} className={`border-t border-gray-50 hover:bg-gray-50/40 ${inactive ? 'opacity-50' : ''}`}>
                          <td className="p-4"><input type="checkbox" checked={selected.has(r.pincode)} onChange={() => toggleRow(r.pincode)} className="accent-[#C41E6B]" /></td>
                          <td className="p-4 font-mono font-bold text-gray-900 tracking-wider">{r.pincode}</td>
                          <td className="p-4 text-gray-600">{r.city || '—'}</td>
                          <td className="p-4 text-gray-500">{r.state || '—'}</td>
                          <td className="p-4 text-right font-bold text-gray-800">{r.standardDeliveryFee ? `₹${r.standardDeliveryFee}` : 'Default'}</td>
                          <td className="p-4 text-center">
                            {r.fastestDeliveryAvailable
                              ? <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-[#C41E6B] bg-[#C41E6B]/8 px-2 py-0.5 rounded-full"><Rocket className="w-3 h-3" />Yes</span>
                              : <span className="text-gray-300 text-xs">No</span>}
                          </td>
                          <td className="p-4 text-right text-gray-600">{r.fastestDeliveryAvailable && r.fastestDeliveryFee ? `₹${r.fastestDeliveryFee}` : '—'}</td>
                          <td className="p-4 text-center">
                            <button onClick={() => rowStatus(r.pincode, 'deliveryAvailable')}
                              className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                r.deliveryAvailable ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-500 border border-red-100'}`}>
                              {r.deliveryAvailable ? 'Available' : 'Unavailable'}
                            </button>
                          </td>
                          <td className="p-4 text-xs text-gray-400">
                            {r.updatedAt ? new Date((r.updatedAt._seconds || 0) * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => setModal({ open: true, editing: r })} className="p-1.5 rounded-lg text-gray-400 hover:text-[#C41E6B] hover:bg-[#C41E6B]/5" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                              <button onClick={() => rowStatus(r.pincode, 'isActive')} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50" title={inactive ? 'Reactivate' : 'Deactivate'}>
                                {inactive ? <ToggleLeft className="w-3.5 h-3.5" /> : <ToggleRight className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={() => del(r.pincode)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* pagination */}
            {pagination.total > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50 text-xs text-gray-400 font-semibold">
                <span>{pagination.total} PIN code{pagination.total !== 1 ? 's' : ''}{pagination.capped ? ' (showing first 500)' : ''}</span>
                <div className="flex items-center gap-2">
                  <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-1.5 rounded-lg border border-gray-100 disabled:opacity-40 hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /></button>
                  <span>Page {pagination.page} / {pagination.totalPages}</span>
                  <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded-lg border border-gray-100 disabled:opacity-40 hover:bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <PincodeModal open={modal.open} editing={modal.editing}
        onClose={() => setModal({ open: false, editing: null })}
        onSaved={() => { loadRows(); loadSummary(); }} />
    </div>
  );
}
