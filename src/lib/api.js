import { toast } from 'sonner';

let isRedirecting = false;

// In-memory SWR cache for GET requests
const memoryCache = new Map();
// Requests already on the wire, so concurrent callers share one response.
const inFlight = new Map();

export const cachedFetch = async (url, ttlMs = 120000) => {
  const now = Date.now();
  const cached = memoryCache.get(url);
  if (cached && (now - cached.timestamp < ttlMs)) {
    return cached.data;
  }
  if (inFlight.has(url)) return inFlight.get(url);
  const request = (async () => {
    try {
      const res = await fetch(url);
      const json = await res.json();
      memoryCache.set(url, { timestamp: now, data: json });
      return json;
    } catch (err) {
      if (cached) return cached.data; // Fallback to stale data on network error
      throw err;
    } finally {
      inFlight.delete(url);
    }
  })();
  inFlight.set(url, request);
  return request;
};

export const clearApiCache = (url) => {
  if (url) memoryCache.delete(url);
  else memoryCache.clear();
};

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const AUTH_KEYS = ['token', 'uid', 'role', 'userEmail', 'userName'];

/**
 * Sessions are httpOnly cookies set by the API (see the backend's lib/session.js);
 * page scripts never hold the tokens. localStorage 'token' is only this marker,
 * which the UI uses as a "signed in" flag. Sent as a Bearer value it is ignored
 * by the server, which then reads the cookie.
 */
export const SESSION_MARKER = 'cookie-session';

/** The "signed in" marker (no secret). */
export const getToken = () => localStorage.getItem('token');

const API_ORIGIN = (() => { try { return new URL(API_BASE, window.location.href).origin; } catch { return ''; } })();

/**
 * Send the session cookie with every request to our API, including from the
 * dev server (a different port). Installed once from main.jsx.
 */
export function installCredentialedFetch() {
  if (typeof window === 'undefined' || window.__alimFetchPatched) return;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    try {
      const url = typeof input === 'string' ? input : input?.url;
      if (url && new URL(url, window.location.href).origin === API_ORIGIN) {
        return nativeFetch(input, { credentials: 'include', ...init });
      }
    } catch { /* fall through */ }
    return nativeFetch(input, init);
  };
  window.__alimFetchPatched = true;
}

/**
 * Sign out: tell the server to invalidate every existing token for this user,
 * then clear local state and go to /login.
 */
export const logout = async ({ redirect = true } = {}) => {
  const token = getToken();
  if (token) {
    try {
      await fetch(`${API_BASE}/users/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
    } catch { /* best effort — clear local state regardless */ }
  }
  AUTH_KEYS.forEach((k) => localStorage.removeItem(k));
  try { sessionStorage.removeItem('appliedCoupon'); } catch { /* ignore */ }
  if (redirect) window.location.href = '/login';
};

export const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const targetUrl = url.startsWith('http')
    ? url
    : `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;

  try {
    const response = await fetch(targetUrl, { ...options, headers });

    // 401 = the session is invalid/expired -> force re-login.
    if (response.status === 401) {
      if (!isRedirecting) {
        isRedirecting = true;
        toast.error('Session expired. Please login again.');
        localStorage.clear();
        window.location.href = '/login';
      }
      return null;
    }

    // 403 = authenticated but not allowed -> keep the session, surface the message.
    if (response.status === 403) {
      let msg = 'You do not have permission to do that.';
      try {
        const data = await response.clone().json();
        if (data?.error) msg = data.error;
      } catch { /* ignore */ }
      toast.error(msg);
      return response;
    }

    return response;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
