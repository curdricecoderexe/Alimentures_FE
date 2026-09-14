/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Display + UI labels use Outfit; body copy uses Plus Jakarta Sans.
        display: ['"Outfit"', 'system-ui', 'sans-serif'],
        sans:    ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        ui:      ['"Outfit"', 'system-ui', 'sans-serif'],
        body:    ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        serif:   ['"Playfair Display"', 'serif'],
      },
      colors: {
        // ── Alimenture light-glass system ──
        paper:   '#FFFFFF',
        cream:   { DEFAULT: '#FBF7EF', deep: '#F4EBDA' },
        berry:   { DEFAULT: '#A50D5A', bright: '#C21A75', deep: '#79083F', tint: '#FBEDF4' },
        gold:    { DEFAULT: '#B27B26', light: '#D7A94E', tint: '#F9F1E1' },
        ink:     { DEFAULT: '#221B1F', soft: '#5A4F55', muted: '#8E848B' },
        hairline: '#EEE6D6',
        leaf:    '#2E7D51',
        danger:  '#C0392B',

        // legacy tokens kept so existing admin/staff screens keep compiling
        brand: {
          dark:   '#000000',
          cardBg: '#0A0A0A',
          pink:   '#E91E8C',
          gold:   '#D4AF37',
          silver: '#F3F4F6',
          muted:  '#888888',
          border: 'rgba(255, 255, 255, 0.08)',
        },
      },
      borderRadius: {
        card: '20px',
        panel: '26px',
      },
      boxShadow: {
        glass:    '0 22px 54px -24px rgba(120,10,64,.22), 0 4px 14px -6px rgba(34,27,31,.10), inset 0 1px 0 rgba(255,255,255,.75)',
        'glass-sm': '0 14px 34px -18px rgba(120,10,64,.20), inset 0 1px 0 rgba(255,255,255,.7)',
        'glass-lift': '0 34px 62px -26px rgba(120,10,64,.34), inset 0 1px 0 rgba(255,255,255,.8)',
        berry:    '0 16px 32px -14px rgba(165,13,90,.55), inset 0 1px 0 rgba(255,255,255,.25)',
        'berry-lg': '0 24px 46px -18px rgba(165,13,90,.6), inset 0 1px 0 rgba(255,255,255,.28)',
      },
      backdropBlur: { glass: '22px' },
      transitionTimingFunction: {
        soft: 'cubic-bezier(0.16, 1, 0.3, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'fade-up':     'fadeUp .7s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':     'fadeIn .6s ease-out both',
        'scale-in':    'scaleIn .5s cubic-bezier(0.16,1,0.3,1) both',
        'orb-drift':   'orbDrift 18s ease-in-out infinite',
        'orb-drift-slow': 'orbDrift 26s ease-in-out infinite',
        'shimmer':     'shimmer 1.8s linear infinite',
        'float':       'float 6s ease-in-out infinite',
        'float-slow':  'float 9s ease-in-out infinite',
        'spin-slow':   'spin 20s linear infinite',
        'gradient-pan': 'gradientPan 6s ease infinite',
        'pulse-ring':  'pulseRing 2.4s cubic-bezier(0.16,1,0.3,1) infinite',
      },
      keyframes: {
        fadeUp:  { '0%': { opacity: '0', transform: 'translateY(26px)' }, '100%': { opacity: '1', transform: 'none' } },
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(.94)' }, '100%': { opacity: '1', transform: 'none' } },
        orbDrift: {
          '0%,100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%':     { transform: 'translate3d(28px,-34px,0) scale(1.08)' },
        },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        float:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-14px)' } },
        gradientPan: { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        pulseRing: {
          '0%':   { boxShadow: '0 0 0 0 rgba(165,13,90,.30)' },
          '70%':  { boxShadow: '0 0 0 14px rgba(165,13,90,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(165,13,90,0)' },
        },
      },
    },
  },
  plugins: [],
}
