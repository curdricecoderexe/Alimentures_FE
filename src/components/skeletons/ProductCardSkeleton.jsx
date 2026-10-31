import React from 'react';
import Sk from './Sk';

export default function ProductCardSkeleton() {
  return (
    <div className="rounded-[24px] overflow-hidden flex flex-col bg-white border border-hairline/80 shadow-[0_10px_28px_-18px_rgba(121,8,63,0.2)]">
      {/* image frame — mirrors ProductCard's inset 16:9 frame */}
      <div className="p-1.5 sm:p-2 pb-0 sm:pb-0">
        <div className="relative aspect-[4/3] sm:aspect-video w-full rounded-[18px] plate-berry">
          <Sk className="absolute top-2 right-2 h-9 w-9" rounded="rounded-full" />
        </div>
      </div>

      {/* body — mirrors ProductCard: category/rating row, title, weights */}
      <div className="px-3 sm:px-4 pt-3 sm:pt-3.5 flex flex-col gap-2 flex-1">
        <Sk className="h-2.5 w-16" />
        <Sk className="h-4 w-3/4" />
        <Sk className="h-4 w-1/2" />
        <div className="flex gap-1">
          <Sk className="h-5 w-10" rounded="rounded-md" />
          <Sk className="h-5 w-10" rounded="rounded-md" />
        </div>
      </div>

      {/* price + action */}
      <div className="mx-3 sm:mx-4 mt-3 py-3 border-t border-hairline flex items-end justify-between">
        <Sk className="h-6 w-16" />
        <Sk className="h-10 w-10 sm:w-20" rounded="rounded-xl" />
      </div>
    </div>
  );
}
