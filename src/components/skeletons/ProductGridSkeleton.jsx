import React from 'react';
import ProductCardSkeleton from './ProductCardSkeleton';

export default function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
