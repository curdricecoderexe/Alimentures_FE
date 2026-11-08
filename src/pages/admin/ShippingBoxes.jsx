import React, { useEffect, useMemo, useState } from 'react';
import {
  Boxes, Plus, Trash2, RefreshCw, Loader2, ToggleLeft, ToggleRight, Info, PlugZap, BarChart3, Brain,
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE, authenticatedFetch } from '../../lib/api';

/**
 * Admin → Shipping & Boxes
 * The packaging catalogue (boxes, courier flyers, covers) and packing rules.
 * For every order the server evaluates each active package the contents fit
 * safely, estimates dead / volumetric / chargeable weight and picks the one
 * with the lowest expected cost. Staff then verify the real packed parcel
 * before courier booking. Also: cost-difference policy, learned allowances and
 * shipping profit/loss analytics.
 */

const inputCls = 'w-full h-10 px-3 rounded-xl border border-gray-100 bg-gray-50/60 text-sm text-gray-900 font-semibold focus:outline-none focus:border-[#C41E6B]/40 focus:bg-white transition-all';
const thCls = 'px-2 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400';

const PACKAGE_TYPES = [['box', 'Box'], ['flyer', 'Flyer'], ['cover', 'Cover']];
const g = (kg) => Math.round((Number(kg) || 0) * 1000);
const splitList = (txt) => String(txt || '').split(',').map((x) => x.trim()).filter(Boolean);
const dimsText = (d) => (d ? `${d.l}x${d.b}x${d.h}` : '');
const parseDimsText = (t) => {
  const m = String(t || '').trim().match(/^([\d.]+)\s*[x×*]\s*([\d.]+)\s*[x×*]\s*([\d.]+)$/i);
  return m ? { l: Number(m[1]), b: Number(m[2]), h: Number(m[3]) } : null;
};
/** "Honey: 40" lines ↔ { Honey: 0.04 } (grams in the UI, kg on the server). */
const mapToLines = (m, fmt) => Object.entries(m || {}).map(([k, v]) => `${k}: ${fmt(v)}`).join('\n');
const linesToMap = (txt, parse) => Object.fromEntries(String(txt || '').split('\n')
  .map((l) => l.split(':')).filter((p) => p.length >= 2 && p[0].trim())
  .map(([k, ...v]) => [k.trim(), parse(v.join(':').trim())]).filter(([, v]) => v != null));

const toForm = (s) => ({
  autoSelectBox: s.autoSelectBox !== false,
  fillPct: Math.round(((s.fillFactor ?? 1.15) - 1) * 100),
  extraPackagingG: g(s.extraPackagingKg ?? 0.02),
  pouchAllowancePct: s.pouchAllowancePct ?? 5,
  volumetricDivisor: s.volumetricDivisor ?? 5000,
  billingSlabKg: s.billingSlabKg ?? 0.5,
  innerPackagingG: g(s.innerPackagingKg),
  categoryInnerText: mapToLines(s.categoryInnerPackagingKg, g),
  boxOnlyText: (s.boxOnlyCategories || []).join(', '),
  safetyPct: s.safetyPct ?? 3,
  safetyMinG: g(s.safetyMinKg ?? 0.01),
  fallbackDimsText: dimsText(s.fallbackItemDims),
  categoryDimsText: mapToLines(s.categoryFallbackDims, dimsText),
  requirePackingVerification: s.requirePackingVerification !== false,
  absorbUpToRs: s.adjustment?.absorbUpToRs ?? 10,
  autoDispatchUpToRs: s.adjustment?.autoDispatchUpToRs ?? 25,
  learningEnabled: s.learning?.enabled !== false,
  learningMinSamples: s.learning?.minSamples ?? 5,
  learningPercentile: s.learning?.percentile ?? 75,
  learningMaxG: g(s.learning?.maxAllowanceKg ?? 0.3),
  boxes: (s.boxes || []).map((b) => ({
    id: b.id, name: b.name, type: b.type || 'box', length: b.length, breadth: b.breadth, height: b.height,
    boxWeightG: g(b.boxWeightKg),
    fillerG: g(b.fillerKg),
    maxWeightKg: b.maxWeightKg || '',
    materialCost: b.materialCost ?? 0,
    categoriesText: (b.allowedCategories || []).join(', '),
    isActive: b.isActive !== false,
  })),
});

const toPayload = (f) => ({
  autoSelectBox: !!f.autoSelectBox,
  fillFactor: 1 + (Number(f.fillPct) || 0) / 100,
  extraPackagingKg: (Number(f.extraPackagingG) || 0) / 1000,
  pouchAllowancePct: Number(f.pouchAllowancePct) || 0,
  volumetricDivisor: Number(f.volumetricDivisor) || 5000,
  billingSlabKg: Number(f.billingSlabKg) || 0.5,
  innerPackagingKg: (Number(f.innerPackagingG) || 0) / 1000,
  categoryInnerPackagingKg: linesToMap(f.categoryInnerText, (v) => (Number.isFinite(Number(v)) ? Number(v) / 1000 : null)),
  boxOnlyCategories: splitList(f.boxOnlyText),
  safetyPct: Number(f.safetyPct) || 0,
  safetyMinKg: (Number(f.safetyMinG) || 0) / 1000,
  fallbackItemDims: parseDimsText(f.fallbackDimsText),
  categoryFallbackDims: linesToMap(f.categoryDimsText, parseDimsText),
  requirePackingVerification: !!f.requirePackingVerification,
  adjustment: { absorbUpToRs: Number(f.absorbUpToRs) || 0, autoDispatchUpToRs: Number(f.autoDispatchUpToRs) || 0 },
  learning: {
    enabled: !!f.learningEnabled,
    minSamples: Number(f.learningMinSamples) || 5,
    percentile: Number(f.learningPercentile) || 75,
    maxAllowanceKg: (Number(f.learningMaxG) || 0) / 1000,
  },
  boxes: f.boxes.map((b) => ({
    id: String(b.id || '').trim(),
    name: String(b.name || '').trim(),
    type: b.type || 'box',
    length: Number(b.length),
    breadth: Number(b.breadth),
    height: Number(b.height),
    boxWeightKg: (Number(b.boxWeightG) || 0) / 1000,
    fillerKg: (Number(b.fillerG) || 0) / 1000,
    maxWeightKg: Number(b.maxWeightKg) || 0,
    materialCost: Number(b.materialCost) || 0,
    allowedCategories: splitList(b.categoriesText),
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

const rs = (v) => (v == null ? '—' : `₹${Math.round(Number(v)).toLocaleString('en-IN')}`);

/** Learned packing allowances (historical data) with admin overrides. */
function LearnedAllowances() {
  const [rows, setRows] = useState(null);
  const [edit, setEdit] = useState({});
  const [version, setVersion] = useState(0);
  const load = () => setVersion((v) => v + 1);
  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await authenticatedFetch(`${API_BASE}/shipping/learning`);
      const body = res ? await res.json().catch(() => ({})) : {};
      if (alive && body.success) { setRows(body.data); setEdit({}); }
    })();
    return () => { alive = false; };
  }, [version]);
  const saveOverride = async (id, value) => {
    const res = await authenticatedFetch(`${API_BASE}/shipping/learning/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overrideKg: value === '' ? null : Number(value) / 1000 }),
    });
    const body = res ? await res.json().catch(() => ({})) : {};
    if (body.success) { toast.success(value === '' ? 'Override cleared' : 'Override saved'); load(); } else toast.error(body.error || 'Save failed');
  };
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-6 pt-5 pb-3">
        <Brain className="w-4 h-4 text-[#C41E6B]" />
        <div>
          <h2 className="text-sm font-bold text-gray-900">Learned packing allowances</h2>
          <p className="text-xs text-gray-400 mt-0.5">From verified parcels: extra weight beyond the base estimate, per product mix and package. Outliers are ignored.</p>
        </div>
      </div>
      {!rows ? <div className="px-6 pb-6"><Loader2 className="w-4 h-4 animate-spin text-gray-300" /></div>
        : rows.length === 0 ? <p className="px-6 pb-6 text-sm text-gray-400">No verified parcels yet — allowances appear after staff verify packing.</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="border-y border-gray-50 bg-gray-50/40">
                  <tr>{['Product mix', 'Package', 'Samples', 'Learned (g)', 'Median (g)', 'Override (g)', ''].map((h) => <th key={h} className={`${thCls} first:pl-6`}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-2 py-2 pl-6 text-xs font-semibold text-gray-700">{r.signature}</td>
                      <td className="px-2 py-2 text-xs font-bold text-gray-600">{r.boxId || 'any'}</td>
                      <td className="px-2 py-2 text-xs font-bold text-gray-600">{r.samples}{r.trimmed ? ` (−${r.trimmed} outliers)` : ''}</td>
                      <td className="px-2 py-2 text-xs font-bold text-gray-900">{Math.round(r.allowanceKg * 1000)}</td>
                      <td className="px-2 py-2 text-xs font-bold text-gray-500">{Math.round(r.medianKg * 1000)}</td>
                      <td className="px-2 py-2 w-28">
                        <input type="number" min="0" className={inputCls}
                          value={edit[r.id] ?? (r.overrideKg == null ? '' : Math.round(r.overrideKg * 1000))}
                          onChange={(e) => setEdit((x) => ({ ...x, [r.id]: e.target.value }))} placeholder="none" />
                      </td>
                      <td className="px-2 py-2 pr-6">
                        <button onClick={() => saveOverride(r.id, edit[r.id] ?? (r.overrideKg == null ? '' : Math.round(r.overrideKg * 1000)))}
                          className="px-3 py-1.5 rounded-lg bg-black text-white text-[11px] font-bold">Save</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
    </div>
  );
}

/** Shipping profit / loss and estimate accuracy. */
function ShippingAnalytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      setBusy(true);
      try {
        const res = await authenticatedFetch(`${API_BASE}/shipping/analytics?days=${days}`);
        const body = res ? await res.json().catch(() => ({})) : {};
        if (alive && body.success) setData(body.data);
      } finally {
        if (alive) setBusy(false);
      }
    })();
    return () => { alive = false; };
  }, [days]);
  const t = data?.totals || {};
  const tiles = [
    ['Shipping revenue', rs(t.revenue)],
    ['Estimated freight', rs(t.estimatedFreight)],
    ['Actual freight', rs(t.actualFreight)],
    ['Packaging cost', rs(t.materialCost)],
    ['Profit / loss', rs(t.profit), (t.profit ?? 0) < 0 ? 'text-red-600' : 'text-emerald-600'],
    ['Losses on loss-making parcels', rs(t.losses), 'text-red-600'],
    ['Avg weight difference', data?.avgWeightDiffKg == null ? '—' : `${Math.round(data.avgWeightDiffKg * 1000)} g`],
    ['Avg volumetric difference', data?.avgVolumetricDiffKg == null ? '—' : `${Math.round(data.avgVolumetricDiffKg * 1000)} g`],
  ];
  const Table = ({ title, rows }) => (
    <div className="overflow-x-auto">
      <p className="px-6 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">{title}</p>
      <table className="w-full min-w-[560px]">
        <tbody>
          {(rows || []).map((r) => (
            <tr key={r.key} className="border-b border-gray-50 last:border-0">
              <td className="px-2 py-2 pl-6 text-xs font-bold text-gray-800">{r.key}</td>
              <td className="px-2 py-2 text-xs text-gray-500">{r.orders} orders</td>
              <td className="px-2 py-2 text-xs text-gray-500">fees {rs(r.revenue)}</td>
              <td className="px-2 py-2 text-xs text-gray-500">freight {rs(r.freight)}</td>
              <td className={`px-2 py-2 text-xs font-bold ${r.profit < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{rs(r.profit)}</td>
              <td className="px-2 py-2 pr-6 text-xs text-gray-500">{r.avgWeightDiffKg == null ? '' : `avg ${Math.round(r.avgWeightDiffKg * 1000)} g heavier`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#C41E6B]" />
          <h2 className="text-sm font-bold text-gray-900">Shipping analytics</h2>
          {busy && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-300" />}
        </div>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className={`${inputCls} w-36`}>
          {[7, 30, 90, 365].map((d) => <option key={d} value={d}>Last {d} days</option>)}
        </select>
      </div>
      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-6">
            {tiles.map(([label, value, cls]) => (
              <div key={label} className="p-3 rounded-2xl bg-gray-50/70 border border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
                <p className={`mt-1 text-lg font-extrabold ${cls || 'text-gray-900'}`}>{value}</p>
              </div>
            ))}
          </div>
          <p className="px-6 pt-3 text-[11px] text-gray-400 font-semibold">
            {t.orders} paid orders · {t.verified} parcels verified · {t.shipped} booked{data.truncated ? ' · showing the most recent 2000 orders' : ''}
          </p>
          {data.couriers?.length > 0 && <Table title="By courier" rows={data.couriers} />}
          {data.packages?.length > 0 && <Table title="By package" rows={data.packages} />}
          <p className="px-6 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">Needs review</p>
          {data.review?.length ? (
            <ul className="px-6 space-y-1">
              {data.review.map((r) => (
                <li key={r.orderId} className="text-xs text-gray-700">
                  <b>#{r.orderId.slice(-8).toUpperCase()}</b> · {r.reason}{r.freightRs != null ? ` (₹${r.freightRs})` : ''}
                </li>
              ))}
            </ul>
          ) : <p className="px-6 text-xs text-gray-400">Nothing waiting — all parcels are within the cost policy.</p>}
        </>
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
    boxes: [...f.boxes, { id: `BX-${f.boxes.length + 1}`, name: '', type: 'box', length: '', breadth: '', height: '', boxWeightG: '', fillerG: '', maxWeightKg: '', materialCost: '', categoriesText: '', isActive: true }],
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
    if (form.fallbackDimsText && !parseDimsText(form.fallbackDimsText)) return toast.error('Fallback item size must look like 15x10x5');
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
          For each order we try <b>every active package</b> the items safely fit, estimate its packed weight (contents + inner packaging + package + filler + tape + learned allowance + safety margin)
          and pick the one with the <b>lowest expected courier cost</b>. Enter each variant's <b>packed weight and size</b> in Products — items without a size are flagged as low-confidence estimates.
          {form?.requirePackingVerification !== false && <> Staff <b>weigh and measure</b> every parcel before the courier is booked, and Shiprocket gets those real numbers.</>}
        </div>
      </div>

      {!form ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
      ) : (
        <>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Packaging catalogue</h2>
                <p className="text-xs text-gray-400 mt-0.5">EXTERNAL dimensions in cm (what the courier measures). Max weight 0 = no limit. Categories empty = any product.</p>
              </div>
              <button onClick={addBox} disabled={form.boxes.length >= 30}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black text-white text-xs font-bold disabled:opacity-40">
                <Plus className="w-3.5 h-3.5" /> Add box
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1280px]">
                <thead className="border-y border-gray-50 bg-gray-50/40">
                  <tr>
                    <th className={`${thCls} pl-6`}>Code</th>
                    <th className={thCls}>Name</th>
                    <th className={thCls}>Type</th>
                    <th className={thCls}>Length (cm)</th>
                    <th className={thCls}>Breadth (cm)</th>
                    <th className={thCls}>Height (cm)</th>
                    <th className={thCls}>Tare (g)</th>
                    <th className={thCls}>Filler (g)</th>
                    <th className={thCls}>Max weight (kg)</th>
                    <th className={thCls}>Cost (₹)</th>
                    <th className={thCls}>Only for categories</th>
                    <th className={thCls}>Volumetric</th>
                    <th className={thCls}>Active</th>
                    <th className={thCls} />
                  </tr>
                </thead>
                <tbody>
                  {form.boxes.length === 0 && (
                    <tr><td colSpan={14} className="px-6 py-8 text-center text-sm text-gray-400">
                      No boxes — every parcel will be sent as {meta.fallbackBox ? `${meta.fallbackBox.length} × ${meta.fallbackBox.breadth} × ${meta.fallbackBox.height} cm` : 'the default size'}.
                    </td></tr>
                  )}
                  {form.boxes.map((b, i) => (
                    <tr key={i} className={`border-b border-gray-50 last:border-0 ${b.isActive ? '' : 'opacity-50'}`}>
                      <td className="px-2 py-2 pl-6 w-28"><input className={`${inputCls} uppercase`} value={b.id} onChange={(e) => setBox(i, 'id', e.target.value.toUpperCase())} /></td>
                      <td className="px-2 py-2"><input className={inputCls} value={b.name} placeholder="Small" onChange={(e) => setBox(i, 'name', e.target.value)} /></td>
                      <td className="px-2 py-2 w-24">
                        <select className={inputCls} value={b.type} onChange={(e) => setBox(i, 'type', e.target.value)}>
                          {PACKAGE_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </td>
                      {['length', 'breadth', 'height'].map((k) => (
                        <td key={k} className="px-2 py-2 w-24">
                          <input type="number" min="0.5" step="0.5" className={inputCls} value={b[k]} onChange={(e) => setBox(i, k, e.target.value)} />
                        </td>
                      ))}
                      <td className="px-2 py-2 w-24"><input type="number" min="0" className={inputCls} value={b.boxWeightG} onChange={(e) => setBox(i, 'boxWeightG', e.target.value)} /></td>
                      <td className="px-2 py-2 w-20"><input type="number" min="0" className={inputCls} value={b.fillerG} onChange={(e) => setBox(i, 'fillerG', e.target.value)} /></td>
                      <td className="px-2 py-2 w-24"><input type="number" min="0" step="0.1" className={inputCls} value={b.maxWeightKg} onChange={(e) => setBox(i, 'maxWeightKg', e.target.value)} /></td>
                      <td className="px-2 py-2 w-20"><input type="number" min="0" step="0.5" className={inputCls} value={b.materialCost} onChange={(e) => setBox(i, 'materialCost', e.target.value)} /></td>
                      <td className="px-2 py-2 w-40"><input className={inputCls} value={b.categoriesText} placeholder="any" onChange={(e) => setBox(i, 'categoriesText', e.target.value)} /></td>
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
                Active packages (smallest first): {sortedPreview.map((b) => `${b.id}${b.type !== 'box' ? ` (${b.type})` : ''}`).join(' · ')} — the cheapest one that safely fits is used.
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
              { k: 'billingSlabKg', label: 'Courier billing slab (kg)', hint: 'Couriers round chargeable weight up to this step (0.5 kg)', unit: 'kg', step: '0.1' },
              { k: 'innerPackagingG', label: 'Inner packaging per item (g)', hint: 'Bubble wrap / sleeve per unit, for categories not listed below', unit: 'g' },
              { k: 'safetyPct', label: 'Safety allowance (%)', hint: 'Added to every estimated parcel weight', unit: '%' },
              { k: 'safetyMinG', label: 'Minimum safety allowance (g)', hint: 'Never less than this, even for tiny parcels', unit: 'g' },
            ].map((r) => (
              <div key={r.k} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-gray-50 last:border-0">
                <div><p className="text-sm font-bold text-gray-800">{r.label}</p><p className="text-xs text-gray-400 mt-0.5">{r.hint}</p></div>
                <div className="shrink-0">
                  {r.toggle
                    ? <Toggle on={form[r.k]} onClick={() => set(r.k, !form[r.k])} />
                    : (
                      <div className="relative w-32">
                        <input type="number" min="0" step={r.step || '1'} value={form[r.k]} onChange={(e) => set(r.k, e.target.value)} className={`${inputCls} ${r.unit ? 'pr-8' : ''}`} />
                        {r.unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">{r.unit}</span>}
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-4">
              <h2 className="text-sm font-bold text-gray-900">Category rules</h2>
              <label className="block space-y-1">
                <span className="text-xs font-bold text-gray-700">Inner packaging by category (g per item)</span>
                <textarea rows={3} value={form.categoryInnerText} onChange={(e) => set('categoryInnerText', e.target.value)}
                  placeholder={'Honey: 40\nCookies: 10'} className={`${inputCls} h-auto py-2 font-mono`} />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-bold text-gray-700">Box-only categories</span>
                <input value={form.boxOnlyText} onChange={(e) => set('boxOnlyText', e.target.value)} placeholder="Honey, Ghee" className={inputCls} />
                <span className="block text-[11px] text-gray-400">Never packed in a flyer or cover (jars, glass, crushable).</span>
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-bold text-gray-700">Fallback item size for products without a packed size (cm)</span>
                <input value={form.fallbackDimsText} onChange={(e) => set('fallbackDimsText', e.target.value)} placeholder="15x10x5 (empty = choose by weight only)" className={inputCls} />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-bold text-gray-700">Fallback size by category</span>
                <textarea rows={2} value={form.categoryDimsText} onChange={(e) => set('categoryDimsText', e.target.value)}
                  placeholder={'Cookies: 18x12x5'} className={`${inputCls} h-auto py-2 font-mono`} />
                <span className="block text-[11px] text-gray-400">Estimates using a fallback are always marked low-confidence.</span>
              </label>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <h2 className="text-sm font-bold text-gray-900 mb-2">Dispatch &amp; cost differences</h2>
              <div className="flex items-center justify-between gap-3 py-3 border-b border-gray-50">
                <div><p className="text-sm font-bold text-gray-800">Require packing verification</p><p className="text-xs text-gray-400 mt-0.5">Staff must weigh + measure before the courier is booked; Shiprocket gets the real parcel</p></div>
                <Toggle on={form.requirePackingVerification} onClick={() => set('requirePackingVerification', !form.requirePackingVerification)} />
              </div>
              {[
                { k: 'absorbUpToRs', label: 'Absorb automatically up to (₹)', hint: 'Actual courier cost above the checkout quote, absorbed silently' },
                { k: 'autoDispatchUpToRs', label: 'Allow dispatch up to (₹)', hint: 'Above this, an admin must approve. The customer is never charged more.' },
              ].map((r) => (
                <div key={r.k} className="flex items-center justify-between gap-3 py-3 border-b border-gray-50">
                  <div><p className="text-sm font-bold text-gray-800">{r.label}</p><p className="text-xs text-gray-400 mt-0.5">{r.hint}</p></div>
                  <input type="number" min="0" value={form[r.k]} onChange={(e) => set(r.k, e.target.value)} className={`${inputCls} w-28`} />
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 py-3 border-b border-gray-50">
                <div><p className="text-sm font-bold text-gray-800">Learn from verified parcels</p><p className="text-xs text-gray-400 mt-0.5">Adds the typical extra packing weight per product mix + package</p></div>
                <Toggle on={form.learningEnabled} onClick={() => set('learningEnabled', !form.learningEnabled)} />
              </div>
              {[
                { k: 'learningMinSamples', label: 'Samples needed before learning applies' },
                { k: 'learningPercentile', label: 'Percentile used (50–95)' },
                { k: 'learningMaxG', label: 'Largest learned allowance (g)' },
              ].map((r) => (
                <div key={r.k} className="flex items-center justify-between gap-3 py-3 border-b border-gray-50 last:border-0">
                  <p className="text-sm font-bold text-gray-800">{r.label}</p>
                  <input type="number" min="0" value={form[r.k]} onChange={(e) => set(r.k, e.target.value)} className={`${inputCls} w-28`} />
                </div>
              ))}
            </div>
          </div>

          <LearnedAllowances />
          <ShippingAnalytics />

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
