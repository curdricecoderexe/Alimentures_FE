import React from 'react';
import Sk, { SkCard } from './Sk';

export default function ProductDetailsSkeleton() {
  return (
    <div className="min-h-screen relative overflow-x-hidden font-sans">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-[1440px] py-24 sm:py-28 relative z-10">
        <Sk className="h-9 w-32 mb-6 sm:mb-8" rounded="rounded-full" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">
          {/* left — image showcase */}
          <div className="lg:col-span-7 space-y-6">
            <Sk className="w-full h-[420px] sm:h-[560px] lg:h-[620px]" rounded="rounded-[3.5rem]" />
            <div className="grid grid-cols-3 gap-4">
              <Sk className="h-24" rounded="rounded-2xl" />
              <Sk className="h-24" rounded="rounded-2xl" />
              <Sk className="h-24" rounded="rounded-2xl" />
            </div>
          </div>

          {/* right — info panel */}
          <div className="lg:col-span-5 space-y-6">
            <Sk className="h-[22px] w-20" rounded="rounded-full" />
            <Sk className="h-10 w-4/5" />
            <div className="flex gap-2">
              <Sk className="h-4 w-24" />
              <Sk className="h-4 w-16" />
            </div>
            <Sk className="h-9 w-32" />

            <SkCard className="p-5 space-y-3">
              <Sk className="h-2.5 w-24" />
              <div className="flex gap-3">
                <Sk className="h-12 flex-1" rounded="rounded-2xl" />
                <Sk className="h-12 flex-1" rounded="rounded-2xl" />
                <Sk className="h-12 flex-1" rounded="rounded-2xl" />
              </div>
            </SkCard>

            <div className="space-y-2.5">
              <Sk className="h-3 w-full" />
              <Sk className="h-3 w-5/6" />
              <Sk className="h-3 w-11/12" />
            </div>

            <div className="flex gap-3 pt-2">
              <Sk className="h-14 w-14" rounded="rounded-2xl" />
              <Sk className="h-14 flex-1" rounded="rounded-full" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Sk className="h-16" rounded="rounded-2xl" />
              <Sk className="h-16" rounded="rounded-2xl" />
              <Sk className="h-16" rounded="rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
