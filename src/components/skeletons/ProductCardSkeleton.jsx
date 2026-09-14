import React from 'react';
import Sk from './Sk';

export default function ProductCardSkeleton() {
  return (
    <div className="glass rounded-card overflow-hidden flex flex-col">
      {/* image plate */}
      <div className="relative aspect-square w-full plate-berry">
        <Sk className="absolute top-3 left-3 h-[22px] w-14" rounded="rounded-full" />
        <Sk className="absolute top-3 right-3 h-8 w-8" rounded="rounded-full" />
      </div>

      {/* body — mirrors ProductCard p-5 */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-center justify-between">
          <Sk className="h-[22px] w-16" rounded="rounded-full" />
          <Sk className="h-3 w-8" />
        </div>
        <Sk className="h-4 w-3/4" />
        <div className="space-y-1.5 flex-1">
          <Sk className="h-2.5 w-full" />
          <Sk className="h-2.5 w-5/6" />
        </div>
        <div className="pt-3 border-t border-hairline space-y-3 mt-auto">
          <div className="flex items-baseline justify-between">
            <Sk className="h-2.5 w-10" />
            <Sk className="h-4 w-16" />
          </div>
          <div className="flex gap-2">
            <Sk className="h-9 flex-1" rounded="rounded-xl" />
            <Sk className="h-9 flex-1" rounded="rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
