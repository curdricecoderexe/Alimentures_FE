/**
 * Which orders count as sales in admin dashboards.
 *
 * Allow-list of PAID, still-live statuses (mirrors the backend's
 * ORDER_TRANSITIONS). Cancelled, refunded, unpaid (`payment_pending`) and
 * failed orders never count towards revenue, order totals or top products —
 * an allow-list keeps any new non-sale status out by default.
 */
export const REVENUE_STATUSES = Object.freeze([
  'pending', // paid & confirmed, awaiting fulfilment
  'payment_successful_no_stock', // paid; stock being arranged
  'processing',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
]);

export const isRevenueOrder = (o) => REVENUE_STATUSES.includes(String(o?.status || '').toLowerCase());

export const revenueOf = (orders) => orders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
