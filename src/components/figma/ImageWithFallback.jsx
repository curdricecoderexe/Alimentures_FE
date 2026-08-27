import { useState } from 'react';

export default function ImageWithFallback({ src, alt, className, ...props }) {
  const [error, setError] = useState(false);

  return (
    <img
      src={error ? 'https://via.placeholder.com/400x400?text=No+Image' : src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      {...props}
    />
  );
}