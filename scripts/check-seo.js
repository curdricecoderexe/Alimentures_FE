/**
 * check-seo.js — validates the pre-rendered build in dist/ (run after
 * scripts/prerender.js; fails the build on any error).
 *
 * Checks: unique titles/descriptions, absolute canonicals on the production
 * origin that match the URL, no stray noindex on sitemap URLs, no localhost
 * URLs, one <h1> per page, image alt text, JSON-LD parses and its Product
 * price/availability match the visible page, product images exist, sitemap
 * URLs are canonical and indexable, internal links and redirect targets resolve.
 *
 * Passing here is not proof of rich-result eligibility — also run key URLs
 * through Google's Rich Results Test after deploying.
 */
import fs from 'fs';
import path from 'path';

const DIST = path.join(process.cwd(), 'dist');
const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

if (!fs.existsSync(path.join(DIST, 'sitemap.xml'))) {
  console.error('✖ check-seo: dist/sitemap.xml missing — run scripts/prerender.js first.');
  process.exit(1);
}

const robotsTxt = fs.readFileSync(path.join(DIST, 'robots.txt'), 'utf8');
const sitemapXml = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const siteOrigin = sitemapUrls.length ? new URL(sitemapUrls[0]).origin : null;
const isLive = !/Disallow: \/\s*$/m.test(robotsTxt);

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
  const p = path.join(dir, d.name);
  return d.isDirectory() ? walk(p) : [p];
});
const htmlFiles = walk(DIST).filter((f) => f.endsWith('.html'));
const pathFor = (file) => {
  const rel = path.relative(DIST, file).replace(/\\/g, '/');
  return rel === 'index.html' ? '/' : `/${rel.replace(/\.html$/, '')}`;
};
const pages = new Map(htmlFiles.map((f) => [pathFor(f), f]));
const SHELLS = new Set(['/404', '/_app']);

const attr = (html, re) => (html.match(re) || [])[1];
const unesc = (s) => String(s ?? '').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

const redirectsTxt = fs.existsSync(path.join(DIST, '_redirects')) ? fs.readFileSync(path.join(DIST, '_redirects'), 'utf8') : '';
const appRoutes = redirectsTxt.split('\n').filter((l) => /\s\/_app\.html\s+200/.test(l)).map((l) => l.trim().split(/\s+/)[0]);
const resolves = (p) => pages.has(p) || appRoutes.some((r) => (r.endsWith('/*') ? p.startsWith(r.slice(0, -1)) : p === r));

const titles = new Map();
const descriptions = new Map();

for (const [route, file] of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const name = path.relative(DIST, file);

  if (/\/\/(localhost|127\.0\.0\.1)[:/]/.test(html)) err(name, 'contains a localhost URL');
  if (SHELLS.has(route)) {
    if (!/<meta name="robots" content="noindex/.test(html)) err(name, 'shell page must be noindex');
    continue;
  }

  const titleCount = (html.match(/<title[\s>]/g) || []).length;
  const title = unesc(attr(html, /<title[^>]*>([^<]*)<\/title>/));
  if (titleCount !== 1) err(name, `expected 1 <title>, found ${titleCount}`);
  if (!title) err(name, 'empty <title>');
  else {
    if (title.length > 70) warn(name, `title is ${title.length} chars (may truncate): ${title}`);
    if (titles.has(title)) err(name, `duplicate title (also ${titles.get(title)}): ${title}`);
    titles.set(title, name);
  }

  const desc = unesc(attr(html, /<meta name="description" content="([^"]*)"/));
  if (!desc) err(name, 'missing meta description');
  else {
    if (desc.length < 50 || desc.length > 170) warn(name, `description is ${desc.length} chars`);
    if (descriptions.has(desc)) err(name, `duplicate description (also ${descriptions.get(desc)})`);
    descriptions.set(desc, name);
  }

  const canonical = attr(html, /<link rel="canonical" href="([^"]*)"/);
  const robots = attr(html, /<meta name="robots" content="([^"]*)"/) || '';
  if (isLive && /noindex/.test(robots)) err(name, `unexpected robots "${robots}"`);
  if (!canonical) err(name, 'missing canonical');
  else {
    if (!/^https:\/\//.test(canonical)) err(name, `canonical is not absolute https: ${canonical}`);
    if (siteOrigin && new URL(canonical).origin !== siteOrigin) err(name, `canonical origin ${new URL(canonical).origin} ≠ ${siteOrigin}`);
    if (new URL(canonical).pathname !== route) err(name, `canonical ${canonical} does not match URL ${route}`);
  }

  const body = html.slice(html.indexOf('<div id="root">'));
  const h1s = (body.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) err(name, `expected 1 <h1> in page content, found ${h1s}`);
  for (const img of body.match(/<img\b[^>]*>/g) || []) {
    if (!/\balt="[^"]+"/.test(img)) err(name, `image without alt text: ${img.slice(0, 80)}`);
  }

  // Internal links in the crawlable content must resolve.
  for (const [, href] of body.matchAll(/<a href="(\/[^"#?]*)/g)) {
    if (!resolves(href)) err(name, `broken internal link ${href}`);
  }

  const blocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  for (const [, raw] of blocks) {
    let data;
    try { data = JSON.parse(raw); } catch (e) { err(name, `invalid JSON-LD: ${e.message}`); continue; }
    if (data['@context'] !== 'https://schema.org') err(name, `JSON-LD ${data['@type']} has no schema.org @context`);
    const urls = JSON.stringify(data).match(/https?:\/\/[^"]+/g) || [];
    for (const u of urls) if (/localhost|127\.0\.0\.1/.test(u)) err(name, `JSON-LD contains ${u}`);

    if (data['@type'] === 'Product') {
      if (!data.name) err(name, 'Product JSON-LD missing name');
      if (!data.image?.length) warn(name, 'Product JSON-LD has no image');
      for (const img of data.image || []) {
        const local = path.join(DIST, new URL(img).pathname);
        // Photos served by the API (/api/products/:id/image/…) aren't build files.
        if (img.startsWith(siteOrigin) && !new URL(img).pathname.startsWith('/api/') && !fs.existsSync(local)) err(name, `Product image not in build: ${img}`);
      }
      const offer = data.offers;
      if (!offer) err(name, 'Product JSON-LD missing offers');
      else {
        if (offer.priceCurrency !== 'INR') err(name, `priceCurrency ${offer.priceCurrency}`);
        // Compare with the product's own price line, not related-product prices.
        const marked = offer['@type'] === 'AggregateOffer' ? offer.lowPrice : offer.price;
        const priceLine = (body.match(/<article>[\s\S]*?<p>((?:From )?₹\d[^<]*)<\/p>/) || [])[1] || '';
        const visible = (priceLine.match(/₹(\d+(?:\.\d+)?)/) || [])[1];
        if (visible !== String(marked)) err(name, `JSON-LD price ₹${marked} ≠ visible price ₹${visible ?? '—'}`);
        const stock = /InStock$/.test(offer.availability) ? 'In stock' : 'Sold out';
        if (!priceLine.includes(stock)) err(name, `JSON-LD availability (${stock}) does not match the page`);
      }
      if (data.aggregateRating && !(Number(data.aggregateRating.reviewCount) > 0)) err(name, 'aggregateRating without reviews');
    }
    if (data['@type'] === 'BreadcrumbList') {
      for (const it of data.itemListElement || []) {
        const p = new URL(it.item).pathname;
        if (!pages.has(p)) err(name, `breadcrumb points to missing page ${p}`);
      }
    }
  }
}

// Sitemap: every URL is a real, canonical, indexable page.
if (sitemapUrls.length === 0) err('sitemap.xml', 'no URLs');
const seen = new Set();
for (const loc of sitemapUrls) {
  const u = new URL(loc);
  if (seen.has(loc)) err('sitemap.xml', `duplicate ${loc}`);
  seen.add(loc);
  if (u.search || u.hash) err('sitemap.xml', `non-canonical URL ${loc}`);
  const file = pages.get(u.pathname);
  if (!file) { err('sitemap.xml', `${loc} has no page in the build`); continue; }
  const html = fs.readFileSync(file, 'utf8');
  if (attr(html, /<link rel="canonical" href="([^"]*)"/) !== loc) err('sitemap.xml', `${loc} is not its page's canonical`);
}
for (const [, img] of sitemapXml.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)) {
  const p = new URL(img).pathname;
  if (!p.startsWith('/api/') && !fs.existsSync(path.join(DIST, p))) err('sitemap.xml', `image missing from build: ${img}`);
}
if (isLive && siteOrigin && !robotsTxt.includes(`Sitemap: ${siteOrigin}/sitemap.xml`)) err('robots.txt', 'missing Sitemap line');

// Redirect targets must exist.
for (const line of redirectsTxt.split('\n')) {
  const parts = line.trim().split(/\s+/);
  if (!line.trim() || line.startsWith('#') || parts.length < 3) continue;
  const [, to, status] = parts;
  if (status === '301' && !pages.has(to)) err('_redirects', `301 target ${to} does not exist`);
}

for (const w of warnings) console.warn(`⚠ ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`✖ ${e}`);
  console.error(`\n✖ check-seo: ${errors.length} error(s) across ${pages.size} pages.`);
  process.exit(1);
}
console.log(`✓ check-seo: ${pages.size} pages, ${sitemapUrls.length} sitemap URLs, ${titles.size} unique titles — no errors${warnings.length ? ` (${warnings.length} warnings)` : ''}.`);
