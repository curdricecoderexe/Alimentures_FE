import { useEffect, useRef } from 'react';

/**
 * Six-box one-time-code input.
 * - typing advances, Backspace goes back, ←/→ move between boxes
 * - pasting (or browser / SMS autofill) fills every box at once
 * - calls onComplete(code) once all digits are in
 * Value is a plain string of digits, controlled by the parent.
 */
export default function OtpInput({
  value = '',
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  invalid = false,
  autoFocus = true,
  tone = 'light', // 'light' (storefront auth) | 'admin'
}) {
  const refs = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    if (autoFocus) refs.current[Math.min(value.length, length - 1)]?.focus();
    // focus once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = (next) => {
    const clean = next.replace(/\D/g, '').slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
    return clean;
  };

  const handleInput = (i, raw, pasted = false) => {
    let typed = raw.replace(/\D/g, '');
    if (!typed) return;
    // Typing into a filled box (cursor after its digit) yields "old+new" — keep the new one.
    if (!pasted && typed.length === 2 && digits[i]) typed = typed.startsWith(digits[i]) ? typed.slice(1) : typed.slice(0, 1);
    if (typed.length > 1) { // paste / autofill into one box
      const clean = commit(value.slice(0, i) + typed);
      refs.current[Math.min(clean.length, length - 1)]?.focus();
      return;
    }
    const next = (value.slice(0, i) + typed + value.slice(i + 1)).slice(0, length);
    commit(next);
    refs.current[Math.min(i + 1, length - 1)]?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[i]) commit(value.slice(0, i) + value.slice(i + 1));
      else if (i > 0) { commit(value.slice(0, i - 1) + value.slice(i)); refs.current[i - 1]?.focus(); }
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus();
  };

  const admin = tone === 'admin';
  const base = admin
    ? 'bg-white text-gray-900 focus:border-gray-900 focus:ring-gray-900/10'
    : 'bg-white text-ink focus:border-mulberry focus:ring-mulberry/15';
  const idle = admin ? 'border-gray-200' : 'border-[#E8E1D4]';
  const filled = admin ? 'border-gray-400' : 'border-mulberry/40';

  return (
    <div className="flex justify-between gap-2 sm:gap-3" role="group" aria-label="One-time code">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={d}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onFocus={(e) => e.target.select()}
          onPaste={(e) => { e.preventDefault(); handleInput(i, e.clipboardData.getData('text'), true); }}
          className={`w-full min-w-0 aspect-[5/6] max-w-[56px] rounded-[14px] border text-center font-display text-[22px] sm:text-[26px] font-semibold tabular-nums outline-none transition-all focus:ring-4 disabled:opacity-60 ${
            invalid ? 'border-danger/60 bg-danger/[0.03] text-danger' : `${base} ${d ? filled : idle}`
          }`}
        />
      ))}
    </div>
  );
}
