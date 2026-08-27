import React from 'react';
export default function AddressSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
      {[1, 2].map(i => (
        <div key={i} className="bg-white dark:bg-[#1A1021] rounded-3xl border border-gray-100 dark:border-white/10 p-6 space-y-3">
          <div className="flex justify-between">
            <div className="h-5 bg-gray-200 dark:bg-white/20 rounded w-1/3"></div>
            <div className="h-5 bg-gray-100 dark:bg-white/10 rounded w-16"></div>
          </div>
          <div className="h-3 bg-gray-100 dark:bg-white/10 rounded w-3/4"></div>
          <div className="h-3 bg-gray-100 dark:bg-white/10 rounded w-1/2"></div>
          <div className="pt-4 flex gap-2">
            <div className="h-8 bg-gray-50 dark:bg-white/5 rounded-lg w-16"></div>
            <div className="h-8 bg-gray-50 dark:bg-white/5 rounded-lg w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
