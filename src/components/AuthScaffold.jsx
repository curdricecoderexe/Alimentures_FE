import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Star, ShieldCheck, Lock } from 'lucide-react';
import logo from '../assets/logo.png';
import brandPhotoDefault from '../assets/login.png';
import { Field, ORB_BERRY, ORB_GOLD } from './ui/motion';
import { useAppearance } from '../lib/appearance';

const EASE = [0.16, 1, 0.3, 1];

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

  return (
    <div className="relative min-h-screen grid lg:grid-cols-[minmax(0,1fr)_600px] bg-cream font-sans text-ink overflow-hidden">
      {/* ══════════ Brand panel ══════════ */}
      <div className="relative hidden lg:flex flex-col justify-between p-14 xl:p-16 text-white overflow-hidden foil-top bg-[#5F0634]">
        {/* lifestyle photo */}
        <img
          src={brandPhoto}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105"
        />
        {/* berry scrim — keeps the panel on-brand and the copy legible while the
            warm cookie tones read through the middle band */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(157deg, rgba(121,8,63,0.92) 0%, rgba(165,13,90,0.72) 46%, rgba(80,5,44,0.95) 100%)' }}
          aria-hidden="true"
        />
        <Field
          orbs={[
            { size: 460, color: 'rgba(215,169,78,.28)', top: -160, left: -130 },
            { size: 400, color: 'rgba(244,166,200,.20)', bottom: -180, right: -130 },
          ]}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(120% 78% at 12% 4%, transparent 38%, rgba(35,3,20,.42) 100%)' }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-x-0 bottom-0 h-2/5 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(52,4,29,0.72), transparent)' }}
          aria-hidden="true"
        />

        <div className="relative z-[2]">
          <img src={logo} alt="Alimenture" className="h-11 w-auto object-contain brightness-0 invert opacity-95" />
        </div>

        <motion.div
          initial={still ? false : { opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: EASE }}
          className="relative z-[2] flex flex-col gap-6 max-w-lg"
        >
          <span
            className="self-start inline-flex items-center gap-2 h-8 px-3.5 rounded-full text-[10px] font-extrabold uppercase tracking-[0.16em] backdrop-blur-md"
            style={{ background: 'rgba(255,255,255,.13)', border: '1px solid rgba(255,255,255,.22)', color: '#F2C24C' }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#F2C24C' }} />
            Heritage grains · Since 2023
          </span>

          <h2 className="display-lg text-[2.9rem] xl:text-[3.2rem] leading-[1.04] text-balance">
            Crafting grains<br />
            <span style={{ color: '#F2C24C' }}>into gold</span>
          </h2>

          <p className="text-white/75 text-[15px] leading-relaxed">
            Track orders, save your addresses and reorder your clean&#8209;label favourites in a single tap.
          </p>

          <div
            className="mt-2 rounded-2xl p-5 backdrop-blur-md"
            style={{ background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.16)' }}
          >
            <div className="flex gap-1 mb-2.5" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="h-3.5 w-3.5" style={{ fill: '#F2C24C', color: '#F2C24C' }} />
              ))}
            </div>
            <p className="text-[13.5px] leading-relaxed text-white/85">
              &ldquo;Genuinely clean ingredients and the millet cookies are unreal. Reordering is one tap now.&rdquo;
            </p>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/55 mt-3">
              Sriram · Verified buyer
            </p>
          </div>
        </motion.div>

        <div className="relative z-[2] flex gap-10 pt-6 border-t border-white/15">
          {[['10+', 'Heritage grains'], ['FSSAI', 'Registered FBO'], ['4.8★', 'Avg. rating']].map(([n, l]) => (
            <div key={l}>
              <p className="display-md text-2xl" style={{ color: '#F2C24C' }}>{n}</p>
              <p className="text-[12px] text-white/65 mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════ Form panel ══════════ */}
      <div className="relative flex items-center justify-center p-6 sm:p-12 overflow-hidden">
        <Field
          orbs={[
            { size: 520, color: ORB_BERRY, top: -170, right: -170 },
            { size: 440, color: ORB_GOLD, bottom: -170, left: -150 },
          ]}
        />

        <motion.div
          initial={still ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative z-[2] w-full max-w-[420px]"
        >
          <div className="lg:hidden flex justify-center mb-7">
            <img src={logo} alt="Alimenture" className="h-14 w-auto object-contain drop-shadow-sm" />
          </div>

          {children}

          <div className="flex items-center justify-center gap-x-5 gap-y-2 flex-wrap mt-6">
            {[
              [ShieldCheck, 'Encrypted session'],
              [Lock, 'Razorpay secured'],
            ].map(([Icon, label]) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-leaf" />
                <p className="text-[10px] font-bold text-ink-soft uppercase tracking-[0.13em]">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Shared field ────────────────────────────────────────────────────────
   The exact input treatment from the login screen: kicker label, a paper
   pill with a berry leading icon and an optional trailing slot.           */
export function AuthField({ label, labelAction, icon: Icon, trailing, hint, className = '', ...props }) {
  return (
    <label className="block">
      {labelAction ? (
        <span className="flex items-center justify-between mb-1.5">
          <span className="kicker text-ink-soft text-[9.5px]">{label}</span>
          {labelAction}
        </span>
      ) : (
        label && <span className="kicker text-ink-soft text-[9.5px] mb-1.5 block">{label}</span>
      )}
      <div className="flex items-center gap-3 h-[52px] px-4 rounded-2xl bg-paper border border-hairline transition-all focus-within:border-berry/50 focus-within:ring-4 focus-within:ring-berry/10">
        {Icon && <Icon className="h-[17px] w-[17px] text-berry shrink-0" />}
        <input
          className={`flex-1 bg-transparent outline-none text-[14.5px] font-medium placeholder:text-ink-muted ${className}`}
          {...props}
        />
        {trailing}
      </div>
      {hint && <p className="text-[10.5px] text-ink-muted font-medium mt-1.5 ml-1">{hint}</p>}
    </label>
  );
}

/* ─── Segmented Sign in / Create account toggle ───────────────────────── */
export function AuthTabs({ active }) {
  const base = 'flex-1 h-9 rounded-full flex items-center justify-center text-[10.5px] font-extrabold uppercase tracking-[0.14em] transition-colors';
  return (
    <div className="glass-sm flex p-1 rounded-full mb-8">
      {active === 'signin' ? (
        <span className={`btn-berry ${base}`}>Sign in</span>
      ) : (
        <Link to="/login" className={`${base} text-ink-muted hover:text-berry`}>Sign in</Link>
      )}
      {active === 'register' ? (
        <span className={`btn-berry ${base}`}>Create account</span>
      ) : (
        <Link to="/register" className={`${base} text-ink-muted hover:text-berry`}>Create account</Link>
      )}
    </div>
  );
}
