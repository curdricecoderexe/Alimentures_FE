/**
 * Social platforms the footer can show. The admin picks platforms + URLs in
 * Admin → Social Links (stored on settings/storefront.socialLinks); keep the
 * ids in sync with SOCIAL_PLATFORMS in the backend settingsController.
 */

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const SOCIAL_PLATFORMS = {
  instagram: {
    label: 'Instagram',
    hover: 'hover:text-[#E1306C] hover:border-[#E1306C]/50',
    placeholder: 'https://instagram.com/yourbrand',
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  facebook: {
    label: 'Facebook',
    hover: 'hover:text-[#1877F2] hover:border-[#1877F2]/50',
    placeholder: 'https://facebook.com/yourbrand',
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  youtube: {
    label: 'YouTube',
    hover: 'hover:text-[#FF0000] hover:border-[#FF0000]/50',
    placeholder: 'https://youtube.com/@yourbrand',
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
      </svg>
    ),
  },
  linkedin: {
    label: 'LinkedIn',
    hover: 'hover:text-[#0A66C2] hover:border-[#0A66C2]/50',
    placeholder: 'https://linkedin.com/company/yourbrand',
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  x: {
    label: 'X (Twitter)',
    hover: 'hover:text-white hover:border-white/60',
    placeholder: 'https://x.com/yourbrand',
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <path d="M4 4l16 16M20 4L4 20" strokeWidth="2.2" />
      </svg>
    ),
  },
  whatsapp: {
    label: 'WhatsApp',
    hover: 'hover:text-[#25D366] hover:border-[#25D366]/50',
    placeholder: 'https://wa.me/919999999999',
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <path d="M3 21l1.65-4.95A8.5 8.5 0 1 1 8 19.6L3 21z" />
        <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1c-1-.5-1.5-1-2-2l1-1-1-2L9 9.5z" />
      </svg>
    ),
  },
  pinterest: {
    label: 'Pinterest',
    hover: 'hover:text-[#E60023] hover:border-[#E60023]/50',
    placeholder: 'https://pinterest.com/yourbrand',
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <circle cx="12" cy="12" r="10" />
        <path d="M9.5 21l2-8.5M10 14.5c.5 1 1.5 1.5 2.5 1.5 2.5 0 4-2 4-4.5S14.5 7 12 7s-4.5 2-4.5 4.5c0 1 .3 1.8.8 2.3" />
      </svg>
    ),
  },
  threads: {
    label: 'Threads',
    hover: 'hover:text-white hover:border-white/60',
    placeholder: 'https://threads.net/@yourbrand',
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <path d="M17 11.5c-.5-3-2.5-4.5-5-4.5-3 0-5 2.2-5 5.2C7 15.5 9 18 12.3 18c2.7 0 4.7-1.6 4.7-3.8 0-2-1.6-3.2-4-3.2-1.9 0-3 .9-3 2.1 0 1.1 1 1.9 2.3 1.9 2.2 0 3.2-1.8 3.2-4.5" />
        <path d="M19.5 7A9 9 0 1 0 21 12" />
      </svg>
    ),
  },
  telegram: {
    label: 'Telegram',
    hover: 'hover:text-[#26A5E4] hover:border-[#26A5E4]/50',
    placeholder: 'https://t.me/yourbrand',
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <path d="M22 2L11 13" />
        <path d="M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    ),
  },
};

export const SOCIAL_PLATFORM_IDS = Object.keys(SOCIAL_PLATFORMS);

/** Shown until an admin saves their own list. */
export const DEFAULT_SOCIAL_LINKS = [
  { platform: 'instagram', url: 'https://instagram.com/alimenture', enabled: true },
  { platform: 'facebook', url: 'https://facebook.com/alimenture', enabled: true },
  { platform: 'linkedin', url: 'https://linkedin.com/company/alimenture', enabled: true },
  { platform: 'x', url: 'https://twitter.com/alimenture', enabled: true },
];

/** settings.socialLinks → links to render (defaults when never configured). */
export function resolveSocialLinks(settings) {
  const list = Array.isArray(settings?.socialLinks) ? settings.socialLinks : DEFAULT_SOCIAL_LINKS;
  return list.filter((l) => l && l.enabled !== false && l.url && SOCIAL_PLATFORMS[l.platform]);
}
