import { useEffect, useState } from 'react';
import { API_BASE, authenticatedFetch } from './api';

/*
 * First-order welcome offer (10% off). The API creates a personal, single-use
 * code for a signed-in customer who hasn't ordered yet, and returns null
 * otherwise (staff/admin, already ordered, already used).
 */

export async function fetchWelcomeCoupon() {
  if (!localStorage.getItem('token')) return null;
  if ((localStorage.getItem('role') || 'customer').toLowerCase() !== 'customer') return null;
  try {
    const res = await authenticatedFetch(`${API_BASE}/coupons/welcome`);
    if (!res || !res.ok) return null;
    const json = await res.json();
    return json?.success ? json.data : null;
  } catch {
    return null;
  }
}

export function useWelcomeCoupon() {
  const [coupon, setCoupon] = useState(null);
  useEffect(() => {
    let alive = true;
    fetchWelcomeCoupon().then((c) => { if (alive) setCoupon(c); });
    return () => { alive = false; };
  }, []);
  return coupon;
}

/** Validate a code against the order value; resolves to the applied-coupon object or throws with the API message. */
export async function validateCoupon(code, orderValue) {
  const res = await authenticatedFetch(`${API_BASE}/coupons/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: code.trim().toUpperCase(), orderValue }),
  });
  if (!res) throw new Error('Please sign in to apply a coupon');
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Invalid coupon');
  return { ...json.coupon, discountAmount: json.discountAmount, finalAmount: json.finalAmount };
}
