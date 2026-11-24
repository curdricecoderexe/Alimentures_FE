import { useState } from 'react';
import { toast } from 'sonner';
import { TicketPercent, X, Loader2, Gift, Check } from 'lucide-react';
import { useWelcomeCoupon, validateCoupon } from '../../lib/welcomeCoupon';

/**
 * Apply-a-coupon box with the customer's welcome offer suggested on top.
 * `applied` / `onChange(applied|null)` hold the applied coupon (the caller
 * persists it, e.g. to sessionStorage, so cart and checkout stay in sync).
 */
export default function CouponBox({ orderValue, applied, onChange }) {
  const welcome = useWelcomeCoupon();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const apply = async (value) => {
    if (!value.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      const next = await validateCoupon(value, orderValue);
      onChange(next);
      setCode('');
      toast.success(`Coupon applied — ₹${next.discountAmount} off`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = () => { onChange(null); setError(''); };
  const suggest = welcome && applied?.code !== welcome.code;

  return (
    <div className="space-y-3">
      {suggest && (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-berry/35 bg-berry-tint/50 p-3.5">
          <span className="h-10 w-10 shrink-0 rounded-xl bg-paper border border-berry/20 text-berry flex items-center justify-center">
            <Gift className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-display uppercase tracking-[0.14em] text-berry">Suggested for you</p>
            <p className="text-[13.5px] text-ink leading-snug">
              <span className="font-display font-semibold tracking-wide">{welcome.code}</span>
              <span className="text-ink-soft"> · {welcome.discountValue}% off your first order</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => apply(welcome.code)}
            disabled={busy}
            className="h-9 px-4 shrink-0 rounded-full bg-mulberry text-paper text-[13px] font-display font-medium hover:bg-mulberry-deep transition-colors disabled:opacity-60"
          >
            {applied ? 'Switch' : 'Apply'}
          </button>
        </div>
      )}

      {applied ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-leaf/30 bg-leaf/5 px-4 py-3">
          <span className="flex items-center gap-2.5 min-w-0">
            <span className="h-7 w-7 shrink-0 rounded-full bg-leaf text-paper flex items-center justify-center"><Check className="h-3.5 w-3.5" strokeWidth={2.2} /></span>
            <span className="min-w-0">
              <span className="block text-[13.5px] font-display font-semibold text-ink tracking-wide truncate">{applied.code}</span>
              <span className="block text-[12px] text-ink-soft">You save ₹{applied.discountAmount}</span>
            </span>
          </span>
          <button type="button" onClick={remove} aria-label="Remove coupon" className="h-8 w-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-ink/5 hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); apply(code); }}>
          <div className={`flex items-center gap-2 rounded-2xl border bg-paper pl-3.5 pr-1.5 h-12 transition-colors ${error ? 'border-danger/50' : 'border-ink/15 focus-within:border-berry/60'}`}>
            <TicketPercent className={`h-4 w-4 shrink-0 ${error ? 'text-danger/70' : 'text-ink-muted'}`} />
            <input
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); if (error) setError(''); }}
              placeholder="Enter coupon code"
              aria-label="Coupon code"
              className="flex-1 min-w-0 bg-transparent text-[14px] tracking-wide text-ink placeholder:text-ink-muted outline-none"
            />
            <button type="submit" disabled={busy || !code.trim()} className="h-9 px-4 rounded-xl bg-ink text-paper text-[13px] font-display font-medium disabled:opacity-40">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
            </button>
          </div>
          {error && <p className="mt-1.5 text-[12px] text-danger">{error}</p>}
        </form>
      )}
    </div>
  );
}
