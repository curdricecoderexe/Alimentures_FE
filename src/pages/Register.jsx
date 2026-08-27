import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, User, ChevronRight, ShieldCheck } from 'lucide-react';
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

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [resending, setResending] = useState(false);
  const otpTimer = useOtpTimer();

  const sendOtpRequest = async () => {
    const response = await fetch(`${API_BASE}/users/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, data };
  };

  const handleResendOtp = async () => {
    if (otpTimer.cooldown > 0 || resending) return;
    setResending(true);
    toast.loading(`Resending code...`, { id: "otp-toast" });
    try {
      const { ok, data } = await sendOtpRequest();
      if (ok) {
        toast.success(`New code sent to ${email}`, { id: "otp-toast" });
        setOtp('');
        otpTimer.start();
      } else {
        toast.error(data.error || "Failed to resend code", { id: "otp-toast" });
      }
    } catch {
      toast.error("Network error. Please try again.", { id: "otp-toast" });
    } finally {
      setResending(false);
    }
  };

  const isStrongPassword = (pass) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    return pass.length >= minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!isStrongPassword(password)) {
      toast.error("Password too weak! Must be 8+ chars with uppercase, number, and special character.");
      return;
    }

    toast.loading(`Sending verification code...`, { id: "otp-toast" });

    try {
      const { ok, data } = await sendOtpRequest();

      if (ok) {
        toast.success(`OTP sent to ${email}`, { id: "otp-toast" });
        setOtpSent(true);
        otpTimer.start();
      } else {
        toast.error(data.error || "Failed to send OTP", { id: "otp-toast" });
      }
    } catch {
      toast.error("Network error. Please try again.", { id: "otp-toast" });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!otp) {
      return toast.error("Please enter the OTP");
    }
    toast.loading(`Verifying and creating account...`, { id: "register-toast" });
    
    try {
      const response = await fetch(`${API_BASE}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password, otp })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Account created! Please login.`, { id: "register-toast", icon: <ShieldCheck className="text-[#C41E6B]" /> });
        setTimeout(() => {
          navigate('/login');
        }, 1200);
      } else {
        toast.error(data.error || "Registration failed", { id: "register-toast" });
      }
    } catch (error) {
      console.error("Register error:", error);
      toast.error("Network error. Please try again.", { id: "register-toast" });
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
        <motion.div variants={itemVariants} className="flex flex-col items-center mb-8 text-center">
          <motion.img 
            whileHover={{ scale: 1.04, y: -2 }}
            src={logo} alt="Logo" className="h-20 sm:h-24 w-auto object-contain mb-4 drop-shadow-lg filter brightness-200" 
          />
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-white tracking-tighter italic drop-shadow-lg">Join Alimenture.</h1>
          <p className="text-[#D4AF37] mt-2 font-black uppercase text-[10px] tracking-[0.3em] ml-1 drop-shadow-md">Create your account</p>
        </motion.div>

        {/* REGISTER CARD */}
        <Card className="border-0 shadow-[0_40px_80px_rgba(0,0,0,0.8)] rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/10 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          <CardContent className="p-6 sm:p-10 md:p-12 relative z-10">
            <form onSubmit={handleRegister} className="space-y-5 sm:space-y-6">
              
              <motion.div variants={itemVariants} className="space-y-4 sm:space-y-5">
                {!otpSent ? (
                  <>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</Label>
                      <div className="relative group">
                        <div className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 z-20">
                          <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" />
                        </div>
                        <Input
                          type="text"
                          placeholder="John Doe"
                          className="pl-11 sm:pl-14 h-14 sm:h-16 rounded-2xl border-white/10 bg-black/40 focus:bg-black/60 focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all font-bold text-xs sm:text-sm text-white placeholder:text-gray-600"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</Label>
                      <div className="relative group">
                        <div className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 z-20">
                          <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" />
                        </div>
                        <Input
                          type="email"
                          placeholder="name@alimenture.com"
                          className="pl-11 sm:pl-14 h-14 sm:h-16 rounded-2xl border-white/10 bg-black/40 focus:bg-black/60 focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all font-bold text-xs sm:text-sm text-white placeholder:text-gray-600"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Password</Label>
                      <div className="relative group">
                        <div className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 z-20">
                          <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" />
                        </div>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="pl-11 sm:pl-14 h-14 sm:h-16 rounded-2xl border-white/10 bg-black/40 focus:bg-black/60 focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all font-bold text-xs sm:text-sm tracking-widest text-white placeholder:text-gray-600"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={8}
                        />
                      </div>
                      <p className="text-[9px] text-gray-500 font-bold ml-1">8+ chars, uppercase, number & symbol</p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Verification Code</Label>
                    <p className="text-xs text-gray-400 mb-1 ml-1">We've sent a 6-digit code to {email}</p>
                    <p className="text-[10px] font-bold ml-1 mb-4">
                      {otpTimer.expired ? (
                        <span className="text-[#E91E8C]">Code expired — request a new one below.</span>
                      ) : (
                        <span className="text-gray-500">Code expires in <span className="text-[#D4AF37] tabular-nums">{otpTimer.label}</span></span>
                      )}
                    </p>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 z-20">
                        <ShieldCheck className="h-5 w-5 text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" />
                      </div>
                      <Input
                        type="text"
                        placeholder="123456"
                        className="pl-14 h-16 text-center text-xl rounded-2xl border-white/10 bg-black/40 focus:bg-black/60 focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all font-black tracking-[0.5em] text-white placeholder:text-gray-600"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        maxLength={6}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1 ml-1">
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={otpTimer.cooldown > 0 || resending}
                        className="text-[10px] font-black uppercase tracking-widest text-[#E91E8C] hover:text-white transition-colors disabled:text-gray-600 disabled:cursor-not-allowed"
                      >
                        {otpTimer.cooldown > 0 ? `Resend in ${otpTimer.cooldown}s` : resending ? 'Resending…' : 'Resend Code'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setOtp(''); }}
                        className="text-[10px] font-bold text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        Change email
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* ACTION BUTTON */}
              <motion.div variants={itemVariants} className="pt-4 flex flex-col gap-3">
                {!otpSent ? (
                  <Button 
                    type="button"
                    onClick={handleSendOtp}
                    className="w-full text-black h-16 rounded-full text-[11px] font-black uppercase tracking-[0.25em] shadow-[0_15px_30px_-10px_rgba(212,175,55,0.4)] border border-[#D4AF37] transition-all flex items-center justify-center gap-3 group active:scale-[0.98] hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg, #F9F295 0%, #E0AA3E 50%, #E0AA3E 100%)' }}
                  >
                    Send Verification Code
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black/20 group-hover:bg-black/30 transition-colors">
                      <ChevronRight className="h-4 w-4 text-black group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    className="w-full text-black h-16 rounded-full text-[11px] font-black uppercase tracking-[0.25em] shadow-[0_15px_30px_-10px_rgba(212,175,55,0.4)] border border-[#D4AF37] transition-all flex items-center justify-center gap-3 group active:scale-[0.98] hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg, #F9F295 0%, #E0AA3E 50%, #E0AA3E 100%)' }}
                  >
                    Verify & Create Account
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black/20 transition-colors">
                      <ShieldCheck className="h-4 w-4 text-black" />
                    </div>
                  </Button>
                )}
              </motion.div>
            </form>
          </CardContent>
        </Card>

        {/* SECURITY FOOTER */}
        <motion.div 
          variants={itemVariants} 
          className="mt-8 flex flex-col items-center gap-6"
        >
          <div className="flex items-center gap-3 px-6 py-2 bg-[#D4AF37]/10 rounded-full border border-[#D4AF37]/20 backdrop-blur-md mb-2">
            <ShieldCheck className="h-3 w-3 text-[#D4AF37]" />
            <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest italic drop-shadow-md">SECURE END-TO-END SESSION</p>
          </div>
          <p className="text-[11px] font-bold text-gray-500">
            Already have an account? <span onClick={() => navigate('/login')} className="text-[#E91E8C] cursor-pointer hover:text-white transition-colors">Sign In</span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
