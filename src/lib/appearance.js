import { useEffect, useState } from 'react';
import { API_BASE } from './api';

/**
 * Customisable storefront background images.
 *
 * The admin "Templates" screen writes a { slotKey: dataUri|url } map to
 * `/api/appearance`. Every consuming component pairs its bundled default with
 * the slot, e.g. `appearance.featuredBg || featuredBgDefault`, so the site is
 * always fine even before an admin uploads anything (or if the API is down).
 */

const CACHE_KEY = 'alim_appearance_v1';
let _mem = null;

const readCache = () => {
  if (_mem) return _mem;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) _mem = JSON.parse(raw) || {};
  } catch { /* ignore */ }
  return _mem || {};
};

export async function fetchAppearance() {
  try {
    const res = await fetch(`${API_BASE}/appearance`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data && typeof json.data === 'object') {
        _mem = json.data;
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(json.data)); } catch { /* ignore */ }
        return json.data;
      }
    }
  } catch { /* offline / server down — keep whatever we have */ }
  return readCache();
}

export function clearAppearanceCache() {
  _mem = null;
  try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
}

/**
 * Returns the slot map. Renders immediately with the cached value (or {}),
 * then refreshes from the API once on mount.
 */
export function useAppearance() {
  const [map, setMap] = useState(readCache);
  useEffect(() => {
    let alive = true;
    fetchAppearance().then((next) => { if (alive) setMap(next || {}); });
    return () => { alive = false; };
  }, []);
  return map;
}

/**
 * Page-specific image slots (GET /api/appearance?page=…), e.g. the Gift Hampers
 * page's banner and product photos. Kept out of the site-wide map so other
 * pages don't download them. Memory-cached for the session.
 */
const _pageMem = new Map();

export async function fetchPageAppearance(page) {
  try {
    const res = await fetch(`${API_BASE}/appearance?page=${encodeURIComponent(page)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data && typeof json.data === 'object') {
        _pageMem.set(page, json.data);
        return json.data;
      }
    }
  } catch { /* offline — keep what we have */ }
  return _pageMem.get(page) || {};
}

export function clearPageAppearanceCache(page) {
  if (page) _pageMem.delete(page);
  else _pageMem.clear();
}

export function usePageAppearance(page) {
  const [map, setMap] = useState(() => _pageMem.get(page) || {});
  useEffect(() => {
    let alive = true;
    fetchPageAppearance(page).then((next) => { if (alive) setMap(next || {}); });
    return () => { alive = false; };
  }, [page]);
  return map;
}
