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
        // ── Alimenture brand — sampled from public/logo.png (see designs.md) ──
        // Plum #B0128F = logo petals/wordmark (purple end, not the #C80088 pink end)
        // Gold #F8A830 = logo bee + "PRIVATE LIMITED"; cocoa #5C3410 = flower centre.
        // `berry` / `plum` keep their names so existing screens compile.
        paper:   '#FFFDF9',
        cream:   { DEFAULT: '#F7F0E3', deep: '#EBDDC3' },                       // sandal-light page bg
        sandal:  { DEFAULT: '#E6D3B3', light: '#F7F0E3', deep: '#CDB48A', ink: '#6E5A3A' },
        berry:   { DEFAULT: '#B0128F', bright: '#D4148F', deep: '#6A1A8A', tint: '#FBE9F5' }, // logo plum
        gold:    { DEFAULT: '#C7801A', light: '#F8A830', tint: '#FEF3E0' },   // logo amber (bee)
        ink:     { DEFAULT: '#1F1726', soft: '#574D60', muted: '#8A8193' },
        plum:    { DEFAULT: '#7A1E96', deep: '#3A0A40', tint: '#F6E8F6' },   // logo wordmark end
        // Tailwind `violet-*` remapped to logo-plum shades so utility classes stay on-brand.
        violet: { 50:'#FDF2FA', 100:'#FBE9F5', 200:'#F4CBE6', 300:'#E895CF', 400:'#D85AB4', 500:'#D4148F', 600:'#B0128F', 700:'#7A1E96', 800:'#6A1A8A', 900:'#3A0A40', 950:'#2B0B33' },
        // Premium tones: the logo's exact hue (≈310°) at lower saturation.
        mulberry:  { DEFAULT: '#7C276E', deep: '#5F1C54', tint: '#F7EDF6' },  // buttons
        aubergine: { DEFAULT: '#542650', deep: '#401C3E' },                    // footer
        night:   { DEFAULT: '#2B0B33', soft: '#3A1042' },                      // hero / footer brand field
        cocoa:   '#5C3410',
        hairline: '#E6D8BF',
        leaf:    '#2E7D51',
        danger:  '#C0392B',

        // legacy tokens kept so existing admin/staff screens keep compiling
        brand: {
          dark:   '#000000',
          cardBg: '#0A0A0A',
          pink:   '#B0128F', // legacy name — now logo plum
          gold:   '#D4AF37',
          silver: '#F3F4F6',
          muted:  '#888888',
          border: 'rgba(255, 255, 255, 0.08)',
        },
      },
      backgroundImage: {
        'brand': 'linear-gradient(100deg, #D4148F 0%, #B0128F 45%, #6A1A8A 100%)',
        'brand-soft': 'linear-gradient(100deg, #FBE9F5 0%, #F1E6F8 100%)',
      },
      borderRadius: {
        card: '20px',
        panel: '26px',
        hero: '40px',
      },
      boxShadow: {
        glass:    '0 22px 54px -24px rgba(106,26,138,.22), 0 4px 14px -6px rgba(31,23,38,.10), inset 0 1px 0 rgba(255,255,255,.75)',
        'glass-sm': '0 14px 34px -18px rgba(106,26,138,.20), inset 0 1px 0 rgba(255,255,255,.7)',
        'glass-lift': '0 34px 62px -26px rgba(106,26,138,.34), inset 0 1px 0 rgba(255,255,255,.8)',
        berry:    '0 16px 32px -14px rgba(176,18,143,.55), inset 0 1px 0 rgba(255,255,255,.25)',
        'berry-lg': '0 24px 46px -18px rgba(176,18,143,.6), inset 0 1px 0 rgba(255,255,255,.28)',
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
        'ken-burns':   'kenBurns 28s ease-in-out infinite alternate',
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
        kenBurns: { '0%': { transform: 'scale(1.04) translate3d(0,0,0)' }, '100%': { transform: 'scale(1.14) translate3d(-2%,-2%,0)' } },
        pulseRing: {
          '0%':   { boxShadow: '0 0 0 0 rgba(176,18,143,.30)' },
          '70%':  { boxShadow: '0 0 0 14px rgba(176,18,143,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(176,18,143,0)' },
        },
      },
    },
  },
  plugins: [],
}
