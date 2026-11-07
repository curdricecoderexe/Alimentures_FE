/**
 * Alimenture assistant mascot — a friendly little robot with a millet-sprout
 * antenna, in brand berry + gold. Pure SVG so it stays sharp at any size.
 */
export default function BotAvatar({ className = 'w-9 h-9', title = 'Alimenture assistant' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} {...(title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true })}>
      {title && <title>{title}</title>}
      {/* backdrop */}
      <circle cx="32" cy="32" r="32" fill="#FBEFF4" />
      {/* sprout antenna */}
      <path d="M32 17v-6" stroke="#5E8C31" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M32 12c0-4 2.6-6.4 6.8-6.6-.2 4-2.8 6.6-6.8 6.6z" fill="#7DB244" />
      <path d="M32 13.5c0-3.4-2.2-5.4-5.8-5.6.2 3.4 2.4 5.6 5.8 5.6z" fill="#5E8C31" />
      {/* ears */}
      <rect x="9" y="29" width="6" height="12" rx="3" fill="#D7A94E" />
      <rect x="49" y="29" width="6" height="12" rx="3" fill="#D7A94E" />
      {/* head */}
      <rect x="13" y="17" width="38" height="33" rx="13" fill="#A50D5A" />
      <rect x="13" y="17" width="38" height="16" rx="13" fill="#C21A75" opacity=".55" />
      {/* face screen */}
      <rect x="18" y="24" width="28" height="20" rx="9" fill="#FFF8EC" />
      {/* eyes */}
      <ellipse cx="26" cy="32.5" rx="2.6" ry="3.2" fill="#3B0A24" />
      <ellipse cx="38" cy="32.5" rx="2.6" ry="3.2" fill="#3B0A24" />
      <circle cx="26.9" cy="31.3" r=".9" fill="#fff" />
      <circle cx="38.9" cy="31.3" r=".9" fill="#fff" />
      {/* cheeks */}
      <circle cx="22.2" cy="37.6" r="1.9" fill="#F6B5D6" />
      <circle cx="41.8" cy="37.6" r="1.9" fill="#F6B5D6" />
      {/* smile */}
      <path d="M28.5 38.2c1.9 2 5.1 2 7 0" stroke="#3B0A24" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* chin light */}
      <rect x="28" y="52" width="8" height="4" rx="2" fill="#D7A94E" />
    </svg>
  );
}
