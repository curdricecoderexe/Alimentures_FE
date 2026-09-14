import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Field, ORB_BERRY, ORB_GOLD } from '../components/ui/motion';

export default function NotFound() {
  const still = useReducedMotion();

  return (
    <div className="relative min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center overflow-hidden font-sans">
      <Field
        orbs={[
          { size: 480, color: ORB_BERRY, top: -140, left: -120 },
          { size: 440, color: ORB_GOLD, bottom: -160, right: -120 },
        ]}
      />

      <motion.div
        initial={still ? false : { opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-[2] max-w-lg w-full"
      >
        <div className="glass foil-top rounded-panel p-10 sm:p-14 flex flex-col items-center gap-5">
          <div className="relative">
            <span className="orb absolute w-[220px] h-[220px] bg-[rgba(165,13,90,.22)] -inset-6" />
            <p className="relative display-xl text-[6rem] sm:text-[7rem] accent-text leading-none">404</p>
          </div>

          <span className="pill-berry-soft inline-flex items-center h-8 px-4 rounded-full text-[10px] font-bold uppercase tracking-[0.16em]">
            Page not found
          </span>
          <h2 className="display-md text-2xl sm:text-[2rem] text-ink">
            This page went the way of <span className="accent-text">refined sugar</span>
          </h2>
          <p className="text-ink-soft text-sm sm:text-[15px] font-medium leading-relaxed max-w-sm">
            The link may be broken or the page may have moved. Let&rsquo;s get you back to something wholesome.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full">
            <button
              onClick={() => window.history.back()}
              className="btn-glass w-full sm:w-auto px-7 h-12 rounded-full font-extrabold text-xs uppercase tracking-[0.12em] flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Go back
            </button>
            <Link
              to="/"
              className="btn-berry w-full sm:w-auto px-7 h-12 rounded-full font-extrabold text-xs uppercase tracking-[0.12em] flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" /> Back to home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
