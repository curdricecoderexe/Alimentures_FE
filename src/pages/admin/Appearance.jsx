import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Image as ImageIcon, Upload, RotateCcw, Check, Loader2, Palette, Sparkles, Film, Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { authenticatedFetch, API_BASE } from '../../lib/api';
import { clearAppearanceCache } from '../../lib/appearance';
import {
  clearHomeVideoCache, filmStreamUrl, DEFAULT_FILM_SRC, DEFAULT_FILM_TITLE, DEFAULT_FILM_SUBTITLE,
} from '../../lib/homeVideo';
import DashboardSkeleton from '../../components/skeletons/DashboardSkeleton';
import useSkeletonLoader from '../../hooks/useSkeletonLoader';

import authBgDefault from '../../assets/login.webp';
import featuredBgDefault from '../../assets/feature-bg.webp';
import craftingBgDefault from '../../assets/Munnar.jpg';
import superGrainsBgDefault from '../../assets/bf.webp';
import commitmentBgDefault from '../../assets/bg-1.webp';
import lineupImageDefault from '../../assets/cas/women.webp';

// The exact bundled fallback for each slot, so "Reset" previews match what the
// live site actually shows. The 5 catalog-category slots and the optional
// lineup slides 2-3 have no bundled image, so they're omitted here.
const BUNDLED_DEFAULTS = {
  authBg: authBgDefault,
  featuredBg: featuredBgDefault,
  craftingBg: craftingBgDefault,
  superGrainsBg: superGrainsBgDefault,
  commitmentBg: commitmentBgDefault,
  lineupImage1: lineupImageDefault,
};

const MAX_DIMENSION = 1800;
const MAX_BYTES = 850 * 1024; // stay under the API's 900 KB ceiling

/** Load → downscale → WebP compress an uploaded file to a data URI under MAX_BYTES. */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.onloadend = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('That file is not a valid image'));
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width >= height) { height = Math.round(height * (MAX_DIMENSION / width)); width = MAX_DIMENSION; }
          else { width = Math.round(width * (MAX_DIMENSION / height)); height = MAX_DIMENSION; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);

        let quality = 0.85;
        let out = canvas.toDataURL('image/webp', quality);
        while (out.length * 0.75 > MAX_BYTES && quality > 0.4) {
          quality -= 0.1;
          out = canvas.toDataURL('image/webp', quality);
        }
        if (out.length * 0.75 > MAX_BYTES) {
          reject(new Error('Image is too detailed to compress — try a smaller one'));
          return;
        }
        resolve(out);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function SlotCard({ slot, currentImage, onSaved }) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(currentImage || null);
  const inputRef = useRef(null);

  useEffect(() => { setPreview(currentImage || null); }, [currentImage]);

  const isCustom = !!currentImage;
  // Show the real bundled fallback when there's no custom override, instead
  // of a generic placeholder — matches exactly what the live site renders.
  const displayImage = preview || BUNDLED_DEFAULTS[slot.key] || null;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      toast.error('Use a PNG, JPEG or WebP image');
      return;
    }
    setBusy(true);
    const toastId = toast.loading('Optimising & uploading…');
    try {
      const dataUri = await compressImage(file);
      setPreview(dataUri);
      const res = await authenticatedFetch(`${API_BASE}/appearance/${slot.key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUri }),
      });
      if (!res) { toast.dismiss(toastId); return; }
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`${slot.label} updated`, { id: toastId });
        clearAppearanceCache();
        onSaved(slot.key, dataUri);
      } else {
        toast.error(json.error || 'Upload failed', { id: toastId });
        setPreview(currentImage || null);
      }
    } catch (err) {
      toast.error(err.message || 'Upload failed', { id: toastId });
      setPreview(currentImage || null);
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (!isCustom || busy) return;
    setBusy(true);
    const toastId = toast.loading('Reverting to default…');
    try {
      const res = await authenticatedFetch(`${API_BASE}/appearance/${slot.key}`, { method: 'DELETE' });
      if (!res) { toast.dismiss(toastId); return; }
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`${slot.label} reset to default`, { id: toastId });
        clearAppearanceCache();
        setPreview(null);
        onSaved(slot.key, null);
      } else {
        toast.error(json.error || 'Reset failed', { id: toastId });
      }
    } catch {
      toast.error('Reset failed', { id: toastId });
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
    >
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 aspect-[16/9] overflow-hidden">
        {displayImage ? (
          <img src={displayImage} alt={slot.label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300">
            <ImageIcon className="w-8 h-8" />
            <span className="text-[10px] font-bold uppercase tracking-widest">No background image</span>
          </div>
        )}
        <span className={`absolute top-3 left-3 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
          isCustom ? 'bg-[#C41E6B] text-white' : 'bg-white/85 text-gray-500 border border-gray-200'
        }`}>
          {isCustom ? <><Check className="w-3 h-3" /> Custom</> : 'Default'}
        </span>
        {busy && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[#C41E6B] animate-spin" />
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 flex flex-col gap-3 flex-1">
        <div className="flex-1">
          <h3 className="font-bold text-sm text-gray-900">{slot.label}</h3>
          {slot.hint && <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{slot.hint}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl bg-[#221B1F] text-white text-[11px] font-bold uppercase tracking-wider hover:bg-black transition-colors disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" /> {isCustom ? 'Replace' : 'Upload'}
          </button>
          <button
            onClick={handleReset}
            disabled={busy || !isCustom}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl border border-gray-200 text-gray-500 text-[11px] font-bold uppercase tracking-wider hover:border-[#C41E6B] hover:text-[#C41E6B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} className="hidden" />
      </div>
    </motion.div>
  );
}

const VIDEO_MAX_BYTES = 40 * 1024 * 1024; // matches the API's VIDEO_MAX_BYTES
const formatMB = (n) => `${(n / (1024 * 1024)).toFixed(1)} MB`;

/** PUT the raw file with upload progress (fetch can't report it). */
function uploadVideoFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', `${API_BASE}/home-video/file`);
    const token = localStorage.getItem('token');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
    xhr.onerror = () => reject(new Error('Network error while uploading'));
    xhr.onload = () => {
      let json = {};
      try { json = JSON.parse(xhr.responseText); } catch { /* non-JSON error */ }
      if (xhr.status >= 200 && xhr.status < 300 && json.success) resolve(json.data);
      else reject(new Error(json.error || (xhr.status === 413 ? 'Video is too large' : 'Upload failed')));
    };
    xhr.send(file);
  });
}

function HomeFilmCard() {
  const [info, setInfo] = useState(null);
  const [form, setForm] = useState({ title: '', subtitle: '', enabled: true });
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(null); // 0..1 while uploading
  const inputRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/home-video`, { cache: 'no-store' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setInfo(json.data);
      setForm({ title: json.data.title || '', subtitle: json.data.subtitle || '', enabled: json.data.enabled !== false });
    } catch {
      setInfo({}); // still preview the bundled film
      toast.error('Failed to load the homepage film settings');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const isCustom = !!info?.version;
  const src = isCustom ? filmStreamUrl(info.version) : DEFAULT_FILM_SRC;
  const busy = saving || progress !== null;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^video\/(mp4|webm|quicktime)$/i.test(file.type)) {
      toast.error('Use an MP4 or WebM video');
      return;
    }
    if (file.size > VIDEO_MAX_BYTES) {
      toast.error(`Video is ${formatMB(file.size)} — the limit is ${formatMB(VIDEO_MAX_BYTES)}`);
      return;
    }
    setProgress(0);
    const toastId = toast.loading('Uploading film…');
    try {
      const data = await uploadVideoFile(file, setProgress);
      toast.success('Homepage film updated', { id: toastId });
      clearHomeVideoCache();
      setInfo((prev) => ({ ...prev, version: data.version, size: data.size }));
    } catch (err) {
      toast.error(err.message || 'Upload failed', { id: toastId });
    } finally {
      setProgress(null);
    }
  };

  const handleReset = async () => {
    if (!isCustom || busy) return;
    setSaving(true);
    const toastId = toast.loading('Reverting to the default film…');
    try {
      const res = await authenticatedFetch(`${API_BASE}/home-video/file`, { method: 'DELETE' });
      if (!res) { toast.dismiss(toastId); return; }
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Homepage film reset to default', { id: toastId });
        clearHomeVideoCache();
        setInfo((prev) => ({ ...prev, version: null, size: null }));
      } else {
        toast.error(json.error || 'Reset failed', { id: toastId });
      }
    } catch {
      toast.error('Reset failed', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const toastId = toast.loading('Saving…');
    try {
      const res = await authenticatedFetch(`${API_BASE}/home-video`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res) { toast.dismiss(toastId); return; }
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Film details saved', { id: toastId });
        clearHomeVideoCache();
      } else {
        toast.error(json.error || 'Save failed', { id: toastId });
      }
    } catch {
      toast.error('Save failed', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden grid grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,1fr)]"
    >
      <div className="relative bg-black aspect-video xl:aspect-auto xl:min-h-[340px] min-w-0">
        {/* #t= makes the browser paint a first frame instead of a black box */}
        {info && <video key={src} src={`${src}#t=0.5`} controls muted playsInline preload="metadata" className="absolute inset-0 w-full h-full object-contain" />}
        <span className={`absolute top-3 left-3 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
          isCustom ? 'bg-[#C41E6B] text-white' : 'bg-white/85 text-gray-500 border border-gray-200'
        }`}>
          {isCustom ? <><Check className="w-3 h-3" /> Custom</> : 'Default'}
        </span>
        {progress !== null && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 text-white">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-xs font-bold tracking-wider">{Math.round(progress * 100)}%</span>
            <div className="w-2/3 h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full bg-[#C41E6B] transition-[width]" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6 flex flex-col gap-4 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-gray-900">Homepage film</h3>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
              Plays muted on loop below the hero; visitors can open it full-screen with sound.
              {isCustom && info?.size ? ` Current upload: ${formatMB(info.size)}.` : ''}
            </p>
          </div>
          <label className="inline-flex items-center gap-2 self-start h-8 px-3 rounded-full border border-gray-200 text-[11px] font-bold text-gray-500 cursor-pointer shrink-0 whitespace-nowrap">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
              className="accent-[#C41E6B] w-4 h-4"
            />
            Show on site
          </label>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Headline</label>
          <input
            value={form.title}
            maxLength={120}
            placeholder={DEFAULT_FILM_TITLE}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C41E6B]"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Description</label>
          <textarea
            value={form.subtitle}
            maxLength={280}
            rows={3}
            placeholder={DEFAULT_FILM_SUBTITLE}
            onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-[#C41E6B]"
          />
        </div>

        <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 mt-auto">
          <button
            onClick={handleSave}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-[#C41E6B] text-white text-[11px] font-bold uppercase tracking-wider whitespace-nowrap hover:brightness-110 transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 shrink-0" /> Save
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-[#221B1F] text-white text-[11px] font-bold uppercase tracking-wider whitespace-nowrap hover:bg-black transition-colors disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5 shrink-0" /> {isCustom ? 'Replace' : 'Upload'}
          </button>
          <button
            onClick={handleReset}
            disabled={busy || !isCustom}
            title="Revert to the default film"
            aria-label="Revert to the default film"
            className="inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl border border-gray-200 text-gray-500 text-[11px] font-bold uppercase tracking-wider hover:border-[#C41E6B] hover:text-[#C41E6B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10.5px] text-gray-400 leading-relaxed">
          MP4 (H.264) or WebM, up to {formatMB(VIDEO_MAX_BYTES)}. Landscape 16:9 looks best; keep it short and
          compressed (≈10–20 MB) so it starts quickly on mobile.
        </p>
        <input ref={inputRef} type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleFile} className="hidden" />
      </div>
    </motion.div>
  );
}

export default function AdminAppearance() {
  const [slots, setSlots] = useState([]);
  const [images, setImages] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const showSkeleton = useSkeletonLoader(isLoading);

  const fetchAll = useCallback(async () => {
    try {
      const [slotRes, imgRes] = await Promise.all([
        authenticatedFetch(`${API_BASE}/appearance/slots`),
        authenticatedFetch(`${API_BASE}/appearance`),
      ]);
      if (slotRes) {
        const j = await slotRes.json();
        if (j.success) setSlots(j.data || []);
      }
      if (imgRes) {
        const j = await imgRes.json();
        if (j.success) setImages(j.data || {});
      }
    } catch {
      toast.error('Failed to load appearance settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSaved = (key, value) => {
    setImages((prev) => {
      const next = { ...prev };
      if (value) next[key] = value; else delete next[key];
      return next;
    });
  };

  if (isLoading) {
    if (showSkeleton) return <DashboardSkeleton />;
    return <div className="min-h-screen" />;
  }

  const groups = slots.reduce((acc, s) => {
    (acc[s.group] = acc[s.group] || []).push(s);
    return acc;
  }, {});
  const customCount = slots.filter((s) => images[s.key]).length;

  return (
    <div className="p-3 sm:p-6 lg:p-10 space-y-8 bg-transparent min-h-screen font-sans">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="w-11 h-11 rounded-2xl bg-[#C41E6B]/10 flex items-center justify-center text-[#C41E6B] shrink-0">
            <Palette className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Templates</h1>
            <p className="text-xs sm:text-sm text-gray-400 font-medium mt-0.5">
              Swap the background image behind any storefront section.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-3.5 py-2 rounded-xl self-start">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          {customCount} of {slots.length} customised
        </span>
      </div>

      <div className="rounded-2xl bg-[#C41E6B]/[0.04] border border-[#C41E6B]/15 px-4 py-3 text-[12px] text-gray-600 leading-relaxed">
        Images are downscaled and converted to WebP automatically (max ~850&nbsp;KB). Landscape shots work
        best for section backdrops; a taller image suits the auth panel. Every section keeps a bundled
        fallback, so “Reset” always returns it to the original look.
      </div>

      <div className="space-y-4">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400 inline-flex items-center gap-2">
          <Film className="w-3.5 h-3.5" /> Homepage film
        </h2>
        <HomeFilmCard />
      </div>

      {Object.entries(groups).map(([group, list]) => (
        <div key={group} className="space-y-4">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">{group}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {list.map((slot) => (
              <SlotCard key={slot.key} slot={slot} currentImage={images[slot.key]} onSaved={handleSaved} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
