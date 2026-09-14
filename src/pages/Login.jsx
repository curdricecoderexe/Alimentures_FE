import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, useReducedMotion } from 'framer-motion';
import { Lock, Mail, ArrowRight, ShieldCheck, Eye, EyeOff, Loader2, Check, KeyRound } from 'lucide-react';
import { API_BASE } from '../lib/api';
import AuthScaffold, { AuthField, AuthTabs } from '../components/AuthScaffold';

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
    toast.success('Welcome back!', { id: 'login-toast', icon: <ShieldCheck className="text-berry" /> });
    if (remember) localStorage.setItem('rememberEmail', email);
    else localStorage.removeItem('rememberEmail');
    localStorage.setItem('token', data.token);
    localStorage.setItem('uid', data.uid);
    localStorage.setItem('role', data.role);
    localStorage.setItem('userEmail', data.email);
    localStorage.setItem('userName', data.name);

    const role = data.role || 'customer';
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
        toast.success('Enter the code we emailed you', { id: 'login-toast', icon: <KeyRound className="text-berry" /> });
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

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    toast.loading('Verifying code…', { id: 'login-toast' });

    try {
      const response = await fetch(`${API_BASE}/users/login/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, otp }),
      });
      const data = await response.json();

      if (response.ok) {
        finishLogin(data);
      } else {
        toast.error(data.error || 'Invalid code', { id: 'login-toast' });
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
  };

  return (
    <AuthScaffold>
      <div className="glass foil-top rounded-panel p-7 sm:p-9 shadow-glass-lift">
        <AuthTabs active="signin" />

        <h1 className="display-lg text-[2.15rem] leading-tight">
          Welcome <span className="accent-text">back</span>
        </h1>
        <p className="text-ink-soft text-[13.5px] mt-2 font-medium">
          {step === 'password'
            ? 'Sign in to continue to your Alimenture account.'
            : <>We emailed a 6-digit code to <span className="font-bold text-ink">{otpEmail}</span>.</>}
        </p>

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
              placeholder="alimentureindustries@gmail.com"
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
                  className="text-[11px] font-bold text-berry hover:opacity-70 transition-opacity"
                >
                  Forgot?
                </Link>
              }
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

            <button
              type="button"
              onClick={() => setRemember((v) => !v)}
              className="flex items-center gap-2.5 self-start mt-0.5 group/r"
            >
              <span
                className={`h-[18px] w-[18px] rounded-[6px] border flex items-center justify-center transition-all ${
                  remember ? 'bg-berry border-berry' : 'bg-paper border-hairline group-hover/r:border-berry/50'
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
              className="btn-berry w-full h-[52px] rounded-full text-[11px] font-extrabold uppercase tracking-[0.16em] flex items-center justify-center gap-2.5 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
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
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4 mt-7">
            <AuthField
              label="One-time code"
              icon={KeyRound}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
              className="tracking-[0.5em] text-center"
            />

            <motion.button
              type="submit"
              disabled={loading || otp.length !== 6}
              whileTap={still || loading ? undefined : { scale: 0.985 }}
              className="btn-berry w-full h-[52px] rounded-full text-[11px] font-extrabold uppercase tracking-[0.16em] flex items-center justify-center gap-2.5 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
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

            <button
              type="button"
              onClick={handleBackToPassword}
              disabled={loading}
              className="text-center text-[12px] font-bold text-berry hover:opacity-70 transition-opacity disabled:opacity-50"
            >
              Use a different account / resend code
            </button>
          </form>
        )}

        <p className="text-center text-[12px] text-ink-muted mt-7">
          New to Alimenture?{' '}
          <Link to="/register" className="font-bold text-berry hover:opacity-70 transition-opacity">
            Create an account
          </Link>
        </p>
      </div>
    </AuthScaffold>
  );
}
