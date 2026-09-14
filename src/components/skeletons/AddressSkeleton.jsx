import React from 'react';
import Sk from './Sk';

export default function AddressSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-panel border border-hairline bg-paper p-6 space-y-3">
          <Sk className="h-4 w-32" />
          <Sk className="h-3 w-24" />
          <div className="pt-1 space-y-2">
            <Sk className="h-3 w-11/12" />
            <Sk className="h-3 w-3/4" />
          </div>
          <div className="pt-4 mt-1 border-t border-hairline flex gap-4">
            <Sk className="h-3 w-16" />
            <Sk className="h-3 w-12" />
            <Sk className="h-3 w-16 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}
