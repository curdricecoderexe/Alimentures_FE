import React from 'react';

/**
 * Shimmer block for the Alimenture light-glass skeletons.
 * Uses the `.skeleton` class from index.css (cream-tinted shimmer that
 * respects prefers-reduced-motion).
 */
export default function Sk({ className = '', rounded = 'rounded-lg', style }) {
  return <span className={`skeleton block ${rounded} ${className}`} style={style} aria-hidden="true" />;
}

/** A frosted glass card shell to lay shimmer blocks inside. */
export function SkCard({ className = '', children, panel = false }) {
  return (
    <div className={`glass ${panel ? 'rounded-panel' : 'rounded-card'} ${className}`} aria-hidden="true">
      {children}
    </div>
  );
}
