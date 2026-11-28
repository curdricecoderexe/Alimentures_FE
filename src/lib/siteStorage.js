/**
 * siteStorage.js — one place that decides what browser data the site keeps.
 *
 * Three moments wipe stored data so stale values never leak into a session:
 *
 *  1. App start, after a release that changed stored data   → migrateStorageOnBoot()
 *     Bump STORAGE_VERSION whenever the shape of anything we persist changes
 *     (cart items, coupons, cached slides…). Every visitor's old data is then
 *     cleared once on their next visit, so an old cart/cache can never break a
 *     new version of the site. Ordinary deploys don't bump it, so carts survive.
 *  2. Login   → resetForLogin()   clears everything from earlier sessions/accounts
 *     except the guest cart (a shopper who signs in at checkout keeps their items).
 *  3. Logout / expired session → resetForLogout()   clears everything personal,
 *     cart included, so the next person on this device starts clean.
 *
 * Always kept: cookie-consent choice, theme, "remember my email", and the
 * anonymous analytics ids (`__alim_*`, governed by the consent banner).
 */

// ⬆ Bump when a release changes the shape of persisted data.
export const STORAGE_VERSION = '2026-11-26';
const VERSION_KEY = 'alim_storage_version';

const ALWAYS_KEEP = new Set(['theme', 'rememberEmail', VERSION_KEY]);
const isAlwaysKept = (key) => ALWAYS_KEEP.has(key)
  || key.startsWith('__alim_')
  || key.startsWith('welcomeOfferShown_'); // the welcome offer is announced once per account

// Broadcast so in-memory state (cart, wishlist…) can follow the storage reset.
export const SESSION_RESET_EVENT = 'alim:session-reset';

function safe(fn) {
  try { return fn(); } catch { return undefined; } // storage blocked (private mode etc.)
}

function clearLocal(keep) {
  safe(() => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
    keys.forEach((k) => { if (k && !isAlwaysKept(k) && !keep.has(k)) localStorage.removeItem(k); });
  });
}

function clearSession() {
  safe(() => {
    const keys = [];
    for (let i = 0; i < sessionStorage.length; i++) keys.push(sessionStorage.key(i));
    keys.forEach((k) => { if (k && !k.startsWith('__alim_')) sessionStorage.removeItem(k); });
  });
}

function announce(reason) {
  safe(() => window.dispatchEvent(new CustomEvent(SESSION_RESET_EVENT, { detail: { reason } })));
}

/** Run once, before React renders: drop data written by an incompatible older release. */
export function migrateStorageOnBoot() {
  safe(() => {
    if (localStorage.getItem(VERSION_KEY) === STORAGE_VERSION) return;
    // Keep the session itself (it's an httpOnly cookie + these markers) so a
    // release doesn't sign everyone out; everything else is rebuilt fresh.
    clearLocal(new Set(['token', 'uid', 'role', 'userEmail', 'userName']));
    clearSession();
    localStorage.setItem(VERSION_KEY, STORAGE_VERSION);
  });
}

/** Call on a successful login, BEFORE writing the new account's details. */
export function resetForLogin() {
  clearLocal(new Set(['cart']));
  clearSession();
  announce('login');
}

/**
 * The session expired on its own (not a deliberate logout): drop the account's
 * data but keep the cart, so a shopper bounced to login mid-checkout comes back
 * to the same cart.
 */
export function resetForExpiredSession() {
  clearLocal(new Set(['cart']));
  clearSession();
  announce('expired');
}

/** Call on a deliberate logout. */
export function resetForLogout() {
  clearLocal(new Set());
  clearSession();
  announce('logout');
}
