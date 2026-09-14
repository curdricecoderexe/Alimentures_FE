import React from 'react';
import Sk, { SkCard } from './Sk';

export default function CartSkeleton() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-[1264px] py-24 relative z-10">
      {/* header + steps */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-9">
        <div className="flex flex-col gap-3.5">
          <Sk className="h-12 w-56" />
          <Sk className="h-[3px] w-[60px]" rounded="rounded-full" />
          <Sk className="h-3 w-64" />
        </div>
        <Sk className="h-[52px] w-72" rounded="rounded-full" />
      </div>

      {/* free-ship bar */}
      <SkCard className="h-[76px] mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        {/* items */}
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <SkCard key={i} className="p-4 sm:p-5 flex gap-4 sm:gap-5 items-center">
              <Sk className="w-full h-40 sm:w-28 sm:h-28" rounded="rounded-2xl" />
              <div className="flex-1 space-y-2.5">
                <Sk className="h-2.5 w-20" />
                <Sk className="h-4 w-1/2" />
                <Sk className="h-2.5 w-32" />
              </div>
              <div className="flex flex-col items-end gap-3">
                <Sk className="h-[42px] w-28" rounded="rounded-full" />
                <Sk className="h-5 w-16" />
              </div>
            </SkCard>
          ))}
        </div>

        {/* summary */}
        <div className="flex flex-col gap-4">
          <SkCard panel className="foil-top p-6 sm:p-7 space-y-4">
            <Sk className="h-2.5 w-24" />
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between">
                <Sk className="h-3 w-24" /><Sk className="h-3 w-14" />
              </div>
            ))}
            <div className="h-px bg-white/50" />
            <div className="flex justify-between items-end">
              <Sk className="h-3 w-20" /><Sk className="h-8 w-24" />
            </div>
            <Sk className="h-[52px] w-full" rounded="rounded-full" />
          </SkCard>
          <SkCard className="h-28" />
          <SkCard className="h-32" />
        </div>
      </div>
    </div>
  );
}
