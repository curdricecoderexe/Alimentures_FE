/**
 * Tamil Nadu local landing pages: /locations (hub) and /locations/:city.
 *
 * FACTS ONLY. Every page is built from:
 *   - what is true for the whole business (made & dispatched in Chennai, the
 *     product claims shown on the home page, contact details),
 *   - live data (categories, products, PIN-code delivery check, free-delivery
 *     threshold),
 *   - and the optional per-city fields below, which stay null until the
 *     business confirms them. Never put estimates or placeholders here — a null
 *     field simply hides its sentence/FAQ.
 *
 * Place names (areas) are only used as "enter your PIN code" prompts, never as
 * a promise of delivery — the live PIN check is the source of truth.
 */

/** Optional business-confirmed facts for Chennai (home city). */
export const CHENNAI_PAGE = {
  // e.g. '1–2 business days' — the actual delivery time to Chennai PIN codes.
  chennaiDeliveryEta: null,
  // e.g. { address: '…', hours: 'Mon–Sat, 10 AM – 6 PM', mapUrl: 'https://maps.google.com/?q=…' }
  pickup: null,
};

/**
 * Cities, in the order they're listed. `eta` = business-confirmed usual
 * delivery time (null hides it). `samplePin` is a real head-office PIN used as
 * the input placeholder.
 */
export const TN_CITIES = [
  {
    slug: 'chennai', name: 'Chennai', tamil: 'சென்னை', samplePin: '600001', home: true,
    areas: ['Anna Nagar', 'T. Nagar', 'Adyar', 'Velachery', 'Tambaram', 'OMR'],
    intro: 'Chennai is home. Every Alimenture cookie, mix and bake is made in our FSSAI-registered Chennai kitchen and dispatched from here — so Chennai orders travel the shortest distance from our oven to your door.',
    eta: CHENNAI_PAGE.chennaiDeliveryEta,
    pickup: CHENNAI_PAGE.pickup,
  },
  {
    slug: 'coimbatore', name: 'Coimbatore', tamil: 'கோயம்புத்தூர்', samplePin: '641001',
    areas: ['R.S. Puram', 'Gandhipuram', 'Peelamedu', 'Saibaba Colony', 'Singanallur'],
    intro: 'Looking for millet snacks in Coimbatore? Order Alimenture online and we ship your heritage-grain cookies, country-sugar bakes and pantry staples from our Chennai kitchen to Kovai.',
  },
  {
    slug: 'madurai', name: 'Madurai', tamil: 'மதுரை', samplePin: '625001',
    areas: ['Anna Nagar', 'K.K. Nagar', 'Tallakulam', 'Thirunagar', 'Mattuthavani'],
    intro: 'Healthy snacking for Madurai families — Alimenture millet cookies are made without maida or white sugar and shipped from Chennai to your Madurai address.',
  },
  {
    slug: 'trichy', name: 'Trichy', fullName: 'Tiruchirappalli', tamil: 'திருச்சிராப்பள்ளி', samplePin: '620001',
    areas: ['Srirangam', 'Thillai Nagar', 'Cantonment', 'K.K. Nagar', 'Woraiyur'],
    intro: 'Order millet cookies and clean-label bakes in Trichy (Tiruchirappalli). Alimenture ships from its Chennai kitchen to homes and offices across the city.',
  },
  {
    slug: 'tirunelveli', name: 'Tirunelveli', tamil: 'திருநெல்வேலி', samplePin: '627001',
    areas: ['Palayamkottai', 'Tirunelveli Junction', 'Vannarpettai', 'Perumalpuram'],
    intro: 'From Chennai to Nellai — Alimenture delivers heritage-millet cookies, A2 ghee and country-sugar treats to Tirunelveli and Palayamkottai.',
  },
  {
    slug: 'salem', name: 'Salem', tamil: 'சேலம்', samplePin: '636001',
    areas: ['Fairlands', 'Hasthampatti', 'Alagapuram', 'Suramangalam'],
    intro: 'Millet cookies for Salem, made the honest way: ten heritage grains, country sugar instead of white sugar, and no maida — shipped from Chennai.',
  },
  {
    slug: 'erode', name: 'Erode', tamil: 'ஈரோடு', samplePin: '638001',
    areas: ['Perundurai Road', 'Brough Road', 'Surampatti', 'Veerappanchatram'],
    intro: 'Order Alimenture in Erode — wholesome millet cookies and bakes with nothing to hide, delivered from our Chennai kitchen.',
  },
  {
    slug: 'tiruppur', name: 'Tiruppur', tamil: 'திருப்பூர்', samplePin: '641601',
    areas: ['Avinashi Road', 'Kumaran Road', 'Palladam Road', 'Mangalam Road'],
    intro: 'Healthy snacks for busy Tiruppur days: Alimenture millet cookies and pantry staples, shipped from Chennai to your door.',
  },
  {
    slug: 'vellore', name: 'Vellore', tamil: 'வேலூர்', samplePin: '632001',
    areas: ['Katpadi', 'Sathuvachari', 'Gandhi Nagar', 'Bagayam'],
    intro: 'Alimenture delivers to Vellore and Katpadi — millet and heritage-rice cookies sweetened with country sugar, made fresh in Chennai.',
  },
  {
    slug: 'thanjavur', name: 'Thanjavur', tamil: 'தஞ்சாவூர்', samplePin: '613001',
    areas: ['Medical College Road', 'Nanjikottai Road', 'Srinivasapuram', 'Rajappa Nagar'],
    intro: 'Heritage grains for the rice bowl of Tamil Nadu — order Alimenture millet and native-rice cookies in Thanjavur, shipped from Chennai.',
  },
  {
    slug: 'thoothukudi', name: 'Thoothukudi', fullName: 'Thoothukudi (Tuticorin)', tamil: 'தூத்துக்குடி', samplePin: '628001',
    areas: ['Millerpuram', 'Bryant Nagar', 'Spic Nagar', 'Muthammal Colony'],
    intro: 'Order Alimenture in Thoothukudi (Tuticorin) — clean-label millet cookies and bakes delivered from our Chennai kitchen.',
  },
  {
    slug: 'nagercoil', name: 'Nagercoil', fullName: 'Nagercoil (Kanyakumari)', tamil: 'நாகர்கோவில்', samplePin: '629001',
    areas: ['Vadasery', 'Kottar', 'Parvathipuram', 'Chettikulam'],
    intro: 'All the way to the southern tip — Alimenture ships millet cookies and country-sugar treats to Nagercoil and Kanyakumari district.',
  },
  {
    slug: 'dindigul', name: 'Dindigul', tamil: 'திண்டுக்கல்', samplePin: '624001',
    areas: ['Begambur', 'Nagal Nagar', 'Palani Road', 'R.M. Colony'],
    intro: 'Millet snacks in Dindigul without the maida and white sugar — order Alimenture online, shipped from Chennai.',
  },
  {
    slug: 'hosur', name: 'Hosur', tamil: 'ஓசூர்', samplePin: '635109',
    areas: ['Mathigiri', 'Bagalur Road', 'Rayakottai Road', 'Sipcot'],
    intro: 'Hosur, order Alimenture heritage-grain cookies and pantry staples online — made in Chennai and delivered to your address.',
  },
  {
    slug: 'kanchipuram', name: 'Kanchipuram', tamil: 'காஞ்சிபுரம்', samplePin: '631501',
    areas: ['Pillaiyarpalayam', 'Gandhi Road', 'Sevilimedu', 'Orikkai'],
    intro: 'Close to our Chennai kitchen — Alimenture millet cookies and bakes delivered to Kanchipuram homes and offices.',
  },
];

export const cityBySlug = (slug) => TN_CITIES.find((c) => c.slug === String(slug || '').toLowerCase()) || null;
export const cityPath = (slug) => `/locations/${slug}`;
export const LOCATIONS_PATH = '/locations';

/** Tamil search terms people actually use, shown on every local page (and in its meta). */
export const TAMIL_TERMS = [
  { ta: 'சிறுதானிய பிஸ்கட்', en: 'millet biscuits' },
  { ta: 'கேழ்வரகு', en: 'ragi' },
  { ta: 'தினை', en: 'foxtail millet (thinai)' },
  { ta: 'கம்பு', en: 'pearl millet (kambu)' },
  { ta: 'வரகு', en: 'kodo millet (varagu)' },
  { ta: 'நாட்டுச் சர்க்கரை', en: 'country sugar' },
  { ta: 'நெய்', en: 'ghee' },
  { ta: 'தேன்', en: 'honey' },
];

/** Page copy shared by the React page and the prerender script (keeps them identical for Google). */
export function cityMeta(city) {
  return {
    title: `Millet Cookies & Healthy Snacks in ${city.name} | Alimenture`,
    description: `Order millet cookies, A2 ghee, raw honey and country-sugar bakes online in ${city.name}. No maida, no white sugar — made in Chennai, delivered across Tamil Nadu.`,
    h1: `Millet cookies & healthy snacks in ${city.name}`,
  };
}

export const HUB_META = {
  title: 'Millet Cookies Delivered Across Tamil Nadu | Alimenture',
  description: 'Alimenture delivers millet cookies, A2 ghee, honey and clean-label bakes to Chennai, Coimbatore, Madurai, Trichy, Tirunelveli, Salem and across Tamil Nadu.',
  h1: 'Healthy millet snacks, delivered across Tamil Nadu',
};

/** FAQs — answers only state what is true everywhere, plus optional confirmed facts. */
export function cityFaqs(city, { freeAbove = null, hampersVisible = false } = {}) {
  const full = city.fullName || city.name;
  return [
    {
      q: `Do you deliver to ${city.name}?`,
      a: city.home
        ? 'Yes — Chennai is where our kitchen is and every order ships from here. Enter your PIN code above to confirm delivery to your address.'
        : `Yes, we ship across Tamil Nadu from our Chennai kitchen, including ${full}. Enter your PIN code above to confirm delivery and see the charge for your address.`,
    },
    city.eta && { q: `How long does delivery to ${city.name} take?`, a: `Orders to ${city.name} usually arrive in ${city.eta}.` },
    {
      q: `How much does delivery to ${city.name} cost?`,
      a: `The delivery charge is calculated at checkout from your PIN code and order weight${freeAbove ? `, and orders above ₹${freeAbove} ship free` : ''}.`,
    },
    city.pickup && { q: 'Can I collect my order in person?', a: `Yes — pickup is available at ${city.pickup.address}${city.pickup.hours ? ` (${city.pickup.hours})` : ''}.` },
    {
      q: 'Are Alimenture cookies made with maida or white sugar?',
      a: 'No. Our cookies use heritage millets and native rice instead of maida, and are sweetened with country sugar (nattu sakkarai) instead of white sugar.',
    },
    {
      q: 'Where are your products made?',
      a: 'Everything is made in our FSSAI-registered kitchen in Chennai and dispatched from there.',
    },
    hampersVisible && {
      q: `Can I order gift hampers or bulk orders for ${city.name}?`,
      a: 'Yes — use the bulk order form on our Gift Hampers page and our team will get back to you.',
    },
  ].filter(Boolean);
}
