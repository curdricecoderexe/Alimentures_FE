import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Image as ImageIcon, Upload, RotateCcw, Check, Loader2, Palette, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { authenticatedFetch, API_BASE } from '../../lib/api';
import { clearAppearanceCache } from '../../lib/appearance';
import DashboardSkeleton from '../../components/skeletons/DashboardSkeleton';
import useSkeletonLoader from '../../hooks/useSkeletonLoader';

import authBgDefault from '../../assets/login.png';
import featuredBgDefault from '../../assets/feature-bg.png';
import craftingBgDefault from '../../assets/Munnar.jpg';
import superGrainsBgDefault from '../../assets/bf.png';
import commitmentBgDefault from '../../assets/bg-1.png';

// The exact bundled fallback for each slot, so "Reset" previews match what the
// live site actually shows. The 5 catalog-category slots have no bundled
// image — their default is "no background" — so they're omitted here.
const BUNDLED_DEFAULTS = {
  authBg: authBgDefault,
  featuredBg: featuredBgDefault,
  craftingBg: craftingBgDefault,
  superGrainsBg: superGrainsBgDefault,
  commitmentBg: commitmentBgDefault,
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
