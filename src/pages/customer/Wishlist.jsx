import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { Heart, X, ArrowRight, ShieldCheck, HandHeart, Droplets } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import SEO from '../../components/SEO';
import { ProductImageFrame } from '../../components/ui/ProductCard';
import { Reveal } from '../../components/ui/motion';
import { productPath } from '../../lib/seo';
import { ShopHero, ShopSectionHead, FaqList, CARD, CARD_HOVER, LABEL } from '../../components/shop/ShopSections';

const EASE = [0.16, 1, 0.3, 1];

const WISHLIST_FAQS = [
  { q: 'How long are items saved in my Wishlist?', a: 'Your wishlist is saved locally and persists as long as you\'re on the same device and browser. We recommend adding favourites to cart when ready.' },
  { q: 'Can I move all wishlist items to my cart at once?', a: 'Yes! Use the "Move all to cart" button below your saved items. Each item will be added with its default weight variant.' },
  { q: 'Is there a limit to how many items I can save?', a: 'There\'s no limit. Save as many products as you like and curate your perfect wellness deck.' },
  { q: 'Are Alimenture products free from maida and refined oil?', a: 'Absolutely. Every Alimenture product is 100% free from maida (refined flour), white sugar, refined oils, preservatives, and artificial flavours. We use only ancient grains, palm jaggery, and pure cow butter.' },
  { q: 'Do you offer discounts for bulk orders?', a: 'Yes! Orders above ₹2000 qualify for bulk discounts. Contact us via the chat support for custom pricing on large orders.' },
  { q: 'What is your return policy if I am unsatisfied?', a: 'We offer a 100% satisfaction guarantee. If you\'re not happy with a product, contact us within 7 days of delivery and we\'ll arrange a full replacement or refund.' },
];

const PROMISES = [
  { Icon: ShieldCheck, title: 'Toxin-free certified', desc: 'Independently lab tested for complete absence of synthetic fertilizers, pesticide residue, and industrial heavy metals.' },
  { Icon: HandHeart, title: 'Native heritage grains', desc: 'Sourced direct from farming collectives cultivating Ragi, Thinai, and ancient native grains in living soils.' },
  { Icon: Droplets, title: 'Palm-sugar sweetened', desc: 'Sweetened exclusively with raw native palm sugar and coconut jaggery. Zero chemical sweeteners or white sugar added.' },
];

const getBenefitBadges = (item) => {
  const name = (item.name || item.title || '').toLowerCase();
  if (name.includes('red') || name.includes('ragi') || name.includes('bite')) return ['Ragi base', '0% white sugar', 'High fiber'];
  if (name.includes('penta') || name.includes('butter') || name.includes('five')) return ['5 grainlets', 'Preservative free', 'Native sweet'];
  if (name.includes('tri') || name.includes('grain') || name.includes('gain')) return ['Ragi & Thinai', 'No refined oils', 'Clean nutrition'];
  return ['Palm sugar base', 'Toxin free', 'Native grains'];
};

export default function Wishlist() {
  const { wishlist, toggleWishlist, addToCart, clearWishlist } = useCart();
  const navigate = useNavigate();

  const estimatedValue = wishlist.reduce((sum, item) => sum + (item.price || 0), 0);
  const count = wishlist.length;

  const moveToCart = (item) => {
    const token = localStorage.getItem('token');
    if (!token) { toast.error('Please login to add items to cart'); navigate('/login', { state: { from: '/wishlist' } }); return; }
    addToCart(item);
    toggleWishlist(item);
    toast.success('Moved to cart!');
  };

  const moveAll = () => {
    const token = localStorage.getItem('token');
    if (!token) { toast.error('Please login to continue'); navigate('/login'); return; }
    wishlist.forEach((item) => addToCart(item));
    clearWishlist();
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-cream text-ink relative overflow-x-hidden font-sans">
      <SEO title="Your wishlist" noindex />

      <ShopHero
        eyebrow="My favourites"
        title={<>Your <em>wishlist</em></>}
        text={count
          ? 'The heritage bakes and pantry staples you’ve saved — ready whenever you are.'
          : 'Save the products you love and come back to them any time.'}
        aside={count > 0 && (
          <div className="flex items-center gap-8 sm:gap-10 lg:pb-2">
            <div>
              <p className="headline text-4xl sm:text-5xl">{count}</p>
              <p className={`${LABEL} mt-1`}>{count === 1 ? 'Item saved' : 'Items saved'}</p>
            </div>
            {estimatedValue > 0 && (
              <div className="pl-8 sm:pl-10 border-l border-ink/10">
                <p className="headline text-4xl sm:text-5xl">₹{estimatedValue.toLocaleString('en-IN')}</p>
                <p className={`${LABEL} mt-1`}>Est. value</p>
              </div>
            )}
          </div>
        )}
      />

      <section className="relative z-10 bg-cream pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="mx-auto max-w-[1240px] lg:px-2">
          <AnimatePresence mode="wait">
            {count === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
                className={`${CARD} flex flex-col items-center text-center px-6 py-20 sm:py-24`}
              >
                <span className="h-16 w-16 rounded-full bg-berry-tint flex items-center justify-center mb-6">
                  <Heart className="h-7 w-7 text-berry" />
                </span>
                <h2 className="headline text-3xl sm:text-4xl">Nothing saved <em>yet</em></h2>
                <p className="text-ink-soft text-[15px] max-w-sm mt-3 mb-8">
                  Browse our heritage grain collection and tap the heart on anything you’d like to keep.
                </p>
                <Link to="/shop" className="btn-pill">
                  Explore products <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            ) : (
              <motion.div key="grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                <AnimatePresence>
                  {wishlist.map((item) => {
                    const name = item.name || item.title;
                    const hasId = item.id || item._id;
                    return (
                      <motion.article
                        key={item.id || item._id}
                        layout
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.45, ease: EASE }}
                        className={`group relative flex flex-col overflow-hidden ${CARD} ${CARD_HOVER}`}
                      >
                        {hasId ? (
                          <Link to={productPath(item)} aria-label={name}>
                            <ProductImageFrame src={item.image} alt={name} aspect="aspect-[4/3]" />
                          </Link>
                        ) : (
                          <ProductImageFrame src={item.image} alt={name} aspect="aspect-[4/3]" />
                        )}

                        <button
                          type="button"
                          onClick={() => toggleWishlist(item)}
                          aria-label={`Remove ${name} from wishlist`}
                          className="absolute top-2.5 right-2.5 h-9 w-9 rounded-full bg-white/95 flex items-center justify-center shadow-sm text-ink-soft hover:text-danger transition-[color,transform] duration-200 hover:scale-105 active:scale-95"
                        >
                          <X className="h-4 w-4" />
                        </button>

                        <div className="flex flex-1 flex-col px-4 pt-3.5 pb-4">
                          <span className={`${LABEL} truncate`}>{item.category || 'Heritage grain'}</span>
                          <h3 className="mt-1 line-clamp-2 min-h-[2.6em] text-[16px] font-semibold leading-[1.3] text-[#3D3A3C] group-hover:text-ink transition-colors">
                            {name}
                          </h3>

                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {getBenefitBadges(item).map((b) => (
                              <span key={b} className="inline-flex items-center h-6 px-2.5 rounded-full bg-cream text-[11px] font-medium text-ink-soft">{b}</span>
                            ))}
                          </div>

                          <p className="mt-auto pt-4 text-[18px] font-bold text-ink tracking-tight leading-none">
                            ₹{Number(item.price || 0).toLocaleString('en-IN')}
                            {item.selectedWeight && <span className="ml-1.5 text-[12px] font-medium text-ink-muted">/ {item.selectedWeight}</span>}
                          </p>

                          <button
                            type="button"
                            onClick={() => moveToCart(item)}
                            className="btn-brand mt-3 h-11 w-full rounded-[14px] text-[13.5px] font-semibold uppercase tracking-[0.05em]"
                          >
                            Move to cart
                          </button>
                        </div>
                      </motion.article>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {count > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <Link to="/shop" className="link-arrow">Continue shopping <ArrowRight className="h-4 w-4" /></Link>
              <button type="button" onClick={() => clearWishlist()} className="text-[13px] font-medium text-ink-muted hover:text-danger transition-colors">
                Clear wishlist
              </button>
            </div>
          )}

          {/* Move-all band — the landing page's dark brand field */}
          {count > 0 && (
            <Reveal className="mt-12 sm:mt-16 relative overflow-hidden rounded-[28px] bg-night px-6 py-10 sm:px-12 sm:py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-berry/30 blur-3xl" />
              <div className="relative space-y-3 max-w-xl">
                <span className="eyebrow eyebrow-light">Curated wellness deck</span>
                <h3 className="headline headline-on-dark text-3xl sm:text-[2.75rem]">
                  {count} item{count > 1 ? 's' : ''} <em>ready to nourish you</em>
                </h3>
                <p className="text-white/70 text-[15px] leading-relaxed">
                  Move your whole selection to the cart and begin your toxin-free nutrition journey.
                </p>
              </div>
              <button type="button" onClick={moveAll} className="btn-light relative shrink-0 w-full md:w-auto">
                Move all to cart <ArrowRight className="h-4 w-4" />
              </button>
            </Reveal>
          )}
        </div>
      </section>

      {/* Purity promise */}
      <section className="relative z-10 bg-cream border-t border-ink/10 py-16 sm:py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-[1240px] lg:px-2">
          <ShopSectionHead center eyebrow="Our purity promise" title={<>Beyond clean <em>food standards</em></>} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {PROMISES.map(({ Icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 0.06} className={`${CARD} ${CARD_HOVER} p-7 sm:p-8`}>
                <span className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-mulberry/[0.06] text-mulberry"><Icon className="h-5 w-5" strokeWidth={1.5} /></span>
                <h3 className="font-display text-xl text-ink tracking-[-0.01em] mb-2">{title}</h3>
                <p className="text-ink-soft text-[14.5px] leading-relaxed">{desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <FaqList
        title={<>Frequently asked <em>questions</em></>}
        text="Everything you need to know about our products, orders, and wellness philosophy."
        faqs={WISHLIST_FAQS}
      />
    </div>
  );
}
