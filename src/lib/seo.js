/**
 * seo.js — the single source of SEO metadata (titles, descriptions, URLs,
 * JSON-LD) for the storefront.
 *
 * Pure functions with no browser or Vite dependencies, so the same code runs in
 * the app (via <SEO />) and at build time in scripts/prerender.js. Everything
 * is derived from real catalogue data — nothing here may invent ingredients,
 * claims, prices, ratings or identifiers.
 */

const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};
const nodeEnv = (typeof globalThis.process !== 'undefined' && globalThis.process.env) || {};

export const PRODUCTION_URL = 'https://alimenture.in';

/** Canonical origin. A localhost VITE_APP_URL is ignored in production builds. */
export function resolveSiteUrl(raw, isProd) {
  const url = String(raw || '').trim().replace(/\/+$/, '');
  if (!url) return PRODUCTION_URL;
  if (isProd && /\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(url)) return PRODUCTION_URL;
  return url;
}

export const SITE_URL = resolveSiteUrl(
  env.VITE_APP_URL || nodeEnv.VITE_APP_URL,
  env.PROD ?? nodeEnv.NODE_ENV === 'production',
);

export const BRAND = 'Alimenture';
export const ORG_NAME = 'Alimenture Industries';
export const LEGAL_NAME = 'Alimenture Industries Private Limited';
export const DEFAULT_IMAGE = '/logo.png';
export const LOCALE = 'en_IN';

export const absoluteUrl = (path = '/') =>
  /^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

/** Lowercase, hyphenated URL slug. MUST match the backend's lib/slug.js. */
export const slugify = (text) => String(text || '')
  .normalize('NFKD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80)
  .replace(/-+$/g, '');

// Without a backend-issued slug fall back to the id (the product page then
// redirects to the slug) — a title-derived guess could hit a colliding slug.
export const productPath = (p) => `/products/${p.slug || p.id || p._id || slugify(p.title || p.name)}`;
export const categoryPath = (name) => `/categories/${slugify(name)}`;

/** "TRI-GRAIN GAIN — PREMIUM" -> "Tri-Grain Gain — Premium". Mixed-case text is left alone. */
export function displayName(text) {
  const s = String(text || '').trim();
  const letters = s.replace(/[^A-Za-z]/g, '');
  if (!letters || letters !== letters.toUpperCase()) return s;
  return s.toLowerCase().replace(/(^|[\s(\-–—/&])([a-z])/g, (m, sep, c) => sep + c.toUpperCase())
    .replace(/\b([a-z]\d+|\d+[a-z]+)\b/gi, (w) => w.toUpperCase());
}

const sentence = (text) => {
  const s = displayName(text).replace(/\s+/g, ' ').trim();
  if (!s) return '';
  const lower = s === s.toUpperCase() ? s.toLowerCase() : s;
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

/** Trim to `max` characters on a word boundary. */
export function clip(text, max = 160) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 20)).replace(/[\s,.;:–—-]+$/, '')}…`;
}

const listJoin = (items) => (items.length <= 1 ? items.join('')
  : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);

/** "Key Ingredients: A, B, C." from the admin-entered secondary description. */
export function keyIngredients(p) {
  const m = String(p.secondaryDescription || '').match(/Key Ingredients?\s*:\s*([^\n]+?)(?:\.(?:\s|$)|\n|\s+0%|$)/i);
  if (!m) return [];
  // Split on commas that are not inside brackets: "Nut Blend (A, B)" stays whole.
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of m[1]) {
    if (ch === '(') depth += 1;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim()).filter(Boolean);
}

export function packSizes(p) {
  const sizes = (p.variants || []).map((v) => String(v.weight || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
  return [...new Set(sizes)];
}

/** Lowest live price and stock state, matching what the product card shows. */
export function offerSummary(p) {
  const variants = (p.variants || []).filter((v) => Number(v.price) > 0);
  if (variants.length === 0) {
    const price = Number(p.price) || 0;
    return { low: price, high: price, count: price ? 1 : 0, inStock: Number(p.stock) > 0, variants: [] };
  }
  const prices = variants.map((v) => Number(v.price));
  return {
    low: Math.min(...prices),
    high: Math.max(...prices),
    count: variants.length,
    inStock: variants.some((v) => Number(v.stock) > 0),
    variants,
  };
}

const CATEGORY_NOUN = { cookies: 'Cookies' };

/** e.g. "Tri-Grain Gain — Premium Cookies". */
export function productHeadline(p) {
  const name = displayName(p.title || p.name);
  const noun = CATEGORY_NOUN[slugify(p.category)];
  return noun && !new RegExp(noun.replace(/s$/, ''), 'i').test(name) ? `${name} ${noun}` : name;
}

export function productTitle(p) {
  if (p.seoTitle) return p.seoTitle;
  const head = productHeadline(p);
  const local = `${head} Online in Chennai | ${BRAND}`;
  return local.length <= 66 ? local : `${head} | ${BRAND}`;
}

export function productDescription(p) {
  if (p.seoDescription) return clip(p.seoDescription);
  const name = displayName(p.title || p.name);
  const ingredients = keyIngredients(p);
  const sizes = packSizes(p);
  const { low, count } = offerSummary(p);
  const price = sizes.length && low
    ? `${sizes.join(' / ')} pack${sizes.length > 1 ? 's' : ''}${count > 1 ? ' from' : ','} ₹${low}.`
    : (low ? `₹${low}.` : '');
  const tails = ['Made in Chennai — order online with delivery across India.', 'Made in Chennai, delivered across India.', 'Made in Chennai.'];
  // Prefer more ingredients, then the longest closing line that still fits.
  for (let n = Math.min(ingredients.length, 5); n >= (ingredients.length ? 2 : 0); n -= 1) {
    const lead = ingredients.length
      ? `${name} made with ${listJoin(ingredients.slice(0, n))}.`
      : (p.description ? `${name}: ${sentence(p.description).replace(/[.!]+$/, '')}.` : `${name} by ${BRAND}.`);
    for (const tail of tails) {
      const text = [lead, price, tail].filter(Boolean).join(' ');
      if (text.length <= 160) return text;
    }
    if (!ingredients.length) break;
  }
  return clip(`${name}. ${price} Made in Chennai.`);
}

const IMAGE_EXT = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif' };

/** Extension for an inline base64 image, or null if it isn't one. */
export const dataUriExt = (src) => {
  const m = /^data:(image\/[a-z+]+);base64,/i.exec(String(src || ''));
  return m ? IMAGE_EXT[m[1].toLowerCase()] || null : null;
};

/**
 * Crawlable URL for a product photo. Catalogue photos are stored inline as
 * base64, which search engines cannot index, so the build (scripts/prerender.js)
 * writes each one to /images/products/<slug>[-n].<ext>; this returns that path.
 */
export function productImagePath(p, src, index = 0) {
  if (typeof src !== 'string' || !src) return null;
  const ext = dataUriExt(src);
  if (!ext) return src.startsWith('data:') ? null : src;
  const slug = productPath(p).split('/').pop();
  return `/images/products/${slug}${index ? `-${index + 1}` : ''}.${ext}`;
}

/** Product image URLs usable by search engines. */
export function publicImages(p) {
  return [p.image, p.secondaryImage]
    .map((src, i) => productImagePath(p, src, i))
    .filter(Boolean)
    .map(absoluteUrl);
}

export function productJsonLd(p) {
  const url = absoluteUrl(productPath(p));
  const { low, high, count, inStock, variants } = offerSummary(p);
  const availability = (ok) => `https://schema.org/${ok ? 'InStock' : 'OutOfStock'}`;
  const offerFor = (price, ok, extra = {}) => ({
    '@type': 'Offer',
    url,
    priceCurrency: 'INR',
    price: String(price),
    availability: availability(ok),
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@type': 'Organization', name: ORG_NAME },
    ...extra,
  });

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: displayName(p.title || p.name),
    description: clip([p.description && sentence(p.description), String(p.secondaryDescription || '').replace(/\s*\n+\s*/g, '. ')]
      .filter(Boolean).join('. ').replace(/\.\s*\./g, '.').replace(/:\.\s*/g, ': '), 5000),
    sku: (variants[0] && variants[0].sku) || p.sku || p.id,
    brand: { '@type': 'Brand', name: BRAND },
    url,
  };
  const imgs = publicImages(p);
  if (imgs.length) data.image = imgs;
  if (p.category) data.category = p.category;

  if (count > 1) {
    data.offers = {
      '@type': 'AggregateOffer',
      priceCurrency: 'INR',
      lowPrice: String(low),
      highPrice: String(high),
      offerCount: String(count),
      availability: availability(inStock),
      offers: variants.map((v) => offerFor(v.price, Number(v.stock) > 0, v.sku ? { sku: v.sku } : {})),
    };
  } else if (low) {
    data.offers = offerFor(low, inStock);
  }

  const reviewCount = Number(p.reviewCount) || 0;
  if (reviewCount > 0 && Number(p.averageRating) > 0) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: String(p.averageRating),
      reviewCount: String(reviewCount),
      bestRating: '5',
      worstRating: '1',
    };
  }
  return data;
}

/** [{ name, path }] -> BreadcrumbList. Must mirror the visible breadcrumb. */
export function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export const productBreadcrumbs = (p) => [
  { name: 'Home', path: '/' },
  { name: 'Shop', path: '/shop' },
  ...(p.category ? [{ name: p.category, path: categoryPath(p.category) }] : []),
  { name: displayName(p.title || p.name), path: productPath(p) },
];

export function organizationJsonLd({ email, phones = [] } = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: ORG_NAME,
    legalName: LEGAL_NAME,
    alternateName: BRAND,
    url: `${SITE_URL}/`,
    logo: absoluteUrl(DEFAULT_IMAGE),
    foundingDate: '2023-12',
    address: { '@type': 'PostalAddress', addressLocality: 'Chennai', addressRegion: 'Tamil Nadu', addressCountry: 'IN' },
    areaServed: [{ '@type': 'State', name: 'Tamil Nadu' }, { '@type': 'Country', name: 'India' }],
    knowsLanguage: ['en', 'ta'],
    ...(email || phones.length ? {
      contactPoint: phones.map((telephone) => ({
        '@type': 'ContactPoint',
        telephone: telephone.replace(/\s+/g, ''),
        contactType: 'customer service',
        areaServed: 'IN',
        availableLanguage: ['en', 'ta'],
        ...(email ? { email } : {}),
      })),
    } : {}),
  };
}

/** FAQPage rich result from [{ q, a }]. */
export function faqJsonLd(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
}

/**
 * Local landing page: a WebPage about the (online) store serving a city or the
 * whole state. Uses OnlineStore — not LocalBusiness — because orders ship from
 * Chennai; we don't claim a physical branch anywhere else.
 */
export function localPageJsonLd({ path, title, description, places }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${absoluteUrl(path)}#webpage`,
    url: absoluteUrl(path),
    name: title,
    description,
    inLanguage: 'en-IN',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: {
      '@type': 'OnlineStore',
      '@id': `${SITE_URL}/#organization`,
      name: ORG_NAME,
      url: `${SITE_URL}/`,
      areaServed: places.map((p) => ({ '@type': p.type || 'City', name: p.name, ...(p.containedIn ? { containedInPlace: { '@type': 'State', name: p.containedIn } } : {}) })),
    },
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: BRAND,
    url: `${SITE_URL}/`,
    inLanguage: 'en-IN',
    publisher: { '@id': `${SITE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/shop?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export const HOME_SEO = {
  title: `Millet Cookies, Ghee, Honey & Healthy Bakes in Chennai | ${BRAND}`,
  description: 'Millet & heritage-rice cookies made with country sugar, plus A2 ghee, raw forest honey and bakes. Made in Chennai, delivered across Tamil Nadu and India.',
};

export const ABOUT_SEO = {
  title: `About Us — Our Story, Commitment & 3S Philosophy | ${BRAND}`,
  description: 'Who we are: a Chennai food company reviving heritage millets with clean-label recipes — our story, our 3S philosophy, and our commitment to farmers and a healthier India.',
};

export const WHY_CHOOSE_SEO = {
  title: `Why Choose Us — Clean Snacks from Heritage Grains | ${BRAND}`,
  description: "Why families choose Alimenture: Alchemi's clean-label cookies, ten ancient super grains and an honest farm-to-pantry process with nothing hidden.",
};

/** "<title> | Alimenture" when that fits Google's ~60-character display, else the title alone. */
export const pageTitle = (title, max = 62) => (`${title} | ${BRAND}`.length <= max ? `${title} | ${BRAND}` : title);

/** Policy meta description: the summary, padded with context when it's too short to be useful. */
export const policyDescription = (pol) => (String(pol.summary || '').length >= 70
  ? pol.summary
  : `${pol.name}: ${pol.summary} Read the full ${pol.name.toLowerCase()} of ${ORG_NAME}, Chennai.`);

export const BLOG_SEO = {
  title: `The Grain Journal: Millet Recipes & Guides | ${BRAND}`,
  description: 'Stories, recipes and guides from the Alimenture kitchen: millets for beginners, heritage rices of Tamil Nadu, mindful snacking and thoughtful gifting.',
};

export const HAMPERS_SEO = {
  title: `Gift Hampers — Festive, Corporate & Wellness Hampers | ${BRAND}`,
  description: 'Curated gift hampers of millet cookies, raw honey, jaggery and health mixes. Festive, corporate and wellness boxes, personalised and shipped across India.',
};

/** Article JSON-LD for a blog post (src/data/blog.js). */
export function articleJsonLd(post, image) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Organization', name: post.author || ORG_NAME },
    publisher: { '@id': `${SITE_URL}/#organization` },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    ...(image ? { image: absoluteUrl(image) } : {}),
  };
}

export const SHOP_SEO = {
  title: `Shop Millet Cookies, Ghee, Honey & More | ${BRAND}`,
  description: 'Browse every Alimenture product: millet and heritage-rice cookies, A2 ghee, raw forest honey, country sugar and baked treats. Made in Chennai, delivered across India.',
};
