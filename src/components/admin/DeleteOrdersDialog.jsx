import { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Loader2, ShieldCheck, Trash2, X } from 'lucide-react';
import { authenticatedFetch, API_BASE } from '../../lib/api';
import OtpInput from '../ui/OtpInput';
import useOtpTimer from '../../hooks/useOtpTimer';

/*
 * Permanently delete one or more orders (any status) after confirming a
 * one-time code emailed to the signed-in admin. The API archives each order to
 * `deletedOrders` before removing it, and audit-logs the deletion.
 */

const CLOSED = ['cancelled', 'refunded', 'payment_failed', 'failed', 'payment_pending'];

export default function DeleteOrdersDialog({ orders, onClose, onDeleted }) {
  const [step, setStep] = useState('review'); // review | code
  const [sentTo, setSentTo] = useState('');
  const [otp, setOtp] = useState('');
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const timer = useOtpTimer();

  const count = orders.length;
  const active = orders.filter((o) => !CLOSED.includes(String(o.status || '').toLowerCase()));
  const shipped = orders.filter((o) => o.shipment?.awb || o.awbCode || ['shipped', 'out_for_delivery', 'in_transit'].includes(String(o.status || '').toLowerCase()));
  const total = orders.reduce((n, o) => n + (Number(o.totalAmount) || 0), 0);

  const sendCode = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await authenticatedFetch(`${API_BASE}/orders/admin/delete-otp`, { method: 'POST' });
      if (!res) return;
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not send the code');
      setSentTo(json.data?.sentTo || 'your email');
      setStep('code');
      setOtp('');
      timer.start();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (code = otp) => {
    if (code.length !== 6 || typed.trim().toUpperCase() !== 'DELETE' || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await authenticatedFetch(`${API_BASE}/orders/admin/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: orders.map((o) => o.id), otp: code }),
      });
      if (!res) return;
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Delete failed');
      const n = json.data.deleted.length;
      toast.success(`${n} ${n === 1 ? 'order' : 'orders'} deleted`);
      onDeleted(json.data.deleted);
    } catch (err) {
      setError(err.message);
      setOtp('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Delete orders">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={busy ? undefined : onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 sm:p-7 max-h-[92vh] overflow-y-auto">
        <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="absolute right-4 top-4 h-9 w-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700">
          <X className="h-4 w-4" />
        </button>

        <span className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
          {step === 'review' ? <Trash2 className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
        </span>
        <h2 className="mt-4 text-xl font-bold text-gray-900">
          {step === 'review' ? `Delete ${count} ${count === 1 ? 'order' : 'orders'}?` : 'Enter the verification code'}
        </h2>

        {step === 'review' ? (
          <>
            <p className="mt-1.5 text-sm text-gray-500">
              {count === 1 ? `Order ${orders[0].id}` : `${count} orders`} · ₹{total.toLocaleString('en-IN')} total. This removes {count === 1 ? 'it' : 'them'} from the dashboard permanently.
            </p>
            <ul className="mt-4 space-y-2 text-[13px]">
              {active.length > 0 && (
                <li className="flex gap-2.5 rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-900">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span><strong>{active.length} paid / active {active.length === 1 ? 'order' : 'orders'}.</strong> Stock isn’t returned and no refund is made — refund first in Razorpay if needed.</span>
                </li>
              )}
              {shipped.length > 0 && (
                <li className="flex gap-2.5 rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-900">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span><strong>{shipped.length} with a shipment.</strong> Cancel the courier pickup in Shiprocket separately.</span>
                </li>
              )}
              <li className="flex gap-2.5 rounded-xl bg-gray-50 border border-gray-100 p-3 text-gray-600">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                <span>A copy of every deleted order is archived for your accounting records, and the deletion is logged.</span>
              </li>
            </ul>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <div className="mt-6 flex gap-2">
              <button type="button" onClick={onClose} className="flex-1 h-12 rounded-2xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={sendCode} disabled={busy} className="flex-[1.4] h-12 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-60 inline-flex items-center justify-center gap-2">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Email me a code
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-1.5 text-sm text-gray-500">We sent a 6-digit code to <span className="font-bold text-gray-900">{sentTo}</span>. It expires in {timer.label}.</p>
            <div className="mt-5">
              <OtpInput tone="admin" value={otp} onChange={(v) => { setOtp(v); setError(''); }} onComplete={(code) => confirm(code)} disabled={busy} invalid={!!error} />
            </div>
            <label className="block mt-5">
              <span className="block text-[12px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">Type DELETE to confirm</span>
              <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" className="w-full h-11 rounded-xl border border-gray-200 px-3 font-bold tracking-widest uppercase outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10" />
            </label>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <div className="mt-6 flex gap-2">
              <button type="button" onClick={sendCode} disabled={busy || timer.cooldown > 0} className="flex-1 h-12 rounded-2xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 tabular-nums">
                {timer.cooldown > 0 ? `Resend in ${timer.cooldown}s` : 'Resend code'}
              </button>
              <button
                type="button"
                onClick={() => confirm()}
                disabled={busy || otp.length !== 6 || typed.trim().toUpperCase() !== 'DELETE'}
                className="flex-[1.4] h-12 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete permanently
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
