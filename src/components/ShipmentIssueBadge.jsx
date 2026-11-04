import React from 'react';
import { AlertTriangle, Undo2, Bike } from 'lucide-react';

/**
 * Small flag shown beside an order's status in the Orders lists when its
 * shipment needs a human: failed Shiprocket push, failed delivery attempt
 * (NDR), return to origin (RTO), lost parcel, or a local-partner delivery.
 */
function shipmentIssue(order) {
  const sh = order?.shipment || {};
  const open = !['delivered', 'refunded', 'cancelled'].includes(String(order?.status || '').toLowerCase());
  if (['rto_in_transit', 'rto_delivered'].includes(sh.state) && order.status !== 'refunded') {
    return { label: sh.state === 'rto_delivered' ? 'RTO received' : 'RTO', tone: 'red', Icon: Undo2 };
  }
  if (sh.state === 'lost' && order.status !== 'refunded') return { label: 'Lost', tone: 'red', Icon: AlertTriangle };
  if (!open) return null;
  if (sh.state === 'failed' || sh.needsAttention) return { label: 'Ship failed', tone: 'red', Icon: AlertTriangle };
  if (sh.ndr) return { label: 'NDR', tone: 'amber', Icon: AlertTriangle };
  if (sh.exception) return { label: 'Courier issue', tone: 'amber', Icon: AlertTriangle };
  if (order.deliveryPartner === 'local' && !sh.shipmentId) return { label: 'Local partner', tone: 'indigo', Icon: Bike };
  return null;
}

const TONES = {
  red: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900',
  amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900',
};

export default function ShipmentIssueBadge({ order }) {
  const issue = shipmentIssue(order);
  if (!issue) return null;
  const { Icon } = issue;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[9px] font-bold uppercase tracking-wider shrink-0 ${TONES[issue.tone]}`}>
      <Icon className="h-2.5 w-2.5" />{issue.label}
    </span>
  );
}
