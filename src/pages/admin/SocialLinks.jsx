import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Plus, Trash2, ArrowUp, ArrowDown, Save, Loader2, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { authenticatedFetch, API_BASE, clearApiCache } from '../../lib/api';
import { SOCIAL_PLATFORMS, SOCIAL_PLATFORM_IDS, DEFAULT_SOCIAL_LINKS } from '../../lib/socialPlatforms';

const MAX_LINKS = 12;
const isValidUrl = (v) => { try { const u = new URL(v); return u.protocol === 'https:' || u.protocol === 'http:'; } catch { return false; } };

/** Admin → Social Links: the icons shown in the storefront footer. */
export default function AdminSocialLinks() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/settings`);
        const json = await res.json();
        const saved = json?.data?.socialLinks;
        setLinks((Array.isArray(saved) ? saved : DEFAULT_SOCIAL_LINKS).map((l) => ({ ...l, enabled: l.enabled !== false })));
      } catch {
        toast.error('Could not load social links');
        setLinks(DEFAULT_SOCIAL_LINKS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const update = (next) => { setLinks(next); setDirty(true); };
  const patch = (i, change) => update(links.map((l, idx) => (idx === i ? { ...l, ...change } : l)));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= links.length) return;
    const next = [...links];
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
  };
  const add = () => {
    const used = new Set(links.map((l) => l.platform));
    const platform = SOCIAL_PLATFORM_IDS.find((p) => !used.has(p)) || 'instagram';
    update([...links, { platform, url: '', enabled: true }]);
  };

  const invalidRows = links.map((l, i) => (isValidUrl(l.url) ? null : i)).filter((i) => i !== null);

  const save = async () => {
    if (invalidRows.length) {
      toast.error(`Row ${invalidRows[0] + 1}: enter a full link starting with https://`);
      return;
    }
    setSaving(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/settings/social`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ socialLinks: links }),
      });
      if (!res) return;
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save');
      setLinks(json.data.socialLinks);
      setDirty(false);
      clearApiCache(`${API_BASE}/settings`);
      toast.success('Social links updated — the footer now shows the new list');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-pink-50 text-[#C41E6B] flex items-center justify-center"><Share2 className="w-5 h-5" /></span>
            Social Links
          </h1>
          <p className="text-sm text-gray-500 mt-2">Choose which social profiles appear in the website footer, their links and their order.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => update(DEFAULT_SOCIAL_LINKS.map((l) => ({ ...l })))}
            className="h-11 px-4 rounded-xl border border-gray-200 bg-white text-gray-600 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Defaults
          </button>
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="h-11 px-5 rounded-xl bg-[#C41E6B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#A3155A] disabled:opacity-50 inline-flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes
          </button>
        </div>
      </div>

      {/* Live preview */}
      <div className="rounded-2xl p-5 flex flex-wrap items-center gap-3" style={{ background: 'linear-gradient(160deg,#79083F 0%,#5E0631 100%)' }}>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D7A94E] mr-2">Footer preview</span>
        {links.filter((l) => l.enabled && isValidUrl(l.url)).map((l, i) => (
          <span key={i} title={SOCIAL_PLATFORMS[l.platform]?.label} className="h-9 w-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white/80 [&>svg]:h-4 [&>svg]:w-4">
            {SOCIAL_PLATFORMS[l.platform]?.icon}
          </span>
        ))}
        {!links.some((l) => l.enabled && isValidUrl(l.url)) && <span className="text-xs text-white/60">No icons will be shown</span>}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {loading ? (
          <div className="p-10 flex justify-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : links.length === 0 ? (
          <p className="p-10 text-center text-sm text-gray-500">No social links. Add one below.</p>
        ) : links.map((l, i) => {
          const meta = SOCIAL_PLATFORMS[l.platform];
          const bad = l.url && !isValidUrl(l.url);
          return (
            <motion.div layout key={i} className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 ${l.enabled ? '' : 'opacity-60'}`}>
              <div className="flex items-center gap-3 sm:w-56 shrink-0">
                <span className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 text-gray-700 flex items-center justify-center shrink-0 [&>svg]:h-4 [&>svg]:w-4">
                  {meta?.icon}
                </span>
                <select
                  value={l.platform}
                  onChange={(e) => patch(i, { platform: e.target.value })}
                  className="flex-1 h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-100"
                  aria-label="Platform"
                >
                  {SOCIAL_PLATFORM_IDS.map((p) => <option key={p} value={p}>{SOCIAL_PLATFORMS[p].label}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-0">
                <input
                  value={l.url}
                  onChange={(e) => patch(i, { url: e.target.value })}
                  placeholder={meta?.placeholder}
                  maxLength={500}
                  aria-label="Profile link"
                  className={`w-full h-10 rounded-xl border px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 ${bad ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-pink-100'}`}
                />
                {bad && <p className="text-[11px] text-red-500 mt-1">Enter a full link starting with https://</p>}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => patch(i, { enabled: !l.enabled })} title={l.enabled ? 'Hide from footer' : 'Show in footer'} className="h-9 w-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center">
                  {l.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => move(i, -1)} disabled={i === 0} title="Move up" className="h-9 w-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 flex items-center justify-center">
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === links.length - 1} title="Move down" className="h-9 w-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 flex items-center justify-center">
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button onClick={() => update(links.filter((_, idx) => idx !== i))} title="Remove" className="h-9 w-9 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
        {!loading && links.length < MAX_LINKS && (
          <div className="p-4 sm:p-5">
            <button onClick={add} className="h-10 px-4 rounded-xl border border-dashed border-gray-300 text-gray-600 text-xs font-bold uppercase tracking-wider hover:border-[#C41E6B] hover:text-[#C41E6B] inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add social link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
