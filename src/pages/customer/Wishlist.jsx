import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, Heart, Trash2, ArrowLeft, Sparkles, ArrowRight, Star, Shield, Leaf, Zap, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import FallbackImg from '../../assets/lan.png';
import { toast } from 'sonner';
import ParticleCanvas from '../../components/ui/ParticleCanvas';

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } };

const WISHLIST_FAQS = [
  { q: 'How long are items saved in my Wishlist?', a: 'Your wishlist is saved locally and persists as long as you\'re on the same device and browser. We recommend adding favourites to cart when ready.' },
  { q: 'Can I move all wishlist items to my cart at once?', a: 'Yes! Use the "Move All to Cart" button at the bottom. Each item will be added with its default weight variant.' },
  { q: 'Is there a limit to how many items I can save?', a: 'There\'s no limit. Save as many products as you like and curate your perfect wellness deck.' },
  { q: 'Are Alimenture products free from maida and refined oil?', a: 'Absolutely. Every Alimenture product is 100% free from maida (refined flour), white sugar, refined oils, preservatives, and artificial flavours. We use only ancient grains, palm jaggery, and pure cow butter.' },
  { q: 'Do you offer discounts for bulk orders?', a: 'Yes! Orders above ₹2000 qualify for bulk discounts. Contact us via the chat support for custom pricing on large orders.' },
  { q: 'What is your return policy if I am unsatisfied?', a: 'We offer a 100% satisfaction guarantee. If you\'re not happy with a product, contact us within 7 days of delivery and we\'ll arrange a full replacement or refund.' },
];

export default function Wishlist() {
  const { wishlist, toggleWishlist, addToCart, clearWishlist } = useCart();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const estimatedValue = wishlist.reduce((sum, item) => sum + (item.price || 0), 0);

  const getBenefitBadges = (item) => {
    const name = (item.name || item.title || '').toLowerCase();
    if (name.includes('red') || name.includes('ragi') || name.includes('bite')) return ['Ragi Base', '0% White Sugar', 'High Fiber'];
    if (name.includes('penta') || name.includes('butter') || name.includes('five')) return ['5 Grainlets', 'Preservative Free', 'Native Sweet'];
    if (name.includes('tri') || name.includes('grain') || name.includes('gain')) return ['Ragi & Thinai', 'No Refined Oils', 'Clean Nutrition'];
    return ['Palm Sugar Base', 'Toxin Free', 'Native Grains'];
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] relative overflow-x-hidden font-sans">
      {/* Animated particles */}
      <ParticleCanvas count={50} colors={['#920075','#D4AF37','#F59E0B','#E91E8C','#FDE047']} minSize={0.8} maxSize={3} speed={0.65} interactive={true} />
      {/* Ambient background */}
      <div className="absolute top-0 left-1/4 w-[700px] h-[400px] bg-[#920075]/4 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[350px] bg-[#D4AF37]/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-[1400px] py-24 relative z-10">

        {/* Back button */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="mb-8 flex justify-center sm:justify-start">
          <button onClick={() => navigate('/')} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-600 text-xs font-semibold hover:border-[#920075]/40 hover:text-[#920075] transition-all shadow-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Continue Shopping
          </button>
        </motion.div>

        {/* Hero Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="mb-12 text-center sm:text-left">
          <div className="flex flex-col gap-4 items-center sm:items-start">
            <div className="space-y-2 flex flex-col items-center sm:items-start">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-[#920075] justify-center sm:justify-start">
                <Heart className="h-3.5 w-3.5 fill-current" /> My Favourites
              </span>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-[#0a0806] tracking-tight leading-tight text-center sm:text-left">
                Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#920075] to-[#D4AF37]">Wishlist</span>
              </h1>
            </div>

            {/* Stats bar */}
            {wishlist.length > 0 && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <div className="px-4 py-2.5 sm:px-5 sm:py-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-center min-w-[80px]">
                  <p className="text-xl sm:text-2xl font-black text-[#920075]">{wishlist.length}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Items</p>
                </div>
                {estimatedValue > 0 && (
                  <div className="px-4 py-2.5 sm:px-5 sm:py-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-center">
                    <p className="text-xl sm:text-2xl font-black text-[#0a0806]">₹{estimatedValue}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Est. Value</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="h-px bg-gradient-to-r from-[#920075]/20 via-[#D4AF37]/30 to-transparent mt-6 sm:mt-8" />
        </motion.div>

        {/* Wishlist grid */}
        <AnimatePresence mode="wait">
          {wishlist.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-20 h-20 bg-[#920075]/5 border border-[#920075]/10 rounded-full flex items-center justify-center mb-6">
                <Heart className="h-9 w-9 text-[#920075]/40" />
              </div>
              <h2 className="text-2xl font-display font-black text-[#0a0806] mb-2">Your Wishlist is Empty</h2>
              <p className="text-gray-500 text-sm max-w-sm text-center mb-8">
                Browse our heritage grain collection and save your favourite products here.
              </p>
              <button onClick={() => navigate('/')}
                className="px-8 h-12 rounded-xl bg-[#920075] text-white font-black uppercase text-[10px] tracking-[0.2em] hover:bg-[#7a0062] transition-colors shadow-[0_4px_14px_rgba(146,0,117,0.25)]">
                Explore Products
              </button>
            </motion.div>
          ) : (
            <motion.div key="grid" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlist.map((item) => (
                <motion.div key={item.id || item._id} variants={fadeIn} layout>
                  <div className="group relative flex flex-col rounded-[1.75rem] overflow-hidden bg-white border border-gray-100 shadow-[0_2px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_16px_48px_rgba(146,0,117,0.10)] hover:border-[#920075]/20 hover:-translate-y-1.5 transition-all duration-400">
                    {/* Image */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50 shrink-0">
                      <img src={item.image || FallbackImg} alt={item.name || item.title}
                        className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-600 opacity-0"
                        loading="lazy" decoding="async"
                        onLoad={e => e.target.classList.remove('opacity-0')} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#D4AF37] text-white font-black uppercase text-[8px] tracking-widest shadow-sm">Heritage</span>
                      <button onClick={() => toggleWishlist(item)}
                        className="absolute top-3 right-3 h-8 w-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-red-400 hover:text-white hover:bg-red-500 transition-all border border-white/50 shadow-sm">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 p-3.5">
                        <h3 className="font-display font-black text-white text-base leading-tight line-clamp-1">{item.name || item.title}</h3>
                        {item.category && <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest mt-0.5">{item.category}</p>}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-4 flex-1 flex flex-col gap-3">
                      <div className="flex flex-wrap gap-1.5">
                        {getBenefitBadges(item).slice(0, 3).map((b, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-gray-50 border border-gray-200/80 text-[9px] font-semibold text-gray-500">{b}</span>
                        ))}
                      </div>

                      <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Price</p>
                          <p className="text-lg font-black text-[#0a0806] leading-none mt-0.5">₹{item.price}</p>
                        </div>
                        <button
                          onClick={() => {
                            const token = localStorage.getItem('token');
                            if (!token) { toast.error('Please login to add items to cart'); navigate('/login', { state: { from: '/wishlist' } }); return; }
                            addToCart(item);
                            toggleWishlist(item);
                            toast.success('Moved to cart!');
                          }}
                          className="flex-1 h-9 rounded-xl bg-[#920075] text-white font-black uppercase text-[9px] tracking-[0.15em] hover:bg-[#7a0062] transition-colors flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(146,0,117,0.2)]">
                          <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Move all banner */}
        {wishlist.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16 relative rounded-[1.75rem] sm:rounded-[2rem] overflow-hidden bg-gradient-to-br from-[#1F0320] via-[#2B062C] to-[#150216] p-6 sm:p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#920075]/30 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#D4AF37]/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/15 rounded-full text-[9px] font-black text-[#D4AF37] uppercase tracking-widest mb-3">
                <Sparkles className="h-3 w-3" /> Curated Wellness Deck
              </span>
              <h3 className="font-display font-black text-white text-xl sm:text-2xl md:text-3xl leading-tight">
                {wishlist.length} item{wishlist.length > 1 ? 's' : ''} ready to nourish you
              </h3>
              <p className="text-gray-400 text-sm mt-2 font-sans max-w-lg">Move your entire selection to cart and begin your toxin-free nutrition journey.</p>
            </div>
            <button
              onClick={() => {
                const token = localStorage.getItem('token');
                if (!token) { toast.error('Please login to continue'); navigate('/login'); return; }
                wishlist.forEach(item => addToCart(item));
                clearWishlist();
                navigate('/cart');
              }}
              className="relative z-10 w-full md:w-auto shrink-0 px-8 sm:px-10 h-12 sm:h-14 rounded-2xl bg-[#D4AF37] text-black font-black uppercase text-[10px] tracking-[0.2em] hover:bg-white transition-colors shadow-lg whitespace-nowrap">
              Move All to Cart
            </button>
          </motion.div>
        )}

        {/* Trust pillars */}
        <div className="mt-24 border-t border-gray-200/50 pt-16">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#920075] bg-[#920075]/8 border border-[#920075]/15 px-5 py-2 rounded-full inline-block">Our Purity Promise</span>
            <h2 className="font-display text-3xl sm:text-4xl font-black text-[#0a0806] tracking-tight">Beyond Clean Food Standards</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🔬', accent: '#920075', title: 'Toxin-Free Certified', desc: 'Independently lab tested for complete absence of synthetic fertilizers, pesticide residue, and industrial heavy metals.' },
              { icon: '🌾', accent: '#D4AF37', title: 'Native Heritage Grains', desc: 'Sourced direct from biodiversity farming collectives cultivating wild Ragi, Thinai, and ancient native grains in living soils.' },
              { icon: '🍯', accent: '#F59E0B', title: 'Palm-Sugar Sweetened', desc: 'Sweetened exclusively with raw native palm sugar and coconut jaggery. Zero chemical sweeteners or white sugar added.' },
            ].map((item, i) => (
              <div key={i} className="group relative p-7 bg-white border border-gray-100 rounded-[1.75rem] shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(146,0,117,0.08)] hover:border-[#920075]/20 hover:-translate-y-1 transition-all duration-400 overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#920075]/30 to-transparent" />
                <div className="h-12 w-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <h3 className="font-display font-black text-lg text-[#0a0806] mb-2 group-hover:text-[#920075] transition-colors">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-24 border-t border-gray-200/50 pt-16 mb-16">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37] bg-[#D4AF37]/8 border border-[#D4AF37]/15 px-5 py-2 rounded-full inline-block">Customer Questions</span>
            <h2 className="font-display text-3xl sm:text-4xl font-black text-[#0a0806] tracking-tight">Frequently Asked Questions</h2>
            <p className="text-gray-500 text-sm">Everything you need to know about our products, orders, and wellness philosophy.</p>
          </div>

          <div className="max-w-3xl mx-auto grid grid-cols-1 gap-3">
            {WISHLIST_FAQS.map((faq, i) => (
              <div key={i} className={`rounded-2xl border bg-white transition-all duration-300 overflow-hidden ${openFaq === i ? 'border-[#920075]/25 shadow-[0_8px_30px_rgba(146,0,117,0.07)]' : 'border-gray-100 shadow-sm hover:border-gray-200'}`}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left gap-4">
                  <span className={`font-display font-black text-base leading-snug transition-colors ${openFaq === i ? 'text-[#920075]' : 'text-[#0a0806]'}`}>{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-[#920075]' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                      <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                        <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
