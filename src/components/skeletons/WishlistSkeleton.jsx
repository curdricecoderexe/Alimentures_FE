import React from 'react';
import Sk from './Sk';
import ProductGridSkeleton from './ProductGridSkeleton';

export default function WishlistSkeleton() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-[1400px] py-24 relative z-10">
      <Sk className="h-9 w-40 mb-4" rounded="rounded-full" />
      <div className="flex flex-col gap-3.5 mb-10">
        <Sk className="h-12 w-72" />
        <Sk className="h-[3px] w-[60px]" rounded="rounded-full" />
      </div>
      <ProductGridSkeleton count={8} />
    </div>
  );
}
