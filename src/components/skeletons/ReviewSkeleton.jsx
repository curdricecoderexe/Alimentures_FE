import React from 'react';
export default function ReviewSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white dark:bg-[#1A1021] rounded-3xl border border-gray-100 dark:border-white/10 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 dark:bg-white/10 rounded-full"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 dark:bg-white/20 rounded w-32"></div>
              <div className="h-3 bg-gray-100 dark:bg-white/10 rounded w-20"></div>
            </div>
          </div>
          <div className="h-3 bg-gray-100 dark:bg-white/10 rounded w-full"></div>
          <div className="h-3 bg-gray-100 dark:bg-white/10 rounded w-5/6"></div>
        </div>
      ))}
    </div>
  );
}
