import React from 'react';
export default function AppSkeleton() {
  return (
    <div className="min-h-screen bg-[#FCFBF9] flex flex-col p-6 animate-pulse">
      <div className="h-16 bg-gray-200 dark:bg-white/20 rounded-2xl w-full mb-8"></div>
      <div className="flex-1 space-y-6">
        <div className="h-40 bg-gray-200 dark:bg-white/20 rounded-3xl w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="h-64 bg-gray-200 dark:bg-white/20 rounded-3xl"></div>
           <div className="h-64 bg-gray-200 dark:bg-white/20 rounded-3xl"></div>
           <div className="h-64 bg-gray-200 dark:bg-white/20 rounded-3xl"></div>
        </div>
      </div>
    </div>
  );
}
