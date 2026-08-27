import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ChevronRight, ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react';
import logo from '../assets/logo.png';
import { API_BASE } from '../lib/api';
import useOtpTimer from '../hooks/useOtpTimer';

const BackgroundDecor = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden bg-[#0a0806]">
    {/* Ambient Pink/Yellow Blobs matching Home */}
    <motion.div
      animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, 30, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#E91E8C] opacity-[0.15] blur-[120px]"
    />
    <motion.div
      animate={{ scale: [1, 1.3, 1], x: [0, -50, 0], y: [0, 60, 0] }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      className="absolute top-[20%] -right-[5%] w-[40%] h-[40%] rounded-full bg-[#D4AF37] opacity-[0.12] blur-[100px]"
    />
    <motion.div
      animate={{ scale: [1, 1.1, 1], x: [20, -20, 20], y: [20, -20, 20] }}
      transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      className="absolute bottom-[-10%] left-[20%] w-[45%] h-[45%] rounded-full bg-[#F59E0B] opacity-[0.1] blur-[130px]"
    />
    
    {/* Subtle luxurious grain */}
    <div 
      className="absolute inset-0 opacity-[0.03]" 
      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundSize: '100px 100px' }}
    />
  </div>
);

const containerVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = location.state?.email || '';

  const [email, setEmail] = useState(emailFromState);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [done, setDone] = useState(false);
  const [resending, setResending] = useState(false);
  // The user lands here straight after a code was sent, so start the clock.
  const otpTimer = useOtpTimer({ autoStart: !!emailFromState });

  const handleResend = async () => {
    if (!email || otpTimer.cooldown > 0 || resending) return;
    setResending(true);
    toast.loading("Sending a new code...", { id: "reset-pw" });
    try {
      const response = await fetch(`${API_BASE}/users/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        toast.success("A new code is on its way.", { id: "reset-pw" });
        setOtp('');
        otpTimer.start();
      } else {
        toast.error(data.error || "Failed to resend code", { id: "reset-pw" });
      }
    } catch {
      toast.error("Network error. Please try again.", { id: "reset-pw" });
    } finally {
      setResending(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    toast.loading("Resetting your password...", { id: "reset-pw" });

    try {
      const response = await fetch(`${API_BASE}/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Password reset successfully!", { id: "reset-pw" });
        setDone(true);
      } else {
        toast.error(data.error || "Failed to reset password", { id: "reset-pw" });
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Network error. Please try again.", { id: "reset-pw" });
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 font-sans">
      <BackgroundDecor />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[480px] z-10"
      >
        {/* LOGO */}
        <motion.div variants={itemVariants} className="flex flex-col items-center mb-10 text-center">
          <motion.img whileHover={{ scale: 1.04, y: -2 }} src={logo} alt="Logo" className="h-20 sm:h-24 w-auto object-contain mb-4 filter brightness-200 drop-shadow-lg" />
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-white tracking-tighter italic drop-shadow-lg">New Password.</h1>
          <p className="text-[#D4AF37] mt-2 font-black uppercase text-[10px] tracking-[0.3em] ml-1 drop-shadow-md">Secure Reset Protocol</p>
        </motion.div>

        <Card className="border-0 shadow-[0_40px_80px_rgba(0,0,0,0.8)] rounded-[3rem] overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/10 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          <CardContent className="p-10 md:p-12 relative z-10">
            {!done ? (
              <form onSubmit={handleReset} className="space-y-6">
                <motion.p variants={itemVariants} className="text-sm text-gray-400 font-medium text-center mb-2">
                  Enter the OTP sent to your email and choose a new secure password.
                </motion.p>

                {/* Email */}
                {!emailFromState && (
                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email</Label>
                    <Input
                      type="email"
                      placeholder="name@alimenture.com"
                      className="h-14 rounded-2xl border-white/10 bg-black/40 focus:bg-black/60 focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all font-bold text-white placeholder:text-gray-600"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </motion.div>
                )}

                {/* OTP */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">OTP Code</Label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 z-20">
                      <KeyRound className="h-5 w-5 text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" />
                    </div>
                    <Input
                      type="text"
                      placeholder="6-digit code from email"
                      className="pl-14 h-16 rounded-2xl border-white/10 bg-black/40 focus:bg-black/60 focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all font-bold tracking-[0.5em] text-white placeholder:text-gray-600"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1 ml-1">
                    <span className="text-[10px] font-bold text-gray-500">
                      {otpTimer.secondsLeft > 0
                        ? <>Expires in <span className="text-[#D4AF37] tabular-nums">{otpTimer.label}</span></>
                        : <span className="text-[#E91E8C]">Code may have expired</span>}
                    </span>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={!email || otpTimer.cooldown > 0 || resending}
                      className="text-[10px] font-black uppercase tracking-widest text-[#E91E8C] hover:text-white transition-colors disabled:text-gray-600 disabled:cursor-not-allowed"
                    >
                      {otpTimer.cooldown > 0 ? `Resend in ${otpTimer.cooldown}s` : resending ? 'Sending…' : 'Resend Code'}
                    </button>
                  </div>
                </motion.div>

                {/* New Password */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">New Password</Label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 z-20">
                      <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" />
                    </div>
                    <Input
                      type="password"
                      placeholder="At least 8 characters"
                      minLength={8}
                      className="pl-14 h-16 rounded-2xl border-white/10 bg-black/40 focus:bg-black/60 focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all font-bold text-white placeholder:text-gray-600"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                </motion.div>

                {/* Confirm Password */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Confirm Password</Label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 z-20">
                      <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" />
                    </div>
                    <Input
                      type="password"
                      placeholder="Repeat new password"
                      className="pl-14 h-16 rounded-2xl border-white/10 bg-black/40 focus:bg-black/60 focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all font-bold text-white placeholder:text-gray-600"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="pt-2 flex flex-col gap-4">
                  <Button
                    type="submit"
                    className="w-full text-black h-16 rounded-full text-[11px] font-black uppercase tracking-[0.25em] shadow-[0_15px_30px_-10px_rgba(212,175,55,0.4)] border border-[#D4AF37] transition-all flex items-center justify-center gap-3 group active:scale-[0.98] hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg, #F9F295 0%, #E0AA3E 50%, #E0AA3E 100%)' }}
                  >
                    Reset Password
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black/20 group-hover:bg-black/30 transition-colors">
                      <ChevronRight className="h-4 w-4 text-black group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Button>

                  <Link to="/forgot-password" className="w-full flex justify-center">
                    <Button type="button" variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/5 font-bold text-sm flex items-center gap-2 rounded-full h-12">
                      <ArrowLeft className="h-4 w-4" />
                      Request New OTP
                    </Button>
                  </Link>
                </motion.div>
              </form>
            ) : (
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mb-2 border border-[#D4AF37]/20">
                  <ShieldCheck className="h-10 w-10 text-[#D4AF37]" />
                </div>
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-white tracking-tight">Password Updated!</h2>
                <p className="text-sm text-gray-400 font-medium">
                  Your password has been reset successfully. You can now log in with your new credentials.
                </p>
                <div className="pt-6 w-full">
                  <Button
                    onClick={() => navigate('/login')}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white h-14 rounded-2xl font-bold transition-colors"
                  >
                    Back to Login
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        <motion.div variants={itemVariants} className="mt-10 flex flex-col items-center gap-6">
          <div className="flex items-center gap-3 px-6 py-2 bg-[#D4AF37]/10 rounded-full border border-[#D4AF37]/20 backdrop-blur-md">
            <ShieldCheck className="h-3 w-3 text-[#D4AF37]" />
            <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest italic drop-shadow-md">SECURE END-TO-END SESSION</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
