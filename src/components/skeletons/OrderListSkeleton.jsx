import React from 'react';
import Sk, { SkCard } from './Sk';

export default function OrderListSkeleton() {
  return (
    <div>
      {/* header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-9">
        <div className="flex flex-col gap-3.5">
          <Sk className="h-3 w-24" />
          <Sk className="h-11 w-64" />
          <Sk className="h-[3px] w-[60px]" rounded="rounded-full" />
        </div>
        <div className="flex gap-2">
          <Sk className="h-[34px] w-24" rounded="rounded-full" />
          <Sk className="h-[34px] w-28" rounded="rounded-full" />
          <Sk className="h-[34px] w-28" rounded="rounded-full" />
        </div>
      </div>

      {/* active order card */}
      <SkCard panel className="foil-top p-6 sm:p-8 mb-6">
        <div className="flex flex-col lg:flex-row lg:justify-between gap-5 pb-7 border-b border-white/50">
          <div className="flex flex-col gap-2.5">
            <div className="flex gap-2.5">
              <Sk className="h-[28px] w-32" rounded="rounded-full" />
              <Sk className="h-[26px] w-20" rounded="rounded-full" />
            </div>
            <Sk className="h-8 w-72" />
            <Sk className="h-3 w-80" />
          </div>
          <div className="flex gap-2">
            <Sk className="h-10 w-24" rounded="rounded-full" />
            <Sk className="h-10 w-24" rounded="rounded-full" />
          </div>
        </div>

        {/* timeline dots */}
        <div className="flex justify-between py-9 px-2 sm:px-6">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <Sk className="h-[52px] w-[52px]" rounded="rounded-full" />
              <Sk className="h-3 w-16" />
            </div>
          ))}
        </div>

        {/* items + side */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="flex flex-col gap-3">
            <Sk className="h-2.5 w-32" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass-sm rounded-card p-3.5 flex items-center gap-4">
                <Sk className="h-16 w-16" rounded="rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Sk className="h-3.5 w-1/2" />
                  <Sk className="h-2.5 w-24" />
                </div>
                <Sk className="h-4 w-12" />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            <div className="glass-sm rounded-card p-5 space-y-3">
              <Sk className="h-2.5 w-20" />
              <Sk className="h-3.5 w-28" />
              <Sk className="h-3 w-40" />
              <Sk className="h-3 w-36" />
            </div>
            <div className="glass-sm rounded-card p-5 space-y-2.5">
              <Sk className="h-2.5 w-16" />
              <Sk className="h-3 w-full" />
              <Sk className="h-3 w-full" />
              <Sk className="h-6 w-24" />
            </div>
          </div>
        </div>
      </SkCard>

      {/* history rows */}
      <div className="flex flex-col gap-3.5 mt-8">
        {[0, 1].map((i) => (
          <SkCard key={i} className="p-5 sm:px-6 flex items-center gap-6">
            <div className="flex -space-x-3.5">
              <Sk className="h-12 w-12" rounded="rounded-xl" />
              <Sk className="h-12 w-12" rounded="rounded-xl" />
            </div>
            <div className="flex-1 space-y-2">
              <Sk className="h-3.5 w-40" />
              <Sk className="h-2.5 w-56" />
            </div>
            <Sk className="h-5 w-16" />
            <Sk className="h-9 w-24" rounded="rounded-full" />
          </SkCard>
        ))}
      </div>
    </div>
  );
}
