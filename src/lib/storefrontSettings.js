import { useEffect, useState } from 'react';
import { API_BASE, cachedFetch, clearApiCache } from './api';

/**
 * Public storefront settings (settings/storefront) — social links, the Gift
 * Hampers page switch, etc. Shared through the API module's memory cache so
 * the layout and pages make one request between them.
 */
const SETTINGS_URL = `${API_BASE}/settings`;
const TTL = 5 * 60 * 1000;

export const clearStorefrontSettingsCache = () => clearApiCache(SETTINGS_URL);

export function useStorefrontSettings() {
  const [state, setState] = useState({ settings: null, loaded: false });
  useEffect(() => {
    let alive = true;
    cachedFetch(SETTINGS_URL, TTL)
      .then((j) => { if (alive) setState({ settings: j?.success ? j.data : null, loaded: true }); })
      .catch(() => { if (alive) setState({ settings: null, loaded: true }); });
    return () => { alive = false; };
  }, []);
  return state;
}

/** The Gift Hampers page is visible unless an admin has switched it off. */
export const hampersVisibleIn = (settings) => settings?.hampersVisible !== false;
