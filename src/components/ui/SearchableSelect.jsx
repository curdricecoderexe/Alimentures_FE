import React, { useState, useRef, useEffect, useMemo, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * SearchableSelect — accessible, keyboard-driven, mobile-friendly combobox.
 * Style-agnostic: pass `triggerClassName` / `panelClassName` to match the host
 * design (storefront glass or admin light). Options are strings or
 * `{ value, label }`.
 *
 * Props:
 *   value, onChange(value)
 *   options: (string | {value,label})[]
 *   placeholder, searchPlaceholder
 *   disabled, loading           — loading shows a spinner + "Loading…" row
 *   emptyText                   — shown when there are 0 options / 0 matches
 *   name, id, required, label   — a11y / form wiring
 *   maxRender (default 100)     — virtualisation cap for very long lists
 */
export default function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  disabled = false,
  loading = false,
  emptyText = 'No options',
  triggerClassName,
  panelClassName,
  name,
  id,
  required = false,
  ariaLabel,
  maxRender = 100,
}) {
  const norm = useMemo(
    () => options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o)),
    [options],
  );
  const selected = norm.find((o) => o.value === value) || null;

  const [open, _setOpen] = useState(false);
  const [query, _setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [coords, setCoords] = useState(null);

  const setOpen = (v) => { _setOpen(v); if (!v) _setQuery(''); setActive(0); };
  const setQuery = (v) => { _setQuery(v); setActive(0); };

  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const reactId = useId();
  const listId = `${id || reactId}-listbox`;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? norm.filter((o) => o.label.toLowerCase().includes(q)) : norm;
    return list.slice(0, maxRender);
  }, [norm, query, maxRender]);

  const position = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    const openUp = below < 280 && r.top > below;
    setCoords({
      left: r.left,
      width: r.width,
      top: openUp ? undefined : r.bottom + 6,
      bottom: openUp ? window.innerHeight - r.top + 6 : undefined,
      maxHeight: Math.min(320, (openUp ? r.top : below) - 16),
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    position();
    const onScroll = () => position();
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, true);
    const onDoc = (e) => {
      if (rootRef.current?.contains(e.target) || listRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    const t = setTimeout(() => inputRef.current?.focus(), 20);
    return () => {
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('scroll', onScroll, true);
      document.removeEventListener('mousedown', onDoc);
      clearTimeout(t);
    };
  }, [open, position]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const node = listRef.current.querySelector(`[data-idx="${active}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const choose = (opt) => {
    onChange?.(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onTriggerKey = (e) => {
    if (disabled) return;
    if (['ArrowDown', 'Enter', ' '].includes(e.key) && !open) { e.preventDefault(); setOpen(true); }
  };

  const onListKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[active]) choose(filtered[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); triggerRef.current?.focus(); }
    else if (e.key === 'Tab') setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative w-full">
      {/* hidden input keeps native form semantics / validation */}
      <input type="text" name={name} value={value || ''} required={required} tabIndex={-1} aria-hidden="true"
        onChange={() => {}} className="sr-only" />

      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => !disabled && (open ? setOpen(false) : setOpen(true))}
        onKeyDown={onTriggerKey}
        className={cn(
          'w-full h-[52px] px-4 rounded-2xl border border-hairline bg-white text-left text-[14px] font-medium outline-none transition-all',
          'flex items-center justify-between gap-2 focus:border-berry/50 focus:ring-4 focus:ring-berry/10',
          disabled && 'opacity-60 cursor-not-allowed',
          triggerClassName,
        )}
      >
        <span className={cn('truncate', !selected && 'text-ink-muted')}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-ink-muted transition-transform', open && 'rotate-180')} />
      </button>

      {open && coords && createPortal(
        <div
          ref={listRef}
          onKeyDown={onListKey}
          style={{ position: 'fixed', left: coords.left, top: coords.top, bottom: coords.bottom, width: coords.width, maxHeight: coords.maxHeight, zIndex: 9999 }}
          className={cn(
            'rounded-2xl border border-hairline bg-white shadow-[0_24px_60px_-16px_rgba(120,10,64,0.28)] overflow-hidden flex flex-col',
            panelClassName,
          )}
        >
          <div className="flex items-center gap-2 px-3 h-11 border-b border-hairline shrink-0">
            <Search className="h-4 w-4 text-ink-muted shrink-0" />
            <input
              ref={inputRef}
              role="combobox"
              aria-controls={listId}
              aria-autocomplete="list"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onListKey}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent outline-none text-[13.5px] text-ink placeholder:text-ink-muted"
            />
          </div>

          <ul id={listId} role="listbox" className="overflow-y-auto py-1.5 flex-1">
            {loading ? (
              <li className="flex items-center gap-2 px-4 py-3 text-[13px] text-ink-muted">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
              </li>
            ) : filtered.length === 0 ? (
              <li className="px-4 py-3 text-[13px] text-ink-muted">{emptyText}</li>
            ) : (
              filtered.map((opt, i) => {
                const isSel = opt.value === value;
                return (
                  <li
                    key={opt.value}
                    data-idx={i}
                    role="option"
                    aria-selected={isSel}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(opt)}
                    className={cn(
                      'flex items-center justify-between gap-2 px-4 py-2.5 text-[13.5px] cursor-pointer',
                      i === active ? 'bg-berry/8 text-berry' : 'text-ink-soft',
                      isSel && 'font-semibold text-ink',
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSel && <Check className="h-3.5 w-3.5 shrink-0 text-berry" />}
                  </li>
                );
              })
            )}
            {!loading && norm.length > maxRender && filtered.length === maxRender && (
              <li className="px-4 py-2 text-[11px] text-ink-muted">Keep typing to narrow results…</li>
            )}
          </ul>
        </div>,
        document.body,
      )}
    </div>
  );
}
