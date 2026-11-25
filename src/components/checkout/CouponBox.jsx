import { useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { TicketPercent, X, Loader2, Gift, Check } from 'lucide-react';
import { CouponTicket, Confetti, CountUp } from '../coupon/WelcomeOffer';
import { useWelcomeCoupon, validateCoupon, couponDiscount } from '../../lib/welcomeCoupon';

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
  const [celebrate, setCelebrate] = useState(0); // bumps on each successful apply → replays the burst

  const apply = async (value) => {
    if (!value.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      const next = await validateCoupon(value, orderValue);
      onChange(next);
      setCelebrate((n) => n + 1);
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
      <AnimatePresence initial={true}>
        {suggest && (
          <motion.div
            key="suggest"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, height: 0, marginBottom: -12 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            <CouponTicket className="pl-5 pr-3.5 py-3.5">
              <div className="flex items-center gap-3">
                <motion.span
                  className="h-11 w-11 shrink-0 rounded-xl bg-mulberry text-paper flex items-center justify-center shadow-[0_8px_18px_-8px_rgba(124,39,110,0.7)]"
                  animate={{ rotate: [0, -8, 8, -4, 0] }}
                  transition={{ duration: 0.9, delay: 0.5, repeat: Infinity, repeatDelay: 4 }}
                >
                  <Gift className="h-5 w-5" strokeWidth={1.6} />
                </motion.span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-display uppercase tracking-[0.14em] text-gold">Welcome gift · for you</p>
                  <p className="text-[14px] text-ink leading-snug">
                    <span className="font-display font-semibold text-mulberry-deep"><CountUp to={Number(welcome.discountValue) || 10} delay={0.4} />% off</span>
                    <span className="text-ink-soft"> your first order</span>
                  </p>
                  <p className="font-display text-[12.5px] tracking-[0.08em] text-ink-muted truncate">{welcome.code}</p>
                </div>
                <button
                  type="button"
                  onClick={() => apply(welcome.code)}
                  disabled={busy}
                  className="h-10 px-4 shrink-0 rounded-full bg-mulberry text-paper text-[13px] font-display font-medium hover:bg-mulberry-deep transition-colors disabled:opacity-60 inline-flex items-center gap-1.5"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : applied ? 'Switch' : 'Apply'}
                </button>
              </div>
            </CouponTicket>
          </motion.div>
        )}
      </AnimatePresence>

      {applied ? (
        <motion.div
          key={applied.code}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 340, damping: 24 }}
          className="relative flex items-center justify-between gap-3 rounded-2xl border border-leaf/30 bg-leaf/5 px-4 py-3"
        >
          {celebrate > 0 && <Confetti key={celebrate} count={26} spread={140} className="z-10" />}
          <span className="flex items-center gap-2.5 min-w-0">
            <motion.span
              className="h-8 w-8 shrink-0 rounded-full bg-leaf text-paper flex items-center justify-center"
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.1 }}
            >
              <Check className="h-4 w-4" strokeWidth={2.2} />
            </motion.span>
            <span className="min-w-0">
              <span className="block text-[13.5px] font-display font-semibold text-ink tracking-wide truncate">{applied.code} applied</span>
              <span className="block text-[12.5px] text-leaf">You save ₹<CountUp to={couponDiscount(applied, orderValue)} delay={0.15} duration={0.8} /></span>
            </span>
          </span>
          <button type="button" onClick={remove} aria-label="Remove coupon" className="h-8 w-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-ink/5 hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
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
