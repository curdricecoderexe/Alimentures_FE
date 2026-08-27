import React from 'react';
export default function DashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-8 animate-pulse p-4 sm:p-6 lg:p-10 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white dark:bg-[#1A1021] rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-white/10 p-4 sm:p-6 h-32 w-full">
             <div className="h-10 w-10 bg-gray-100 dark:bg-white/10 rounded-2xl mb-4"></div>
             <div className="h-6 bg-gray-200 dark:bg-white/20 rounded w-1/2"></div>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-[#1A1021] rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-white/10 p-4 sm:p-6 h-64 sm:h-80 w-full mt-4 sm:mt-8"></div>
    </div>
  );
}
