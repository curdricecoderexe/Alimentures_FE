import { useState, useEffect } from 'react';

export default function useSkeletonLoader(isLoading, delay = 200) {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    let timeout;
    if (isLoading) {
      timeout = setTimeout(() => setShowSkeleton(true), delay);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowSkeleton(false);
    }
    return () => clearTimeout(timeout);
  }, [isLoading, delay]);

  return showSkeleton;
}
