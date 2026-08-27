import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, ChevronRight, ShieldCheck, Asterisk } from 'lucide-react';
import logo from '../assets/logo.png';
import { API_BASE } from '../lib/api';

// --- BACKGROUND DECOR (Liquid Glass Light) ---
const BackgroundDecor = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden bg-[#FAFAFA]">
    {/* Ambient Liquid Glows */}
    <motion.div
      animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, 30, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-pink-100/60 blur-[120px]"
    />
    <motion.div
      animate={{ scale: [1, 1.3, 1], x: [0, -50, 0], y: [0, 60, 0] }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      className="absolute top-[20%] -right-[5%] w-[40%] h-[40%] rounded-full bg-orange-50/70 blur-[100px]"
    />
    <motion.div
      animate={{ scale: [1, 1.1, 1], x: [20, -20, 20], y: [20, -20, 20] }}
      transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      className="absolute bottom-[-10%] left-[20%] w-[45%] h-[45%] rounded-full bg-blue-50/50 blur-[130px]"
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

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    toast.loading(`Authenticating access...`, { id: "login-toast" });
    
    try {
      const response = await fetch(`${API_BASE}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Welcome back!`, { id: "login-toast", icon: <ShieldCheck className="text-[#C41E6B]" /> });
        
        // Save to local storage
        localStorage.setItem("token", data.token);
        localStorage.setItem("uid", data.uid);
        localStorage.setItem("role", data.role);
        localStorage.setItem("userEmail", data.email);
        localStorage.setItem("userName", data.name);

        // Redirect based on returned role
        const role = data.role || 'customer';
        
        const from = location.state?.from || (role === 'admin' ? '/admin' : role === 'staff' ? '/staff' : role === 'delivery' ? '/delivery' : '/');
        
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1200);
      } else {
        toast.error(data.error || "Login failed", { id: "login-toast" });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Network error. Please try again.", { id: "login-toast" });
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
            src={logo} alt="Alimenture Logo" className="h-24 md:h-28 w-auto object-contain mb-3 drop-shadow-md transition-all duration-300" 
          />
          <p className="text-[#C41E6B] font-black uppercase text-xs tracking-[0.3em]">Enterprise Gateway</p>
        </motion.div>

        {/* LOGIN CARD */}
        <Card className="border-0 shadow-[0_20px_60px_rgba(0,0,0,0.05)] rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden bg-white/40 backdrop-blur-2xl border border-white/60 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
          <CardContent className="p-6 sm:p-10 md:p-12 relative z-10">
            <form onSubmit={handleLogin} className="space-y-6 sm:space-y-8">
              
              {/* INPUT FIELDS */}
              <motion.div variants={itemVariants} className="space-y-5 sm:space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Identity Tag</Label>
                  <div className="relative group">
                    <div className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 z-20">
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-[#C41E6B] transition-colors" />
                    </div>
                    <Input
                      type="email"
                      placeholder="name@alimenture.com"
                      className="pl-11 sm:pl-14 h-14 sm:h-16 rounded-2xl border-white/80 bg-white/50 focus:bg-white focus:ring-2 focus:ring-[#C41E6B]/20 focus:border-[#C41E6B] transition-all font-bold text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 shadow-inner"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Encrypted Pass</Label>
                    <span onClick={() => navigate('/forgot-password')} className="text-[10px] font-bold text-[#C41E6B] cursor-pointer hover:text-gray-900 transition-colors">Reset?</span>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 z-20">
                      <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-[#C41E6B] transition-colors" />
                    </div>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pl-11 sm:pl-14 h-14 sm:h-16 rounded-2xl border-white/80 bg-white/50 focus:bg-white focus:ring-2 focus:ring-[#C41E6B]/20 focus:border-[#C41E6B] transition-all font-bold text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 tracking-widest shadow-inner"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </motion.div>

              {/* ACTION BUTTON */}
              <motion.div variants={itemVariants} className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full text-white h-16 rounded-full text-[11px] font-black uppercase tracking-[0.25em] shadow-[0_15px_30px_-10px_rgba(196,30,107,0.3)] transition-all flex items-center justify-center gap-3 group active:scale-[0.98] hover:scale-[1.02] bg-gradient-to-r from-[#C41E6B] to-[#E83D6E] border-0"
                >
                  Authorize Entry
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
                    <ChevronRight className="h-4 w-4 text-white group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>

        {/* SECURITY FOOTER */}
        <motion.div 
          variants={itemVariants} 
          className="mt-10 flex flex-col items-center gap-6"
        >
          <div className="flex items-center gap-3 px-6 py-2 bg-white/50 rounded-full border border-white/80 shadow-sm backdrop-blur-md">
            <ShieldCheck className="h-3 w-3 text-[#10B981]" />
            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest italic">SECURE END-TO-END SESSION</p>
          </div>
          
          <p className="text-[11px] font-bold text-gray-500 mt-2">
            Don't have an account? <span onClick={() => navigate('/register')} className="text-[#C41E6B] cursor-pointer hover:text-gray-900 transition-colors">Sign Up</span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}