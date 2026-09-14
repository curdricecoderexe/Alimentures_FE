import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, useReducedMotion } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, ShieldCheck, KeyRound, Loader2, MailCheck } from 'lucide-react';
import { API_BASE } from '../lib/api';
import useOtpTimer from '../hooks/useOtpTimer';
import AuthScaffold, { AuthField } from '../components/AuthScaffold';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const still = useReducedMotion();

  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const otpTimer = useOtpTimer();

  const requestReset = async () => {
    const response = await fetch(`${API_BASE}/users/request-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, data };
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    toast.loading('Processing request…', { id: 'reset-toast' });
    try {
      const { ok, data } = await requestReset();
      if (ok) {
        toast.success('If that account exists, a code is on its way.', { id: 'reset-toast' });
        setIsSubmitted(true);
        otpTimer.start();
      } else {
        toast.error(data.error || 'Failed to process request', { id: 'reset-toast' });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Network error. Please try again.', { id: 'reset-toast' });
    } finally {
      setSending(false);
    }
  };

  const handleResend = async () => {
    if (otpTimer.cooldown > 0 || sending) return;
    setSending(true);
    toast.loading('Resending code…', { id: 'reset-toast' });
    try {
      const { ok, data } = await requestReset();
      if (ok) {
        toast.success('A new code is on its way.', { id: 'reset-toast' });
        otpTimer.start();
      } else {
        toast.error(data.error || 'Failed to resend', { id: 'reset-toast' });
      }
    } catch {
      toast.error('Network error. Please try again.', { id: 'reset-toast' });
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthScaffold>
      <div className="glass foil-top rounded-panel p-7 sm:p-9 shadow-glass-lift">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-ink-muted hover:text-berry transition-colors mb-7"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </Link>

        {!isSubmitted ? (
          <>
            <h1 className="display-lg text-[2.15rem] leading-tight">
              Reset your <span className="accent-text">password</span>
            </h1>
            <p className="text-ink-soft text-[13.5px] mt-2 font-medium">
              Enter your registered email and we&rsquo;ll send a 6&#8209;digit code to reset it securely.
            </p>

            <form onSubmit={handleResetPassword} className="flex flex-col gap-4 mt-7">
              <AuthField
                label="Email address"
                icon={Mail}
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alimentureindustries@gmail.com"
              />

              <motion.button
                type="submit"
                disabled={sending}
                whileTap={still || sending ? undefined : { scale: 0.985 }}
                className="btn-berry w-full h-[52px] rounded-full text-[11px] font-extrabold uppercase tracking-[0.16em] flex items-center justify-center gap-2.5 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending code…
                  </>
                ) : (
                  <>
                    Send reset code <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </form>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-5">
              <span className="ico-chip ico-chip-gold h-14 w-14 rounded-2xl">
                <MailCheck className="h-6 w-6" />
              </span>
            </div>
            <h1 className="display-lg text-[2rem] leading-tight text-center">
              Check your <span className="accent-text">email</span>
            </h1>
            <p className="text-ink-soft text-[13px] mt-2.5 font-medium text-center">
              If an account exists for <span className="text-ink font-semibold">{email}</span>, a 6&#8209;digit reset
              code is on its way. Check your inbox and spam folder.
            </p>
            <p className="text-[11.5px] text-ink-muted font-medium text-center mt-3">
              {otpTimer.expired ? (
                <span className="text-danger">The code has likely expired — resend below.</span>
              ) : (
                <>Code expires in <span className="text-berry tabular-nums">{otpTimer.label}</span></>
              )}
            </p>

            <div className="flex flex-col gap-3 mt-7">
              <button
                type="button"
                onClick={() => navigate('/reset-password', { state: { email } })}
                className="btn-berry w-full h-[52px] rounded-full text-[11px] font-extrabold uppercase tracking-[0.16em] flex items-center justify-center gap-2.5"
              >
                <KeyRound className="h-4 w-4" /> Enter reset code
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={otpTimer.cooldown > 0 || sending}
                className="text-[11px] font-bold uppercase tracking-[0.12em] text-berry hover:opacity-70 transition-opacity disabled:text-ink-muted disabled:cursor-not-allowed self-center"
              >
                {otpTimer.cooldown > 0 ? `Resend code in ${otpTimer.cooldown}s` : sending ? 'Sending…' : 'Resend code'}
              </button>
            </div>
          </>
        )}

        <p className="text-center text-[12px] text-ink-muted mt-7 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-leaf" /> Secure end&#8209;to&#8209;end session
        </p>
      </div>
    </AuthScaffold>
  );
}
