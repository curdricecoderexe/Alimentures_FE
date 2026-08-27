import React from 'react';
import ProductGridSkeleton from './ProductGridSkeleton';

export default function WishlistSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-white/20 rounded w-48 mb-8"></div>
      <ProductGridSkeleton count={4} />
    </div>
  );
}
