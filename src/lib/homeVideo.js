import { useEffect, useState } from 'react';
import { API_BASE } from './api';

/**
 * Homepage brand film.
 *
 * The admin "Templates" screen can upload a replacement film and edit its
 * overlay copy via `/api/home-video`. With no upload the storefront plays the
 * bundled default, so the section always works (even if the API is down).
 */

export const DEFAULT_FILM_SRC = '/videos/alimentures-film.mp4';
export const DEFAULT_FILM_TITLE = 'Rooted in soil, baked with care';
export const DEFAULT_FILM_SUBTITLE = 'A short look at the grains, the hands and the slow craft behind every Alimentures bake.';

const CACHE_KEY = 'alim_home_video_v1';

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw) || null;
  } catch { /* ignore */ }
  return null;
};

export const filmStreamUrl = (version) => `${API_BASE}/home-video/stream?v=${encodeURIComponent(version)}`;

export async function fetchHomeVideo() {
  try {
    const res = await fetch(`${API_BASE}/home-video`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(json.data)); } catch { /* ignore */ }
        return json.data;
      }
    }
  } catch { /* offline / server down — keep whatever we have */ }
  return readCache();
}

export function clearHomeVideoCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
}

/** Resolved film settings: { enabled, title, subtitle, src, isCustom }. */
export function useHomeVideo() {
  const [data, setData] = useState(readCache);
  useEffect(() => {
    let alive = true;
    fetchHomeVideo().then((next) => { if (alive && next) setData(next); });
    return () => { alive = false; };
  }, []);

  const d = data || {};
  return {
    enabled: d.enabled !== false,
    title: d.title || DEFAULT_FILM_TITLE,
    subtitle: d.subtitle || DEFAULT_FILM_SUBTITLE,
    src: d.version ? filmStreamUrl(d.version) : DEFAULT_FILM_SRC,
    isCustom: !!d.version,
  };
}
