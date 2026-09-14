import React from 'react';
import { Check } from 'lucide-react';

/**
 * Cart → Address → Payment progress pill, shared by Cart and Checkout.
 * `current` = 1 | 2 | 3. Steps before `current` render as completed (leaf ✓),
 * the current step is berry, later steps are muted.
 */
const STEPS = ['Cart', 'Address', 'Payment'];

export default function CheckoutSteps({ current = 1, className = '' }) {
  return (
    <div
      className={`glass-sm inline-flex items-center rounded-full px-4 sm:px-5 py-2.5 shadow-glass-sm ${className}`}
    >
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <React.Fragment key={label}>
            {i > 0 && (
              <span
                className="mx-3 sm:mx-4 h-0.5 w-6 sm:w-10 rounded-full"
                style={{
                  background: step <= current
                    ? 'linear-gradient(90deg,#2E7D51,#A50D5A)'
                    : '#EEE6D6',
                }}
              />
            )}
            <span className="flex items-center gap-2 shrink-0">
              <span
                className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-display font-extrabold ${
                  done
                    ? 'bg-leaf/15 text-leaf'
                    : active
                    ? 'bg-gradient-to-br from-berry to-[#C21A75] text-white'
                    : 'bg-white/70 border border-hairline text-ink-muted'
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : step}
              </span>
              <span
                className={`kicker text-[9.5px] hidden sm:inline ${
                  done ? 'text-leaf' : active ? 'text-berry' : 'text-ink-muted'
                }`}
              >
                {label}
              </span>
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
}
