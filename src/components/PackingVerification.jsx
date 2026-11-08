import React, { useEffect, useMemo, useState } from 'react';
import { Scale, Loader2, CheckCircle2, AlertTriangle, ShieldCheck, History } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { API_BASE, authenticatedFetch } from '../lib/api';

/**
 * Packing verification for one order (admin + staff order modals).
 * Staff weigh and measure the packed parcel BEFORE courier booking; the server
 * compares it with the checkout estimate and applies the freight-difference
 * policy. Admins can approve a difference, confirm a Shiprocket panel fix, or
 * skip verification — always with a recorded reason. The customer is never
 * charged more from here.
 */

const VERIFY_LABEL = {
  pending: ['Awaiting measurement', 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'],
  verified: ['Verified', 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'],
  overridden: ['Skipped by admin', 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300'],
  not_required: ['Not required', 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300'],
};

const ADJUST_TEXT = {
  absorbed: ['Small difference — absorbed automatically.', 'text-emerald-700 dark:text-emerald-300'],
  within_tolerance: ['Within tolerance — dispatch allowed.', 'text-emerald-700 dark:text-emerald-300'],
  needs_approval: ['Large difference — an admin must decide before booking.', 'text-red-700 dark:text-red-300'],
  approved: ['Approved by admin — business absorbs the difference.', 'text-indigo-700 dark:text-indigo-300'],
  customer_contacted: ['Waiting on the customer — booking stays blocked.', 'text-amber-700 dark:text-amber-300'],
  refund_requested: ['Customer chose to cancel — use the refund workflow.', 'text-red-700 dark:text-red-300'],
};

const inputCls = 'h-9 w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#24162E] px-2 text-xs font-bold text-gray-900 dark:text-gray-100';
const num = (v) => (v === '' || v == null ? null : Number(v));
const kg = (v) => (v == null ? '—' : `${Number(v).toFixed(2)} kg`);
const rs = (v) => (v == null ? '—' : `₹${Math.round(Number(v))}`);
const dims = (o) => (o?.length ? `${o.length}×${o.breadth}×${o.height} cm` : '—');
const signed = (v, fmt) => (v == null ? '—' : `${v > 0 ? '+' : ''}${fmt(v)}`);

function Row({ label, est, act, diff, bad }) {
  return (
    <tr className="border-t border-gray-100 dark:border-white/5">
      <td className="py-1.5 pr-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400">{label}</td>
      <td className="py-1.5 pr-2 text-[11px] font-bold text-gray-800 dark:text-gray-200">{est}</td>
      <td className="py-1.5 pr-2 text-[11px] font-bold text-gray-800 dark:text-gray-200">{act}</td>
      <td className={`py-1.5 text-[11px] font-extrabold ${bad ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'}`}>{diff}</td>
    </tr>
  );
}

export default function PackingVerification({ order, packaging, isAdmin, onOrderUpdated }) {
  const lg = order?.logistics || {};
  const sh = order?.shipment || {};
  const status = lg.verification?.status || (packaging?.requirePackingVerification ? 'pending' : 'not_required');
  const est = lg.estimate || (order?.plannedPackage ? {
    deadKg: order.plannedPackage.weightKg, volumetricKg: order.plannedPackage.volumetricKg, chargeableKg: order.plannedPackage.chargeableKg,
    length: order.plannedPackage.length, breadth: order.plannedPackage.breadth, height: order.plannedPackage.height,
    packageId: order.plannedPackage.boxId,
  } : null);
  const checkoutFreight = lg.checkoutQuote?.freight ?? order?.quotedCourier?.rate ?? order?.estimatedShippingCost ?? null;
  const boxes = useMemo(() => (packaging?.boxes || []).filter((b) => b.isActive), [packaging]);
  const divisor = packaging?.volumetricDivisor || 5000;
  const locked = !!sh.awb;

  const blank = () => ({
    packageId: lg.actual?.packageId || est?.packageId || '',
    weightKg: '', length: '', breadth: '', height: '', materialCost: '',
  });
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(null);
  const [reason, setReason] = useState('');
  const [showForm, setShowForm] = useState(status !== 'verified');

  useEffect(() => {
    setForm(blank());
    setReason('');
    setShowForm((order?.logistics?.verification?.status || 'pending') !== 'verified');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id]);

  // Picking a catalogue package pre-fills its external size + material cost.
  const pickPackage = (id) => {
    const b = boxes.find((x) => x.id === id);
    setForm((f) => ({
      ...f,
      packageId: id,
      ...(b ? { length: b.length, breadth: b.breadth, height: b.height, materialCost: b.materialCost ?? '' } : {}),
    }));
  };

  const live = useMemo(() => {
    const w = num(form.weightKg); const l = num(form.length); const b = num(form.breadth); const h = num(form.height);
    if (!(w > 0 && l > 0 && b > 0 && h > 0)) return null;
    const vol = Math.round(((l * b * h) / divisor) * 100) / 100;
    return { deadKg: w, volumetricKg: vol, chargeableKg: Math.max(w, vol) };
  }, [form, divisor]);

  const post = async (key, path, body) => {
    setBusy(key);
    try {
      const res = await authenticatedFetch(`${API_BASE}/shipping/orders/${order.id}/${path}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = res ? await res.json().catch(() => ({})) : {};
      if (!res?.ok || !data.success) { toast.error(data.error || 'Request failed'); return null; }
      return data.data;
    } catch {
      toast.error('Network error');
      return null;
    } finally {
      setBusy(null);
    }
  };

  const verify = async () => {
    const data = await post('verify', 'packing', {
      weightKg: form.weightKg, length: form.length, breadth: form.breadth, height: form.height,
      packageId: form.packageId || 'custom', materialCost: form.materialCost,
    });
    if (!data) return;
    onOrderUpdated?.({ logistics: data.logistics });
    setShowForm(false);
    if (data.dispatch?.allowed) toast.success('Parcel verified — ready to book the courier');
    else toast.warning(data.dispatch?.block?.message || 'Parcel verified — needs attention before booking');
  };

  const adminAction = async (key, path, body) => {
    const data = await post(key, path, body);
    if (data) { onOrderUpdated?.({ logistics: data.logistics }); setReason(''); toast.success('Saved'); }
  };

  if (order?.deliveryPartner === 'local' && status === 'not_required') return null;

  const [label, chip] = VERIFY_LABEL[status] || VERIFY_LABEL.pending;
  const act = lg.actual;
  const diff = lg.difference || {};
  const adj = lg.adjustment?.status;
  const needsDecision = ['needs_approval', 'customer_contacted'].includes(adj);

  return (
    <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#1A1021] space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Scale className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
        <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Packing verification</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${chip}`}>{label}</span>
        {est?.confidence && (
          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">estimate confidence: {est.confidence}{est.reconstructed ? ' (rebuilt)' : ''}</span>
        )}
      </div>

      {/* Estimated vs actual */}
      {(est || act) && (
        <table className="w-full">
          <thead>
            <tr>
              {['', 'Estimated', 'Actual', 'Difference'].map((h) => (
                <th key={h} className="pb-1 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <Row label="Dead weight" est={kg(est?.deadKg)} act={kg(act?.deadKg ?? live?.deadKg)}
              diff={signed(diff.deadKg ?? (live && est ? Math.round((live.deadKg - est.deadKg) * 1000) / 1000 : null), kg)}
              bad={(diff.deadKg ?? 0) > 0.1} />
            <Row label="Size" est={dims(est)} act={act ? dims(act) : (live ? dims({ length: form.length, breadth: form.breadth, height: form.height }) : '—')} diff="" />
            <Row label="Volumetric" est={kg(est?.volumetricKg)} act={kg(act?.volumetricKg ?? live?.volumetricKg)}
              diff={signed(diff.volumetricKg, kg)} bad={(diff.volumetricKg ?? 0) > 0.1} />
            <Row label="Chargeable" est={kg(est?.chargeableKg)} act={kg(act?.chargeableKg ?? live?.chargeableKg)}
              diff={signed(diff.chargeableKg, kg)} bad={(diff.chargeableKg ?? 0) > 0} />
            <Row label="Courier freight" est={rs(checkoutFreight)} act={rs(act?.freightQuote)}
              diff={signed(diff.freightRs, rs)} bad={(diff.freightRs ?? 0) > 0} />
          </tbody>
        </table>
      )}
      {act && diff.marginRs != null && (
        <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
          Delivery fee {rs(lg.customerFee ?? order.deliveryFee)} − freight {rs(act.freightQuote)} − packaging {rs(act.materialCost)} ={' '}
          <b className={diff.marginRs < 0 ? 'text-red-600' : 'text-emerald-600'}>{diff.marginRs < 0 ? 'loss' : 'margin'} {rs(Math.abs(diff.marginRs))}</b>
          {act.freightCourierName ? ` · quoted with ${act.freightCourierName}` : ''}
        </p>
      )}
      {lg.freightNote === 'quote_failed' && (
        <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">Shiprocket could not quote the measured parcel — freight will be checked again at booking.</p>
      )}

      {adj && ADJUST_TEXT[adj] && (
        <p className={`text-[11px] font-bold ${ADJUST_TEXT[adj][1]}`}>
          {ADJUST_TEXT[adj][0]}{lg.adjustment?.reason ? ` (${lg.adjustment.reason})` : ''}
        </p>
      )}

      {lg.pushedMismatch && !locked && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-semibold">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>This order was already pushed to Shiprocket with the estimated size. Update weight and dimensions to the values above in the Shiprocket panel, then an admin confirms it here.</span>
        </div>
      )}

      {/* Measurement form */}
      {!locked && showForm && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <label className="col-span-2 sm:col-span-3 space-y-1">
              <span className="text-[10px] font-bold uppercase text-gray-500">Packaging used</span>
              <select value={form.packageId} onChange={(e) => pickPackage(e.target.value)} className={inputCls}>
                <option value="">Custom / other</option>
                {boxes.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.type || 'box'}) · {b.length}×{b.breadth}×{b.height} cm</option>
                ))}
              </select>
            </label>
            {[['weightKg', 'Weight (kg)', '0.01'], ['length', 'Length (cm)', '0.1'], ['breadth', 'Breadth (cm)', '0.1'], ['height', 'Height (cm)', '0.1'], ['materialCost', 'Material cost (₹)', '0.5']].map(([k, ph, step]) => (
              <label key={k} className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-gray-500">{ph}</span>
                <input type="number" inputMode="decimal" min="0" step={step} value={form[k]}
                  onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} className={inputCls} />
              </label>
            ))}
          </div>
          <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
            Weigh the sealed parcel and measure its OUTSIDE. Volumetric = L × B × H ÷ {divisor}.
          </p>
          <Button onClick={verify} disabled={!!busy || !live} className="h-9 px-3.5 rounded-xl bg-black !text-white font-bold text-xs">
            {busy === 'verify' ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
            Verify packing
          </Button>
        </div>
      )}
      {!locked && !showForm && (
        <button type="button" onClick={() => setShowForm(true)} className="text-[11px] font-bold text-[#E83D6E] underline">
          Re-measure parcel
        </button>
      )}

      {/* Admin decisions */}
      {isAdmin && !locked && (needsDecision || lg.pushedMismatch || status === 'pending') && (
        <div className="pt-2 border-t border-gray-200 dark:border-white/10 space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-gray-500">
            <ShieldCheck className="h-3.5 w-3.5" /> Admin
          </div>
          <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300}
            placeholder="Reason / note (required for overrides)" className={inputCls} />
          <div className="flex flex-wrap gap-2">
            {needsDecision && (
              <>
                <Button variant="outline" disabled={!!busy} onClick={() => adminAction('approve', 'adjustment', { decision: 'approve', note: reason })} className="h-8 px-3 rounded-lg text-[11px] font-bold">
                  Approve · business absorbs
                </Button>
                {adj !== 'customer_contacted' && (
                  <Button variant="outline" disabled={!!busy} onClick={() => adminAction('contact', 'adjustment', { decision: 'customer_contacted', note: reason })} className="h-8 px-3 rounded-lg text-[11px] font-bold">
                    Contacting customer
                  </Button>
                )}
                <Button variant="outline" disabled={!!busy} onClick={() => adminAction('refund', 'adjustment', { decision: 'refund_requested', note: reason })} className="h-8 px-3 rounded-lg text-[11px] font-bold text-red-600">
                  Customer cancels
                </Button>
              </>
            )}
            {lg.pushedMismatch && (
              <Button variant="outline" disabled={!!busy || reason.trim().length < 5} onClick={() => adminAction('panel', 'packing/override', { kind: 'panel_updated', reason })} className="h-8 px-3 rounded-lg text-[11px] font-bold">
                Shiprocket panel updated
              </Button>
            )}
            {status === 'pending' && (
              <Button variant="outline" disabled={!!busy || reason.trim().length < 5} onClick={() => adminAction('skip', 'packing/override', { kind: 'skip_verification', reason })} className="h-8 px-3 rounded-lg text-[11px] font-bold">
                Skip verification
              </Button>
            )}
          </div>
        </div>
      )}

      {(lg.verifications?.length > 1 || lg.overrides?.length > 0) && (
        <p className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
          <History className="h-3 w-3" />
          {lg.verifications?.length || 0} measurement(s) · {lg.overrides?.length || 0} admin action(s) recorded
        </p>
      )}
    </div>
  );
}
