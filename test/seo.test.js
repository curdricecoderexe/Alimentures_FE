/** SEO library: slugs (must match the API), titles, descriptions, JSON-LD. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import {
  slugify, productPath, productTitle, productDescription, productJsonLd, breadcrumbJsonLd,
  productBreadcrumbs, resolveSiteUrl, displayName, keyIngredients, publicImages,
} from '../src/lib/seo.js';

const require = createRequire(import.meta.url);

const ghee = {
  id: 'g1', slug: 'a2-ghee', title: 'A2 GHEE', category: 'Others', description: 'Slow clarified golden ghee',
  variants: [{ weight: '500ml', price: 450, stock: 3 }],
};
const cookie = {
  id: 'c1', slug: 'tri-grain-gain-premium', title: 'TRI-GRAIN GAIN — PREMIUM', category: 'Cookies',
  secondaryDescription: 'Key Ingredients: Mapillai Samba, Kaattuyaanam, Exotic Nut Blend (Hazelnuts, Almonds), Butter.',
  variants: [{ weight: '120g', price: 90, stock: 0 }, { weight: '250g', price: 170, stock: 4 }],
  reviewCount: 0, averageRating: 0,
};

test('slugify matches the backend implementation exactly', () => {
  let backend;
  try { backend = require('../../Alimentures_BE-main/lib/slug.js'); } catch { return; } // repos checked out separately
  for (const s of ['TRI-GRAIN GAIN — PREMIUM', 'Pure Country Sugar (Nattu Sakkarai)', 'Café & Crème', '  --x--  ', 'A2 GHEE']) {
    assert.equal(slugify(s), backend.slugify(s), s);
  }
});

test('production builds never use a localhost canonical origin', () => {
  assert.equal(resolveSiteUrl('http://localhost:5173', true), 'https://alimenture.in');
  assert.equal(resolveSiteUrl('', true), 'https://alimenture.in');
  assert.equal(resolveSiteUrl('https://alimenture.in/', true), 'https://alimenture.in');
  assert.equal(resolveSiteUrl('http://localhost:5173', false), 'http://localhost:5173');
});

test('paths prefer the API slug and fall back to the id', () => {
  assert.equal(productPath(ghee), '/products/a2-ghee');
  assert.equal(productPath({ id: 'x9', title: 'Something' }), '/products/x9');
});

test('titles and descriptions stay within search-result limits', () => {
  assert.equal(displayName('TRI-GRAIN GAIN — PREMIUM'), 'Tri-Grain Gain — Premium');
  for (const p of [ghee, cookie]) {
    assert.ok(productTitle(p).length <= 66, productTitle(p));
    assert.ok(productDescription(p).length <= 160, productDescription(p));
    assert.match(productTitle(p), /\| Alimenture$/);
  }
  assert.deepEqual(keyIngredients(cookie), ['Mapillai Samba', 'Kaattuyaanam', 'Exotic Nut Blend (Hazelnuts, Almonds)', 'Butter']);
});

test('Product JSON-LD mirrors live price and stock, with no invented ratings', () => {
  const g = productJsonLd(ghee);
  assert.equal(g.offers['@type'], 'Offer');
  assert.equal(g.offers.price, '450');
  assert.equal(g.offers.priceCurrency, 'INR');
  assert.match(g.offers.availability, /InStock$/);

  const c = productJsonLd(cookie);
  assert.equal(c.offers['@type'], 'AggregateOffer');
  assert.equal(c.offers.lowPrice, '90');
  assert.equal(c.offers.highPrice, '170');
  assert.match(c.offers.offers[0].availability, /OutOfStock$/);
  assert.equal(c.aggregateRating, undefined, 'no rating without reviews');

  const rated = productJsonLd({ ...ghee, reviewCount: 3, averageRating: 4.7 });
  assert.equal(rated.aggregateRating.reviewCount, '3');
});

test('images: inline base64 is never exposed; API image URLs pass through', () => {
  assert.deepEqual(publicImages({ ...ghee, image: 'data:image/jpeg;base64,AAAA' }), ['https://alimenture.in/images/products/a2-ghee.jpg']);
  const url = 'https://alimenture.in/api/products/g1/image/main?v=1';
  assert.deepEqual(publicImages({ ...ghee, image: url }), [url]);
});

test('breadcrumbs follow Home › Shop › Category › Product', () => {
  const crumbs = breadcrumbJsonLd(productBreadcrumbs(ghee));
  assert.deepEqual(crumbs.itemListElement.map((i) => i.name), ['Home', 'Shop', 'Others', 'A2 Ghee']);
  assert.equal(crumbs.itemListElement[3].item, 'https://alimenture.in/products/a2-ghee');
});
