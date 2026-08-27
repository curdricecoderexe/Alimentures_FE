import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ChevronRight, ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react';
import logo from '../assets/logo.png';
import { API_BASE } from '../lib/api';
import useOtpTimer from '../hooks/useOtpTimer';

// --- BACKGROUND DECOR ---
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

// --- VARIANTS ---
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

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const otpTimer = useOtpTimer();

  const requestReset = async () => {
    const response = await fetch(`${API_BASE}/users/request-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, data };
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    toast.loading(`Processing request...`, { id: "reset-toast" });

    try {
      const { ok, data } = await requestReset();

      if (ok) {
        // The API returns a generic response whether or not the account exists,
        // so we always advance to the "sent" panel.
        toast.success(`If that account exists, a code is on its way.`, { id: "reset-toast" });
        setIsSubmitted(true);
        otpTimer.start();
      } else {
        toast.error(data.error || "Failed to process request", { id: "reset-toast" });
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Network error. Please try again.", { id: "reset-toast" });
    } finally {
      setSending(false);
    }
  };

  const handleResend = async () => {
    if (otpTimer.cooldown > 0 || sending) return;
    setSending(true);
    toast.loading(`Resending code...`, { id: "reset-toast" });
    try {
      const { ok, data } = await requestReset();
      if (ok) {
        toast.success(`A new code is on its way.`, { id: "reset-toast" });
        otpTimer.start();
      } else {
        toast.error(data.error || "Failed to resend", { id: "reset-toast" });
      }
    } catch {
      toast.error("Network error. Please try again.", { id: "reset-toast" });
    } finally {
      setSending(false);
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
        {/* LOGO SECTION */}
        <motion.div variants={itemVariants} className="flex flex-col items-center mb-10 text-center">
          <motion.img 
            whileHover={{ scale: 1.04, y: -2 }}
            src={logo} alt="Logo" className="h-20 sm:h-24 w-auto object-contain mb-4 filter brightness-200 drop-shadow-lg" 
          />
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-white tracking-tighter italic drop-shadow-lg">Password Recovery.</h1>
          <p className="text-[#D4AF37] mt-2 font-black uppercase text-[10px] tracking-[0.3em] ml-1 drop-shadow-md">Secure Protocol</p>
        </motion.div>

        {/* FORGOT PASSWORD CARD */}
        <Card className="border-0 shadow-[0_40px_80px_rgba(0,0,0,0.8)] rounded-[3rem] overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/10 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          <CardContent className="p-10 md:p-12 relative z-10">
            {!isSubmitted ? (
              <form onSubmit={handleResetPassword} className="space-y-8">
                
                <motion.div variants={itemVariants} className="text-center mb-4">
                    <p className="text-sm text-gray-400 font-medium">Enter your registered email address and we'll send you a 6-digit code to reset your password securely.</p>
                </motion.div>

                {/* INPUT FIELD */}
                <motion.div variants={itemVariants} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Identity Tag</Label>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 z-20">
                        <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" />
                      </div>
                      <Input
                        type="email"
                        placeholder="name@alimenture.com"
                        className="pl-14 h-16 rounded-2xl border-white/10 bg-black/40 focus:bg-black/60 focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all font-bold text-white placeholder:text-gray-600"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </motion.div>

                {/* ACTION BUTTONS */}
                <motion.div variants={itemVariants} className="pt-2 flex flex-col gap-4">
                  <Button
                    type="submit"
                    disabled={sending}
                    className="w-full text-black h-16 rounded-full text-[11px] font-black uppercase tracking-[0.25em] shadow-[0_15px_30px_-10px_rgba(212,175,55,0.4)] border border-[#D4AF37] transition-all flex items-center justify-center gap-3 group active:scale-[0.98] hover:scale-[1.02] disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #F9F295 0%, #E0AA3E 50%, #E0AA3E 100%)' }}
                  >
                    {sending ? 'Sending…' : 'Send Reset Code'}
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black/20 group-hover:bg-black/30 transition-colors">
                      <ChevronRight className="h-4 w-4 text-black group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Button>
                  
                  <Link to="/login" className="w-full flex justify-center">
                    <Button 
                        type="button" 
                        variant="ghost"
                        className="text-gray-400 hover:text-white hover:bg-white/5 font-bold text-sm flex items-center gap-2 rounded-full h-12"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Login
                    </Button>
                  </Link>
                </motion.div>
              </form>
            ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col items-center text-center space-y-5">
                    <div className="w-20 h-20 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mb-1 border border-[#D4AF37]/20">
                        <ShieldCheck className="h-10 w-10 text-[#D4AF37]" />
                    </div>
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-white tracking-tight">Check Your Email</h2>
                    <p className="text-sm text-gray-400 font-medium">
                        If an account exists for <br/><span className="text-white font-bold">{email}</span>, we've sent a 6-digit reset code.
                    </p>
                    <p className="text-xs text-gray-500">
                        Check your inbox and spam folder.{' '}
                        {otpTimer.expired
                          ? <span className="text-[#E91E8C]">The code has likely expired — resend below.</span>
                          : <>The code expires in <span className="text-[#D4AF37] tabular-nums">{otpTimer.label}</span>.</>}
                    </p>
                    <div className="pt-4 w-full flex flex-col gap-3">
                        <Button
                            onClick={() => navigate('/reset-password', { state: { email } })}
                            className="w-full text-black h-14 rounded-full text-[11px] font-black uppercase tracking-[0.25em] border border-[#D4AF37] flex items-center justify-center gap-3 group active:scale-[0.98] hover:scale-[1.02] transition-all"
                            style={{ background: 'linear-gradient(135deg, #F9F295 0%, #E0AA3E 50%, #E0AA3E 100%)' }}
                        >
                            <KeyRound className="h-4 w-4" />
                            Enter Reset Code
                        </Button>
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={otpTimer.cooldown > 0 || sending}
                            className="text-[10px] font-black uppercase tracking-widest text-[#E91E8C] hover:text-white transition-colors disabled:text-gray-600 disabled:cursor-not-allowed"
                        >
                            {otpTimer.cooldown > 0 ? `Resend code in ${otpTimer.cooldown}s` : sending ? 'Sending…' : 'Resend code'}
                        </button>
                        <Link to="/login" className="w-full">
                            <Button variant="ghost" className="w-full text-gray-400 hover:text-white hover:bg-white/5 h-11 rounded-2xl font-bold text-sm">
                                Return to Login
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            )}
          </CardContent>
        </Card>

        {/* SECURITY FOOTER */}
        <motion.div 
          variants={itemVariants} 
          className="mt-10 flex flex-col items-center gap-6"
        >
          <div className="flex items-center gap-3 px-6 py-2 bg-[#D4AF37]/10 rounded-full border border-[#D4AF37]/20 backdrop-blur-md">
            <ShieldCheck className="h-3 w-3 text-[#D4AF37]" />
            <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest italic drop-shadow-md">SECURE END-TO-END SESSION</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
