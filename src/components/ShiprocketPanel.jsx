import React, { useEffect, useState } from 'react';
import { Truck, RefreshCw, FileDown, ExternalLink, AlertTriangle, Loader2, Send } from 'lucide-react';
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

/**
 * Shiprocket fulfilment controls for one order (admin + staff order modals).
 * `onOrderUpdated(patch)` receives `{ shipment, status? }` after every change.
 */
export default function ShiprocketPanel({ order, onOrderUpdated }) {
  const [enabled, setEnabled] = useState(null);
  const [busy, setBusy] = useState(null);
  const [couriers, setCouriers] = useState(null);
  const [courierId, setCourierId] = useState('');
  const sh = order?.shipment || {};

  useEffect(() => {
    let alive = true;
    loadShiprocketStatus().then((s) => { if (alive) setEnabled(!!s?.enabled); });
    return () => { alive = false; };
  }, []);

  useEffect(() => { setCouriers(null); setCourierId(''); }, [order?.id]);

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
    const shipment = await call('create', 'create');
    if (shipment) {
      onOrderUpdated?.({ shipment });
      toast.success('Order pushed to Shiprocket');
    }
  };

  const loadCouriers = async () => {
    const data = await call('couriers', 'couriers', { method: 'GET' });
    if (data) {
      setCouriers(data.couriers || []);
      setCourierId(data.recommendedId ? String(data.recommendedId) : '');
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

            {(sh.error || sh.exception) && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-semibold">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{sh.exception ? `Courier exception: ${sh.exception}` : sh.error}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {!sh.shipmentId && SHIPPABLE.includes(order.status) && (
                <Button onClick={createShipment} disabled={!!busy} className="h-9 px-3.5 rounded-xl bg-black !text-white font-bold text-xs">
                  {busy === 'create' ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                  Push to Shiprocket
                </Button>
              )}

              {sh.shipmentId && !sh.awb && (
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
                      <option value="">Shiprocket recommended</option>
                      {couriers.map((c) => (
                        <option key={c.courierId} value={c.courierId}>
                          {c.name} · ₹{c.rate}{c.estimatedDays ? ` · ${c.estimatedDays}d` : ''}
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
