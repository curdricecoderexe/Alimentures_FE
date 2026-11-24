import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck, Lock, Wheat, Truck } from 'lucide-react';
import logo from '../assets/logo.png';
import brandPhotoDefault from '../assets/login.webp';
import { useAppearance } from '../lib/appearance';

const EASE = [0.16, 1, 0.3, 1];

/* Remembered across route changes so switching Sign in ⇄ Create account can
   glide: the tab highlight slides over and the form slides in from that side. */
let lastAuthPath = null;
let lastAuthTab = null;
const SIDE = { '/login': 0, '/register': 1 };

/**
 * The split-screen shell shared by every auth route (login / register /
 * forgot-password / reset-password) so they all wear the exact same skin.
 * Left: the berry brand panel. Right: your form card, passed as children,
 * with the Field orbs + trust row already placed around it.
 */
export default function AuthScaffold({ children }) {
  const still = useReducedMotion();
  const appearance = useAppearance();
  const brandPhoto = appearance.authBg || brandPhotoDefault;
  // The bundled photo already carries the Alimenture sign at its top, so the logo chip is only added for custom photos.
  const customPhoto = Boolean(appearance.authBg);
  const { pathname } = useLocation();
  const [prevPath] = useState(() => lastAuthPath);
  useEffect(() => { lastAuthPath = pathname; }, [pathname]);
  const fromAuthPage = prevPath !== null && prevPath !== pathname;
  // +1 = slide in from the right (to Create account), -1 = from the left (to Sign in)
  const dir = (SIDE[pathname] ?? 0) - (SIDE[prevPath] ?? 0);

  return (
    <div className="relative min-h-screen grid lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] bg-cream font-sans text-ink">
      {/* ══════════ Brand panel (photo card) ══════════ */}
      <div className="relative hidden lg:block p-3">
        <div className="relative h-full min-h-[calc(100vh-1.5rem)] overflow-hidden rounded-[28px] text-white">
          {/* lifestyle photo — Admin → Appearance → Auth brand panel */}
          <img src={brandPhoto} alt="" aria-hidden="true" className={`absolute inset-0 h-full w-full object-cover ${customPhoto ? 'object-center' : 'object-top'}`} />
          {/* calm aubergine fade (logo hue) so the copy reads, photo stays visible */}
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#2E1430]/90 via-[#401C3E]/45 to-black/10" />

          <div className="relative z-[1] flex h-full flex-col justify-between p-10 xl:p-12">
            {customPhoto ? (
              <Link to="/" className="self-start inline-flex rounded-[14px] bg-white px-3.5 py-2 shadow-sm" aria-label="Alimenture home">
                <img src={logo} alt="Alimenture" className="h-9 w-auto object-contain" />
              </Link>
            ) : (
              <Link to="/" className="self-center h-24 w-64" aria-label="Alimenture home" />
            )}

            <motion.div
              initial={still || fromAuthPage ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
              className="max-w-md"
            >
              <p className="text-[13px] font-medium text-white/75">Made in Chennai</p>
              <h2 className="mt-2 font-display text-[2.4rem] xl:text-[2.75rem] font-medium leading-[1.08] tracking-[-0.02em]">
                Clean food, rooted in heritage grains.
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/80">
                Track orders, save your addresses and reorder your favourites in a tap.
              </p>
              <ul className="mt-8 grid grid-cols-3 gap-3 border-t border-white/20 pt-6">
                {[
                  [Wheat, '10 heritage grains'],
                  [ShieldCheck, 'FSSAI-registered kitchen'],
                  [Truck, 'Delivered across India'],
                ].map(([Icon, label]) => (
                  <li key={label} className="flex flex-col gap-2">
                    <Icon className="h-5 w-5 text-white/85" strokeWidth={1.6} />
                    <span className="text-[13px] leading-snug text-white/85">{label}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ══════════ Form panel ══════════ */}
      <div className="relative flex items-center justify-center px-5 py-10 sm:p-12">
        <motion.div
          initial={still ? false : fromAuthPage ? { opacity: 0, x: (dir || 1) * 32 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: fromAuthPage ? 0.45 : 0.6, ease: EASE }}
          className="w-full max-w-[420px]"
        >
          <Link to="/" className="lg:hidden flex justify-center mb-7" aria-label="Alimenture home">
            <img src={logo} alt="Alimenture" className="h-12 w-auto object-contain" />
          </Link>

          {children}

          <div className="mt-6 flex items-center justify-center gap-x-5 gap-y-2 flex-wrap text-[12px] text-ink-muted">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Encrypted session</span>
            <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Secure payments by Razorpay</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Shared field ────────────────────────────────────────────────────────
   Plain label, white 48px input with a quiet leading icon, mulberry focus. */
export function AuthField({ label, labelAction, icon: Icon, trailing, hint, className = '', ...props }) {
  return (
    <label className="block">
      {labelAction ? (
        <span className="flex items-center justify-between mb-1.5">
          <span className="text-[13px] font-semibold text-ink">{label}</span>
          {labelAction}
        </span>
      ) : (
        label && <span className="text-[13px] font-semibold text-ink mb-1.5 block">{label}</span>
      )}
      <div className="flex items-center gap-3 h-12 px-3.5 rounded-[12px] bg-white border border-[#E2DCD0] transition-[border-color,box-shadow] focus-within:border-mulberry/60 focus-within:ring-4 focus-within:ring-mulberry/10">
        {Icon && <Icon className="h-[18px] w-[18px] text-ink-muted shrink-0" />}
        <input
          className={`flex-1 min-w-0 w-full bg-transparent outline-none text-[15px] text-ink placeholder:text-ink-muted ${className}`}
          {...props}
        />
        {trailing && <span className="shrink-0 flex items-center">{trailing}</span>}
      </div>
      {hint && <p className="text-[12px] text-ink-muted mt-1.5">{hint}</p>}
    </label>
  );
}

/* ─── Segmented Sign in / Create account switch ───────────────────────
   The white highlight glides between the tabs. Each tab is its own route, so
   the last tab is remembered and the highlight springs over from it on mount. */
export function AuthTabs({ active }) {
  const still = useReducedMotion();
  const [from] = useState(() => lastAuthTab);
  useEffect(() => { lastAuthTab = active; }, [active]);
  // Warm both routes so switching never flashes a loader.
  useEffect(() => { import('../pages/Login'); import('../pages/Register'); }, []);

  const idx = active === 'register' ? 1 : 0;
  const glide = !still && from && from !== active;
  const base = 'relative z-[1] flex-1 min-w-0 h-10 px-2 rounded-[10px] flex items-center justify-center whitespace-nowrap text-[14px] font-medium transition-colors duration-300';

  return (
    <div className="relative flex p-1 rounded-[12px] bg-[#EFEAE1] mb-7">
      <motion.span
        aria-hidden="true"
        className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-[10px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_6px_16px_-10px_rgba(64,28,62,0.35)]"
        initial={glide ? { x: idx ? '0%' : '100%' } : false}
        animate={{ x: idx ? '100%' : '0%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.9 }}
      />
      {active === 'signin'
        ? <span className={`${base} text-ink`} aria-current="page">Sign in</span>
        : <Link to="/login" className={`${base} text-ink-soft hover:text-ink`}>Sign in</Link>}
      {active === 'register'
        ? <span className={`${base} text-ink`} aria-current="page">Create account</span>
        : <Link to="/register" className={`${base} text-ink-soft hover:text-ink`}>Create account</Link>}
    </div>
  );
}
