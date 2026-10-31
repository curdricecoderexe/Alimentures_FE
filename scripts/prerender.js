/**
 * prerender.js — post-build SEO step (runs after `vite build`).
 *
 * The storefront is a client-rendered SPA, so on its own every URL serves the
 * same index.html: same title, no product content, no structured data, and a
 * 200 for URLs that don't exist. This script fixes that from live catalogue data:
 *
 *   dist/<page>.html          per-page head (title, description, canonical, OG,
 *                             JSON-LD) + crawlable fallback content and links
 *   dist/images/products/*    product photos as real files (the API stores them
 *                             as inline base64, which search engines can't index)
 *   dist/sitemap.xml          canonical, indexable URLs with real lastmod + images
 *   dist/robots.txt
 *   dist/_redirects           301s for legacy /product/<id> and renamed slugs,
 *                             real 404 status for unknown URLs (Netlify)
 *   dist/_nginx_redirects.conf  the same 301s for Nginx (deploy/nginx/alimenture.conf
 *                             includes it; reload Nginx after a build)
 *   dist/404.html, _app.html  shells for unknown URLs / private app routes
 *
 * The React app replaces the fallback content on load, and <SEO /> swaps the
 * pre-rendered head tags for its own (same values — both come from src/lib/seo.js).
 *
 * Env: VITE_API_URL (required), VITE_APP_URL (canonical origin; localhost is
 * ignored), CONTEXT (set by Netlify; non-production builds are noindexed),
 * VITE_GSC_VERIFICATION (optional Search Console meta tag token).
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');

// Vite reads .env for the bundle; mirror that for this Node script.
for (const file of ['.env', '.env.production']) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}
process.env.NODE_ENV = 'production';

const seo = await import('../src/lib/seo.js');
const { CATEGORY_CONTENT, genericCategoryContent } = await import('../src/data/categoryContent.js');
const { CHENNAI_PAGE } = await import('../src/data/localSeo.js');
const { POLICIES, SUPPORT_CONTACT } = await import('../src/data/policies.js');

const {
  SITE_URL, BRAND, LOCALE, DEFAULT_IMAGE, absoluteUrl, slugify, productPath, categoryPath,
  displayName, productTitle, productDescription, productJsonLd, breadcrumbJsonLd,
  productBreadcrumbs, organizationJsonLd, websiteJsonLd, publicImages, productImagePath,
  dataUriExt, offerSummary, packSizes, keyIngredients, HOME_SEO, SHOP_SEO,
} = seo;

const API = (process.env.VITE_API_URL || '').replace(/\/+$/, '');
const IS_LIVE = !process.env.CONTEXT || process.env.CONTEXT === 'production';

const fail = (msg) => { console.error(`✖ prerender: ${msg}`); process.exit(1); };
if (!API) fail('VITE_API_URL is not set.');
if (!fs.existsSync(path.join(DIST, 'index.html'))) fail('dist/index.html missing — run `vite build` first.');

// ─── Data ────────────────────────────────────────────────────────────────────
// The API host may be cold-starting (Render) — retry before giving up. Failing
// the build is deliberate: Netlify then keeps serving the previous deploy rather
// than one with no products in it.
async function getJson(url, attempts = 6) {
  for (let i = 1; ; i += 1) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i >= attempts) throw new Error(`${url}: ${err.message}`);
      await new Promise((r) => setTimeout(r, Math.min(5000 * i, 20000)));
    }
  }
}

let products;
let categories;
try {
  const list = await getJson(`${API}/products?limit=100`);
  if (!list?.success) throw new Error('product list request failed');
  if (list.data.length >= 100) console.warn('⚠ prerender: 100+ products — paginate the product fetch.');
  // Details carry the extra photos the list omits.
  products = await Promise.all(list.data.map(async (p) => {
    const full = await getJson(`${API}/products/${encodeURIComponent(p.id)}`);
    return { ...p, ...(full?.data || {}) };
  }));
  categories = (await getJson(`${API}/categories`))?.data || [];
} catch (err) {
  fail(`could not load catalogue from ${API} — ${err.message}`);
}
if (products.length === 0) fail('the API returned no products; refusing to publish an empty storefront.');

const toMs = (t) => {
  if (!t) return 0;
  if (t._seconds !== undefined) return t._seconds * 1000;
  if (t.seconds !== undefined) return t.seconds * 1000;
  return new Date(t).getTime() || 0;
};
const isoDate = (ms) => (ms ? new Date(ms).toISOString().slice(0, 10) : null);

const visibleCategories = categories
  .filter((c) => c.visible !== false)
  .map((c) => ({ ...c, items: products.filter((p) => (p.category || '').trim().toLowerCase() === c.name.trim().toLowerCase()) }))
  .filter((c) => c.items.length > 0);

// ─── HTML helpers ────────────────────────────────────────────────────────────
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsonLdTag = (data) => `<script type="application/ld+json" data-prerender>${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

function headTags({ title, description, pathname, image, imageAlt, type = 'website', jsonLd = [], noindex = false }) {
  const url = pathname ? absoluteUrl(pathname) : null;
  const img = absoluteUrl(image || DEFAULT_IMAGE);
  const robots = noindex || !IS_LIVE ? 'noindex, follow' : 'index, follow, max-image-preview:large';
  return [
    `<title data-prerender>${esc(title)}</title>`,
    description && `<meta name="description" content="${esc(description)}" data-prerender>`,
    url && !noindex && `<link rel="canonical" href="${esc(url)}" data-prerender>`,
    `<meta name="robots" content="${robots}" data-prerender>`,
    `<meta property="og:type" content="${type}" data-prerender>`,
    `<meta property="og:site_name" content="${BRAND}" data-prerender>`,
    `<meta property="og:locale" content="${LOCALE}" data-prerender>`,
    `<meta property="og:title" content="${esc(title)}" data-prerender>`,
    description && `<meta property="og:description" content="${esc(description)}" data-prerender>`,
    url && `<meta property="og:url" content="${esc(url)}" data-prerender>`,
    `<meta property="og:image" content="${esc(img)}" data-prerender>`,
    imageAlt && `<meta property="og:image:alt" content="${esc(imageAlt)}" data-prerender>`,
    '<meta name="twitter:card" content="summary_large_image" data-prerender>',
    `<meta name="twitter:title" content="${esc(title)}" data-prerender>`,
    description && `<meta name="twitter:description" content="${esc(description)}" data-prerender>`,
    `<meta name="twitter:image" content="${esc(img)}" data-prerender>`,
    ...[].concat(jsonLd).filter(Boolean).map(jsonLdTag),
  ].filter(Boolean).join('\n    ');
}

const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
if (!/<title[^>]*>[\s\S]*?<\/title>/.test(template) || !template.includes('<div id="root"></div>')) {
  fail('index.html no longer has a <title> and an empty <div id="root"></div> to fill.');
}
const verification = process.env.VITE_GSC_VERIFICATION
  ? `<meta name="google-site-verification" content="${esc(process.env.VITE_GSC_VERIFICATION)}">\n    `
  : '';

function renderPage(meta, body = '') {
  return template
    .replace(/<title[^>]*>[\s\S]*?<\/title>/, `${verification}${headTags(meta)}`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

const written = [];
function writePage(pathname, meta, body) {
  const file = pathname === '/' ? 'index.html' : `${pathname.replace(/^\//, '')}.html`;
  const out = path.join(DIST, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, renderPage(meta, body));
  written.push(pathname);
}

// Crawlable fallback markup (replaced by React on load).
const link = (href, text) => `<a href="${esc(href)}">${esc(text)}</a>`;
const crumbsHtml = (items) => `<nav aria-label="Breadcrumb">${items.map((c, i) => (i === items.length - 1 ? esc(c.name) : link(c.path, c.name))).join(' / ')}</nav>`;
const navHtml = () => `<nav aria-label="Categories"><ul>${[
  `<li>${link('/', 'Home')}</li>`, `<li>${link('/shop', 'Shop all products')}</li>`,
  ...visibleCategories.map((c) => `<li>${link(categoryPath(c.name), c.name)}</li>`),
].join('')}</ul></nav>`;
const productListHtml = (items) => `<ul>${items.map((p) => {
  const { low, count } = offerSummary(p);
  return `<li>${link(productPath(p), displayName(p.title || p.name))}${low ? ` — ${count > 1 ? 'from ' : ''}₹${low}` : ''}</li>`;
}).join('')}</ul>`;

// ─── Product images → files ──────────────────────────────────────────────────
let imageCount = 0;
for (const p of products) {
  [p.image, p.secondaryImage].forEach((src, i) => {
    if (!dataUriExt(src)) return;
    const rel = productImagePath(p, src, i);
    const out = path.join(DIST, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(src.slice(src.indexOf(',') + 1), 'base64'));
    imageCount += 1;
  });
}

// ─── Pages ───────────────────────────────────────────────────────────────────
const sitemap = []; // { loc, lastmod, images }
const newest = Math.max(...products.map((p) => toMs(p.updatedAt)));

// Home
writePage('/', {
  title: HOME_SEO.title,
  description: HOME_SEO.description,
  pathname: '/',
  jsonLd: [organizationJsonLd({ email: SUPPORT_CONTACT.email, phones: SUPPORT_CONTACT.phones }), websiteJsonLd()],
}, `<main><h1>${esc(BRAND)} — millet cookies, ghee, honey and healthy bakes from Chennai</h1><p>${esc(HOME_SEO.description)}</p>${navHtml()}${productListHtml(products)}</main>`);
sitemap.push({ loc: '/', lastmod: isoDate(newest) });

// Shop
writePage('/shop', { title: SHOP_SEO.title, description: SHOP_SEO.description, pathname: '/shop' },
  `<main><h1>Shop all products</h1><p>${esc(SHOP_SEO.description)}</p>${navHtml()}${productListHtml(products)}</main>`);
sitemap.push({ loc: '/shop', lastmod: isoDate(newest) });

// Categories (only those with products — empty ones 404 via _redirects)
for (const c of visibleCategories) {
  const slug = slugify(c.name);
  const content = CATEGORY_CONTENT[slug] || genericCategoryContent(c.name, c.items.map((p) => displayName(p.title || p.name)));
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Shop', path: '/shop' }, { name: c.name, path: categoryPath(c.name) }];
  writePage(categoryPath(c.name), {
    title: content.title,
    description: content.description,
    pathname: categoryPath(c.name),
    jsonLd: breadcrumbJsonLd(crumbs),
  }, `<main>${crumbsHtml(crumbs)}<h1>${esc(content.h1)}</h1>${content.intro ? `<p>${esc(content.intro)}</p>` : ''}${productListHtml(c.items)}${navHtml()}</main>`);
  sitemap.push({ loc: categoryPath(c.name), lastmod: isoDate(Math.max(...c.items.map((p) => toMs(p.updatedAt)))) });
}

// Products
for (const p of products) {
  const name = displayName(p.title || p.name);
  const crumbs = productBreadcrumbs(p);
  const { low, count, inStock } = offerSummary(p);
  const ingredients = keyIngredients(p);
  const sizes = packSizes(p);
  const related = products.filter((o) => o.id !== p.id && o.category === p.category).slice(0, 4);
  writePage(productPath(p), {
    title: productTitle(p),
    description: productDescription(p),
    pathname: productPath(p),
    type: 'product',
    image: productImagePath(p, p.image),
    imageAlt: `${BRAND} ${name}`,
    jsonLd: [productJsonLd(p), breadcrumbJsonLd(crumbs)],
  }, `<main>${crumbsHtml(crumbs)}<article>
    ${p.image ? `<img src="${esc(productImagePath(p, p.image) || '')}" alt="${esc(`${BRAND} ${name}`)}">` : ''}
    <h1>${esc(name)}</h1>
    ${p.description ? `<p>${esc(p.description)}</p>` : ''}
    ${low ? `<p>${count > 1 ? 'From ' : ''}₹${low}${sizes.length ? ` · ${esc(sizes.join(' / '))}` : ''} · ${inStock ? 'In stock' : 'Sold out'}</p>` : ''}
    ${p.secondaryDescription ? `<h2>About this product</h2><p>${esc(p.secondaryDescription)}</p>` : ''}
    ${ingredients.length ? `<h2>Key ingredients</h2><ul>${ingredients.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}
    ${p.category ? `<p>More in ${link(categoryPath(p.category), p.category)}</p>` : ''}
    ${related.length ? `<h2>You may also like</h2>${productListHtml(related)}` : ''}
  </article></main>`);
  sitemap.push({ loc: productPath(p), lastmod: isoDate(toMs(p.updatedAt)), images: publicImages(p) });
}

// Policies
writePage('/policies', {
  title: `Policies & Legal | ${BRAND}`,
  description: 'Alimenture policies: privacy, terms of service, shipping, returns & refunds, cancellation, and quality guidelines.',
  pathname: '/policies',
}, `<main><h1>Policies &amp; legal</h1><ul>${POLICIES.map((pol) => `<li>${link(`/policies/${pol.slug}`, pol.title)}</li>`).join('')}</ul></main>`);
sitemap.push({ loc: '/policies' });
for (const pol of POLICIES) {
  writePage(`/policies/${pol.slug}`, {
    title: `${pol.title} | ${BRAND}`, description: pol.summary, pathname: `/policies/${pol.slug}`, type: 'article',
  }, `<main><h1>${esc(pol.title)}</h1><p>${esc(pol.summary)}</p>${link('/policies', 'All policies')}</main>`);
  sitemap.push({ loc: `/policies/${pol.slug}` });
}

// Chennai landing page — only once the business has published its facts.
if (CHENNAI_PAGE.published) {
  writePage('/locations/chennai', {
    title: `Millet Cookies, Ghee & Honey Delivered in Chennai | ${BRAND}`,
    description: `Order Alimenture millet cookies, A2 ghee, raw honey and bakes in Chennai. Check delivery to your PIN code.`,
    pathname: '/locations/chennai',
    jsonLd: breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Chennai', path: '/locations/chennai' }]),
  }, `<main><h1>Alimenture in Chennai</h1>${navHtml()}</main>`);
  sitemap.push({ loc: '/locations/chennai' });
}

// Shells: unknown URLs (404) and private app routes (noindex, no canonical).
fs.writeFileSync(path.join(DIST, '404.html'), renderPage({ title: `Page not found | ${BRAND}`, noindex: true }, `<main><h1>Page not found</h1>${navHtml()}</main>`));
fs.writeFileSync(path.join(DIST, '_app.html'), renderPage({ title: BRAND, noindex: true }));

// ─── sitemap.xml ─────────────────────────────────────────────────────────────
const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  ...sitemap.map(({ loc, lastmod, images = [] }) => [
    '  <url>',
    `    <loc>${esc(absoluteUrl(loc))}</loc>`,
    lastmod && `    <lastmod>${lastmod}</lastmod>`,
    ...images.map((src) => `    <image:image><image:loc>${esc(src)}</image:loc></image:image>`),
    '  </url>',
  ].filter(Boolean).join('\n')),
  '</urlset>',
  '',
].join('\n');
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), xml);

// ─── robots.txt ──────────────────────────────────────────────────────────────
// Private pages also carry noindex; disallowing them here just saves crawl budget.
const robots = IS_LIVE ? [
  'User-agent: *',
  'Disallow: /admin',
  'Disallow: /staff',
  'Disallow: /cart',
  'Disallow: /checkout',
  'Disallow: /orders',
  'Disallow: /addresses',
  'Disallow: /wishlist',
  'Disallow: /login',
  'Disallow: /register',
  'Disallow: /forgot-password',
  'Disallow: /reset-password',
  'Disallow: /_app.html',
  '',
  `Sitemap: ${SITE_URL}/sitemap.xml`,
  '',
] : ['# Non-production deploy — keep out of search results.', 'User-agent: *', 'Disallow: /', ''];
fs.writeFileSync(path.join(DIST, 'robots.txt'), robots.join('\n'));

// ─── _redirects ──────────────────────────────────────────────────────────────
// Netlify serves an existing file before applying a (non-forced) rule, so the
// pre-rendered pages above win over the fallbacks below. Order matters.
const appRoutes = ['/cart', '/checkout', '/orders', '/wishlist', '/addresses', '/login', '/register',
  '/forgot-password', '/reset-password', '/admin', '/admin/*', '/staff', '/staff/*'];
const redirects = [
  '# Generated by scripts/prerender.js — do not edit.',
  '# Legacy /product/<id> URLs and renamed slugs → canonical product URL',
  ...products.map((p) => `/product/${p.id}  ${productPath(p)}  301`),
  ...products.flatMap((p) => (p.previousSlugs || [])
    .filter((s) => s && `/products/${s}` !== productPath(p))
    .map((s) => `/products/${s}  ${productPath(p)}  301`)),
  '/shop/  /shop  301',
  '',
  '# Client-only app routes (private; noindex shell)',
  ...appRoutes.map((r) => `${r}  /_app.html  200`),
  '',
  '# Anything else is a real 404 (the SPA still renders it for visitors)',
  '/*  /404.html  404',
  '',
];
fs.writeFileSync(path.join(DIST, '_redirects'), redirects.join('\n'));

// Same permanent redirects for Nginx (exact-match locations, included by the
// server block in deploy/nginx/alimenture.conf).
const nginxSafe = (p) => /^\/[A-Za-z0-9/_-]+$/.test(p);
const nginxRedirects = [
  '# Generated by scripts/prerender.js — do not edit.',
  ...products.map((p) => [`/product/${p.id}`, productPath(p)]),
  ...products.flatMap((p) => (p.previousSlugs || [])
    .filter((s) => s && `/products/${s}` !== productPath(p))
    .map((s) => [`/products/${s}`, productPath(p)])),
].map((r) => (Array.isArray(r) ? (nginxSafe(r[0]) && nginxSafe(r[1]) ? `location = ${r[0]} { return 301 ${r[1]}; }` : '') : r))
  .filter(Boolean);
fs.writeFileSync(path.join(DIST, '_nginx_redirects.conf'), `${nginxRedirects.join('\n')}\n`);

console.log(`✓ prerender: ${written.length} pages, ${imageCount} images, ${sitemap.length} sitemap URLs → ${SITE_URL}${IS_LIVE ? '' : ' (non-production: noindex)'}`);
