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
        display: ['"Playfair Display"', 'serif'],
        sans: ['"Outfit"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          dark:       '#000000', // Pure obsidian black
          cardBg:     '#0A0A0A', // Luxury deep obsidian charcoal
          pink:       '#E91E8C', // Solid brand pink
          gold:       '#D4AF37', // Solid luxury gold
          silver:     '#F3F4F6', // Pure soft white/silver
          muted:      '#888888', // Soft neutral gray
          border:     'rgba(255, 255, 255, 0.08)', // Thin white glass line
        }
      },
      animation: {
        'float':      'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'spin-slow':  'spin 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-15px)' },
        },
        glowPulse: {
          '0%,100%': { boxShadow: '0 0 15px rgba(212,175,55,0.05)' },
          '50%':     { boxShadow: '0 0 35px rgba(212,175,55,0.18), 0 0 60px rgba(255,255,255,0.05)' },
        },
      },
    },
  },
  plugins: [],
}