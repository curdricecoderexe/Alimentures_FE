/*
 * Curated gift hampers.
 *
 * Hampers are made to order, so they are enquired about over WhatsApp rather
 * than bought through the cart. `price` is optional: set a number (₹) to show
 * "From ₹…" on the card, or leave it null to show "Custom quote".
 * `image` is a key into HAMPER_IMAGES in src/pages/customer/Hampers.jsx.
 */

export const HAMPER_WHATSAPP = '917358196132';

export const HAMPER_OCCASIONS = ['All', 'Festive', 'Corporate', 'Wellness', 'Celebrations'];

export const HAMPERS = [
  {
    id: 'grainlets-quartet',
    name: 'The Grainlets Quartet',
    tagline: 'All four Alchemi’s cookies in one keepsake box.',
    occasion: 'Festive',
    badge: 'Bestseller',
    price: null,
    image: 'banner',
    tone: 'from-[#3A0A40] via-[#6A1A8A] to-[#B0128F]',
    contents: ['Red Millets Mate', 'Penta Bite', 'Tri-Grain Gain', 'Classic Coclets', 'Personalised message card'],
  },
  {
    id: 'festive-harvest',
    name: 'Festive Harvest',
    tagline: 'A generous spread for Diwali, Pongal and family get-togethers.',
    occasion: 'Festive',
    badge: 'Seasonal',
    price: null,
    image: 'feature',
    tone: 'from-[#5C3410] via-[#C7801A] to-[#F8A830]',
    contents: ['Two jars of millet cookies', 'Raw honey', 'Organic jaggery', 'Health mix', 'Festive wrap & card'],
  },
  {
    id: 'corporate-thank-you',
    name: 'The Thank-You Box',
    tagline: 'Compact, elegant and desk-friendly — made for teams and clients.',
    occasion: 'Corporate',
    badge: 'Bulk friendly',
    price: null,
    image: 'cookies',
    tone: 'from-[#2B0B33] via-[#542650] to-[#7C276E]',
    contents: ['Two jars of millet cookies', 'Your logo on the sleeve', 'Custom note', 'Pan-India dispatch'],
  },
  {
    id: 'wellness-ritual',
    name: 'Wellness Ritual',
    tagline: 'Gentle, nourishing staples for elders and new parents.',
    occasion: 'Wellness',
    badge: null,
    price: null,
    image: 'grains',
    tone: 'from-[#1F3A2B] via-[#2E7D51] to-[#8DBF6A]',
    contents: ['Multi-millet health mix', 'Raw honey', 'Heritage rice cookies', 'Recipe card'],
  },
  {
    id: 'little-joys',
    name: 'Little Joys',
    tagline: 'A sweet, small gesture for birthdays and return gifts.',
    occasion: 'Celebrations',
    badge: null,
    price: null,
    image: 'coclets',
    tone: 'from-[#6A1A8A] via-[#D4148F] to-[#F8A830]',
    contents: ['One jar of Classic Coclets', 'Mini honey', 'Gift tag'],
  },
  {
    id: 'heritage-collection',
    name: 'The Heritage Collection',
    tagline: 'Our most complete box — a tour of Tamil Nadu’s ancient grains.',
    occasion: 'Celebrations',
    badge: 'Premium',
    price: null,
    image: 'heritage',
    tone: 'from-[#3A0A40] via-[#5C3410] to-[#C7801A]',
    contents: ['All four Grainlets', 'Health mix', 'Raw honey', 'Organic jaggery', 'Wooden keepsake crate'],
  },
];

/** wa.me link with a pre-filled enquiry. */
export function hamperEnquiryUrl({ hamper, qty, occasion, note } = {}) {
  const lines = ['Hi Alimenture! I’d like to enquire about gift hampers.'];
  if (hamper) lines.push(`Hamper: ${hamper}`);
  if (qty) lines.push(`Quantity: ${qty}`);
  if (occasion) lines.push(`Occasion: ${occasion}`);
  if (note) lines.push(`Notes: ${note}`);
  return `https://wa.me/${HAMPER_WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`;
}
