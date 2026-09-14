import React from 'react';
import Sk, { SkCard } from './Sk';

/**
 * Suspense fallback while a lazy route chunk loads. Kept generic — a floating
 * glass nav pill over the shared page backdrop, then a hero + card row.
 */
export default function AppSkeleton() {
  return (
    <div className="relative min-h-screen font-sans overflow-x-hidden bg-cream">
      {/* nav pill */}
      <div className="fixed top-0 left-0 right-0 z-[100] pt-2.5 sm:pt-4 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass-sm rounded-full h-16 flex items-center justify-between px-6">
            <Sk className="h-8 w-32" />
            <div className="hidden md:flex gap-3">
              <Sk className="h-3 w-14" /><Sk className="h-3 w-14" /><Sk className="h-3 w-14" /><Sk className="h-3 w-14" />
            </div>
            <div className="flex gap-3">
              <Sk className="h-8 w-8" rounded="rounded-full" />
              <Sk className="h-8 w-8" rounded="rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-[1264px] pt-32 pb-24 relative z-10">
        <div className="flex flex-col gap-3.5 mb-10">
          <Sk className="h-3 w-24" />
          <Sk className="h-11 w-72" />
          <Sk className="h-[3px] w-[60px]" rounded="rounded-full" />
        </div>
        <SkCard className="h-40 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkCard className="h-64" />
          <SkCard className="h-64" />
          <SkCard className="h-64" />
        </div>
      </div>
    </div>
  );
}
