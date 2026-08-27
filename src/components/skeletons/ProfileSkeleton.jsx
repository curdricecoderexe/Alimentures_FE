import React from 'react';
export default function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse p-6">
      <div className="bg-white dark:bg-[#1A1021] rounded-3xl border border-gray-100 dark:border-white/10 p-8 flex items-center gap-6">
        <div className="w-20 h-20 bg-gray-100 dark:bg-white/10 rounded-full"></div>
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 dark:bg-white/20 rounded w-48"></div>
          <div className="h-4 bg-gray-100 dark:bg-white/10 rounded w-32"></div>
        </div>
      </div>
      <div className="bg-white dark:bg-[#1A1021] rounded-3xl border border-gray-100 dark:border-white/10 p-8 space-y-6">
        <div className="h-5 bg-gray-200 dark:bg-white/20 rounded w-32"></div>
        <div className="space-y-4">
          <div className="h-10 bg-gray-50 dark:bg-white/5 rounded-xl w-full"></div>
          <div className="h-10 bg-gray-50 dark:bg-white/5 rounded-xl w-full"></div>
          <div className="h-10 bg-gray-50 dark:bg-white/5 rounded-xl w-full"></div>
        </div>
      </div>
    </div>
  );
}
