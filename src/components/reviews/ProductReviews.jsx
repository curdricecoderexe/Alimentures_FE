import React from 'react';
import { Star, ShieldCheck } from 'lucide-react';
import ReviewSkeleton from '../skeletons/ReviewSkeleton';

function StarRow({ value, size = 'h-5 w-5' }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${size} ${s <= value ? 'fill-[#D7A94E] text-[#D7A94E]' : 'text-gray-300 fill-current'}`} />
      ))}
    </div>
  );
}

function fmtDate(ts) {
  if (!ts) return '';
  // Firestore timestamps serialize as { _seconds } or ISO strings.
  const ms = ts._seconds ? ts._seconds * 1000 : (ts.seconds ? ts.seconds * 1000 : Date.parse(ts));
  if (!ms || Number.isNaN(ms)) return '';
  return new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// Reviews here come from the post-delivery feedback prompt (Order Tracking),
// not from a "Write a Review" flow on this page — every review is a
// verified purchase and shows up immediately, with no moderation step.
export default function ProductReviews({
  reviews = [],
  loading = false,
  averageRating = 0,
  reviewCount = 0,
}) {
  return (
    <section className="mt-24 pt-16 border-t border-hairline">
      <div className="mb-10">
        <h3 className="text-2xl font-extrabold uppercase tracking-widest text-[#221B1F]">Customer Reviews</h3>
        <div className="flex items-center gap-3 mt-3">
          <StarRow value={Math.round(averageRating)} />
          <span className="text-sm font-bold text-ink-muted">
            {reviewCount > 0
              ? `${averageRating} out of 5 · ${reviewCount} review${reviewCount === 1 ? '' : 's'}`
              : 'No reviews yet'}
          </span>
        </div>
      </div>

      {loading ? (
        <ReviewSkeleton />
      ) : reviews.length === 0 ? (
        <p className="text-sm text-ink-muted font-medium py-8 text-center">
          This product has no reviews yet.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {reviews.map((r) => (
            <div key={r.id} className="glass rounded-panel p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-3">
                <StarRow value={r.rating} size="h-4 w-4" />
                <span className="text-[11px] text-ink-muted font-semibold">{fmtDate(r.createdAt)}</span>
              </div>
              {r.title && <h4 className="font-display font-extrabold text-[15px] text-[#221B1F]">{r.title}</h4>}
              <p className="text-sm text-ink-soft font-medium leading-relaxed whitespace-pre-line" style={{ overflowWrap: 'anywhere' }}>
                {r.comment}
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] font-bold text-ink-muted">
                <span>{r.userName || 'Verified Customer'}</span>
                {r.verifiedPurchase && (
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified Purchase
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
