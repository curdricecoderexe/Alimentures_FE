import React, { useState } from 'react';
import { toast } from 'sonner';
import { RefreshCw, CreditCard, HandCoins, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { authenticatedFetch } from '../../lib/api';

const API = import.meta.env.VITE_API_URL;

const MANUAL_METHODS = [
  { id: 'upi', label: 'UPI (direct)' },
  { id: 'bank_transfer', label: 'Bank transfer (NEFT/IMPS)' },
  { id: 'razorpay_link', label: 'Razorpay payment link / QR' },
  { id: 'cash', label: 'Cash' },
  { id: 'other', label: 'Other' },
];


async function post(path, body) {
  const res = await authenticatedFetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  if (!res) return null;
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

const inputCls = 'w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1A1021] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-200';
const btnCls = 'h-10 px-4 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50';

/**
 * Admin tools for an order whose payment isn't confirmed:
 *  1. Check Razorpay — asks Razorpay if this order was paid.
 *  2. Confirm with a Razorpay payment ID (pay_…) — verified with Razorpay.
 *  3. Record a payment received outside Razorpay (manual).
 */
export default function PaymentResolvePanel({ order, onResolved }) {
  const [busy, setBusy] = useState(null);
  const [paymentId, setPaymentId] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({ method: 'upi', reference: '', amount: String(order?.totalAmount ?? ''), note: '' });

  const cancelled = String(order?.status || '').toLowerCase() === 'cancelled';
  const revivable = !cancelled || ['payment_window_expired', 'reservation_released'].includes(order?.cancelReason);

  const done = (data, fallback) => {
    toast.success(data?.message || fallback, { duration: 7000 });
    onResolved?.(data?.data || null);
  };

  const checkRazorpay = async () => {
    setBusy('check');
    try {
      const r = await post(`/orders/${order.id}/sync-payment`);
      if (!r) return;
      if (!r.ok) { toast.error(r.data?.error || 'Could not check with Razorpay'); return; }
      if (r.data?.paid) done(r.data, 'Payment confirmed');
      else toast.info(r.data?.message || 'No successful payment found in Razorpay yet.', { description: 'If the customer paid, paste the Razorpay payment ID below.' });
    } catch { toast.error('Network error'); } finally { setBusy(null); }
  };

  const confirmWithId = async (e) => {
    e.preventDefault();
    const id = paymentId.trim();
    if (!/^pay_[A-Za-z0-9]{6,30}$/.test(id)) { toast.error('Enter a Razorpay payment ID like pay_XXXXXXXXXXXXXX'); return; }
    setBusy('id');
    try {
      const r = await post(`/orders/${order.id}/sync-payment`, { paymentId: id });
      if (!r) return;
      if (!r.ok) { toast.error(r.data?.error || 'Could not confirm the payment'); return; }
      done(r.data, 'Payment confirmed');
    } catch { toast.error('Network error'); } finally { setBusy(null); }
  };

  const recordManual = async (e) => {
    e.preventDefault();
    const amount = Number(manual.amount);
    if (!Number.isFinite(amount) || amount <= 0) { toast.error('Enter the amount received'); return; }
    if (manual.method !== 'cash' && manual.reference.trim().length < 4) { toast.error('Enter the transaction reference (UTR / UPI ref)'); return; }
    setBusy('manual');
    try {
      const r = await post(`/orders/${order.id}/mark-paid`, { ...manual, amount });
      if (!r) return;
      if (!r.ok) { toast.error(r.data?.error || 'Could not record the payment'); return; }
      done(r.data, 'Payment recorded');
    } catch { toast.error('Network error'); } finally { setBusy(null); }
  };

  if (!revivable) {
    return (
      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#24162E] border border-gray-100 dark:border-white/10 text-xs font-medium text-gray-600 dark:text-gray-300">
        This order was cancelled ({String(order.cancelReason || 'cancelled').replace(/_/g, ' ')}) and can't be marked as paid.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 sm:p-5 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {cancelled ? 'Payment window expired — order auto-cancelled' : 'Payment not confirmed yet'}
          </p>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-0.5">
            If the customer was charged, confirm it here. The order then moves to <b>Placed</b> and stock is reserved again.
          </p>
          {order.razorpayOrderId && (
            <p className="text-[10px] font-bold text-gray-500 mt-1 break-all">Razorpay order: {order.razorpayOrderId}</p>
          )}
        </div>
      </div>

      <button type="button" onClick={checkRazorpay} disabled={!!busy || !order.razorpayOrderId}
        className={`${btnCls} w-full bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black`}>
        <RefreshCw className={`h-4 w-4 ${busy === 'check' ? 'animate-spin' : ''}`} /> Check payment status with Razorpay
      </button>

      <form onSubmit={confirmWithId} className="space-y-2">
        <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5" /> Razorpay payment ID
        </label>
        <div className="flex gap-2">
          <input value={paymentId} onChange={(e) => setPaymentId(e.target.value)} placeholder="pay_XXXXXXXXXXXXXX" className={inputCls} autoComplete="off" spellCheck={false} />
          <button type="submit" disabled={!!busy} className={`${btnCls} bg-emerald-600 text-white hover:bg-emerald-700 shrink-0`}>
            {busy === 'id' ? 'Verifying…' : 'Verify & confirm'}
          </button>
        </div>
        <p className="text-[10px] font-medium text-gray-500">Find it in Razorpay Dashboard → Transactions → Payments. It's verified with Razorpay before the order is confirmed.</p>
      </form>

      <div className="pt-3 border-t border-amber-200/70 dark:border-amber-900/60">
        {!showManual ? (
          <button type="button" onClick={() => setShowManual(true)} className="text-xs font-bold text-gray-700 dark:text-gray-300 inline-flex items-center gap-2 hover:underline">
            <HandCoins className="h-4 w-4" /> Paid outside Razorpay? Record a manual payment
          </button>
        ) : (
          <form onSubmit={recordManual} className="space-y-3">
            <p className="text-[10px] font-bold uppercase text-gray-500 tracking-wider flex items-center gap-1.5"><HandCoins className="h-3.5 w-3.5" /> Manual payment</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select value={manual.method} onChange={(e) => setManual((m) => ({ ...m, method: e.target.value }))} className={inputCls}>
                {MANUAL_METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
              <input type="number" min="0" step="0.01" value={manual.amount} onChange={(e) => setManual((m) => ({ ...m, amount: e.target.value }))} placeholder="Amount received (₹)" className={inputCls} />
            </div>
            <input value={manual.reference} onChange={(e) => setManual((m) => ({ ...m, reference: e.target.value }))}
              placeholder={manual.method === 'cash' ? 'Reference (optional)' : 'UTR / UPI reference / payment ID'} className={inputCls} autoComplete="off" />
            <textarea value={manual.note} onChange={(e) => setManual((m) => ({ ...m, note: e.target.value }))} rows={2}
              placeholder={manual.method === 'cash' ? 'Who collected it and when (required)' : 'Note (optional)'} className={`${inputCls} h-auto py-2`} />
            <p className="text-[10px] font-medium text-gray-500">Razorpay is checked first — if it already has a payment for this order, that is used instead. Each reference can only be used once. This action is audit-logged.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowManual(false)} className={`${btnCls} text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5`}>Cancel</button>
              <button type="submit" disabled={!!busy} className={`${btnCls} flex-1 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black`}>
                {busy === 'manual' ? 'Saving…' : `Mark as paid · ₹${manual.amount || 0}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const MANUAL_LABELS = Object.fromEntries(MANUAL_METHODS.map((m) => [m.id, m.label]));

/** Read-only payment record for a paid order (Razorpay ID or manual entry). */
export function PaymentRecord({ order }) {
  if (!order?.razorpayPaymentId && !order?.manualPayment) return null;
  const m = order.manualPayment;
  return (
    <div className="p-3 sm:p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 flex items-start gap-3">
      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
      <div className="min-w-0 text-xs font-medium text-gray-700 dark:text-gray-300 space-y-0.5">
        {order.razorpayPaymentId && <p className="break-all"><b>Razorpay payment:</b> {order.razorpayPaymentId}</p>}
        {m && (
          <>
            <p><b>Manual payment:</b> {MANUAL_LABELS[m.method] || m.method} · ₹{m.amount}{m.reference ? ` · ${m.reference}` : ''}</p>
            {m.note && <p className="text-gray-500">{m.note}</p>}
            <p className="text-gray-500">Recorded by {m.recordedBy?.email || 'admin'}{m.recordedAt ? ` on ${new Date(m.recordedAt).toLocaleString()}` : ''}</p>
          </>
        )}
        {order.paymentConfirmedBy && !m && order.paymentConfirmedBy !== 'verify' && (
          <p className="text-gray-500">Confirmed via {String(order.paymentConfirmedBy).replace(/_/g, ' ').replace('webhook:', 'webhook ')}</p>
        )}
      </div>
    </div>
  );
}
