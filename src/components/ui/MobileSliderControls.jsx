import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Prev/next arrows + dots + "2 / 7" counter for a horizontal snap row on phones
 * (hidden from `sm` up, where rows show several cards at once).
 * `getEl` returns the scrolling element; its direct children are the slides.
 */
export default function MobileSliderControls({ getEl, count, label = 'products', className = '' }) {
  const [index, setIndex] = useState(0);

  const slideOffsets = useCallback((el) => {
    const kids = [...el.children];
    const base = kids[0]?.offsetLeft ?? 0;
    return kids.map((k) => k.offsetLeft - base);
  }, []);

  useEffect(() => {
    const el = getEl();
    if (!el) return undefined;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const offs = slideOffsets(el);
        let best = 0;
        offs.forEach((o, i) => { if (Math.abs(o - el.scrollLeft) < Math.abs(offs[best] - el.scrollLeft)) best = i; });
        setIndex(best);
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => { el.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); };
  }, [getEl, slideOffsets, count]);

  const go = (i) => {
    const el = getEl();
    if (!el) return;
    const offs = slideOffsets(el);
    const target = Math.max(0, Math.min(offs.length - 1, i));
    el.scrollTo({ left: offs[target], behavior: 'smooth' });
  };

  if (count < 2) return null;
  const dots = Math.min(count, 8); // keep the dot row short; the counter carries the rest

  const btn = 'h-11 w-11 shrink-0 rounded-full bg-white border border-hairline shadow-sm flex items-center justify-center text-ink transition-all active:scale-95 disabled:opacity-35 disabled:active:scale-100';

  return (
    <div className={`sm:hidden mt-5 flex items-center justify-between gap-3 ${className}`}>
      <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label={`Previous ${label}`} className={btn}>
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="flex flex-col items-center gap-2 min-w-0">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {Array.from({ length: dots }).map((_, i) => {
            const active = count <= 8 ? i === index : i === Math.round((index / (count - 1)) * (dots - 1));
            return (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${active ? 'w-6 bg-berry' : 'w-1.5 bg-berry/20'}`}
              />
            );
          })}
        </div>
        <span className="text-[11px] font-bold text-ink-muted tabular-nums" aria-live="polite">
          {index + 1} / {count}
        </span>
      </div>

      <button type="button" onClick={() => go(index + 1)} disabled={index >= count - 1} aria-label={`Next ${label}`} className={btn}>
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
