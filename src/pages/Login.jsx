import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'sonner';
import OtpInput from '../components/ui/OtpInput';
import useOtpTimer from '../hooks/useOtpTimer';
import { fetchWelcomeCoupon } from '../lib/welcomeCoupon';
import { motion, useReducedMotion } from 'framer-motion';
import { Lock, Mail, ArrowRight, ArrowLeft, ShieldCheck, Eye, EyeOff, Loader2, Check, KeyRound, MailCheck } from 'lucide-react';
import { API_BASE } from '../lib/api';
import AuthScaffold, { AuthField, AuthTabs } from '../components/AuthScaffold';
import SEO from '../components/SEO';
import { SESSION_MARKER } from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const still = useReducedMotion();

  const [email, setEmail] = useState(() => location.state?.email || localStorage.getItem('rememberEmail') || '');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(() => !!localStorage.getItem('rememberEmail'));
  const [loading, setLoading] = useState(false);

  // Two-step login: password first, then an OTP mailed to the account.
  const [step, setStep] = useState('password'); // 'password' | 'otp'
  const [otpEmail, setOtpEmail] = useState('');
  const [otp, setOtp] = useState('');

  const finishLogin = (data) => {
    toast.success('Welcome back!', { id: 'login-toast', icon: <ShieldCheck className="text-mulberry" /> });
    if (remember) localStorage.setItem('rememberEmail', email);
    else localStorage.removeItem('rememberEmail');
    // The session itself is an httpOnly cookie set by the server; scripts never
    // see the tokens. 'token' is only a non-secret "signed in" marker the UI reads.
    localStorage.setItem('token', SESSION_MARKER);
    localStorage.setItem('uid', data.uid);
    localStorage.setItem('role', data.role);
    localStorage.setItem('userEmail', data.email);
    localStorage.setItem('userName', data.name);

    const role = data.role || 'customer';
    // First sign-in welcome offer (10% off the first order) — announced once per account.
    if (role === 'customer') {
      const seenKey = `welcomeOfferShown_${data.uid}`;
      if (!localStorage.getItem(seenKey)) {
        fetchWelcomeCoupon().then((c) => {
          if (!c) return;
          localStorage.setItem(seenKey, '1');
          toast.success(`Welcome to Alimenture! Here’s ${c.discountValue}% off your first order`, {
            description: `Use code ${c.code} at checkout — we’ll suggest it for you.`,
            duration: 12000,
          });
        });
      }
    }
    const from = location.state?.from || (role === 'admin' ? '/admin' : role === 'staff' ? '/staff' : '/');
    setTimeout(() => navigate(from, { replace: true }), 900);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    toast.loading('Signing you in…', { id: 'login-toast' });

    try {
      const response = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (response.ok && data.otpRequired) {
        setOtpEmail(data.email || email);
        setStep('otp');
        otpTimer.start();
        toast.success('Enter the code we emailed you', { id: 'login-toast', icon: <KeyRound className="text-mulberry" /> });
        setLoading(false);
      } else if (response.ok) {
        // Back-compat: a token returned directly, without an OTP step.
        finishLogin(data);
      } else {
        toast.error(data.error || 'Login failed', { id: 'login-toast' });
        setLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Network error. Please try again.', { id: 'login-toast' });
      setLoading(false);
    }
  };

  const otpTimer = useOtpTimer();
  const [otpError, setOtpError] = useState(false);
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    if (otpTimer.cooldown > 0 || resending) return;
    setResending(true);
    try {
      const response = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok && data.otpRequired) {
        otpTimer.start();
        setOtp('');
        setOtpError(false);
        toast.success('A new code is on its way', { id: 'login-toast' });
      } else {
        toast.error(data.error || 'Could not resend the code', { id: 'login-toast' });
      }
    } catch {
      toast.error('Network error. Please try again.', { id: 'login-toast' });
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOtp = async (e, codeOverride) => {
    e?.preventDefault?.();
    const code = codeOverride || otp;
    if (loading || code.length !== 6) return;
    setLoading(true);
    toast.loading('Verifying code…', { id: 'login-toast' });

    try {
      const response = await fetch(`${API_BASE}/users/login/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, otp: code }),
      });
      const data = await response.json();

      if (response.ok) {
        finishLogin(data);
      } else {
        toast.error(data.error || 'Invalid code', { id: 'login-toast' });
        setOtpError(true);
        setLoading(false);
      }
    } catch (error) {
      console.error('OTP verify error:', error);
      toast.error('Network error. Please try again.', { id: 'login-toast' });
      setLoading(false);
    }
  };

  const handleBackToPassword = () => {
    setStep('password');
    setOtp('');
    setOtpError(false);
  };

  return (
    <AuthScaffold>
      <SEO title="Sign in" noindex />
      <div className="rounded-[24px] bg-white p-6 sm:p-8 ring-1 ring-[#E8E1D4] shadow-[0_24px_60px_-36px_rgba(64,28,62,0.35)]">
        <AuthTabs active="signin" />

        {step === 'password' ? (
          <>
            <h1 className="text-[26px] sm:text-[28px] font-semibold leading-tight tracking-[-0.01em] text-ink">
              Welcome back
            </h1>
            <p className="text-ink-soft text-[13.5px] mt-2 font-medium">Sign in to continue to your Alimenture account.</p>
          </>
        ) : (
          <div className="text-center">
            <span className="mx-auto h-14 w-14 rounded-2xl bg-mulberry/10 text-mulberry flex items-center justify-center">
              <MailCheck className="h-6 w-6" strokeWidth={1.6} />
            </span>
            <h1 className="mt-4 text-[24px] sm:text-[26px] font-semibold leading-tight tracking-[-0.01em] text-ink">Check your email</h1>
            <p className="text-ink-soft text-[13.5px] mt-2 font-medium">
              Enter the 6-digit code we sent to<br /><span className="font-bold text-ink break-all">{otpEmail}</span>
            </p>
          </div>
        )}

        {step === 'password' ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-4 mt-7">
            <AuthField
              label="Email address"
              icon={Mail}
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />

            <AuthField
              label="Password"
              icon={Lock}
              type={showPw ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              className="tracking-wide"
              labelAction={
                <Link
                  to="/forgot-password"
                  className="text-[13px] font-semibold text-mulberry hover:opacity-70 transition-opacity"
                >
                  Forgot?
                </Link>
              }
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="h-9 w-9 -mr-2 rounded-full flex items-center justify-center text-ink-muted hover:text-mulberry hover:bg-mulberry/5 transition-colors"
                >
                  {showPw ? <EyeOff className="h-[17px] w-[17px]" /> : <Eye className="h-[17px] w-[17px]" />}
                </button>
              }
            />

            <button
              type="button"
              onClick={() => setRemember((v) => !v)}
              className="flex items-center gap-2.5 self-start mt-0.5 group/r"
            >
              <span
                className={`h-[18px] w-[18px] rounded-[6px] border flex items-center justify-center transition-all ${
                  remember ? 'bg-mulberry border-mulberry' : 'bg-white border-[#D8D0C2] group-hover/r:border-mulberry/50'
                }`}
              >
                {remember && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
              </span>
              <span className="text-[12.5px] font-medium text-ink-soft">Remember my email</span>
            </button>

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={still || loading ? undefined : { scale: 0.985 }}
              className="btn-berry w-full h-12 rounded-[12px] text-[15px] font-semibold flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Sign in <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5 mt-7">
            <OtpInput
              value={otp}
              onChange={(v) => { setOtp(v); if (otpError) setOtpError(false); }}
              onComplete={(code) => handleVerifyOtp(null, code)}
              disabled={loading}
              invalid={otpError}
            />

            <p className="text-center text-[12.5px] font-medium text-ink-muted">
              {otpTimer.expired
                ? <span className="text-danger">This code has expired — request a new one.</span>
                : <>Code expires in <span className="text-mulberry tabular-nums font-semibold">{otpTimer.label}</span></>}
            </p>

            <motion.button
              type="submit"
              disabled={loading || otp.length !== 6}
              whileTap={still || loading ? undefined : { scale: 0.985 }}
              className="btn-berry w-full h-12 rounded-[12px] text-[15px] font-semibold flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
                </>
              ) : (
                <>
                  Verify & sign in <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>

            <div className="flex items-center justify-between gap-3 border-t border-[#EFE9DE] pt-4 text-[12.5px] font-semibold">
              <button
                type="button"
                onClick={handleBackToPassword}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-ink-soft hover:text-ink transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Different account
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={otpTimer.cooldown > 0 || resending || loading}
                className="text-mulberry hover:opacity-70 transition-opacity disabled:text-ink-muted disabled:hover:opacity-100 tabular-nums"
              >
                {otpTimer.cooldown > 0 ? `Resend code in ${otpTimer.cooldown}s` : resending ? 'Sending…' : 'Resend code'}
              </button>
            </div>
            <p className="text-center text-[11.5px] text-ink-muted -mt-1">Can’t find it? Check your spam or promotions folder.</p>
          </form>
        )}

        <p className="text-center text-[12px] text-ink-muted mt-7">
          New to Alimenture?{' '}
          <Link to="/register" className="font-semibold text-mulberry hover:opacity-70 transition-opacity">
            Create an account
          </Link>
        </p>
      </div>
    </AuthScaffold>
  );
}
