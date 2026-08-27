import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, ShoppingBag, User, Calendar } from 'lucide-react';
import { authenticatedFetch } from '../../lib/api';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/orders/all/feedbacks`);
        if (res && res.ok) {
          const data = await res.json();
          setReviews(data.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

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
            Direct feedback from your customers to help improve quality and service.
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
            <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-2xl" />
          ))
        ) : reviews.length === 0 ? (
          <div className="col-span-full py-20 text-center">
             <MessageSquare className="h-16 w-16 text-gray-800 mx-auto mb-4" />
             <h3 className="text-2xl font-bold italic text-gray-900 tracking-tight">No Reviews Yet</h3>
             <p className="text-gray-500 font-bold">Feedback will appear here once customers start rating their orders.</p>
          </div>
        ) : (
          reviews.map((review) => (
            <motion.div key={review.orderId} variants={itemVariants}>
              <Card className="border-0 shadow-sm rounded-2xl bg-white shadow-sm border-gray-200/60 transition-shadow duration-300 border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-500">
                <CardContent className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-5 w-5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-800'}`} 
                        />
                      ))}
                    </div>
                    <Badge variant="outline" className="font-bold text-[9px] uppercase border-gray-100 text-gray-500 rounded-lg">
                      #{review.orderId.slice(-6).toUpperCase()}
                    </Badge>
                  </div>

                  <blockquote className="text-lg font-bold italic text-gray-800 leading-tight">
                    "{review.comment || 'No comment provided.'}"
                  </blockquote>

                  <div className="pt-6 border-t border-gray-50 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-bold italic text-gray-900 text-sm">{review.customerName || 'Anonymous User'}</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Verified Customer</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {review.submittedAt ? new Date(review.submittedAt?._seconds * 1000).toLocaleDateString() : 'Recent'}
                      </span>
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
