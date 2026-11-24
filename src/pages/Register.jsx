import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import OtpInput from '../components/ui/OtpInput';
import { motion, useReducedMotion } from 'framer-motion';
import { Lock, Mail, User, ArrowRight, ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import { API_BASE } from '../lib/api';
import useOtpTimer from '../hooks/useOtpTimer';
import AuthScaffold, { AuthField, AuthTabs } from '../components/AuthScaffold';
import SEO from '../components/SEO';

export default function Register() {
  const navigate = useNavigate();
  const still = useReducedMotion();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const otpTimer = useOtpTimer();

  const sendOtpRequest = async () => {
    const response = await fetch(`${API_BASE}/users/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, data };
  };

  const handleResendOtp = async () => {
    if (otpTimer.cooldown > 0 || resending) return;
    setResending(true);
    toast.loading('Resending code…', { id: 'otp-toast' });
    try {
      const { ok, data } = await sendOtpRequest();
      if (ok) {
        toast.success(`New code sent to ${email}`, { id: 'otp-toast' });
        setOtp('');
        otpTimer.start();
      } else {
        toast.error(data.error || 'Failed to resend code', { id: 'otp-toast' });
      }
    } catch {
      toast.error('Network error. Please try again.', { id: 'otp-toast' });
    } finally {
      setResending(false);
    }
  };

  const isStrongPassword = (pass) => {
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    return pass.length >= 8 && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (!isStrongPassword(password)) {
      toast.error('Password too weak! Must be 8+ chars with uppercase, number, and special character.');
      return;
    }

    setBusy(true);
    toast.loading('Sending verification code…', { id: 'otp-toast' });
    try {
      const { ok, data } = await sendOtpRequest();
      if (ok) {
        toast.success(`OTP sent to ${email}`, { id: 'otp-toast' });
        setOtpSent(true);
        otpTimer.start();
      } else if (data.alreadyRegistered) {
        toast.error(data.error || 'This email is already registered. Please sign in.', { id: 'otp-toast' });
        setTimeout(() => navigate('/login', { state: { email } }), 1500);
      } else {
        toast.error(data.error || 'Failed to send OTP', { id: 'otp-toast' });
      }
    } catch {
      toast.error('Network error. Please try again.', { id: 'otp-toast' });
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }
    setBusy(true);
    toast.loading('Verifying and creating account…', { id: 'register-toast' });
    try {
      const response = await fetch(`${API_BASE}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, otp }),
      });
      const data = await response.json();

      if (response.ok) {
        toast.success('Account created! Please login.', {
          id: 'register-toast',
          icon: <ShieldCheck className="text-mulberry" />,
        });
        setTimeout(() => navigate('/login'), 1200);
      } else {
        toast.error(data.error || 'Registration failed', { id: 'register-toast' });
        setBusy(false);
      }
    } catch (error) {
      console.error('Register error:', error);
      toast.error('Network error. Please try again.', { id: 'register-toast' });
      setBusy(false);
    }
  };

  return (
    <AuthScaffold>
      <SEO title="Create an account" noindex />
      <div className="rounded-[24px] bg-white p-6 sm:p-8 ring-1 ring-[#E8E1D4] shadow-[0_24px_60px_-36px_rgba(64,28,62,0.35)]">
        <AuthTabs active="register" />

        {!otpSent ? (
          <>
            <h1 className="text-[26px] sm:text-[28px] font-semibold leading-tight tracking-[-0.01em] text-ink">
              Create your account
            </h1>
            <p className="text-ink-soft text-[13.5px] mt-2 font-medium">
              Join Alimenture to track orders and reorder in one tap.
            </p>

            <form onSubmit={handleSendOtp} className="flex flex-col gap-4 mt-7">
              <AuthField
                label="Full name"
                icon={User}
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />

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
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="tracking-wide"
                hint="8+ characters with an uppercase letter, a number and a symbol."
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

              <motion.button
                type="submit"
                disabled={busy}
                whileTap={still || busy ? undefined : { scale: 0.985 }}
                className="btn-berry w-full h-12 rounded-[12px] text-[15px] font-semibold flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending code…
                  </>
                ) : (
                  <>
                    Send verification code <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-[26px] sm:text-[28px] font-semibold leading-tight tracking-[-0.01em] text-ink">
              Verify your email
            </h1>
            <p className="text-ink-soft text-[13.5px] mt-2 font-medium">
              Enter the 6&#8209;digit code sent to <span className="text-ink font-semibold">{email}</span>.
            </p>

            <form onSubmit={handleRegister} className="flex flex-col gap-4 mt-7">
              <div>
                <span className="block text-[12.5px] font-semibold text-ink mb-2">Verification code</span>
                <OtpInput value={otp} onChange={setOtp} />
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className={otpTimer.expired ? 'text-danger' : 'text-ink-muted'}>
                  {otpTimer.expired ? 'Code expired' : <>Expires in <span className="text-mulberry tabular-nums">{otpTimer.label}</span></>}
                </span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={otpTimer.cooldown > 0 || resending}
                  className="font-semibold text-mulberry hover:opacity-70 transition-opacity disabled:text-ink-muted disabled:cursor-not-allowed"
                >
                  {otpTimer.cooldown > 0 ? `Resend in ${otpTimer.cooldown}s` : resending ? 'Resending…' : 'Resend code'}
                </button>
              </div>

              <motion.button
                type="submit"
                disabled={busy}
                whileTap={still || busy ? undefined : { scale: 0.985 }}
                className="btn-berry w-full h-12 rounded-[12px] text-[15px] font-semibold flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
                  </>
                ) : (
                  <>
                    Verify &amp; create account <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>

              <button
                type="button"
                onClick={() => { setOtpSent(false); setOtp(''); }}
                className="text-[13px] font-medium text-ink-muted hover:text-ink transition-colors self-center"
              >
                Change email address
              </button>
            </form>
          </>
        )}

        <p className="text-center text-[12px] text-ink-muted mt-7">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-mulberry hover:opacity-70 transition-opacity">
            Sign in
          </Link>
        </p>
      </div>
    </AuthScaffold>
  );
}
