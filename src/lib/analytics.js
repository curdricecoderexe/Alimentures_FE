/**
 * Alimenture Analytics SDK
 * Lightweight analytics collection that respects cookie consent.
 * All data is sent to the backend only after analytics consent is granted.
 *
 * Fix: Queues pageviews that fire before consent, then flushes them
 * immediately when consent is granted (via 'alim_consent_granted' event).
 */

import { API_BASE } from './api';

const BASE_URL = `${API_BASE}/analytics`;

// ─── QUEUE FOR PRE-CONSENT EVENTS ─────────────────────────────────────────────
// Stores the last pageview that happened before consent, so we can flush it.
let _pendingPageview = null;

// ─── VISITOR & SESSION ID ─────────────────────────────────────────────────────

function getVisitorId() {
  let vid = localStorage.getItem('__alim_vid');
  if (!vid) {
    vid = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('__alim_vid', vid);
  }
  return vid;
}

function getSessionId() {
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 min
  const stored = sessionStorage.getItem('__alim_sid');
  const lastActive = parseInt(sessionStorage.getItem('__alim_last') || '0');
  const now = Date.now();
  if (stored && (now - lastActive) < SESSION_TIMEOUT) {
    sessionStorage.setItem('__alim_last', now);
    return stored;
  }
  const sid = 's_' + Math.random().toString(36).slice(2) + now.toString(36);
  sessionStorage.setItem('__alim_sid', sid);
  sessionStorage.setItem('__alim_last', now);
  sessionStorage.setItem('__alim_start', now);
  sessionStorage.setItem('__alim_pages', '0');
  return sid;
}

// ─── CONSENT CHECK ────────────────────────────────────────────────────────────

function getConsent() {
  try {
    const raw = localStorage.getItem('__alim_consent');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function hasAnalyticsConsent() {
  const c = getConsent();
  return c && (c.decision === 'all' || c.analytics === true);
}

// ─── DEVICE INFO ──────────────────────────────────────────────────────────────

function getDeviceInfo() {
  const ua = navigator.userAgent || '';
  let device = 'desktop';
  if (/Mobi|Android|iPhone|iPad/i.test(ua)) device = 'mobile';
  else if (/Tablet|iPad/i.test(ua)) device = 'tablet';

  let browser = 'Other';
  if (/Edg\//i.test(ua))          browser = 'Edge';
  else if (/Chrome\//i.test(ua))  browser = 'Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua))  browser = 'Safari';

  let os = 'Other';
  if (/Windows/i.test(ua))       os = 'Windows';
  else if (/Mac OS/i.test(ua))   os = 'macOS';
  else if (/Linux/i.test(ua))    os = 'Linux';
  else if (/Android/i.test(ua))  os = 'Android';
  else if (/iOS|iPhone|iPad/i.test(ua)) os = 'iOS';

  return { device, browser, os };
}

// ─── UTM PARAMS ───────────────────────────────────────────────────────────────

function getUTM() {
  const p = new URLSearchParams(window.location.search);
  return {
    utmSource:   p.get('utm_source')   || sessionStorage.getItem('__alim_utm_source')   || '',
    utmMedium:   p.get('utm_medium')   || sessionStorage.getItem('__alim_utm_medium')   || '',
    utmCampaign: p.get('utm_campaign') || sessionStorage.getItem('__alim_utm_campaign') || '',
    utmContent:  p.get('utm_content')  || sessionStorage.getItem('__alim_utm_content')  || '',
    utmTerm:     p.get('utm_term')     || sessionStorage.getItem('__alim_utm_term')      || '',
  };
}

function persistUTM() {
  const p = new URLSearchParams(window.location.search);
  ['source','medium','campaign','content','term'].forEach(k => {
    const val = p.get(`utm_${k}`);
    if (val) sessionStorage.setItem(`__alim_utm_${k}`, val);
  });
}

// ─── HTTP SEND ────────────────────────────────────────────────────────────────

async function send(endpoint, payload) {
  try {
    await fetch(`${BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Silent fail — analytics should never break the user experience
  }
}

// ─── PAGE VIEW ────────────────────────────────────────────────────────────────

let _pageStart  = Date.now();
let _prevUrl    = document.referrer || '';
let _scrollMax  = 0;
let _lastPvUrl  = ''; // dedup

function trackScrollDepth() {
  const el = document.documentElement;
  const scrolled = el.scrollTop + window.innerHeight;
  const total    = el.scrollHeight;
  const pct = total > 0 ? Math.round((scrolled / total) * 100) : 0;
  if (pct > _scrollMax) _scrollMax = pct;
}

window.addEventListener('scroll', trackScrollDepth, { passive: true });

export function pageview(url, title) {
  persistUTM();
  _pageStart = Date.now();
  _scrollMax = 0;

  const { device, browser, os } = getDeviceInfo();
  const utms = getUTM();

  const payload = {
    url:       url || window.location.href,
    title:     title || document.title,
    referrer:  _prevUrl,
    sessionId: getSessionId(),
    visitorId: getVisitorId(),
    device, browser, os,
    ...utms,
    scrollDepth: _scrollMax,
    timeOnPage: 0,
    timestamp: Date.now(),
  };

  _prevUrl = url || window.location.href;

  // Queue it regardless — if no consent yet, store as pending
  _pendingPageview = payload;

  if (!hasAnalyticsConsent()) {
    // Consent not yet given — store as pending and bail
    return;
  }

  // Deduplicate same URL within 2s
  const dedupeKey = (url || window.location.href);
  if (_lastPvUrl === dedupeKey && (Date.now() - _pageStart) < 2000) return;
  _lastPvUrl = dedupeKey;

  send('pageview', payload);

  // Increment page count in session
  const pages = parseInt(sessionStorage.getItem('__alim_pages') || '0') + 1;
  sessionStorage.setItem('__alim_pages', pages);
}

// ─── FLUSH PENDING (called when consent is granted) ───────────────────────────

function flushPending() {
  if (_pendingPageview) {
    send('pageview', {
      ..._pendingPageview,
      timestamp: Date.now(),
    });
    const pages = parseInt(sessionStorage.getItem('__alim_pages') || '0') + 1;
    sessionStorage.setItem('__alim_pages', pages);
    _pendingPageview = null;
  }
}

// ─── CUSTOM EVENT ─────────────────────────────────────────────────────────────

export function track(name, properties = {}) {
  if (!hasAnalyticsConsent()) return;
  if (!name) return;

  const { device, browser } = getDeviceInfo();

  send('event', {
    name,
    properties,
    sessionId: getSessionId(),
    visitorId: getVisitorId(),
    url:       window.location.href,
    device,
    browser,
    timestamp: Date.now(),
  });
}

// ─── SESSION END (on unload) ──────────────────────────────────────────────────

function flushSession() {
  if (!hasAnalyticsConsent()) return;
  const start     = parseInt(sessionStorage.getItem('__alim_start') || Date.now());
  const pageCount = parseInt(sessionStorage.getItem('__alim_pages') || '1');
  const duration  = Math.round((Date.now() - start) / 1000);
  const { device, browser, os } = getDeviceInfo();
  const utms = getUTM();

  // Final pageview with accurate time-on-page
  send('pageview', {
    url:        window.location.href,
    title:      document.title,
    referrer:   _prevUrl,
    sessionId:  getSessionId(),
    visitorId:  getVisitorId(),
    device, browser, os,
    ...utms,
    scrollDepth: _scrollMax,
    timeOnPage:  Math.round((Date.now() - _pageStart) / 1000),
    timestamp: Date.now(),
  });

  send('session', {
    visitorId:  getVisitorId(),
    sessionId:  getSessionId(),
    startTime:  start,
    endTime:    Date.now(),
    duration,
    pageCount,
    bounced:    pageCount <= 1 && duration < 30,
    device, browser, os,
    referrer:   document.referrer,
    ...utms,
  });
}

window.addEventListener('beforeunload', flushSession);
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flushSession();
});

// ─── CONSENT GRANTED EVENT ────────────────────────────────────────────────────
// When user accepts cookies, immediately flush any queued pageview + start session

window.addEventListener('alim_consent_granted', () => {
  flushPending();

  // Also record the initial session now that we have consent
  const { device, browser, os } = getDeviceInfo();
  const utms = getUTM();
  send('session', {
    visitorId:  getVisitorId(),
    sessionId:  getSessionId(),
    startTime:  parseInt(sessionStorage.getItem('__alim_start') || Date.now()),
    endTime:    Date.now(),
    duration:   0,
    pageCount:  parseInt(sessionStorage.getItem('__alim_pages') || '1'),
    bounced:    false,
    device, browser, os,
    referrer:   document.referrer,
    ...utms,
  });
});

// ─── PERFORMANCE METRICS (Core Web Vitals) ────────────────────────────────────

export function initPerformance() {
  // Don't check consent here — measure first, send only if consent granted when data is ready
  if (!('PerformanceObserver' in window)) return;

  const metrics = { lcp: 0, fcp: 0, ttfb: 0, cls: 0, inp: 0 };

  // TTFB from navigation timing
  const nav = performance.getEntriesByType('navigation')[0];
  if (nav) metrics.ttfb = Math.round(nav.responseStart);

  // FCP
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          metrics.fcp = Math.round(entry.startTime);
        }
      }
    }).observe({ type: 'paint', buffered: true });
  } catch { /* empty */ }

  // LCP
  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) metrics.lcp = Math.round(last.startTime);
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch { /* empty */ }

  // CLS
  try {
    let clsTotal = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) clsTotal += entry.value;
      }
      metrics.cls = parseFloat(clsTotal.toFixed(4));
    }).observe({ type: 'layout-shift', buffered: true });
  } catch { /* empty */ }

  // Send after 8s — only if consent was granted by then
  setTimeout(() => {
    if (!hasAnalyticsConsent()) return;
    send('performance', {
      url:        window.location.href,
      visitorId:  getVisitorId(),
      sessionId:  getSessionId(),
      ...metrics,
    });
  }, 8000);
}

// ─── CONSENT ─────────────────────────────────────────────────────────────────

export function recordConsent(consentObj) {
  const consent = {
    ...consentObj,
    timestamp: Date.now(),
    expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
  };
  localStorage.setItem('__alim_consent', JSON.stringify(consent));

  // Always send consent record (no consent needed for this)
  send('consent', {
    visitorId:   getVisitorId(),
    userAgent:   navigator.userAgent,
    ...consentObj,
  });

  // If analytics is enabled, fire the consent-granted event
  if (consent.decision === 'all' || consent.analytics === true) {
    window.dispatchEvent(new Event('alim_consent_granted'));
  }
}

// ─── IDENTIFY (logged-in user) ────────────────────────────────────────────────

export function identify(userId) {
  if (userId) sessionStorage.setItem('__alim_uid', userId);
}

// ─── AUTO CLICK TRACKING ──────────────────────────────────────────────────────

export function initAutoTracking() {
  document.addEventListener('click', (e) => {
    if (!hasAnalyticsConsent()) return;
    const el = e.target.closest('button, a, [data-track]');
    if (!el) return;
    const label = el.getAttribute('data-track')
      || el.getAttribute('aria-label')
      || el.innerText?.trim().slice(0, 60)
      || el.tagName;
    track('click', { element: label, tag: el.tagName, url: window.location.pathname });
  }, { passive: true });
}

export default { pageview, track, identify, recordConsent, initPerformance, initAutoTracking };
