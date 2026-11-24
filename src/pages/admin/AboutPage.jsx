import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ExternalLink, Plus, Trash2, Wheat, ShieldCheck, Handshake, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { API_BASE, authenticatedFetch } from '../../lib/api';
import { clearStorefrontSettingsCache } from '../../lib/storefrontSettings';
import { COMMITMENT_DEFAULTS } from '../../components/story/StorySections';
import { SlotCard } from './Appearance';
import commitmentPhotoDefault from '../../assets/bg-1.webp';

/*
 * Admin → About Page: edit the "Our commitment" band (copy + photo).
 * Copy is saved to settings/storefront.commitment; the round photo is the
 * `commitmentBg` appearance slot (also listed under Templates).
 */

const PHOTO_SLOT_KEY = 'commitmentBg';
const PLEDGE_ICONS = [Wheat, ShieldCheck, Handshake];
const LINKS = [
  ['/shop', 'Shop'], ['/hampers', 'Gift hampers'], ['/why-choose-us', 'Why choose us'], ['/blog', 'Blog'], ['/about', 'About us'],
];

function Preview({ copy, photo }) {
  return (
    <div className="rounded-2xl overflow-hidden bg-[#5F1C54] text-[#FFFDF9] p-6" style={{ backgroundImage: 'radial-gradient(110% 90% at 0% 0%, #7C276E 0%, transparent 62%)' }}>
      <div className="flex items-center gap-4">
        {photo && <img src={photo} alt="" className="h-16 w-16 rounded-full object-cover ring-1 ring-[#F8A830]/40 ring-offset-2 ring-offset-[#5F1C54]" />}
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] opacity-90">● {copy.eyebrow || 'Our commitment'}</p>
          <p className="mt-1 text-xl leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {copy.headline} {copy.highlight && <span className="text-[#F8A830]">{copy.highlight}</span>}
          </p>
        </div>
      </div>
      <ul className="mt-4 space-y-2 border-t border-white/15 pt-3">
        {copy.pledges.filter((p) => p.trim()).map((p, i) => {
          const Icon = PLEDGE_ICONS[i % 3];
          return <li key={i} className="flex items-center gap-2.5 text-sm opacity-90"><span className="h-7 w-7 rounded-full border border-[#F8A830]/40 text-[#F8A830] flex items-center justify-center"><Icon className="h-3.5 w-3.5" /></span>{p}</li>;
        })}
      </ul>
      <span className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-full bg-[#FFFDF9] text-[#1F1726] text-sm">{copy.ctaLabel || 'Shop'} <ArrowRight className="h-3.5 w-3.5" /></span>
    </div>
  );
}

export default function AboutPage() {
  const [copy, setCopy] = useState(null);
  const [saving, setSaving] = useState(false);
  const [slot, setSlot] = useState(null);
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [settingsRes, slotsRes, imagesRes] = await Promise.all([
          fetch(`${API_BASE}/settings`, { cache: 'no-store' }),
          authenticatedFetch(`${API_BASE}/appearance/slots`),
          fetch(`${API_BASE}/appearance`, { cache: 'no-store' }),
        ]);
        const settings = await settingsRes.json();
        const slots = slotsRes ? await slotsRes.json() : null;
        const images = await imagesRes.json();
        if (!alive) return;
        const saved = settings?.data?.commitment || {};
        setCopy({ ...COMMITMENT_DEFAULTS, ...saved, pledges: [...(saved.pledges?.length ? saved.pledges : COMMITMENT_DEFAULTS.pledges)] });
        setSlot((slots?.data || []).find((s) => s.key === PHOTO_SLOT_KEY) || null);
        setPhoto(images?.data?.[PHOTO_SLOT_KEY] || null);
      } catch {
        if (alive) { setCopy({ ...COMMITMENT_DEFAULTS, pledges: [...COMMITMENT_DEFAULTS.pledges] }); toast.error('Could not load the About page settings'); }
      }
    })();
    return () => { alive = false; };
  }, []);

  if (!copy) return <div className="p-10 text-sm text-gray-500">Loading…</div>;

  const set = (k) => (e) => setCopy((c) => ({ ...c, [k]: e.target.value }));
  const setPledge = (i, v) => setCopy((c) => ({ ...c, pledges: c.pledges.map((p, j) => (j === i ? v : p)) }));
  const knownLink = LINKS.some(([href]) => href === copy.ctaLink);

  const save = async () => {
    const pledges = copy.pledges.map((p) => p.trim()).filter(Boolean);
    if (!copy.headline.trim()) { toast.error('The headline is required'); return; }
    if (!pledges.length) { toast.error('Add at least one commitment'); return; }
    setSaving(true);
    const toastId = toast.loading('Saving…');
    try {
      const res = await authenticatedFetch(`${API_BASE}/settings/commitment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...copy, pledges }),
      });
      if (!res) { toast.dismiss(toastId); return; }
      const json = await res.json();
      if (res.ok && json.success) {
        clearStorefrontSettingsCache();
        toast.success('Commitment section updated', { id: toastId });
      } else {
        toast.error(json.error || 'Save failed', { id: toastId });
      }
    } catch {
      toast.error('Network error', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const reset = () => setCopy({ ...COMMITMENT_DEFAULTS, pledges: [...COMMITMENT_DEFAULTS.pledges] });

  return (
    <div className="min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">About Page</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">Edit the “Our commitment” band on the About us page.</p>
        </div>
        <Link to="/about#commitment" target="_blank" className="self-start sm:self-auto h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 inline-flex items-center gap-2 hover:text-gray-900">
          <ExternalLink className="h-4 w-4" /> View on site
        </Link>
      </div>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6 items-start">
        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="c-eyebrow">Label</Label>
                <Input id="c-eyebrow" value={copy.eyebrow} onChange={set('eyebrow')} maxLength={40} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="c-highlight">Highlighted words (gold)</Label>
                <Input id="c-highlight" value={copy.highlight} onChange={set('highlight')} maxLength={60} className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between"><Label htmlFor="c-headline">Headline</Label><span className="text-[11px] text-gray-400">{copy.headline.length}/140</span></div>
              <Input id="c-headline" value={copy.headline} onChange={set('headline')} maxLength={140} className="h-11 rounded-xl" />
              <p className="text-[11.5px] text-gray-500">The highlighted words are shown right after the headline, in gold.</p>
            </div>

            <div className="space-y-2">
              <Label>Commitments (up to 3)</Label>
              {copy.pledges.map((p, i) => {
                const Icon = PLEDGE_ICONS[i % 3];
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="h-11 w-11 shrink-0 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500"><Icon className="h-4 w-4" /></span>
                    <Input value={p} onChange={(e) => setPledge(i, e.target.value)} maxLength={60} className="h-11 rounded-xl" />
                    {copy.pledges.length > 1 && (
                      <button type="button" onClick={() => setCopy((c) => ({ ...c, pledges: c.pledges.filter((_, j) => j !== i) }))} aria-label="Remove commitment" className="h-11 w-11 shrink-0 rounded-xl text-red-500 hover:bg-red-50 flex items-center justify-center"><Trash2 className="h-4 w-4" /></button>
                    )}
                  </div>
                );
              })}
              {copy.pledges.length < 3 && (
                <button type="button" onClick={() => setCopy((c) => ({ ...c, pledges: [...c.pledges, ''] }))} className="text-sm font-bold text-gray-700 inline-flex items-center gap-1.5 hover:text-black"><Plus className="h-4 w-4" /> Add a commitment</button>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="c-cta">Button text</Label>
                <Input id="c-cta" value={copy.ctaLabel} onChange={set('ctaLabel')} maxLength={30} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-link">Button opens</Label>
                <select id="c-link" value={knownLink ? copy.ctaLink : '__custom'} onChange={(e) => setCopy((c) => ({ ...c, ctaLink: e.target.value === '__custom' ? '/' : e.target.value }))} className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium">
                  {LINKS.map(([href, label]) => <option key={href} value={href}>{label} ({href})</option>)}
                  <option value="__custom">Another page on this site…</option>
                </select>
                {!knownLink && <Input value={copy.ctaLink} onChange={set('ctaLink')} maxLength={100} placeholder="/categories/cookies" className="h-11 rounded-xl" />}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              <Button type="button" onClick={save} disabled={saving} className="h-11 rounded-xl font-bold bg-black hover:bg-zinc-800 !text-white">Save changes</Button>
              <Button type="button" variant="outline" onClick={reset} className="h-11 rounded-xl font-bold">Restore default text</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div>
            <p className="text-sm font-bold text-gray-900 mb-2">Preview</p>
            <Preview copy={copy} photo={photo || commitmentPhotoDefault} />
          </div>
          {slot && <SlotCard slot={slot} currentImage={photo} onSaved={(_, img) => setPhoto(img)} />}
        </div>
      </div>
    </div>
  );
}
