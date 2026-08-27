import React from 'react';
export default function OrderListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white dark:bg-[#1A1021] rounded-3xl border border-gray-100 dark:border-white/10 p-6 flex flex-col sm:flex-row gap-6">
          <div className="w-24 h-24 bg-gray-100 dark:bg-white/10 rounded-2xl shrink-0"></div>
          <div className="flex-1 space-y-3">
            <div className="flex justify-between">
              <div className="h-5 bg-gray-200 dark:bg-white/20 rounded w-1/3"></div>
              <div className="h-5 bg-gray-100 dark:bg-white/10 rounded w-20"></div>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-white/10 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-white/20 rounded w-24"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
