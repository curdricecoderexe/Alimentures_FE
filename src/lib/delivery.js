import { useEffect, useState } from 'react';
import { API_BASE } from './api';

/**
 * Storefront shipping messaging, driven by Admin → PIN Code Delivery
 * (`/api/delivery/summary`). Renders immediately from the last cached value
 * (or these defaults), then refreshes once. The real fee is still resolved
 * per PIN code at checkout — this only powers the copy and cart estimate.
 */

const CACHE_KEY = 'alim_delivery_summary_v1';
const DEFAULTS = { freeDeliveryEnabled: false, freeDeliveryThreshold: 500, defaultDeliveryFee: 70, minDeliveryFee: 60, standardEta: '' };

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULTS;
};

export function useDeliverySummary() {
  const [summary, setSummary] = useState(readCache);
  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/delivery/summary`)
      .then((r) => r.json())
      .then((j) => {
        if (!alive || !j.success || !j.data) return;
        setSummary({ ...DEFAULTS, ...j.data });
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(j.data)); } catch { /* ignore */ }
      })
      .catch(() => { /* keep cached/defaults */ });
    return () => { alive = false; };
  }, []);
  return summary;
}
