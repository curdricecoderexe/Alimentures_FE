import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, Plus, Eye, EyeOff, ArrowUp, ArrowDown, Trash2, Check, X, Pencil, Loader2, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { authenticatedFetch, API_BASE } from '../../lib/api';
import { clearCategoriesCache } from '../../lib/categories';
import DashboardSkeleton from '../../components/skeletons/DashboardSkeleton';
import useSkeletonLoader from '../../hooks/useSkeletonLoader';

/** fetch → json with the shared 401/403 handling; returns null when the session ended. */
async function call(path, options = {}) {
  const res = await authenticatedFetch(`${API_BASE}${path}`, {
    ...options,
    headers: options.body ? { 'Content-Type': 'application/json', ...options.headers } : options.headers,
  });
  if (!res) return null;
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.error || 'Request failed');
  return json;
}

function CategoryRow({ cat, index, total, busy, onRename, onToggle, onMove, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cat.name);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!confirmDelete) return undefined;
    const t = setTimeout(() => setConfirmDelete(false), 4000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const save = async () => {
    const next = name.trim();
    if (!next || next === cat.name) { setEditing(false); setName(cat.name); return; }
    if (await onRename(cat, next)) setEditing(false);
  };

  const inUse = cat.productCount > 0;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 rounded-2xl border transition-colors ${
        cat.visible ? 'bg-white border-gray-100' : 'bg-gray-50/80 border-dashed border-gray-200'
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="w-8 h-8 rounded-xl bg-[#C41E6B]/10 text-[#C41E6B] text-xs font-bold flex items-center justify-center shrink-0">
          {index + 1}
        </span>

        {editing ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input
              autoFocus
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') save();
                if (e.key === 'Escape') { setEditing(false); setName(cat.name); }
              }}
              className="flex-1 min-w-0 h-9 px-3 rounded-xl border border-[#C41E6B]/40 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#C41E6B]/20"
            />
            <button onClick={save} disabled={busy} aria-label="Save name" className="h-9 w-9 rounded-xl bg-[#C41E6B] text-white flex items-center justify-center shrink-0 disabled:opacity-50">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => { setEditing(false); setName(cat.name); }} aria-label="Cancel" className="h-9 w-9 rounded-xl border border-gray-200 text-gray-500 flex items-center justify-center shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-bold text-sm truncate ${cat.visible ? 'text-gray-900' : 'text-gray-400'}`}>{cat.name}</span>
              {!cat.visible && (
                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">Hidden</span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {cat.productCount} product{cat.productCount === 1 ? '' : 's'}
            </p>
          </div>
        )}
      </div>

      {!editing && (
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button onClick={() => { setName(cat.name); setEditing(true); }} disabled={busy} aria-label={`Rename ${cat.name}`} title="Rename"
            className="h-9 w-9 rounded-xl border border-gray-200 text-gray-500 flex items-center justify-center hover:border-[#C41E6B] hover:text-[#C41E6B] transition-colors disabled:opacity-40">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onToggle(cat)} disabled={busy} aria-label={cat.visible ? `Hide ${cat.name}` : `Show ${cat.name}`} title={cat.visible ? 'Hide from shop' : 'Show in shop'}
            className="h-9 w-9 rounded-xl border border-gray-200 text-gray-500 flex items-center justify-center hover:border-[#C41E6B] hover:text-[#C41E6B] transition-colors disabled:opacity-40">
            {cat.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => onMove(index, -1)} disabled={busy || index === 0} aria-label="Move up" title="Move up"
            className="h-9 w-9 rounded-xl border border-gray-200 text-gray-500 flex items-center justify-center hover:border-[#C41E6B] hover:text-[#C41E6B] transition-colors disabled:opacity-30">
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onMove(index, 1)} disabled={busy || index === total - 1} aria-label="Move down" title="Move down"
            className="h-9 w-9 rounded-xl border border-gray-200 text-gray-500 flex items-center justify-center hover:border-[#C41E6B] hover:text-[#C41E6B] transition-colors disabled:opacity-30">
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          {confirmDelete ? (
            <button onClick={() => onDelete(cat)} disabled={busy}
              className="h-9 px-3 rounded-xl bg-red-500 text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50">
              <Trash2 className="w-3.5 h-3.5" /> Confirm
            </button>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={busy || inUse}
              aria-label={`Delete ${cat.name}`}
              title={inUse ? 'Move its products to another category first, or hide it' : 'Delete'}
              className="h-9 w-9 rounded-xl border border-gray-200 text-gray-500 flex items-center justify-center hover:border-red-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </motion.li>
  );
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [unmanaged, setUnmanaged] = useState([]);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const showSkeleton = useSkeletonLoader(isLoading);

  const load = useCallback(async () => {
    try {
      const json = await call('/categories/admin');
      if (json) {
        setCategories(json.data || []);
        setUnmanaged(json.unmanaged || []);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Every mutation: lock the UI, run, refresh the list + storefront cache.
  const run = async (fn, { reload = true } = {}) => {
    setBusy(true);
    try {
      const json = await fn();
      if (json?.message) toast.success(json.message);
      clearCategoriesCache();
      if (reload) await load();
      return true;
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const add = async (name) => {
    const n = String(name || '').trim();
    if (!n) return;
    const ok = await run(async () => {
      const json = await call('/categories', { method: 'POST', body: JSON.stringify({ name: n }) });
      return json && { message: `“${n}” added` };
    });
    if (ok) setNewName('');
  };

  const rename = (cat, name) =>
    run(() => call(`/categories/${cat.id}`, { method: 'PUT', body: JSON.stringify({ name }) }));

  const toggle = (cat) =>
    run(() => call(`/categories/${cat.id}`, { method: 'PUT', body: JSON.stringify({ visible: !cat.visible }) }));

  const remove = (cat) => run(() => call(`/categories/${cat.id}`, { method: 'DELETE' }));

  const move = async (index, dir) => {
    const next = [...categories];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    const prev = categories;
    setCategories(next); // optimistic
    const ok = await run(
      () => call('/categories/order', { method: 'PUT', body: JSON.stringify({ ids: next.map((c) => c.id) }) })
        .then(() => null), // no toast for every nudge
      { reload: false },
    );
    if (!ok) setCategories(prev);
  };

  if (isLoading) {
    if (showSkeleton) return <DashboardSkeleton />;
    return <div className="min-h-screen" />;
  }

  const visibleCount = categories.filter((c) => c.visible).length;

  return (
    <div className="p-3 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 bg-transparent min-h-screen font-sans max-w-4xl">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="w-11 h-11 rounded-2xl bg-[#C41E6B]/10 flex items-center justify-center text-[#C41E6B] shrink-0">
            <Layers className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Categories</h1>
            <p className="text-xs sm:text-sm text-gray-400 font-medium mt-0.5">
              The category filter on the Shop page and the picker in the product editor.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-3.5 py-2 rounded-xl self-start">
          {visibleCount} of {categories.length} shown in shop
        </span>
      </div>

      {/* add */}
      <form
        onSubmit={(e) => { e.preventDefault(); add(newName); }}
        className="flex flex-col sm:flex-row gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4"
      >
        <input
          value={newName}
          maxLength={40}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name, e.g. Millet Flakes"
          className="flex-1 min-w-0 h-11 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold focus:outline-none focus:border-[#C41E6B] focus:bg-white"
        />
        <button
          type="submit"
          disabled={busy || !newName.trim()}
          className="h-11 px-5 rounded-xl bg-[#C41E6B] text-white text-[11px] font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 hover:brightness-110 transition disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add category
        </button>
      </form>

      {/* list */}
      {categories.length ? (
        <ul className="space-y-2.5">
          <AnimatePresence initial={false}>
            {categories.map((cat, i) => (
              <CategoryRow
                key={cat.id}
                cat={cat}
                index={i}
                total={categories.length}
                busy={busy}
                onRename={rename}
                onToggle={toggle}
                onMove={move}
                onDelete={remove}
              />
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <div className="text-center py-14 text-sm text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
          No categories yet — add your first one above.
        </div>
      )}

      {/* product categories that aren't managed yet */}
      {unmanaged.length > 0 && (
        <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-4 sm:p-5 space-y-3">
          <p className="text-[12px] text-amber-900 font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            These categories are set on products but aren’t in your list, so shoppers can’t filter by them.
          </p>
          <div className="flex flex-wrap gap-2">
            {unmanaged.map((u) => (
              <button
                key={u.name}
                onClick={() => add(u.name)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white border border-amber-300 text-[11px] font-bold text-amber-900 hover:bg-amber-100 transition-colors disabled:opacity-50"
              >
                <Plus className="w-3 h-3" /> {u.name} <span className="text-amber-600">({u.productCount})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-[#C41E6B]/[0.04] border border-[#C41E6B]/15 px-4 py-3 text-[12px] text-gray-600 leading-relaxed">
        Renaming a category also moves every product in it to the new name. Hidden categories stay on their
        products but disappear from the shop filter. A category can only be deleted once no products use it.
      </div>
    </div>
  );
}
