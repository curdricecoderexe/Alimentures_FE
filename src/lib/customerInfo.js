/** Formatting helpers for an order's `customerInfo` (admin + staff screens). */

/** One-line "City, State – PIN" for an order's customerInfo. */
export const cityLine = (ci = {}) =>
  [[ci.city, ci.state].filter(Boolean).join(', '), ci.pincode].filter(Boolean).join(' – ');

/** Full postal address as plain text (for copy / export / labels). */
export const fullAddress = (ci = {}) => [ci.address, cityLine(ci)].filter(Boolean).join(', ');

/** Customer name / phone / email for an order. */
export const customerName = (o) => o?.customerInfo?.name || o?.customer || 'Unknown';
