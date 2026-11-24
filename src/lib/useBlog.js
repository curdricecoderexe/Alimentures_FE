/*
 * Data hooks for The Grain Journal.
 *
 * Articles come from the API (/blog — written by admin and staff). Until the
 * first article is published there, the built-in starter articles in
 * src/data/blog.js are shown instead, so the journal is never empty.
 */
import { useEffect, useState } from 'react';
import { BLOG_POSTS } from '../data/blog';
import { coverFor } from '../data/blogCovers';
import { parseContent } from './blogContent';

const API = import.meta.env.VITE_API_URL;
const LIST_CACHE = 'alimenture.blog.v1';

/** One shape for API and built-in posts: { slug, title, excerpt, category, date, readMins, author, featured, cover, body? }. */
export function normalizePost(p) {
  if (!p) return null;
  const fromApi = p.content !== undefined || p.coverImage !== undefined || p.id !== undefined;
  return {
    ...p,
    cover: fromApi ? (p.coverImage || coverFor({})) : coverFor(p),
    body: p.body || (p.content !== undefined ? parseContent(p.content) : undefined),
    author: p.author || 'Team Alimenture',
  };
}

const STARTERS = BLOG_POSTS.map(normalizePost);

function readCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(LIST_CACHE));
    if (Array.isArray(cached) && cached.length) return cached;
  } catch { /* ignore */ }
  return null;
}

/** Published articles, newest first. */
export function useBlogPosts() {
  const [state, setState] = useState(() => {
    const cached = readCache();
    return { posts: cached ? cached.map(normalizePost) : STARTERS, loading: !cached };
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API}/blog`);
        const data = res.ok ? await res.json() : null;
        if (!alive) return;
        if (data?.success && Array.isArray(data.data) && data.data.length) {
          const posts = data.data.map(normalizePost);
          setState({ posts, loading: false });
          try { localStorage.setItem(LIST_CACHE, JSON.stringify(data.data)); } catch { /* quota — fine */ }
          return;
        }
        if (data?.success) {
          // API reachable but nothing published yet — show the starters.
          try { localStorage.removeItem(LIST_CACHE); } catch { /* ignore */ }
          setState({ posts: STARTERS, loading: false });
          return;
        }
      } catch (err) {
        console.error('Failed to fetch articles', err);
      }
      if (alive) setState((s) => ({ ...s, loading: false }));
    })();
    return () => { alive = false; };
  }, []);

  return state;
}

/** A single published article by slug (API first, then the built-in starters). */
export function useBlogPost(slug) {
  const starter = STARTERS.find((p) => p.slug === slug) || null;
  const [state, setState] = useState({ post: null, loading: true, slug });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API}/blog/${encodeURIComponent(slug)}`);
        if (res.ok) {
          const data = await res.json();
          if (alive && data?.success) { setState({ post: normalizePost(data.data), loading: false, slug }); return; }
        }
      } catch (err) {
        console.error('Failed to fetch article', err);
      }
      if (alive) setState({ post: starter, loading: false, slug });
    })();
    return () => { alive = false; };
  }, [slug, starter]);

  // While a new slug loads, don't flash the previous article.
  if (state.slug !== slug) return { post: null, loading: true };
  return state;
}
