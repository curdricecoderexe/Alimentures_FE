import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Trash2, ShieldCheck, User, Package, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { authenticatedFetch } from '../../lib/api';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

function fmtDate(ts) {
  if (!ts) return 'Recent';
  const ms = ts._seconds ? ts._seconds * 1000 : (ts.seconds ? ts.seconds * 1000 : Date.parse(ts));
  return ms && !Number.isNaN(ms) ? new Date(ms).toLocaleDateString() : 'Recent';
}

// Reviews come straight from the post-delivery feedback prompt and go live
// immediately — there's no approval queue. This page is view + spam removal.
// The backend joins each review with the product (title/image) and order
// (customer/date/total) it came from, so no extra lookups are needed here.
export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/reviews/admin`);
      if (res && res.ok) {
        const data = await res.json();
        setReviews(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const remove = async (id) => {
    if (!window.confirm('Permanently delete this review?')) return;
    setBusyId(id);
    const toastId = toast.loading('Deleting…');
    try {
      const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/reviews/admin/${id}`, { method: 'DELETE' });
      if (res && res.ok) {
        toast.success('Review deleted', { id: toastId });
        setReviews((prev) => prev.filter((r) => r.id !== id));
      } else {
        toast.error('Delete failed', { id: toastId });
      }
    } catch {
      toast.error('Network error', { id: toastId });
    } finally {
      setBusyId(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="p-8 space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <Badge className="bg-amber-50 text-amber-600 border-none font-bold uppercase tracking-wider text-[10px] px-4 py-1.5 rounded-full">
            Customer Sentiments
          </Badge>
          <h1 className="text-5xl font-bold tracking-tighter italic text-gray-900 leading-tight">Reviews.</h1>
          <p className="text-gray-500 font-bold max-w-lg leading-relaxed">
            Live product reviews from post-delivery feedback. They show on the storefront immediately — delete any that are spam or abusive.
          </p>
        </div>
      </header>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="h-80 bg-gray-100 animate-pulse rounded-2xl" />
          ))
        ) : reviews.length === 0 ? (
          <div className="col-span-full py-20 text-center">
             <MessageSquare className="h-16 w-16 text-gray-800 mx-auto mb-4" />
             <h3 className="text-2xl font-bold italic text-gray-900 tracking-tight">No Reviews Yet</h3>
             <p className="text-gray-500 font-bold">Reviews will appear here once customers rate delivered orders.</p>
          </div>
        ) : (
          reviews.map((review) => (
            <motion.div key={review.id} variants={itemVariants}>
              <Card className="border-0 shadow-sm rounded-2xl bg-white shadow-sm border-gray-200/60 transition-shadow duration-300 border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-500">
                <CardContent className="p-0">
                  {/* Product */}
                  <div className="flex items-center gap-3 p-5 border-b border-gray-50 bg-gray-50/60">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-gray-100 shrink-0 flex items-center justify-center">
                      {review.productImage ? (
                        <img src={review.productImage} alt={review.productTitle} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-5 w-5 text-gray-300" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-gray-900 truncate">{review.productTitle}</p>
                      <div className="flex gap-0.5 mt-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    <blockquote className="text-base font-bold italic text-gray-800 leading-tight">
                      "{review.comment || 'No comment provided.'}"
                    </blockquote>

                    {/* Customer */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{review.customerName || 'Customer'}</p>
                        {review.customerEmail && (
                          <p className="text-[10px] font-bold text-gray-400 truncate">{review.customerEmail}</p>
                        )}
                      </div>
                      {review.verifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 uppercase tracking-wider ml-auto shrink-0">
                          <ShieldCheck className="h-3 w-3" /> Verified
                        </span>
                      )}
                    </div>

                    {/* Order */}
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50/80 border border-gray-100 px-3.5 py-2.5">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <p>Order #{String(review.orderId || '').slice(-6).toUpperCase()}</p>
                        <p className="text-gray-400 mt-0.5">
                          {fmtDate(review.orderDate)}{review.orderTotal != null ? ` · ₹${review.orderTotal}` : ''}
                        </p>
                      </div>
                      {review.orderId && (
                        <Link
                          to={`/admin/orders?orderId=${review.orderId}`}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-gray-800 shrink-0"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{fmtDate(review.createdAt)}</span>
                      <Button
                        onClick={() => remove(review.id)}
                        disabled={busyId === review.id}
                        className="h-9 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center gap-1.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}
