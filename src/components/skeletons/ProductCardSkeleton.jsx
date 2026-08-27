import React from 'react';
export default function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#1A1021] rounded-3xl shadow-sm border border-gray-100 dark:border-white/10 p-4 flex flex-col gap-4 animate-pulse">
      <div className="w-full aspect-square bg-gray-100 dark:bg-white/10 rounded-2xl"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-white/20 rounded w-3/4"></div>
        <div className="h-3 bg-gray-100 dark:bg-white/10 rounded w-1/2"></div>
      </div>
      <div className="flex items-center justify-between mt-auto pt-4">
        <div className="h-5 bg-gray-200 dark:bg-white/20 rounded w-1/3"></div>
        <div className="h-8 w-8 bg-gray-100 dark:bg-white/10 rounded-full"></div>
      </div>
    </div>
  );
}
