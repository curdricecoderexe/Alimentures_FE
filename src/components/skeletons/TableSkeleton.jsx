import React from 'react';
export default function TableSkeleton() {
  return (
    <div className="bg-white dark:bg-[#1A1021] rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-white/10 overflow-hidden animate-pulse w-full">
      <div className="h-14 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10"></div>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="h-16 border-b border-gray-50 dark:border-white/5 flex items-center px-4 sm:px-6 gap-2 sm:gap-4 w-full">
          <div className="h-4 bg-gray-100 dark:bg-white/10 rounded w-1/4"></div>
          <div className="h-4 bg-gray-100 dark:bg-white/10 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-white/20 rounded w-1/6"></div>
          <div className="h-8 bg-gray-50 dark:bg-white/5 rounded-full w-20 ml-auto"></div>
        </div>
      ))}
    </div>
  );
}
