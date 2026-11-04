import React, { useEffect, useMemo, useState } from 'react';
import {
  Boxes, Plus, Trash2, RefreshCw, Loader2, ToggleLeft, ToggleRight, Info, PlugZap,
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE, authenticatedFetch } from '../../lib/api';

/**
 * Admin → Shipping & Boxes
 * The box catalogue Shiprocket parcels are packed in. For every order the
 * server picks the smallest active box the contents fit (weight limit, volume,
 * longest item side) and sends its L × B × H + packed weight to Shiprocket.
 */

const inputCls = 'w-full h-10 px-3 rounded-xl border border-gray-100 bg-gray-50/60 text-sm text-gray-900 font-semibold focus:outline-none focus:border-[#C41E6B]/40 focus:bg-white transition-all';
const thCls = 'px-2 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400';

const toForm = (s) => ({
  autoSelectBox: s.autoSelectBox !== false,
  fillPct: Math.round(((s.fillFactor ?? 1.15) - 1) * 100),
  extraPackagingG: Math.round((s.extraPackagingKg ?? 0.02) * 1000),
  pouchAllowancePct: s.pouchAllowancePct ?? 5,
  volumetricDivisor: s.volumetricDivisor ?? 5000,
  boxes: (s.boxes || []).map((b) => ({
    id: b.id, name: b.name, length: b.length, breadth: b.breadth, height: b.height,
    boxWeightG: Math.round((b.boxWeightKg || 0) * 1000),
    maxWeightKg: b.maxWeightKg || '',
    isActive: b.isActive !== false,
  })),
});

const toPayload = (f) => ({
  autoSelectBox: !!f.autoSelectBox,
  fillFactor: 1 + (Number(f.fillPct) || 0) / 100,
  extraPackagingKg: (Number(f.extraPackagingG) || 0) / 1000,
  pouchAllowancePct: Number(f.pouchAllowancePct) || 0,
  volumetricDivisor: Number(f.volumetricDivisor) || 5000,
  boxes: f.boxes.map((b) => ({
    id: String(b.id || '').trim(),
    name: String(b.name || '').trim(),
    length: Number(b.length),
    breadth: Number(b.breadth),
    height: Number(b.height),
    boxWeightKg: (Number(b.boxWeightG) || 0) / 1000,
    maxWeightKg: Number(b.maxWeightKg) || 0,
    isActive: !!b.isActive,
  })),
});

/** Shiprocket login health + one-click (rate-limited) login test. */
function ConnectionCard() {
  const [st, setSt] = useState(null);
  const [testing, setTesting] = useState(false);

  const load = async () => {
    const res = await authenticatedFetch(`${API_BASE}/shipping/status`);
    const body = res ? await res.json().catch(() => ({})) : {};
    if (body.success) setSt(body.data);
  };
  useEffect(() => { load(); }, []);

  const test = async () => {
    setTesting(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/shipping/status/test-login`, { method: 'POST' });
      if (!res) return;
      const body = await res.json().catch(() => ({}));
      if (body.success) toast.success('Shiprocket login OK');
      else toast.error(body.error || 'Login failed');
      await load();
    } finally {
      setTesting(false);
    }
  };

  if (!st) return null;
  const a = st.auth || {};
  const tone = !st.enabled ? 'gray' : a.paused || a.lastError ? 'red' : a.ok ? 'green' : 'gray';
  const toneCls = {
    red: 'bg-red-50 border-red-100 text-red-800',
    green: 'bg-emerald-50 border-emerald-100 text-emerald-800',
    gray: 'bg-gray-50 border-gray-100 text-gray-600',
  }[tone];
  const fmt = (iso) => (iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '');

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border text-xs font-medium ${toneCls}`}>
      <div className="flex items-start gap-3">
        <PlugZap className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-sm">
            {!st.enabled ? 'Shiprocket not configured'
              : a.paused ? `Shiprocket login paused until ${fmt(a.pausedUntil)}`
                : a.ok ? 'Shiprocket connected' : a.lastError ? 'Shiprocket login failing' : 'Shiprocket not connected yet'}
          </p>
          {a.lastError && <p>Last error: {a.lastError}{a.consecutiveFailures > 1 ? ` (${a.consecutiveFailures}× in a row)` : ''}</p>}
          {a.paused && (
            <p>
              Logins are paused so Shiprocket doesn't block the API user. Checkout still works (couriers aren't checked meanwhile).
              Fix the credentials in Shiprocket → Settings → API, update .env, restart, then test.
            </p>
          )}
          {a.lastOkAt && !a.lastError && <p>Last successful login {fmt(a.lastOkAt)}</p>}
        </div>
      </div>
      {st.enabled && (
        <button onClick={test} disabled={testing}
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black text-white font-bold disabled:opacity-50">
          {testing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Test login
        </button>
      )}
    </div>
  );
}

const volKg = (b, divisor) => {
  const v = Number(b.length) * Number(b.breadth) * Number(b.height);
  return v > 0 ? (v / (Number(divisor) || 5000)).toFixed(2) : '—';
};

export default function ShippingBoxes() {
  const [form, setForm] = useState(null);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/shipping/packaging`);
      if (!res) return;
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) throw new Error(body.error || 'Failed to load boxes');
      setForm(toForm(body.data));
      setMeta({ updatedAt: body.data.updatedAt, updatedBy: body.data.updatedBy, fallbackBox: body.data.fallbackBox });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setBox = (i, k, v) => setForm((f) => ({ ...f, boxes: f.boxes.map((b, j) => (j === i ? { ...b, [k]: v } : b)) }));
  const addBox = () => setForm((f) => ({
    ...f,
    boxes: [...f.boxes, { id: `BX-${f.boxes.length + 1}`, name: '', length: '', breadth: '', height: '', boxWeightG: '', maxWeightKg: '', isActive: true }],
  }));
  const removeBox = (i) => setForm((f) => ({ ...f, boxes: f.boxes.filter((_, j) => j !== i) }));

  const sortedPreview = useMemo(() => {
    if (!form) return [];
    return form.boxes
      .filter((b) => b.isActive && b.length && b.breadth && b.height)
      .map((b) => ({ ...b, vol: Number(b.length) * Number(b.breadth) * Number(b.height) }))
      .sort((a, b) => a.vol - b.vol);
  }, [form]);

  const save = async () => {
    const bad = form.boxes.find((b) => !String(b.id).trim() || !(b.length > 0 && b.breadth > 0 && b.height > 0));
    if (bad) return toast.error(`Box "${bad.id || bad.name || 'new'}" needs a code and all three sides`);
    setSaving(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/shipping/packaging`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(form)),
      });
      if (!res) return;
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) throw new Error(body.error || 'Save failed');
      setForm(toForm(body.data));
      setMeta({ updatedAt: body.data.updatedAt, updatedBy: body.data.updatedBy, fallbackBox: body.data.fallbackBox });
      toast.success('Shipping boxes saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ on, onClick }) => (
    <button type="button" onClick={onClick}>
      {on ? <ToggleRight className="w-8 h-8 text-emerald-500" /> : <ToggleLeft className="w-8 h-8 text-gray-300" />}
    </button>
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#C41E6B]/10 to-[#E83D6E]/10 border border-[#C41E6B]/15">
              <Boxes className="w-5 h-5 text-[#C41E6B]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Shipping &amp; Boxes</h1>
          </div>
          <p className="text-sm text-gray-400 font-medium ml-1">
            Box sizes and packing rules used to declare each Shiprocket parcel's size and weight
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2.5 rounded-xl border border-gray-100 bg-white text-gray-500 hover:text-[#C41E6B] hover:border-[#C41E6B]/30 shadow-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={save} disabled={saving || !form}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#C41E6B] to-[#E83D6E] text-white font-bold text-sm shadow-lg shadow-[#C41E6B]/25 active:scale-95 disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save changes
          </button>
        </div>
      </div>

      <ConnectionCard />

      <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-blue-900 text-xs font-medium leading-relaxed">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          Couriers bill the <b>higher</b> of the real weight and the volumetric weight (L × B × H ÷ {form?.volumetricDivisor || 5000}).
          For each order we pick the <b>smallest active box</b> that holds the items, add the box's own weight, and send that to Shiprocket.
          For accurate results, also enter each variant's <b>packed weight and size</b> in Products.
          Staff can still change the box for an order before pushing it to Shiprocket.
        </div>
      </div>

      {!form ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
      ) : (
        <>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Box catalogue</h2>
                <p className="text-xs text-gray-400 mt-0.5">Inner dimensions in cm. Max contents 0 or empty = no weight limit.</p>
              </div>
              <button onClick={addBox} disabled={form.boxes.length >= 20}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black text-white text-xs font-bold disabled:opacity-40">
                <Plus className="w-3.5 h-3.5" /> Add box
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead className="border-y border-gray-50 bg-gray-50/40">
                  <tr>
                    <th className={`${thCls} pl-6`}>Code</th>
                    <th className={thCls}>Name</th>
                    <th className={thCls}>Length (cm)</th>
                    <th className={thCls}>Breadth (cm)</th>
                    <th className={thCls}>Height (cm)</th>
                    <th className={thCls}>Box weight (g)</th>
                    <th className={thCls}>Max contents (kg)</th>
                    <th className={thCls}>Volumetric</th>
                    <th className={thCls}>Active</th>
                    <th className={thCls} />
                  </tr>
                </thead>
                <tbody>
                  {form.boxes.length === 0 && (
                    <tr><td colSpan={10} className="px-6 py-8 text-center text-sm text-gray-400">
                      No boxes — every parcel will be sent as {meta.fallbackBox ? `${meta.fallbackBox.length} × ${meta.fallbackBox.breadth} × ${meta.fallbackBox.height} cm` : 'the default size'}.
                    </td></tr>
                  )}
                  {form.boxes.map((b, i) => (
                    <tr key={i} className={`border-b border-gray-50 last:border-0 ${b.isActive ? '' : 'opacity-50'}`}>
                      <td className="px-2 py-2 pl-6 w-28"><input className={`${inputCls} uppercase`} value={b.id} onChange={(e) => setBox(i, 'id', e.target.value.toUpperCase())} /></td>
                      <td className="px-2 py-2"><input className={inputCls} value={b.name} placeholder="Small" onChange={(e) => setBox(i, 'name', e.target.value)} /></td>
                      {['length', 'breadth', 'height'].map((k) => (
                        <td key={k} className="px-2 py-2 w-24">
                          <input type="number" min="0.5" step="0.5" className={inputCls} value={b[k]} onChange={(e) => setBox(i, k, e.target.value)} />
                        </td>
                      ))}
                      <td className="px-2 py-2 w-24"><input type="number" min="0" className={inputCls} value={b.boxWeightG} onChange={(e) => setBox(i, 'boxWeightG', e.target.value)} /></td>
                      <td className="px-2 py-2 w-24"><input type="number" min="0" step="0.1" className={inputCls} value={b.maxWeightKg} onChange={(e) => setBox(i, 'maxWeightKg', e.target.value)} /></td>
                      <td className="px-2 py-2 text-xs font-bold text-gray-500 whitespace-nowrap">{volKg(b, form.volumetricDivisor)} kg</td>
                      <td className="px-2 py-2"><Toggle on={b.isActive} onClick={() => setBox(i, 'isActive', !b.isActive)} /></td>
                      <td className="px-2 py-2 pr-6">
                        <button onClick={() => removeBox(i)} className="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50" title="Remove box">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sortedPreview.length > 0 && (
              <p className="px-6 py-3 text-[11px] text-gray-400 font-semibold border-t border-gray-50">
                Tried in this order: {sortedPreview.map((b) => b.id).join(' → ')}
              </p>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 max-w-2xl">
            <h2 className="text-sm font-bold text-gray-900 mb-2">Packing rules</h2>
            {[
              { k: 'autoSelectBox', label: 'Pick the box automatically', hint: 'OFF = always use the smallest active box (staff choose per order)', toggle: true },
              { k: 'fillPct', label: 'Extra space for filler (%)', hint: 'Added to item volume when checking which box fits', unit: '%' },
              { k: 'extraPackagingG', label: 'Tape, filler & invoice (g)', hint: 'Added to every parcel on top of the box weight', unit: 'g' },
              { k: 'pouchAllowancePct', label: 'Pouch allowance (%)', hint: 'Added to a label weight like "500g" when the variant has no packed weight', unit: '%' },
              { k: 'volumetricDivisor', label: 'Volumetric divisor', hint: '5000 for most Indian domestic couriers' },
            ].map((r) => (
              <div key={r.k} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-gray-50 last:border-0">
                <div><p className="text-sm font-bold text-gray-800">{r.label}</p><p className="text-xs text-gray-400 mt-0.5">{r.hint}</p></div>
                <div className="shrink-0">
                  {r.toggle
                    ? <Toggle on={form[r.k]} onClick={() => set(r.k, !form[r.k])} />
                    : (
                      <div className="relative w-32">
                        <input type="number" min="0" value={form[r.k]} onChange={(e) => set(r.k, e.target.value)} className={`${inputCls} ${r.unit ? 'pr-8' : ''}`} />
                        {r.unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">{r.unit}</span>}
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>

          {meta.updatedAt && (
            <p className="text-[11px] text-gray-400 font-medium">
              Last saved {new Date(meta.updatedAt).toLocaleString()}{meta.updatedBy ? ` by ${meta.updatedBy}` : ''}
            </p>
          )}
        </>
      )}
    </div>
  );
}
