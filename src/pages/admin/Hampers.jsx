import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ExternalLink, Eye, EyeOff, Phone, Mail, Trash2, Inbox } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { API_BASE, authenticatedFetch } from '../../lib/api';
import { clearStorefrontSettingsCache } from '../../lib/storefrontSettings';
import { SlotCard } from './Appearance';

/*
 * Admin → Gift Hampers: switch the public Gift Hampers page on/off, replace
 * every photo on it (banner, hamper cards, Grainlets — appearance slots served
 * with ?page=hampers, also listed under Templates) and work the bulk enquiries.
 */
const BANNER_SLOT_KEY = 'hampersHero';
const ENQUIRY_STATUSES = ['new', 'contacted', 'quoted', 'won', 'closed'];
const STATUS_STYLE = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  contacted: 'bg-amber-50 text-amber-700 border-amber-200',
  quoted: 'bg-violet-50 text-violet-700 border-violet-200',
  won: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
};

async function fetchEnquiries() {
  try {
    const res = await authenticatedFetch(`${API_BASE}/hampers/enquiries`);
    if (!res) return [];
    const json = await res.json();
    return json.success ? json.data : [];
  } catch {
    toast.error('Could not load enquiries');
    return [];
  }
}

/** Bulk / corporate enquiries sent from the Gift Hampers page form. */
function Enquiries() {
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState('open');

  const load = () => fetchEnquiries().then(setItems);
  useEffect(() => {
    let alive = true;
    fetchEnquiries().then((data) => { if (alive) setItems(data); });
    return () => { alive = false; };
  }, []);

  const setStatus = async (id, status) => {
    setItems((list) => list.map((e) => (e.id === id ? { ...e, status } : e)));
    const res = await authenticatedFetch(`${API_BASE}/hampers/enquiries/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
    if (!res || !res.ok) { toast.error('Could not update the status'); load(); }
  };
  const remove = async (e) => {
    if (!window.confirm(`Delete the enquiry from ${e.name}? This can’t be undone.`)) return;
    const res = await authenticatedFetch(`${API_BASE}/hampers/enquiries/${e.id}`, { method: 'DELETE' });
    if (res && res.ok) { toast.success('Enquiry deleted'); load(); } else toast.error('Delete failed');
  };

  const visible = (items || []).filter((e) => filter === 'all' || (filter === 'open' ? !['won', 'closed'].includes(e.status) : e.status === filter));
  const newCount = (items || []).filter((e) => e.status === 'new').length;

  return (
    <Card className="mt-6 rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
      <CardContent className="p-0">
        <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-bold text-gray-900">Bulk &amp; corporate enquiries {newCount > 0 && <span className="ml-2 inline-flex h-6 px-2 items-center rounded-full bg-blue-600 text-white text-[11px]">{newCount} new</span>}</p>
            <p className="text-sm text-gray-500 mt-0.5">Sent from the “Request a quote” form on the Gift Hampers page.</p>
          </div>
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1 self-start overflow-x-auto">
            {[['open', 'Open'], ['all', 'All'], ...ENQUIRY_STATUSES.map((s) => [s, s[0].toUpperCase() + s.slice(1)])].map(([k, label]) => (
              <button key={k} type="button" onClick={() => setFilter(k)} className={`h-8 px-3 rounded-lg text-xs font-bold whitespace-nowrap ${filter === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>{label}</button>
            ))}
          </div>
        </div>
        {items === null ? (
          <p className="p-8 text-sm text-gray-500">Loading enquiries…</p>
        ) : visible.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500"><Inbox className="h-6 w-6 mx-auto mb-2 text-gray-300" />No enquiries here yet.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {visible.map((e) => (
              <li key={e.id} className="p-5 sm:px-6 grid lg:grid-cols-[1.2fr_1.4fr_auto] gap-4 lg:items-center">
                <div className="min-w-0">
                  <p className="font-bold text-gray-900">{e.name}{e.company && <span className="font-medium text-gray-500"> · {e.company}</span>}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <a href={`tel:+91${e.mobile}`} className="inline-flex items-center gap-1.5 text-gray-700 hover:text-black"><Phone className="h-3.5 w-3.5" /> {e.mobile}</a>
                    {e.email && <a href={`mailto:${e.email}`} className="inline-flex items-center gap-1.5 text-gray-700 hover:text-black truncate"><Mail className="h-3.5 w-3.5" /> {e.email}</a>}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">{e.createdAt ? new Date(e.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : ''}</p>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><span className="font-bold">{e.quantity}</span> × {e.hamper || 'Custom hamper'}{e.branding && <span className="ml-2 text-[11px] font-bold uppercase text-violet-700">Branded</span>}</p>
                  <p className="text-gray-500">{[e.occasion, e.budget && `${e.budget} / box`, e.deliveryDate && `by ${e.deliveryDate}`, e.city].filter(Boolean).join(' · ')}</p>
                  {e.notes && <p className="text-gray-500 italic line-clamp-2">“{e.notes}”</p>}
                </div>
                <div className="flex items-center gap-2">
                  <select value={e.status} onChange={(ev) => setStatus(e.id, ev.target.value)} className={`h-9 rounded-lg border px-2 text-xs font-bold uppercase ${STATUS_STYLE[e.status] || STATUS_STYLE.new}`}>
                    {ENQUIRY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button type="button" onClick={() => remove(e)} aria-label="Delete enquiry" className="h-9 w-9 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminHampers() {
  const [visible, setVisible] = useState(null); // null = loading
  const [saving, setSaving] = useState(false);
  const [pageSlots, setPageSlots] = useState([]);
  const [images, setImages] = useState({});

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [settingsRes, slotsRes, imagesRes] = await Promise.all([
          fetch(`${API_BASE}/settings`, { cache: 'no-store' }),
          authenticatedFetch(`${API_BASE}/appearance/slots`),
          fetch(`${API_BASE}/appearance?page=hampers`, { cache: 'no-store' }),
        ]);
        const settings = await settingsRes.json();
        const slots = slotsRes ? await slotsRes.json() : null;
        const images = await imagesRes.json();
        if (!alive) return;
        setVisible(settings?.data?.hampersVisible !== false);
        setPageSlots((slots?.data || []).filter((s) => s.page === 'hampers'));
        setImages(images?.data || {});
      } catch {
        if (alive) { setVisible(true); toast.error('Could not load the Gift Hampers settings'); }
      }
    })();
    return () => { alive = false; };
  }, []);

  const bannerSlot = pageSlots.find((sl) => sl.key === BANNER_SLOT_KEY) || null;
  const onImageSaved = (key, img) => setImages((prev) => {
    const next = { ...prev };
    if (img) next[key] = img; else delete next[key];
    return next;
  });

  const toggle = async () => {
    const next = !visible;
    setSaving(true);
    const toastId = toast.loading(next ? 'Showing the Gift Hampers page…' : 'Hiding the Gift Hampers page…');
    try {
      const res = await authenticatedFetch(`${API_BASE}/settings/hampers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible: next }),
      });
      if (!res) { toast.dismiss(toastId); return; }
      const json = await res.json();
      if (res.ok && json.success) {
        setVisible(next);
        clearStorefrontSettingsCache();
        toast.success(next ? 'Gift Hampers page is live' : 'Gift Hampers page is hidden', { id: toastId });
      } else {
        toast.error(json.error || 'Update failed', { id: toastId });
      }
    } catch {
      toast.error('Network error', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Gift Hampers</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">Control the public Gift Hampers page and its top banner.</p>
        </div>
        <Link to="/hampers" target="_blank" className="self-start sm:self-auto h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 inline-flex items-center gap-2 hover:text-gray-900">
          <ExternalLink className="h-4 w-4" /> Open page
        </Link>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6 items-start">
        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <span className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center ${visible ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                  {visible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </span>
                <div>
                  <p className="font-bold text-gray-900">Show Gift Hampers to customers</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {visible === null ? 'Loading…'
                      : visible ? 'The page is live and linked from the menu.'
                      : 'The page and all its menu links are hidden. Visitors who open the link see a “not available” message. Admins can still preview it.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={!!visible}
                aria-label="Show Gift Hampers to customers"
                disabled={visible === null || saving}
                onClick={toggle}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${visible ? 'bg-emerald-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${visible ? 'translate-x-5' : ''}`} />
              </button>
            </div>
            <p className="mt-5 text-xs text-gray-400">Changes reach shoppers within a few minutes (their browser keeps settings briefly).</p>
          </CardContent>
        </Card>

        <div>
          {bannerSlot ? (
            <SlotCard slot={bannerSlot} currentImage={images[BANNER_SLOT_KEY] || null} onSaved={onImageSaved} />
          ) : (
            <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
              <CardContent className="p-6 text-sm text-gray-500">
                {visible === null ? 'Loading banner…' : 'The banner slot isn’t available — restart the API server so it picks up the new “Gift Hampers — Top banner” slot.'}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {[
        ['Hamper photos', 'The photo on each card in “Curated hampers”.', 'hamper-'],
        ['Grainlets photos', 'The round photos in “Meet the Grainlets” — also used as the small thumbnails in each hamper’s “Inside the box” list.', 'grainlet-'],
      ].map(([title, hint, prefix]) => {
        const group = pageSlots.filter((sl) => sl.key.startsWith(prefix));
        if (!group.length) return null;
        return (
          <div key={prefix} className="mt-8">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-0.5 mb-4">{hint}</p>
            <div className={`grid sm:grid-cols-2 ${prefix === 'grainlet-' ? 'xl:grid-cols-4' : 'xl:grid-cols-3'} gap-4`}>
              {group.map((sl) => (
                <SlotCard key={sl.key} slot={sl} currentImage={images[sl.key] || null} onSaved={onImageSaved} />
              ))}
            </div>
          </div>
        );
      })}

      <Enquiries />
    </div>
  );
}
