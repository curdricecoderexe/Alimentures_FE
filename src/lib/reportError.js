import { API_BASE } from './api';

const RELEASE = import.meta.env.VITE_RELEASE || undefined;

let _sent = 0;
const MAX_PER_SESSION = 15; // don't hammer the endpoint if something loops

/**
 * Fire-and-forget client error report to the backend, which forwards it to
 * ERROR_WEBHOOK_URL. Never throws, never blocks.
 */
export function reportClientError(err, extra = {}) {
  try {
    if (_sent >= MAX_PER_SESSION) return;
    _sent += 1;

    const payload = {
      message: (err && (err.message || String(err))) || 'unknown client error',
      name: err && err.name,
      stack: err && err.stack,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      release: RELEASE,
      ...extra,
    };

    const body = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(`${API_BASE}/client-errors`, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(`${API_BASE}/client-errors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* reporting must never break the app */
  }
}

/** Install global handlers. Call once from main.jsx. */
export function installGlobalErrorReporting() {
  if (typeof window === 'undefined' || window.__alimErrorHandlersInstalled) return;
  window.__alimErrorHandlersInstalled = true;

  window.addEventListener('error', (e) => {
    reportClientError(e.error || new Error(e.message), { kind: 'window.error' });
  });
  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason instanceof Error ? e.reason : new Error(String(e.reason));
    reportClientError(reason, { kind: 'unhandledrejection' });
  });
}
