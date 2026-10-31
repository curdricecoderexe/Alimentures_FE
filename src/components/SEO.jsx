import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { BRAND, DEFAULT_IMAGE, LOCALE, absoluteUrl } from '../lib/seo';

/**
 * Per-page head tags. `title` is used as-is when it already names the brand,
 * otherwise " | Alimenture" is appended. `url` is the canonical path (no query
 * string). Pass `noindex` for private, transactional or empty pages.
 *
 * The build pre-renders head tags into each page's HTML (scripts/prerender.js,
 * marked data-prerender). React 19 hoists Helmet's tags but never removes the
 * static ones, so they are dropped here to avoid duplicate canonicals/titles.
 */
export default function SEO({
  title,
  description,
  type = 'website',
  url,
  image,
  imageAlt,
  jsonLd,
  noindex = false,
}) {
  useEffect(() => {
    document.querySelectorAll('head [data-prerender]').forEach((el) => el.remove());
  }, []);

  const fullTitle = !title ? BRAND : (title.includes(BRAND) ? title : `${title} | ${BRAND}`);
  const pageUrl = url ? absoluteUrl(url) : null;
  const imageUrl = absoluteUrl(image && !image.startsWith('data:') ? image : DEFAULT_IMAGE);
  const blocks = [].concat(jsonLd || []).filter(Boolean);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {pageUrl && !noindex && <link rel="canonical" href={pageUrl} />}
      <meta name="robots" content={noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={BRAND} />
      <meta property="og:locale" content={LOCALE} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {pageUrl && <meta property="og:url" content={pageUrl} />}
      <meta property="og:image" content={imageUrl} />
      {imageAlt && <meta property="og:image:alt" content={imageAlt} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={imageUrl} />

      {blocks.map((block, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(block)}</script>
      ))}
    </Helmet>
  );
}
