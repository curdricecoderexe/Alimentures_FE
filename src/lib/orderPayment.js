/** Unpaid = still awaiting payment, or auto-cancelled because the payment window lapsed. */
export const isUnpaidOrder = (o) => {
  const s = String(o?.status || '').toLowerCase();
  if (o?.razorpayPaymentId || o?.manualPayment) return false;
  return s === 'payment_pending' || s === 'cancelled';
};
