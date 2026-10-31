import { useEffect, useState } from 'react';
import { API_BASE } from './api';

/**
 * Admin-managed product categories (Admin → Categories), as
 * [{ id, name, order, visible, productCount }]. Renders immediately from the
 * last cached list, then refreshes once from `/api/categories`.
 */

const CACHE_KEY = 'alim_categories_v1';

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw) || [];
  } catch { /* ignore */ }
  return [];
};

export function clearCategoriesCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
}

export async function fetchCategories() {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(json.data)); } catch { /* ignore */ }
        return json.data;
      }
    }
  } catch { /* offline / server down — keep whatever we have */ }
  return readCache();
}

export function useCategories() {
  const [list, setList] = useState(readCache);
  useEffect(() => {
    let alive = true;
    fetchCategories().then((next) => { if (alive) setList(next || []); });
    return () => { alive = false; };
  }, []);
  return list;
}
