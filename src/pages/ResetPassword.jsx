import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, useReducedMotion } from 'framer-motion';
import { Lock, Mail, ArrowRight, ArrowLeft, ShieldCheck, KeyRound, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { API_BASE } from '../lib/api';
import useOtpTimer from '../hooks/useOtpTimer';
import AuthScaffold, { AuthField } from '../components/AuthScaffold';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const still = useReducedMotion();
  const emailFromState = location.state?.email || '';

  const [email, setEmail] = useState(emailFromState);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const otpTimer = useOtpTimer({ autoStart: !!emailFromState });

  const handleResend = async () => {
    if (!email || otpTimer.cooldown > 0 || resending) return;
    setResending(true);
    toast.loading('Sending a new code…', { id: 'reset-pw' });
    try {
      const response = await fetch(`${API_BASE}/users/request-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        toast.success('A new code is on its way.', { id: 'reset-pw' });
        setOtp('');
        otpTimer.start();
      } else {
        toast.error(data.error || 'Failed to resend code', { id: 'reset-pw' });
      }
    } catch {
      toast.error('Network error. Please try again.', { id: 'reset-pw' });
    } finally {
      setResending(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setBusy(true);
    toast.loading('Resetting your password…', { id: 'reset-pw' });
    try {
      const response = await fetch(`${API_BASE}/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await response.json();

      if (response.ok) {
        toast.success('Password reset successfully!', { id: 'reset-pw' });
        setDone(true);
      } else {
        toast.error(data.error || 'Failed to reset password', { id: 'reset-pw' });
        setBusy(false);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Network error. Please try again.', { id: 'reset-pw' });
      setBusy(false);
    }
  };

  return (
    <AuthScaffold>
      <div className="glass foil-top rounded-panel p-7 sm:p-9 shadow-glass-lift">
        {!done ? (
          <>
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-ink-muted hover:text-berry transition-colors mb-7"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Request a new code
            </Link>

            <h1 className="display-lg text-[2.15rem] leading-tight">
              Set a new <span className="accent-text">password</span>
            </h1>
            <p className="text-ink-soft text-[13.5px] mt-2 font-medium">
              Enter the code from your email and choose a new secure password.
            </p>

            <form onSubmit={handleReset} className="flex flex-col gap-4 mt-7">
              {!emailFromState && (
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
              )}

              <div>
                <AuthField
                  label="Verification code"
                  icon={KeyRound}
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="tracking-[0.5em] font-bold text-center"
                />
                <div className="flex items-center justify-between text-[11px] font-bold mt-1.5 ml-1">
                  <span className={otpTimer.secondsLeft > 0 ? 'text-ink-muted' : 'text-danger'}>
                    {otpTimer.secondsLeft > 0
                      ? <>Expires in <span className="text-berry tabular-nums">{otpTimer.label}</span></>
                      : 'Code may have expired'}
                  </span>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={!email || otpTimer.cooldown > 0 || resending}
                    className="uppercase tracking-[0.12em] text-berry hover:opacity-70 transition-opacity disabled:text-ink-muted disabled:cursor-not-allowed"
                  >
                    {otpTimer.cooldown > 0 ? `Resend in ${otpTimer.cooldown}s` : resending ? 'Sending…' : 'Resend code'}
                  </button>
                </div>
              </div>

              <AuthField
                label="New password"
                icon={Lock}
                type={showPw ? 'text' : 'password'}
                required
                autoComplete="new-password"
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="tracking-wide"
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    className="text-ink-muted hover:text-berry transition-colors"
                  >
                    {showPw ? <EyeOff className="h-[17px] w-[17px]" /> : <Eye className="h-[17px] w-[17px]" />}
                  </button>
                }
              />

              <AuthField
                label="Confirm password"
                icon={Lock}
                type={showPw ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="tracking-wide"
              />

              <motion.button
                type="submit"
                disabled={busy}
                whileTap={still || busy ? undefined : { scale: 0.985 }}
                className="btn-berry w-full h-[52px] rounded-full text-[11px] font-extrabold uppercase tracking-[0.16em] flex items-center justify-center gap-2.5 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Resetting…
                  </>
                ) : (
                  <>
                    Reset password <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center text-center py-4">
            <span className="ico-chip ico-chip-gold h-16 w-16 rounded-2xl mb-5">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h1 className="display-lg text-[2rem] leading-tight">
              Password <span className="accent-text">updated</span>
            </h1>
            <p className="text-ink-soft text-[13.5px] mt-2.5 font-medium max-w-[300px]">
              Your password has been reset. You can now sign in with your new credentials.
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="btn-berry w-full h-[52px] rounded-full text-[11px] font-extrabold uppercase tracking-[0.16em] flex items-center justify-center gap-2.5 mt-7"
            >
              Back to sign in <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <p className="text-center text-[12px] text-ink-muted mt-7 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-leaf" /> Secure end&#8209;to&#8209;end session
        </p>
      </div>
    </AuthScaffold>
  );
}
