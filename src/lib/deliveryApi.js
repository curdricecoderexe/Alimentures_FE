/**
 * deliveryApi.js — thin client for the delivery + India-location endpoints.
 * Location data is cached in-memory for the tab session (it barely changes).
 * Delivery options are cached briefly per pincode+subtotal bucket to avoid
 * refetching on every keystroke / re-render.
 */
import { INDIA_STATES } from '../data/indiaStates';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const _cities = new Map();       // state -> string[]
const _options = new Map();      // `${pin}:${bucket}` -> { at, data }
const OPTIONS_TTL = 60_000;

export function getStates() {
  // Static list is authoritative and instant; no request needed.
  return INDIA_STATES;
}

export async function getCities(state) {
  const key = String(state || '').trim();
  if (!key) return [];
  if (_cities.has(key)) return _cities.get(key);
  try {
    const res = await fetch(`${API}/delivery/locations/cities?state=${encodeURIComponent(key)}&limit=500`);
    const json = await res.json();
    const list = json.success && Array.isArray(json.data) ? json.data : [];
    _cities.set(key, list);
    return list;
  } catch {
    return [];
  }
}

const PINCODE_RE = /^[1-9][0-9]{5}$/;
export const isValidPincode = (p) => PINCODE_RE.test(String(p || '').trim());

/**
 * @returns {Promise<{ ok: boolean, data?: object, error?: string }>}
 * `data` shape mirrors the server `resolveDeliveryOptions` payload.
 */
export async function getDeliveryOptions(pincode, subtotal = 0) {
  const pin = String(pincode || '').trim();
  if (!isValidPincode(pin)) return { ok: false, error: 'Enter a valid 6-digit PIN code' };

  const bucket = Math.round(Number(subtotal) || 0);
  const key = `${pin}:${bucket >= 10000 ? '10000+' : Math.floor(bucket / 100)}`;
  const cached = _options.get(key);
  if (cached && Date.now() - cached.at < OPTIONS_TTL) return { ok: true, data: cached.data };

  try {
    const res = await fetch(`${API}/delivery/options/${pin}?subtotal=${bucket}`);
    const json = await res.json();
    if (!res.ok || !json.success) return { ok: false, error: json.error || 'Could not check delivery for this PIN code' };
    _options.set(key, { at: Date.now(), data: json.data });
    return { ok: true, data: json.data };
  } catch {
    return { ok: false, error: 'Network error checking delivery' };
  }
}

export function clearDeliveryCache() {
  _cities.clear();
  _options.clear();
}
