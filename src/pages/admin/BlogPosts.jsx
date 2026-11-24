import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Plus, Pencil, Trash2, Search, ArrowLeft, ExternalLink, Image as ImageIcon, Eye, FileText, Star, Download,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent } from '../../components/ui/card';
import TableSkeleton from '../../components/skeletons/TableSkeleton';
import useSkeletonLoader from '../../hooks/useSkeletonLoader';
import { authenticatedFetch } from '../../lib/api';
import { parseContent, blocksToContent, CONTENT_GUIDE } from '../../lib/blogContent';
import { BLOG_POSTS, BLOG_CATEGORIES, formatPostDate } from '../../data/blog';
import { coverFor } from '../../data/blogCovers';

/*
 * Journal (blog) manager — shared by the admin and staff portals.
 * Admin can edit/delete every article; staff can write new ones and edit or
 * delete their own (the API enforces this; the UI just mirrors it).
 */

const API = import.meta.env.VITE_API_URL;
const CATEGORIES = BLOG_CATEGORIES.filter((c) => c !== 'All');
const MAX_COVER_CHARS = 700_000; // keeps the Firestore document well under 1 MB
const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  title: '', slug: '', excerpt: '', category: CATEGORIES[0], content: '', coverImage: '',
  author: localStorage.getItem('userName') || 'Team Alimenture', featured: false, status: 'draft', date: today(),
});

/** Resize + re-encode an image (File or Blob) to a WebP data URI under MAX_COVER_CHARS. */
function compressImage(fileOrBlob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fileOrBlob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, 1600 / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      let quality = 0.82;
      let out = canvas.toDataURL('image/webp', quality);
      while (out.length > MAX_COVER_CHARS && quality > 0.35) {
        quality -= 0.1;
        out = canvas.toDataURL('image/webp', quality);
      }
      if (out.length > MAX_COVER_CHARS) reject(new Error('Image is too large even after compression'));
      else resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image')); };
    img.src = url;
  });
}

function StatusBadge({ status }) {
  const live = status === 'published';
  return (
    <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${live ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
      {live ? 'Published' : 'Draft'}
    </span>
  );
}

/** Lightweight article preview (same block types as the public page). */
function Preview({ form }) {
  const blocks = parseContent(form.content);
  return (
    <div className="bg-[#FFFDF9] text-[#1F1726] rounded-xl border border-gray-200 p-6 sm:p-10">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#B0128F] text-center">{form.category}</p>
      <h1 className="font-serif text-3xl sm:text-4xl text-center mt-3 leading-tight">{form.title || 'Untitled article'}</h1>
      {form.excerpt && <p className="font-serif italic text-lg text-gray-600 text-center mt-3">{form.excerpt}</p>}
      <p className="text-[11px] uppercase tracking-[0.14em] text-gray-500 text-center mt-4 border-y border-gray-200 py-2">
        By {form.author || 'Team Alimenture'} · {form.date ? formatPostDate(form.date) : ''}
      </p>
      {form.coverImage && <img src={form.coverImage} alt="" className="mt-6 w-full aspect-[2/1] object-cover" />}
      <div className="mt-6 max-w-[640px] mx-auto">
        {blocks.length === 0 && <p className="text-gray-400 italic">Start writing to see the preview.</p>}
        {blocks.map((b, i) => {
          if (b.h2) return <h2 key={i} className="font-serif text-2xl mt-8 mb-3">{b.h2}</h2>;
          if (b.list) return <ul key={i} className="my-4 list-disc pl-6 space-y-1.5 font-serif text-[17px]">{b.list.map((x, j) => <li key={j}>{x}</li>)}</ul>;
          if (b.quote) return <figure key={i} className="my-8 border-y border-[#1F1726] py-5 text-center"><blockquote className="font-serif italic text-2xl">“{b.quote}”</blockquote>{b.cite && <figcaption className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[#B0128F]">— {b.cite}</figcaption>}</figure>;
          if (b.tip) return <aside key={i} className="my-6 border-l-[3px] border-[#C7801A] bg-[#F7F0E3] p-4"><p className="text-[11px] uppercase tracking-[0.18em] text-[#C7801A]">Kitchen tip</p><p className="font-serif mt-1">{b.tip}</p></aside>;
          return <p key={i} className="my-4 font-serif text-[17px] leading-[1.75]">{b.p}</p>;
        })}
      </div>
    </div>
  );
}

function Editor({ initial, onCancel, onSaved }) {
  const [form, setForm] = useState(() => ({ ...emptyForm(), ...initial }));
  const [tab, setTab] = useState('write');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const isEdit = Boolean(initial?.id);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e }));
  const words = form.content.trim().split(/\s+/).filter(Boolean).length;

  const pickCover = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try { setForm((f) => ({ ...f, coverImage: '' })); const data = await compressImage(file); setForm((f) => ({ ...f, coverImage: data })); }
    catch (err) { toast.error(err.message); }
  };

  const save = async (status) => {
    const body = { ...form, status: status || form.status };
    if (!body.title.trim() || !body.excerpt.trim() || !body.content.trim()) {
      toast.error('Title, summary and article text are required');
      return;
    }
    if (!body.slug) delete body.slug;
    if (!body.coverImage) delete body.coverImage;
    for (const k of ['id', 'createdAt', 'updatedAt', 'createdBy', 'readMins']) delete body[k];

    setSaving(true);
    const toastId = toast.loading(isEdit ? 'Saving article…' : 'Creating article…');
    try {
      const res = await authenticatedFetch(isEdit ? `${API}/blog/${initial.id}` : `${API}/blog`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res) { toast.dismiss(toastId); return; }
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Could not save the article', { id: toastId }); return; }
      toast.success(body.status === 'published' ? 'Article published' : 'Draft saved', { id: toastId });
      onSaved();
    } catch {
      toast.error('Network error', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onCancel} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:text-gray-900" aria-label="Back to articles">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{isEdit ? 'Edit article' : 'New article'}</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{words} words · about {Math.max(1, Math.round(words / 200))} min read</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={saving} onClick={() => save('draft')} className="h-11 rounded-xl font-bold">Save draft</Button>
          <Button type="button" disabled={saving} onClick={() => save('published')} className="h-11 rounded-xl font-bold bg-black hover:bg-zinc-800 !text-white">
            {form.status === 'published' && isEdit ? 'Update' : 'Publish'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-5">
          <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
            <CardContent className="p-5 sm:p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="bp-title">Headline</Label>
                <Input id="bp-title" value={form.title} onChange={set('title')} maxLength={160} placeholder="e.g. Millets 101: a beginner’s guide" className="h-12 rounded-xl text-base font-semibold" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between"><Label htmlFor="bp-excerpt">Summary</Label><span className="text-[11px] text-gray-400">{form.excerpt.length}/320</span></div>
                <Textarea id="bp-excerpt" value={form.excerpt} onChange={set('excerpt')} maxLength={320} rows={2} placeholder="One or two sentences shown under the headline and on the journal page." className="rounded-xl" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
            <CardContent className="p-0">
              <div className="flex border-b border-gray-100 px-3">
                {[['write', 'Write', FileText], ['preview', 'Preview', Eye]].map(([k, label, Icon]) => (
                  <button key={k} type="button" onClick={() => setTab(k)} className={`flex items-center gap-2 px-4 h-12 text-sm font-bold border-b-2 -mb-px ${tab === k ? 'border-black text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </div>
              <div className="p-5 sm:p-6">
                {tab === 'write' ? (
                  <>
                    <Textarea
                      value={form.content}
                      onChange={set('content')}
                      rows={22}
                      placeholder={'Write the article here.\n\n## A section heading\n- A bullet point\n> A pull quote\n-- Who said it\n! A kitchen tip'}
                      className="rounded-xl font-mono text-[13.5px] leading-relaxed"
                    />
                    <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {CONTENT_GUIDE.map(([code, help]) => (
                        <div key={code} className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                          <code className="text-[12px] font-bold text-gray-900">{code}</code>
                          <p className="text-[11.5px] text-gray-500 mt-0.5">{help}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : <Preview form={form} />}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">Status</span>
                <StatusBadge status={form.status} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bp-date">Publish date</Label>
                <Input id="bp-date" type="date" value={form.date} onChange={set('date')} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bp-category">Section</Label>
                <select id="bp-category" value={form.category} onChange={set('category')} className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bp-author">Byline</Label>
                <Input id="bp-author" value={form.author} onChange={set('author')} maxLength={80} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bp-slug">URL</Label>
                <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden">
                  <span className="px-3 text-xs text-gray-400 bg-gray-50 h-11 flex items-center border-r border-gray-200">/blog/</span>
                  <input id="bp-slug" value={form.slug} onChange={set('slug')} placeholder="auto from headline" maxLength={90} className="flex-1 h-11 px-3 text-sm outline-none bg-white" />
                </div>
              </div>
              <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={set('featured')} className="mt-0.5 h-4 w-4 accent-black" />
                <span>
                  <span className="block text-sm font-bold text-gray-900">Lead story</span>
                  <span className="block text-xs text-gray-500">Shown as the front-page lead. Only one article can be the lead.</span>
                </span>
              </label>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
            <CardContent className="p-5 space-y-3">
              <span className="text-sm font-bold text-gray-900">Cover photo</span>
              <button type="button" onClick={() => fileRef.current?.click()} className="relative w-full aspect-[16/9] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center text-gray-400 hover:border-gray-300">
                {form.coverImage
                  ? <img src={form.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  : <span className="flex flex-col items-center gap-2 text-xs font-medium"><ImageIcon className="h-6 w-6" /> Upload a landscape photo</span>}
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={pickCover} className="hidden" />
              <p className="text-[11.5px] text-gray-500">PNG, JPG or WebP. It’s resized and compressed automatically. Without one, a default journal photo is used.</p>
              {form.coverImage && <button type="button" onClick={() => setForm((f) => ({ ...f, coverImage: '' }))} className="text-xs font-bold text-red-600">Remove photo</button>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function BlogPosts() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const showSkeleton = useSkeletonLoader(isLoading);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState(null); // null = list; {} = new; post = edit
  const [importing, setImporting] = useState(false);

  const role = (localStorage.getItem('role') || '').toLowerCase();
  const uid = localStorage.getItem('uid');
  const isAdmin = role === 'admin';
  const canModify = (p) => isAdmin || p.createdBy?.uid === uid;

  const load = async () => {
    try {
      const res = await authenticatedFetch(`${API}/blog/manage/all`);
      if (!res) return;
      const data = await res.json();
      if (data.success) setPosts(data.data || []);
      else toast.error(data.error || 'Failed to load articles');
    } catch { toast.error('Failed to load articles'); }
    finally { setIsLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => (statusFilter === 'all' || p.status === statusFilter)
      && (!q || `${p.title} ${p.category} ${p.author}`.toLowerCase().includes(q)));
  }, [posts, query, statusFilter]);

  const remove = async (p) => {
    if (!window.confirm(`Delete “${p.title}”? This can’t be undone.`)) return;
    const toastId = toast.loading('Deleting…');
    try {
      const res = await authenticatedFetch(`${API}/blog/${p.id}`, { method: 'DELETE' });
      if (!res) { toast.dismiss(toastId); return; }
      if (res.ok) { toast.success('Article deleted', { id: toastId }); load(); }
      else toast.error((await res.json()).error || 'Delete failed', { id: toastId });
    } catch { toast.error('Network error', { id: toastId }); }
  };

  /** Copy the built-in starter articles into the database so they can be edited. */
  const importStarters = async () => {
    if (!window.confirm(`Import the ${BLOG_POSTS.length} built-in starter articles as published posts?`)) return;
    setImporting(true);
    const toastId = toast.loading('Importing starter articles…');
    let done = 0;
    try {
      for (const p of [...BLOG_POSTS].reverse()) {
        let coverImage;
        try { coverImage = await compressImage(await (await fetch(coverFor(p))).blob()); } catch { coverImage = undefined; }
        const res = await authenticatedFetch(`${API}/blog`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: p.title, slug: p.slug, excerpt: p.excerpt, category: p.category, date: p.date,
            author: p.author || 'Team Alimenture', featured: Boolean(p.featured), status: 'published',
            content: blocksToContent(p.body), ...(coverImage ? { coverImage } : {}),
          }),
        });
        if (!res || !res.ok) throw new Error((res && (await res.json()).error) || 'Import stopped');
        done += 1;
        toast.loading(`Importing starter articles… ${done}/${BLOG_POSTS.length}`, { id: toastId });
      }
      toast.success('Starter articles imported', { id: toastId });
    } catch (err) {
      toast.error(`${err.message} (${done} imported)`, { id: toastId });
    } finally {
      setImporting(false);
      load();
    }
  };

  if (editing) {
    return <Editor initial={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />;
  }

  if (isLoading && posts.length === 0) {
    return showSkeleton ? <div className="min-h-screen"><TableSkeleton /></div> : <div className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">The Grain Journal</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
            Write and publish blog articles{isAdmin ? '' : ' — you can edit the articles you wrote'}.
          </p>
        </div>
        <div className="flex gap-2 justify-center sm:justify-end">
          <Link to="/blog" target="_blank" className="h-10 sm:h-12 px-4 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 inline-flex items-center gap-2 hover:text-gray-900">
            <ExternalLink className="h-4 w-4" /> View journal
          </Link>
          <Button onClick={() => setEditing({})} className="bg-black hover:bg-zinc-800 !text-white h-10 sm:h-12 px-4 sm:px-6 rounded-xl font-bold shadow-md text-xs sm:text-sm">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" /> New article
          </Button>
        </div>
      </div>

      {posts.length === 0 && (
        <Card className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 shadow-none">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-gray-900">No articles in the database yet</p>
              <p className="text-xs text-gray-600 mt-1">
                The public journal is showing {BLOG_POSTS.length} built-in starter articles. As soon as one article is published here, the journal shows only the articles managed on this page.
                {isAdmin && ' Import the starters first to keep them and make them editable.'}
              </p>
            </div>
            {isAdmin && (
              <Button onClick={importStarters} disabled={importing} variant="outline" className="h-11 rounded-xl font-bold shrink-0">
                <Download className="h-4 w-4 mr-2" /> Import starter articles
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm rounded-2xl bg-white border border-gray-100 overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 sm:p-6 border-b border-gray-50 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input placeholder="Search articles…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-11 h-11 rounded-xl bg-gray-100 border-gray-100 font-medium" />
            </div>
            <div className="flex gap-1 rounded-xl bg-gray-100 p-1 self-start">
              {[['all', 'All'], ['published', 'Published'], ['draft', 'Drafts']].map(([k, label]) => (
                <button key={k} type="button" onClick={() => setStatusFilter(k)} className={`h-9 px-4 rounded-lg text-xs font-bold ${statusFilter === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>{label}</button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="p-10 text-center text-sm text-gray-500">{posts.length ? 'No articles match.' : 'Write your first article with “New article”.'}</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {visible.map((p) => (
                <li key={p.id} className="p-4 sm:px-6 flex items-center gap-4">
                  <div className="h-16 w-24 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    <img src={p.coverImage || coverFor({})} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={p.status} />
                      {p.featured && <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700"><Star className="h-3 w-3 fill-current" /> Lead story</span>}
                      <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{p.category}</span>
                    </div>
                    <p className="mt-1 font-bold text-gray-900 truncate">{p.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">By {p.author} · {formatPostDate(p.date)} · {p.readMins} min read</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {p.status === 'published' && (
                      <Link to={`/blog/${p.slug}`} target="_blank" className="h-9 w-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100" aria-label="View article"><ExternalLink className="h-4 w-4" /></Link>
                    )}
                    {canModify(p) && (
                      <>
                        <button type="button" onClick={() => setEditing(p)} className="h-9 w-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100" aria-label="Edit article"><Pencil className="h-4 w-4" /></button>
                        <button type="button" onClick={() => remove(p)} className="h-9 w-9 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50" aria-label="Delete article"><Trash2 className="h-4 w-4" /></button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
