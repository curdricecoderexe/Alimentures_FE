/**
 * Non-fatal facade over ./analytics.js.
 *
 * Ad/privacy blockers (uBlock, AdBlock, Brave Shields…) block any URL containing
 * "analytics" — in dev that includes the module file /src/lib/analytics.js itself,
 * and in production its lazy chunk. A static import of a blocked module kills the
 * whole app (stuck on the splash screen). Loading it lazily means a blocker only
 * switches tracking off — which is what that visitor asked for — and the site
 * keeps working.
 *
 * Keep this file's name free of words blockers match (analytics, track, pixel…).
 */

let modulePromise;
const load = () => (modulePromise ??= import('./analytics.js').catch(() => null));

const deferred = (name) => (...args) => {
  load().then((mod) => {
    try { mod?.[name]?.(...args); } catch { /* never let tracking break the page */ }
  });
};

export const pageview = deferred('pageview');
export const track = deferred('track');
export const identify = deferred('identify');
export const recordConsent = deferred('recordConsent');
export const initPerformance = deferred('initPerformance');
export const initAutoTracking = deferred('initAutoTracking');
