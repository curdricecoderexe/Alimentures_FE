import React, { useEffect, useState } from 'react';
import { Truck, RefreshCw, FileDown, ExternalLink, AlertTriangle, Loader2, Send, Box, Bike, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { API_BASE, authenticatedFetch } from '../lib/api';

const SHIPPABLE = ['pending', 'processing', 'packed', 'payment_successful_no_stock'];

const STATE_LABEL = {
  creating: 'Pushing to Shiprocket…',
  created: 'Created · awaiting courier',
  failed: 'Failed',
  awb_assigned: 'Courier assigned',
  pickup_scheduled: 'Pickup scheduled',
  in_transit: 'In transit',
  delivered: 'Delivered',
  rto_in_transit: 'Returning to you (RTO)',
  rto_delivered: 'Returned to you (RTO delivered)',
  lost: 'Lost / damaged in transit',
  cancelled: 'Cancelled in Shiprocket',
};

const ALERT_HELP = {
  rto_in_transit: 'The parcel is coming back. Once it arrives and is checked, refund the order — refunding restocks the items.',
  rto_delivered: 'The parcel is back at your pickup address. Inspect it, then refund the order to restock and repay the customer.',
  lost: 'Raise a lost/damaged claim in Shiprocket, then refund the customer.',
  cancelled: 'This shipment was cancelled in Shiprocket.',
};

let statusPromise = null;
const loadShiprocketStatus = () => {
  if (!statusPromise) {
    statusPromise = authenticatedFetch(`${API_BASE}/shipping/status`)
      .then((r) => (r ? r.json() : null))
      .then((d) => (d?.success ? d.data : { enabled: false }))
      .catch(() => { statusPromise = null; return { enabled: false }; });
  }
  return statusPromise;
};

let boxesPromise = null;
const loadBoxes = () => {
  if (!boxesPromise) {
    boxesPromise = authenticatedFetch(`${API_BASE}/shipping/packaging`)
      .then((r) => (r ? r.json() : null))
      .then((d) => (d?.success ? (d.data.boxes || []).filter((b) => b.isActive) : []))
      .catch(() => { boxesPromise = null; return []; });
  }
  return boxesPromise;
};

const EMPTY_CUSTOM = { length: '', breadth: '', height: '', weightKg: '' };

/** Override sent to the API for the current box choice ('' = automatic). */
function packageOverride(choice, custom) {
  if (choice === 'custom') {
    const o = { length: custom.length, breadth: custom.breadth, height: custom.height };
    if (custom.weightKg !== '') o.weightKg = custom.weightKg;
    return o;
  }
  return choice ? { boxId: choice } : null;
}

const fmtPkg = (p) => `${p.boxName}${p.boxId && p.boxName !== p.boxId ? ` (${p.boxId})` : ''} · ${p.length}×${p.breadth}×${p.height} cm · ${p.weightKg} kg`;

/**
 * Shiprocket fulfilment controls for one order (admin + staff order modals).
 * `onOrderUpdated(patch)` receives `{ shipment, status? }` after every change.
 */
export default function ShiprocketPanel({ order, onOrderUpdated }) {
  const [enabled, setEnabled] = useState(null);
  const [busy, setBusy] = useState(null);
  const [couriers, setCouriers] = useState(null);
  const [defaultCourierId, setDefaultCourierId] = useState(null);
  const [courierId, setCourierId] = useState('');
  const [boxes, setBoxes] = useState([]);
  const [boxChoice, setBoxChoice] = useState('');
  const [custom, setCustom] = useState(EMPTY_CUSTOM);
  const [pkg, setPkg] = useState(null);
  const [forceLocal, setForceLocal] = useState(false);
  const sh = order?.shipment || {};
  const isLocal = order?.deliveryPartner === 'local';
  const isFastest = order?.deliveryMethod === 'fastest';
  const canPush = enabled && !sh.shipmentId && SHIPPABLE.includes(order?.status) && (!isLocal || forceLocal);
  const freight = sh.freightEstimate ?? order?.estimatedShippingCost ?? null;
  const feeCharged = Number(order?.deliveryFee ?? order?.shipping ?? 0);
  const quoted = order?.quotedCourier || null;
  const planned = order?.plannedPackage || null;
  const autoCourier = couriers?.find((c) => String(c.courierId) === String(defaultCourierId)) || null;

  useEffect(() => {
    let alive = true;
    loadShiprocketStatus().then((s) => { if (alive) setEnabled(!!s?.enabled); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    setCouriers(null); setCourierId(''); setDefaultCourierId(null);
    setBoxChoice(''); setCustom(EMPTY_CUSTOM); setPkg(null); setForceLocal(false);
  }, [order?.id]);

  useEffect(() => {
    if (!canPush) return undefined;
    let alive = true;
    loadBoxes().then((b) => { if (alive) setBoxes(b); });
    return () => { alive = false; };
  }, [canPush]);

  // Live parcel preview for the chosen box (debounced for custom typing).
  useEffect(() => {
    if (!canPush) return undefined;
    const override = packageOverride(boxChoice, custom);
    if (boxChoice === 'custom' && !(custom.length > 0 && custom.breadth > 0 && custom.height > 0)) {
      setPkg(null);
      return undefined;
    }
    let alive = true;
    const t = setTimeout(async () => {
      const qs = override ? `?${new URLSearchParams(override)}` : '';
      try {
        const res = await authenticatedFetch(`${API_BASE}/shipping/orders/${order.id}/package${qs}`);
        const data = res ? await res.json().catch(() => ({})) : {};
        if (alive) setPkg(data.success ? data.data : { error: data.error || 'Could not size the parcel' });
      } catch {
        if (alive) setPkg({ error: 'Network error' });
      }
    }, boxChoice === 'custom' ? 400 : 0);
    return () => { alive = false; clearTimeout(t); };
  }, [canPush, order?.id, boxChoice, custom]);

  const call = async (key, path, { method = 'POST', body } = {}) => {
    setBusy(key);
    try {
      const res = await authenticatedFetch(`${API_BASE}/shipping/orders/${order.id}/${path}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res) return null;
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Shiprocket request failed');
        return null;
      }
      return data.data;
    } catch {
      toast.error('Network error');
      return null;
    } finally {
      setBusy(null);
    }
  };

  const createShipment = async () => {
    const override = packageOverride(boxChoice, custom);
    const body = override ? { package: override } : {};
    if (isLocal) body.force = true;
    const shipment = await call('create', 'create', { body });
    if (shipment) {
      onOrderUpdated?.({ shipment });
      toast.success('Order pushed to Shiprocket');
    }
  };

  const loadCouriers = async () => {
    const data = await call('couriers', 'couriers', { method: 'GET' });
    if (data) {
      setCouriers(data.couriers || []);
      // "Auto" = express for fastest orders, otherwise the cheapest courier (server decides).
      setDefaultCourierId(data.defaultId ?? null);
      setCourierId('');
      if (!data.serviceable) toast.error('No courier services this PIN code');
    }
  };

  const ship = async () => {
    const shipment = await call('ship', 'ship', { body: courierId ? { courierId: Number(courierId) } : {} });
    if (shipment) {
      onOrderUpdated?.({ shipment, status: SHIPPABLE.includes(order.status) ? 'packed' : order.status });
      toast.success(`AWB ${shipment.awb} assigned · pickup requested`);
    }
  };

  const sync = async () => {
    const data = await call('sync', 'sync');
    if (data) {
      onOrderUpdated?.({ shipment: data.shipment, status: data.status });
      toast.success('Tracking updated');
    }
  };

  if (enabled === null) return null;

  return (
    <div className="space-y-3 sm:space-y-4">
      <Label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider ml-1">Shiprocket</Label>
      <div className="p-4 sm:p-5 bg-white dark:bg-[#24162E] border border-gray-100 dark:border-white/10 rounded-2xl space-y-3">
        {!enabled ? (
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Shiprocket is not configured on the server. Fulfil this order manually using the progress steps above.
          </p>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-gray-50 dark:bg-[#1A1021] rounded-xl text-gray-500 dark:text-gray-400 shrink-0">
                <Truck className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">
                  {sh.provider ? (STATE_LABEL[sh.state] || sh.state || 'Created') : 'Not pushed to Shiprocket'}
                </p>
                {sh.shipmentId && (
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    Shipment {sh.shipmentId}{sh.srOrderId ? ` · SR order ${sh.srOrderId}` : ''}{sh.weightKg ? ` · ${sh.weightKg} kg` : ''}
                  </p>
                )}
                {sh.package && (
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    Parcel: {fmtPkg(sh.package)}{sh.package.source === 'manual' ? ' · set by staff' : ''}
                  </p>
                )}
                {sh.awb && (
                  <p className="text-[11px] font-bold text-[#E83D6E]">
                    {sh.courierName || 'Courier'} · AWB {sh.awb}
                  </p>
                )}
                {sh.courierStatus && (
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    Courier status: {sh.courierStatus}{sh.etd ? ` · ETA ${sh.etd}` : ''}
                  </p>
                )}
              </div>
            </div>

            {isLocal && !sh.shipmentId && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 text-[11px] font-semibold">
                <Bike className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <p>This PIN code is delivered by your <b>local delivery partner</b>. Hand the parcel to them and update the status with the progress steps above.</p>
                  {!forceLocal && SHIPPABLE.includes(order.status) && (
                    <button type="button" onClick={() => setForceLocal(true)} className="underline font-bold">
                      Ship via Shiprocket anyway
                    </button>
                  )}
                </div>
              </div>
            )}

            {quoted && !sh.awb && (
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                Quoted at checkout: <b>{quoted.name || `Courier ${quoted.courierId}`}</b> ₹{quoted.rate}
                {planned ? ` for ${planned.boxName || planned.boxId || 'parcel'} · ${planned.chargeableKg} kg` : ''}
                {' '}— assigned automatically unless you change the box or courier.
              </p>
            )}

            {(freight != null || sh.awb) && (
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                Delivery fee charged ₹{feeCharged}
                {freight != null && (
                  <> · courier cost {sh.freightEstimate != null ? '' : '≈ '}₹{freight}
                    {' · '}<span className={feeCharged - freight < 0 ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>
                      {feeCharged - freight < 0 ? 'loss' : 'margin'} ₹{Math.abs(Math.round(feeCharged - freight))}
                    </span>
                  </>
                )}
                {isFastest && <> · <b>Fastest</b>{sh.courierPick === 'express' ? ' (express courier)' : ''}</>}
              </p>
            )}

            {ALERT_HELP[sh.state] && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-[11px] font-semibold">
                <Undo2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{ALERT_HELP[sh.state]}</span>
              </div>
            )}

            {sh.ndr && !['delivered', ...Object.keys(ALERT_HELP)].includes(sh.state) && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-semibold">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  Delivery attempt failed{sh.ndr.count > 1 ? ` (${sh.ndr.count}×)` : ''}: {sh.ndr.status}. Call the customer, then choose re-attempt or update the
                  address in Shiprocket → NDR before the courier returns the parcel.
                </span>
              </div>
            )}

            {sh.needsAttention && !sh.shipmentId && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-[11px] font-semibold">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Automatic push failed {sh.retryCount || 3} times. Fix the problem below (often the address or phone), then push manually.</span>
              </div>
            )}

            {(sh.error || sh.exception) && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-semibold">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{sh.exception ? `Courier exception: ${sh.exception}` : sh.error}</span>
              </div>
            )}

            {canPush && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#1A1021] space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Box className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                  <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Parcel box</span>
                  <select
                    value={boxChoice}
                    onChange={(e) => setBoxChoice(e.target.value)}
                    className="h-8 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#24162E] px-2 text-[11px] font-bold"
                  >
                    <option value="">{planned?.boxId ? `Checkout box (${planned.boxName || planned.boxId})` : 'Automatic (best fit)'}</option>
                    {boxes.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} · {b.length}×{b.breadth}×{b.height} cm</option>
                    ))}
                    <option value="custom">Custom size…</option>
                  </select>
                </div>
                {boxChoice === 'custom' && (
                  <div className="flex flex-wrap gap-1.5">
                    {[['length', 'L cm'], ['breadth', 'B cm'], ['height', 'H cm'], ['weightKg', 'Weight kg (opt.)']].map(([k, ph]) => (
                      <input
                        key={k}
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder={ph}
                        value={custom[k]}
                        onChange={(e) => setCustom((c) => ({ ...c, [k]: e.target.value }))}
                        className={`h-8 ${k === 'weightKg' ? 'w-32' : 'w-20'} rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#24162E] px-2 text-[11px] font-bold`}
                      />
                    ))}
                  </div>
                )}
                {pkg?.error && <p className="text-[11px] font-semibold text-red-600">{pkg.error}</p>}
                {pkg && !pkg.error && (
                  <>
                    <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                      {fmtPkg(pkg)} · volumetric {pkg.volumetricKg} kg · <b>billed as {pkg.chargeableKg} kg</b>
                    </p>
                    {pkg.warnings?.map((w) => (
                      <p key={w} className={`text-[11px] font-semibold ${pkg.fits ? 'text-gray-500 dark:text-gray-400' : 'text-amber-700 dark:text-amber-300'}`}>• {w}</p>
                    ))}
                  </>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {canPush && (
                <Button onClick={createShipment} disabled={!!busy} className="h-9 px-3.5 rounded-xl bg-black !text-white font-bold text-xs">
                  {busy === 'create' ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                  Push to Shiprocket
                </Button>
              )}

              {sh.shipmentId && !sh.awb && sh.state !== 'cancelled' && (
                <>
                  {couriers === null ? (
                    <Button variant="outline" onClick={loadCouriers} disabled={!!busy} className="h-9 px-3.5 rounded-xl font-bold text-xs">
                      {busy === 'couriers' && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                      Choose courier
                    </Button>
                  ) : (
                    <select
                      value={courierId}
                      onChange={(e) => setCourierId(e.target.value)}
                      className="h-9 max-w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1A1021] px-2.5 text-xs font-bold"
                    >
                      <option value="">
                        {isFastest ? 'Auto · fastest express' : 'Auto · cheapest'}{autoCourier ? ` (${autoCourier.name} ₹${autoCourier.rate})` : ''}
                      </option>
                      {couriers.map((c) => (
                        <option key={c.courierId} value={c.courierId}>
                          {c.name} · ₹{c.rate}{c.estimatedDays ? ` · ${c.estimatedDays}d` : ''}{c.isSurface ? '' : ' · express'}
                          {c.rate > feeCharged ? ` · ₹${Math.round(c.rate - feeCharged)} over fee` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  <Button onClick={ship} disabled={!!busy} className="h-9 px-3.5 rounded-xl bg-black !text-white font-bold text-xs">
                    {busy === 'ship' ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Truck className="h-3.5 w-3.5 mr-1.5" />}
                    Assign courier &amp; schedule pickup
                  </Button>
                </>
              )}

              {sh.awb && !sh.pickupRequestedAt && (
                <Button onClick={ship} disabled={!!busy} variant="outline" className="h-9 px-3.5 rounded-xl font-bold text-xs">
                  {busy === 'ship' && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  Retry pickup request
                </Button>
              )}

              {sh.labelUrl && (
                <Button asChild variant="outline" className="h-9 px-3.5 rounded-xl font-bold text-xs">
                  <a href={sh.labelUrl} target="_blank" rel="noopener noreferrer">
                    <FileDown className="h-3.5 w-3.5 mr-1.5" /> Shipping label
                  </a>
                </Button>
              )}

              {sh.awb && (
                <>
                  <Button variant="outline" onClick={sync} disabled={!!busy} className="h-9 px-3.5 rounded-xl font-bold text-xs">
                    <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${busy === 'sync' ? 'animate-spin' : ''}`} /> Sync tracking
                  </Button>
                  <Button asChild variant="ghost" className="h-9 px-3.5 rounded-xl font-bold text-xs">
                    <a href={sh.trackUrl || `https://shiprocket.co/tracking/${sh.awb}`} target="_blank" rel="noopener noreferrer">
                      Track <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                    </a>
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
