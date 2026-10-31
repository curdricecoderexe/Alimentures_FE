/**
 * Category landing-page copy (/categories/<slug>), keyed by category slug.
 *
 * Every statement here must be true of the products currently in that category
 * — it was written from the live catalogue's "Key Ingredients". Update it when
 * the range changes. Categories without an entry get generic copy built from
 * their product names (see categorySeo in scripts/prerender.js and Shop.jsx).
 */
export const CATEGORY_CONTENT = {
  cookies: {
    h1: 'Millet & heritage rice cookies',
    title: 'Millet Cookies Online in Chennai | Alimenture',
    description: 'Cookies baked with millets like ragi, red sorghum and foxtail, or Tamil Nadu heritage rice such as Mapillai Samba — sweetened with country sugar. Made in Chennai.',
    intro: 'Our cookies are baked from millets — finger millet (ragi), red sorghum, foxtail, pearl, little and barnyard millet — or Tamil Nadu heritage rice varieties like Mapillai Samba, Kaattuyaanam and Karunguruvai. Every recipe uses dairy butter and country sugar, with nuts, seeds or fresh coconut depending on the blend. Baked in Chennai and delivered across India.',
  },
  others: {
    h1: 'Ghee, honey, country sugar & bakes',
    title: 'A2 Ghee, Raw Honey, Country Sugar & Cakes | Alimenture',
    description: 'Shop Alimenture A2 ghee, raw multi-flower forest honey, country sugar (nattu sakkarai), wheat banana cake and ragi brownie. Made in Chennai, delivered across India.',
    intro: 'Pantry staples and baked treats from the Alimenture kitchen in Chennai — from slow-clarified A2 ghee and raw forest honey to country sugar, a wheat banana cake and a ragi brownie sweetened with country sugar.',
  },
};

/** Fallback copy for a category with no curated entry. */
export function genericCategoryContent(name, productNames = []) {
  const examples = productNames.slice(0, 4).join(', ');
  return {
    h1: name,
    title: `${name} Online in Chennai | Alimenture`,
    description: examples
      ? `Shop Alimenture ${name.toLowerCase()}: ${examples}. Made in Chennai, delivered across India.`
      : `Shop Alimenture ${name.toLowerCase()}. Made in Chennai, delivered across India.`,
    intro: '',
  };
}
