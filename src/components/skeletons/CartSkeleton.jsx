import React from 'react';
export default function CartSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-pulse p-4 sm:p-6 lg:p-10">
      <div className="flex-1 space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-white/20 rounded w-32 mb-6"></div>
        {[1, 2].map(i => (
          <div key={i} className="bg-white dark:bg-[#1A1021] rounded-3xl border border-gray-100 dark:border-white/10 p-4 flex gap-4">
             <div className="w-24 h-24 bg-gray-100 dark:bg-white/10 rounded-2xl"></div>
             <div className="flex-1 space-y-2 pt-2">
                <div className="h-4 bg-gray-200 dark:bg-white/20 rounded w-1/2"></div>
                <div className="h-3 bg-gray-100 dark:bg-white/10 rounded w-1/4"></div>
                <div className="flex justify-between items-center pt-2">
                   <div className="h-5 bg-gray-200 dark:bg-white/20 rounded w-20"></div>
                   <div className="h-8 bg-gray-50 dark:bg-white/5 rounded-xl w-24"></div>
                </div>
             </div>
          </div>
        ))}
      </div>
      <div className="w-full lg:w-96">
         <div className="bg-white dark:bg-[#1A1021] rounded-3xl border border-gray-100 dark:border-white/10 p-6 space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-white/20 rounded w-1/3 mb-4"></div>
            <div className="flex justify-between"><div className="h-3 bg-gray-100 dark:bg-white/10 w-20 rounded"></div><div className="h-3 bg-gray-200 dark:bg-white/20 w-16 rounded"></div></div>
            <div className="flex justify-between"><div className="h-3 bg-gray-100 dark:bg-white/10 w-20 rounded"></div><div className="h-3 bg-gray-200 dark:bg-white/20 w-16 rounded"></div></div>
            <div className="border-t border-gray-100 dark:border-white/10 my-4"></div>
            <div className="flex justify-between"><div className="h-5 bg-gray-200 dark:bg-white/20 w-24 rounded"></div><div className="h-5 bg-gray-200 dark:bg-white/20 w-20 rounded"></div></div>
            <div className="h-12 bg-gray-200 dark:bg-white/20 rounded-xl w-full mt-4"></div>
         </div>
      </div>
    </div>
  );
}
