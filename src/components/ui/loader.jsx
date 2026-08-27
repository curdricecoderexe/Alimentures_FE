import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../../assets/logo.png';

const loadingStatuses = [
  "Initializing Alimenture Platform...",
  "Loading Heritage Grains & Clean Millets...",
  "Connecting to Secure Catalog...",
  "Preparing Your Experience..."
];

const Loader = ({ fullScreen = true, text = "Loading", mini = false }) => {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    if (mini) return;
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % loadingStatuses.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [mini]);

  if (mini) {
    return (
      <div className="flex items-center justify-center p-2">
        <motion.img
          animate={{
            scale: [0.95, 1.05, 0.95],
            filter: [
              "drop-shadow(0 0 4px rgba(233,30,140,0.3))",
              "drop-shadow(0 0 10px rgba(212,175,55,0.6))",
              "drop-shadow(0 0 4px rgba(233,30,140,0.3))"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          src={logo}
          alt="Loading..."
          className="h-8 w-auto object-contain select-none"
        />
      </div>
    );
  }

  const containerClasses = fullScreen
    ? "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FAF8F5] dark:bg-[#0c0715] backdrop-blur-2xl px-6 overflow-hidden transition-all duration-500"
    : "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FAF8F5] dark:bg-[#0c0715] backdrop-blur-2xl px-6 overflow-hidden transition-all duration-500";

  return (
    <div className={containerClasses}>
      {/* Subtle ambient light aura */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="w-[500px] h-[500px] bg-gradient-to-tr from-[#E91E8C]/10 via-[#D4AF37]/15 to-transparent blur-[140px] opacity-75 pointer-events-none" />
      </div>

      <div className="relative flex flex-col items-center justify-center gap-10 z-10 max-w-md w-full text-center">
        
        {/* FREE-STANDING MODERN LOGO ANIMATION (No rounded circles, no spinners) */}
        <motion.div
          animate={{
            scale: [0.97, 1.03, 0.97],
            y: [-3, 3, -3],
            filter: [
              "drop-shadow(0 4px 12px rgba(233,30,140,0.15)) drop-shadow(0 0 18px rgba(212,175,55,0.15))",
              "drop-shadow(0 10px 28px rgba(233,30,140,0.35)) drop-shadow(0 0 40px rgba(212,175,55,0.35))",
              "drop-shadow(0 4px 12px rgba(233,30,140,0.15)) drop-shadow(0 0 18px rgba(212,175,55,0.15))"
            ]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative flex items-center justify-center"
        >
          <img 
            src={logo} 
            alt="Alimenture Brand" 
            className="w-48 sm:w-60 h-auto object-contain select-none" 
            loading="eager"
          />
        </motion.div>

        {/* SLEEK MODERN LINEAR LIGHT SCANNER */}
        <div className="w-56 sm:w-64 h-[3px] bg-gray-200/70 dark:bg-zinc-800/70 overflow-hidden relative shadow-inner">
          <motion.div
            animate={{ x: ["-100%", "250%", "-100%"] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            className="w-1/2 h-full bg-gradient-to-r from-transparent via-[#E91E8C] via-[#F39C12] to-[#D4AF37] shadow-[0_0_12px_rgba(233,30,140,0.6)]"
          />
        </div>

        {/* PROFESSIONAL TYPOGRAPHY (No Emojis) */}
        <div className="flex flex-col items-center gap-3">
          <motion.div 
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-xs sm:text-sm font-bold tracking-[0.35em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#E91E8C] via-[#E67E22] to-[#D4AF37]"
          >
            {text}
          </motion.div>

          <div className="h-5 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={statusIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
                className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]"
              >
                {loadingStatuses[statusIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Loader;


