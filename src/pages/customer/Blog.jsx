import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, X, Gift } from 'lucide-react';
import SEO from '../../components/SEO';
import { BLOG_SEO } from '../../lib/seo';
import { Reveal } from '../../components/ui/motion';
import { BLOG_CATEGORIES, formatPostDate } from '../../data/blog';
import { useBlogPosts } from '../../lib/useBlog';
import { useStorefrontSettings, hampersVisibleIn } from '../../lib/storefrontSettings';

/*
 * The Grain Journal — laid out like a broadsheet front page: masthead and
 * section bar, a lead story with a "Latest" column, a "More stories" row, and a
 * section-by-section index. Articles are published by admin/staff (see
 * src/lib/useBlog.js).
 */

const kicker = 'text-[11px] font-display font-medium uppercase tracking-[0.18em]';

function Byline({ post, className = '' }) {
  return (
    <p className={`text-[11.5px] uppercase tracking-[0.14em] text-ink-muted ${className}`}>
      <span className="text-ink">By {post.author}</span>
      <span className="mx-2 text-ink/25">|</span>
      <time dateTime={post.date}>{formatPostDate(post.date)}</time>
      <span className="mx-2 text-ink/25">|</span>
      {post.readMins} min read
    </p>
  );
}

function Headline({ as: Tag = 'h3', className = '', children }) {
  return (
    <Tag className={`font-serif text-ink tracking-[-0.01em] transition-colors group-hover:text-berry ${className}`}>
      {children}
    </Tag>
  );
}

function SectionLabel({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-between border-t-2 border-ink pt-2.5 ${className}`}>
      <h2 className={`${kicker} text-ink`}>{children}</h2>
    </div>
  );
}

/* ── Front page blocks ─────────────────────────────────────────────── */

function LeadStory({ post }) {
  return (
    <Link to={`/blog/${post.slug}`} className="group block">
      <p className={`${kicker} text-berry`}>
        {post.category}{post.featured && <span className="text-gold"> · Featured</span>}
      </p>
      <Headline as="h2" className="mt-3 text-[2.2rem] sm:text-5xl lg:text-[3.5rem] leading-[1.06]">{post.title}</Headline>
      <p className="mt-4 font-serif italic text-[1.1rem] sm:text-xl text-ink-soft leading-relaxed">{post.excerpt}</p>
      <Byline post={post} className="mt-5" />
      <figure className="mt-6 overflow-hidden bg-cream-deep">
        <img src={post.cover} alt={post.title} className="w-full aspect-[16/9] object-cover transition-transform duration-[1.2s] ease-soft group-hover:scale-[1.02]" />
      </figure>
    </Link>
  );
}

function LatestItem({ post, withImage }) {
  return (
    <Link to={`/blog/${post.slug}`} className="group block py-5 border-b border-ink/15 first:pt-4">
      {withImage && (
        <div className="mb-4 overflow-hidden bg-cream-deep">
          <img src={post.cover} alt="" loading="lazy" className="w-full aspect-[16/9] object-cover transition-transform duration-700 ease-soft group-hover:scale-[1.03]" />
        </div>
      )}
      <p className={`${kicker} text-berry`}>{post.category}</p>
      <Headline className="mt-2 text-[1.3rem] leading-snug">{post.title}</Headline>
      <p className="mt-2 text-[14px] text-ink-soft leading-relaxed line-clamp-2">{post.excerpt}</p>
      <p className="mt-2.5 text-[11px] uppercase tracking-[0.14em] text-ink-muted">{formatPostDate(post.date)} · {post.readMins} min</p>
    </Link>
  );
}

function StoryColumn({ post }) {
  return (
    <Link to={`/blog/${post.slug}`} className="group block">
      <div className="overflow-hidden bg-cream-deep">
        <img src={post.cover} alt="" loading="lazy" className="w-full aspect-[4/3] object-cover transition-transform duration-700 ease-soft group-hover:scale-[1.03]" />
      </div>
      <p className={`${kicker} mt-4 text-berry`}>{post.category}</p>
      <Headline className="mt-2 text-[1.45rem] leading-snug">{post.title}</Headline>
      <p className="mt-2.5 text-[14.5px] text-ink-soft leading-relaxed line-clamp-3">{post.excerpt}</p>
      <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-ink-muted">By {post.author} · {formatPostDate(post.date)}</p>
    </Link>
  );
}

function FrontPage({ posts }) {
  const lead = posts.find((p) => p.featured) || posts[0];
  const rest = posts.filter((p) => p.slug !== lead.slug);
  const latest = rest.slice(0, 4);
  const more = rest.slice(4, 7);
  const sections = BLOG_CATEGORIES.slice(1)
    .map((c) => ({ name: c, items: posts.filter((p) => p.category === c).slice(0, 3) }))
    .filter((s) => s.items.length);

  return (
    <>
      <Reveal className="grid lg:grid-cols-12">
        <div className="lg:col-span-8 lg:pr-8 lg:border-r border-ink/15"><LeadStory post={lead} /></div>
        {latest.length > 0 && (
          <aside className="lg:col-span-4 lg:pl-8 mt-12 lg:mt-0">
            <SectionLabel>Latest</SectionLabel>
            {latest.map((p, i) => <LatestItem key={p.slug} post={p} withImage={i === 0} />)}
          </aside>
        )}
      </Reveal>

      {more.length > 0 && (
        <Reveal className="mt-16 sm:mt-20">
          <SectionLabel>More stories</SectionLabel>
          <div className="mt-6 grid md:grid-cols-3 gap-10 md:gap-0 md:divide-x divide-ink/15">
            {more.map((p, i) => (
              <div key={p.slug} className={`${i === 0 ? 'md:pr-7' : i === more.length - 1 ? 'md:pl-7' : 'md:px-7'}`}>
                <StoryColumn post={p} />
              </div>
            ))}
          </div>
        </Reveal>
      )}

      {sections.length > 1 && (
        <Reveal className="mt-16 sm:mt-20">
          <SectionLabel>In the sections</SectionLabel>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-0 lg:divide-x divide-ink/15">
            {sections.map((s, i) => (
              <div key={s.name} className={`${i === 0 ? 'lg:pr-6' : 'lg:px-6'}`}>
                <h3 className={`${kicker} text-berry`}>{s.name}</h3>
                <ul className="mt-3 divide-y divide-ink/10">
                  {s.items.map((p) => (
                    <li key={p.slug}>
                      <Link to={`/blog/${p.slug}`} className="group block py-3">
                        <Headline as="span" className="block text-[1.02rem] leading-snug">{p.title}</Headline>
                        <span className="mt-1 block text-[11px] uppercase tracking-[0.12em] text-ink-muted">{formatPostDate(p.date)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Reveal>
      )}
    </>
  );
}

/* ── Archive view (filtered / searched) ────────────────────────────── */

function Archive({ posts, title, onReset }) {
  return (
    <div>
      <SectionLabel>{title}</SectionLabel>
      {posts.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-serif text-2xl text-ink">No articles match that yet.</p>
          <button type="button" onClick={onReset} className="mt-4 link-arrow text-berry">Show all articles</button>
        </div>
      ) : (
        <ol>
          {posts.map((p) => (
            <li key={p.slug} className="border-b border-ink/15">
              <Link to={`/blog/${p.slug}`} className="group grid grid-cols-1 sm:grid-cols-[130px_1fr_200px] gap-3 sm:gap-8 py-7">
                <time dateTime={p.date} className="text-[11.5px] uppercase tracking-[0.14em] text-ink-muted sm:pt-1">{formatPostDate(p.date)}</time>
                <div>
                  <p className={`${kicker} text-berry`}>{p.category}</p>
                  <Headline className="mt-2 text-[1.5rem] sm:text-[1.75rem] leading-snug">{p.title}</Headline>
                  <p className="mt-2 text-[15px] text-ink-soft leading-relaxed line-clamp-2">{p.excerpt}</p>
                  <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-ink-muted">By {p.author} · {p.readMins} min read</p>
                </div>
                <div className="hidden sm:block overflow-hidden bg-cream-deep self-start">
                  <img src={p.cover} alt="" loading="lazy" className="w-full aspect-[4/3] object-cover transition-transform duration-700 ease-soft group-hover:scale-[1.03]" />
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function FrontPageSkeleton() {
  const bar = 'bg-ink/[0.06] animate-pulse';
  return (
    <div className="grid lg:grid-cols-12" aria-hidden="true">
      <div className="lg:col-span-8 lg:pr-8 lg:border-r border-ink/15 space-y-4">
        <div className={`h-3 w-24 ${bar}`} />
        <div className={`h-12 w-11/12 ${bar}`} />
        <div className={`h-12 w-3/4 ${bar}`} />
        <div className={`h-5 w-2/3 ${bar}`} />
        <div className={`mt-6 aspect-[16/9] ${bar}`} />
      </div>
      <div className="hidden lg:block lg:col-span-4 lg:pl-8 space-y-6">
        {[0, 1, 2].map((i) => <div key={i} className="space-y-2 border-b border-ink/15 pb-6"><div className={`h-3 w-20 ${bar}`} /><div className={`h-6 w-full ${bar}`} /><div className={`h-4 w-4/5 ${bar}`} /></div>)}
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────── */

export default function Blog() {
  const { posts, loading } = useBlogPosts();
  const { settings, loaded: settingsLoaded } = useStorefrontSettings();
  const showHampers = settingsLoaded && hampersVisibleIn(settings);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const filtering = category !== 'All' || query.trim() !== '';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (category !== 'All' && p.category !== category) return false;
      if (q && !`${p.title} ${p.excerpt} ${p.category} ${p.author}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [posts, category, query]);

  const reset = () => { setCategory('All'); setQuery(''); };
  const archiveTitle = query.trim()
    ? `Results for “${query.trim()}”${category !== 'All' ? ` in ${category}` : ''}`
    : `${category} · ${results.length} ${results.length === 1 ? 'article' : 'articles'}`;

  return (
    <div className="min-h-screen -mt-20 pt-20 bg-paper text-ink font-sans">
      <SEO title={BLOG_SEO.title} description={BLOG_SEO.description} url="/blog" />

      {/* Masthead */}
      <header className="px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32">
        <div className="mx-auto max-w-[1240px]">
          <div className="flex items-center justify-between gap-4 border-b border-ink/15 pb-3 text-[10.5px] sm:text-[11px] uppercase tracking-[0.18em] text-ink-muted">
            <span>{today}</span>
            <span className="hidden sm:inline">Chennai edition</span>
            <span>{posts.length} {posts.length === 1 ? 'article' : 'articles'}</span>
          </div>
          <Reveal className="py-6 sm:py-9 text-center">
            <h1 className="font-serif text-[3.1rem] sm:text-[5.5rem] lg:text-[7rem] leading-[0.95] tracking-[-0.02em] text-ink">The Grain Journal</h1>
            <p className="mt-4 font-serif italic text-[15px] sm:text-lg text-ink-soft">
              Stories from the soil to your table — recipes, heritage grains and mindful living from the Alimenture kitchen.
            </p>
          </Reveal>
          <div className="h-[5px] border-y border-ink" aria-hidden="true" />

          {/* Section bar */}
          <nav aria-label="Journal sections" className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-ink/15 py-2">
            <div role="tablist" className="flex overflow-x-auto no-scrollbar divide-x divide-ink/15">
              {BLOG_CATEGORIES.map((c) => {
                const active = c === category;
                return (
                  <button
                    key={c}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setCategory(c)}
                    className={`${kicker} shrink-0 px-3.5 first:pl-0 h-9 transition-colors ${active ? 'text-berry underline underline-offset-[6px] decoration-[1.5px]' : 'text-ink-soft hover:text-ink'}`}
                  >
                    {c === 'All' ? 'Front page' : c}
                  </button>
                );
              })}
            </div>
            <label className="relative md:w-64 shrink-0">
              <span className="sr-only">Search the journal</span>
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted pointer-events-none" strokeWidth={1.5} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the journal"
                className="w-full h-9 bg-transparent border-0 border-b border-transparent pl-6 pr-7 text-[14px] text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink/40 transition"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center text-ink-muted hover:text-ink">
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              )}
            </label>
          </nav>
        </div>
      </header>

      {/* Stories */}
      <main className="px-4 sm:px-6 lg:px-8 pt-10 sm:pt-12">
        <div className="mx-auto max-w-[1240px]">
          {loading ? <FrontPageSkeleton />
            : filtering ? <Archive posts={results} title={archiveTitle} onReset={reset} />
            : posts.length > 0 && <FrontPage posts={posts} />}
        </div>
      </main>

      {/* From the pantry */}
      <section className="px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-24 sm:pb-32">
        <Reveal className="mx-auto max-w-[1240px]">
          <SectionLabel>From the pantry</SectionLabel>
          <div className={`mt-6 grid ${showHampers ? 'md:grid-cols-2' : ''} border border-ink/15 md:divide-x divide-ink/15`}>
            <Link to="/shop" className={`group p-8 sm:p-10 flex flex-col justify-between gap-8 ${showHampers ? 'border-b md:border-b-0' : ''} border-ink/15 transition-colors hover:bg-cream/60`}>
              <p className={`${kicker} text-ink-muted`}>Alchemi&rsquo;s cookies & pantry</p>
              <div className="flex items-end justify-between gap-6">
                <h3 className="font-serif text-[1.9rem] sm:text-[2.3rem] leading-tight text-ink">Taste what we <em className="not-italic text-berry">write about.</em></h3>
                <span className="h-12 w-12 shrink-0 rounded-full border border-mulberry/30 text-mulberry flex items-center justify-center transition-colors duration-500 group-hover:bg-mulberry group-hover:text-paper">
                  <ArrowRight className="h-5 w-5" strokeWidth={1.5} />
                </span>
              </div>
            </Link>
            {showHampers && (
              <Link to="/hampers" className="group p-8 sm:p-10 flex flex-col justify-between gap-8 transition-colors hover:bg-cream/60">
                <p className={`${kicker} text-gold inline-flex items-center gap-2`}><Gift className="h-3.5 w-3.5" strokeWidth={1.5} /> Gift hampers</p>
                <div className="flex items-end justify-between gap-6">
                  <h3 className="font-serif text-[1.9rem] sm:text-[2.3rem] leading-tight text-ink">Share the goodness <em className="not-italic text-berry">this season.</em></h3>
                  <span className="h-12 w-12 shrink-0 rounded-full border border-mulberry/30 text-mulberry flex items-center justify-center transition-colors duration-500 group-hover:bg-mulberry group-hover:text-paper">
                    <ArrowRight className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                </div>
              </Link>
            )}
          </div>
        </Reveal>
      </section>
    </div>
  );
}
