/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, ChevronRight, Shield, BarChart2, Target, Sliders } from 'lucide-react';
import { recordConsent } from '../lib/analytics';

const CONSENT_KEY = '__alim_consent';
const CONSENT_DURATION = 365 * 24 * 60 * 60 * 1000; // 12 months

function isConsentValid() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    const c = JSON.parse(raw);
    return c && c.expiresAt && Date.now() < c.expiresAt;
  } catch { return false; }
}

const COOKIE_TYPES = [
  {
    id:       'essential',
    label:    'Essential Cookies',
    desc:     'Required for the website to function. Cannot be disabled.',
    icon:     Shield,
    color:    '#10b981',
    required: true,
  },
  {
    id:    'analytics',
    label: 'Analytics Cookies',
    desc:  'Help us understand how visitors interact with our website to improve performance.',
    icon:  BarChart2,
    color: '#920075',
  },
  {
    id:    'marketing',
    label: 'Marketing Cookies',
    desc:  'Used to deliver relevant advertisements and track campaign performance.',
    icon:  Target,
    color: '#D4AF37',
  },
  {
    id:    'preferences',
    label: 'Preference Cookies',
    desc:  'Remember your settings like language and region for a personalised experience.',
    icon:  Sliders,
    color: '#6366f1',
  },
];

export default function CookieConsent() {
  const [visible, setVisible]   = useState(false);
  const [mode, setMode]         = useState('banner'); // 'banner' | 'customize'
  const [prefs, setPrefs]       = useState({
    essential:   true,
    analytics:   false,
    marketing:   false,
    preferences: false,
  });

  useEffect(() => {
    if (!isConsentValid()) {
      // Delay to not block first render
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const save = (decision, overrides = {}) => {
    const consent = {
      decision,
      essential:   true,
      analytics:   decision === 'all' ? true : (overrides.analytics   ?? prefs.analytics),
      marketing:   decision === 'all' ? true : (overrides.marketing   ?? prefs.marketing),
      preferences: decision === 'all' ? true : (overrides.preferences ?? prefs.preferences),
    };
    recordConsent(consent); // recordConsent now dispatches 'alim_consent_granted' internally
    setVisible(false);
  };

  const toggle = (id) => {
    if (id === 'essential') return;
    setPrefs(p => ({ ...p, [id]: !p[id] }));
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="cookie-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-end sm:items-end justify-center sm:justify-end p-4 sm:p-6 pointer-events-none"
      >
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.96 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="pointer-events-auto w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.18)] border border-white/80 overflow-hidden"
        >
          {/* Gradient accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-[#920075] via-[#D4AF37] to-[#6366f1]" />

          {mode === 'banner' ? (
            /* ── BANNER MODE ─────────────────────────────────── */
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#920075]/10 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-[#920075]" />
                    </div>
                    <h3 className="font-bold text-base text-[#0a0806]">We value your privacy</h3>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    We use cookies to enhance your experience, analyse site traffic, and personalise content.
                    Your consent choices are stored for 12 months and can be changed at any time.
                  </p>
                </div>
              </div>

              {/* Quick Cookie Summary */}
              <div className="grid grid-cols-2 gap-2">
                {COOKIE_TYPES.map(c => {
                  const Icon = c.icon;
                  return (
                    <div key={c.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
                      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: c.color }} />
                      <span className="text-[10px] font-bold text-gray-600 truncate">{c.label.replace(' Cookies', '')}</span>
                      {c.required && <span className="ml-auto text-[8px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full">Always</span>}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => save('all')}
                  className="w-full h-11 rounded-xl bg-[#920075] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#7a0062] transition-all shadow-sm"
                >
                  Accept All Cookies
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => save('essential', { analytics: false, marketing: false, preferences: false })}
                    className="flex-1 h-10 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    Reject Non-Essential
                  </button>
                  <button
                    onClick={() => setMode('customize')}
                    className="flex-1 h-10 rounded-xl border border-[#920075]/30 text-xs font-bold text-[#920075] hover:bg-[#920075]/5 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Customize
                  </button>
                </div>
              </div>

              <p className="text-[9px] text-gray-400 text-center font-medium">
                By using this site you agree to our{' '}
                <a href="/privacy" className="text-[#920075] hover:underline">Privacy Policy</a>
                {' '}and{' '}
                <a href="/cookies" className="text-[#920075] hover:underline">Cookie Policy</a>.
              </p>
            </div>
          ) : (
            /* ── CUSTOMIZE MODE ──────────────────────────────── */
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMode('banner')}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
                <div>
                  <h3 className="font-bold text-sm text-[#0a0806]">Cookie Preferences</h3>
                  <p className="text-[10px] text-gray-400 font-medium">Customise which cookies you allow</p>
                </div>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {COOKIE_TYPES.map(ct => {
                  const Icon = ct.icon;
                  const enabled = prefs[ct.id];
                  return (
                    <div
                      key={ct.id}
                      className={`p-4 rounded-2xl border transition-all ${enabled ? 'border-[#920075]/25 bg-[#920075]/3' : 'border-gray-100 bg-gray-50/60'}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: ct.color + '15' }}>
                            <Icon className="w-3.5 h-3.5" style={{ color: ct.color }} />
                          </div>
                          <span className="text-xs font-bold text-[#0a0806]">{ct.label}</span>
                        </div>

                        {/* Toggle Switch */}
                        <button
                          onClick={() => toggle(ct.id)}
                          disabled={ct.required}
                          className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${
                            ct.required ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                          } ${enabled ? 'bg-[#920075]' : 'bg-gray-200'}`}
                          style={{ height: '22px', width: '40px' }}
                          aria-label={`Toggle ${ct.label}`}
                        >
                          <span
                            className="absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform duration-200"
                            style={{
                              width: '18px',
                              height: '18px',
                              transform: enabled ? 'translateX(18px)' : 'translateX(0)',
                            }}
                          />
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed font-medium pl-9">{ct.desc}</p>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => save('all')}
                  className="flex-1 h-10 rounded-xl bg-[#920075] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#7a0062] transition-all"
                >
                  Accept All
                </button>
                <button
                  onClick={() => save('custom')}
                  className="flex-1 h-10 rounded-xl border border-gray-200 text-[10px] font-bold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Save My Choices
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── HOOK: re-open consent panel ─────────────────────────────────────────────
export function useCookieSettings() {
  return () => localStorage.removeItem(CONSENT_KEY);
}
