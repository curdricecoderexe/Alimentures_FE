import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { MilletSpray, WheatSpray } from '../home/BotanicalArt';
import { Reveal } from '../ui/motion';

/* Shared building blocks for the shopper pages (Cart, Wishlist), written in
   the landing page's editorial voice: cream field, botanical sprays, "● Label"
   eyebrow, light Outfit headline, white hairline cards and pill buttons. */

export const CARD = 'rounded-[22px] bg-white border border-[#ECE6DA]';
export const CARD_HOVER = 'transition-[border-color,box-shadow] duration-300 hover:border-[#E0D6C4] hover:shadow-[0_18px_40px_-28px_rgba(43,11,51,0.35)]';
export const LABEL = 'text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#A09A92]';

/** Page header: eyebrow, headline, lead text and an optional right-hand slot. */
export function ShopHero({ eyebrow, title, text, aside, children }) {
  return (
    // -mt-20 cancels CustomerLayout's pt-20 so the cream field runs to the top
    // edge (behind the floating nav) instead of exposing PageBackdrop's pink wash.
    <section className="relative z-10 -mt-20 overflow-clip bg-cream pt-36 sm:pt-44 pb-12 sm:pb-16 px-4 sm:px-6 font-sans">
      <MilletSpray className="pointer-events-none absolute -left-10 sm:-left-6 -bottom-12 w-[130px] sm:w-[190px] lg:w-[220px] opacity-80 -rotate-[8deg]" />
      <WheatSpray className="pointer-events-none absolute -right-10 sm:-right-6 -bottom-12 w-[130px] sm:w-[180px] lg:w-[210px] opacity-75 rotate-[6deg]" />
      <div className="relative mx-auto max-w-[1240px] lg:px-2">
        <div className={`flex flex-col gap-6 ${aside ? 'lg:flex-row lg:items-end lg:justify-between' : 'items-center text-center'}`}>
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={`space-y-4 max-w-2xl ${aside ? '' : 'mx-auto'}`}
          >
            <span className="eyebrow">{eyebrow}</span>
            <h1 className="headline text-[2.6rem] sm:text-6xl lg:text-[4.25rem]">{title}</h1>
            {text && <p className="text-ink-soft text-[15px] sm:text-lg leading-relaxed">{text}</p>}
          </motion.div>
          {aside}
        </div>
        {children}
      </div>
    </section>
  );
}

/** Section header used further down the page. */
export function ShopSectionHead({ eyebrow, title, text, center = false, action }) {
  return (
    <Reveal className={`flex flex-col gap-3 sm:gap-4 mb-8 sm:mb-12 ${center ? 'items-center text-center max-w-2xl mx-auto' : 'sm:flex-row sm:items-end sm:justify-between'}`}>
      <div className={`space-y-3 sm:space-y-4 ${center ? '' : 'max-w-2xl'}`}>
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="headline text-[2.1rem] sm:text-5xl">{title}</h2>
        {text && <p className="text-ink-soft text-[14px] sm:text-base leading-relaxed">{text}</p>}
      </div>
      {action}
    </Reveal>
  );
}

/** Hairline accordion — same rhythm as the landing page's category rows. */
export function FaqList({ eyebrow = 'Have questions?', title, text, faqs }) {
  const [open, setOpen] = useState(null);
  return (
    <section className="relative z-10 bg-paper py-16 sm:py-24 px-4 sm:px-6 font-sans">
      <div className="mx-auto max-w-[1240px] grid lg:grid-cols-12 gap-10 lg:gap-16">
        <Reveal className="lg:col-span-4 space-y-4 lg:sticky lg:top-28 self-start">
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="headline text-4xl sm:text-5xl">{title}</h2>
          {text && <p className="text-ink-soft text-[15px] leading-relaxed">{text}</p>}
        </Reveal>
        <ul className="lg:col-span-8 border-t border-ink/10">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <li key={faq.q} className="border-b border-ink/10">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="group w-full flex items-center justify-between gap-6 py-5 sm:py-6 text-left"
                >
                  <span className={`font-display text-[17px] sm:text-xl leading-snug tracking-[-0.01em] transition-colors ${isOpen ? 'text-berry' : 'text-ink group-hover:text-berry'}`}>
                    {faq.q}
                  </span>
                  <span className={`h-9 w-9 shrink-0 rounded-full border flex items-center justify-center transition-all duration-300 ${isOpen ? 'rotate-45 border-berry text-berry' : 'border-ink/20 text-ink-soft'}`}>
                    <Plus className="h-4 w-4" />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 pr-12 text-ink-soft text-[15px] leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
