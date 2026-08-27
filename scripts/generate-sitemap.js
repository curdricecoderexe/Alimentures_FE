import fs from 'fs';
import path from 'path';

// Define public static routes
const staticRoutes = [
  '/',
  '/about',
  '/contact',
  '/shop'
];

async function generateSitemap() {
  const API_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';
  const SITE_URL = process.env.VITE_APP_URL || 'https://alimenture.com';
  
  let products = [];
  try {
    const res = await fetch(`${API_URL}/products?limit=1000`);
    const data = await res.json();
    if (data.success && data.data) {
      // Only active/indexable products (assuming all returned are active)
      products = data.data.filter(p => !p.isDraft && !p.isPrivate);
    }
  } catch (err) {
    console.error('Failed to fetch products for sitemap. Using static routes only.', err);
  }

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Add static routes
  staticRoutes.forEach(route => {
    sitemap += `
  <url>
    <loc>${SITE_URL}${route}</loc>
    <changefreq>daily</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`;
  });

  // Add product routes
  products.forEach(product => {
    const slug = product.slug || product.id || product._id;
    sitemap += `
  <url>
    <loc>${SITE_URL}/product/${slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
  });

  sitemap += `\n</urlset>`;

  const publicPath = path.resolve(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(publicPath, sitemap);
  console.log('✅ Sitemap generated successfully at', publicPath);
}

generateSitemap();
