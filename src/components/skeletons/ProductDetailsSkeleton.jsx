import React from 'react';
export default function ProductDetailsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="aspect-square bg-gray-100 dark:bg-white/10 rounded-2xl"></div>
        <div className="space-y-6 pt-6">
          <div className="h-10 bg-gray-200 dark:bg-white/20 rounded-lg w-3/4"></div>
          <div className="flex gap-2">
            <div className="h-4 bg-gray-200 dark:bg-white/20 rounded w-20"></div>
            <div className="h-4 bg-gray-100 dark:bg-white/10 rounded w-24"></div>
          </div>
          <div className="h-8 bg-gray-200 dark:bg-white/20 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-100 dark:bg-white/10 rounded w-full"></div>
            <div className="h-3 bg-gray-100 dark:bg-white/10 rounded w-5/6"></div>
            <div className="h-3 bg-gray-100 dark:bg-white/10 rounded w-4/5"></div>
          </div>
          <div className="flex gap-4 pt-6">
            <div className="h-14 bg-gray-200 dark:bg-white/20 rounded-2xl w-32"></div>
            <div className="h-14 bg-gray-200 dark:bg-white/20 rounded-2xl flex-1"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
