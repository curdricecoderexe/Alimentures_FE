import Sk from './Sk';

/** Mirrors ProductCard: edge-to-edge 4:3 photo, tag, 2-line name, price row, full-width button. */
export default function ProductCardSkeleton() {
  return (
    <div className="rounded-[22px] overflow-hidden flex flex-col bg-white border border-[#ECE6DA]">
      <div className="relative aspect-[4/3] w-full bg-cream">
        <Sk className="absolute top-2.5 right-2.5 h-9 w-9" rounded="rounded-full" />
      </div>

      <div className="px-3.5 pt-3 pb-3.5 sm:px-4 sm:pt-3.5 sm:pb-4 flex flex-col gap-2 flex-1">
        <Sk className="h-2.5 w-20" />
        <Sk className="h-4 w-4/5" />
        <Sk className="h-4 w-1/2" />
        <Sk className="mt-2 h-5 w-32" />
        <Sk className="mt-1 h-10 sm:h-11 w-full" rounded="rounded-[14px]" />
      </div>
    </div>
  );
}
