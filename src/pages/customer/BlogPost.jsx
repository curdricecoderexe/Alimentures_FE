import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ArrowLeft, ArrowRight, Link2, Check, MessageCircle } from 'lucide-react';
import SEO from '../../components/SEO';
import { BRAND, articleJsonLd, breadcrumbJsonLd } from '../../lib/seo';
import { Reveal } from '../../components/ui/motion';
import { formatPostDate } from '../../data/blog';
import { useBlogPost, useBlogPosts } from '../../lib/useBlog';

/* A Grain Journal article, set like a newspaper feature. */

const kicker = 'text-[11px] font-display font-medium uppercase tracking-[0.18em]';

function Block({ block }) {
  if (block.h2) {
    return <h2 className="font-serif text-[1.65rem] sm:text-[2rem] text-ink mt-12 mb-4 leading-tight">{block.h2}</h2>;
  }
  if (block.list) {
    return (
      <ul className="my-6 space-y-3">
        {block.list.map((item, i) => (
          <li key={i} className="flex gap-3.5 font-serif text-[18px] sm:text-[19px] leading-[1.7] text-ink/85">
            <span aria-hidden="true" className="mt-[0.75em] h-1.5 w-1.5 shrink-0 bg-berry" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (block.quote) {
    return (
      <figure className="my-12 border-y border-ink py-7 text-center">
        <blockquote className="font-serif italic text-[1.6rem] sm:text-[2.1rem] leading-[1.25] text-ink">
          “{block.quote}”
        </blockquote>
        {block.cite && <figcaption className={`${kicker} mt-4 text-berry`}>— {block.cite}</figcaption>}
      </figure>
    );
  }
  if (block.tip) {
    return (
      <aside className="my-9 border border-ink/15 border-l-[3px] border-l-gold bg-cream/60 p-5 sm:p-6">
        <p className={`${kicker} text-gold`}>Kitchen tip</p>
        <p className="mt-2 font-serif text-[17px] leading-relaxed text-ink">{block.tip}</p>
      </aside>
    );
  }
  return <p className="my-5 font-serif text-[18px] sm:text-[19px] leading-[1.75] text-ink/85">{block.p}</p>;
}

function ShareBar({ post }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked — ignore */ }
  };
  const btn = 'h-9 w-9 rounded-full border border-ink/15 flex items-center justify-center text-ink-soft hover:text-berry hover:border-berry/40 transition-colors';
  return (
    <div className="flex items-center gap-2">
      <span className={`${kicker} text-ink-muted mr-1`}>Share</span>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${post.title} — ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
        className={btn}
      >
        <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
      </a>
      <button type="button" onClick={copy} aria-label="Copy link" className={btn}>
        {copied ? <Check className="h-4 w-4 text-berry" strokeWidth={1.5} /> : <Link2 className="h-4 w-4" strokeWidth={1.5} />}
      </button>
    </div>
  );
}

function Masthead() {
  return (
    <div className="flex items-center justify-between border-b border-ink pb-3">
      <Link to="/blog" className={`${kicker} inline-flex items-center gap-1.5 text-ink-muted hover:text-berry transition-colors`}>
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} /> Journal
      </Link>
      <Link to="/blog" className="font-serif text-xl sm:text-2xl text-ink">The Grain Journal</Link>
      <span className={`${kicker} text-ink-muted hidden sm:inline`}>Chennai edition</span>
    </div>
  );
}

function NotFoundPost() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 pt-28 bg-paper">
      <SEO title="Article not found" noindex />
      <span className={`${kicker} text-berry`}>The Grain Journal</span>
      <h1 className="font-serif mt-4 text-4xl sm:text-5xl text-ink">We couldn’t find that story.</h1>
      <p className="mt-4 text-ink-soft max-w-md">It may have moved or been retired. Browse the latest articles instead.</p>
      <Link to="/blog" className="btn-pill mt-8"><ArrowLeft className="h-4 w-4" /> Back to the journal</Link>
    </div>
  );
}

function ArticleSkeleton() {
  const bar = 'bg-ink/[0.06] animate-pulse';
  return (
    <div className="min-h-screen -mt-20 bg-paper px-4 sm:px-6 pt-48 sm:pt-52" aria-hidden="true">
      <div className="mx-auto max-w-[760px] space-y-4 pt-12">
        <div className={`h-3 w-24 mx-auto ${bar}`} />
        <div className={`h-12 w-full ${bar}`} />
        <div className={`h-12 w-2/3 mx-auto ${bar}`} />
        <div className={`h-5 w-3/4 mx-auto ${bar}`} />
        <div className={`mt-8 aspect-[16/9] ${bar}`} />
      </div>
    </div>
  );
}

export default function BlogPost() {
  const { slug } = useParams();
  const { post, loading } = useBlogPost(slug);
  const { posts } = useBlogPosts();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  if (loading) return <ArticleSkeleton />;
  if (!post) return <NotFoundPost />;

  const body = post.body || [];
  const others = posts.filter((p) => p.slug !== post.slug);
  const related = [...others.filter((p) => p.category === post.category), ...others.filter((p) => p.category !== post.category)].slice(0, 3);
  const idx = posts.findIndex((p) => p.slug === post.slug);
  const next = posts.length > 1 ? posts[(idx + 1) % posts.length] : null;
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }, { name: post.title, path: `/blog/${post.slug}` }];

  return (
    <div className="min-h-screen -mt-20 pt-20 bg-paper text-ink font-sans">
      <SEO
        title={post.title}
        description={post.excerpt}
        type="article"
        url={`/blog/${post.slug}`}
        image={post.cover}
        imageAlt={post.title}
        jsonLd={[articleJsonLd(post, post.cover), breadcrumbJsonLd(crumbs)]}
      />

      {/* reading progress */}
      <motion.div aria-hidden="true" style={{ scaleX: progress }} className="fixed top-0 left-0 right-0 h-[2px] origin-left bg-berry z-[120]" />

      <div className="px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32">
        <div className="mx-auto max-w-[1240px]"><Masthead /></div>
      </div>

      {/* Headline block */}
      <header className="px-4 sm:px-6 pt-12 sm:pt-16">
        <Reveal className="mx-auto max-w-[860px] text-center">
          <p className={`${kicker} text-berry`}>{post.category}</p>
          <h1 className="font-serif mt-5 text-[2.3rem] sm:text-5xl lg:text-[3.6rem] leading-[1.08] tracking-[-0.01em] text-ink">{post.title}</h1>
          <p className="mt-5 font-serif italic text-[1.15rem] sm:text-[1.35rem] text-ink-soft leading-relaxed max-w-2xl mx-auto">{post.excerpt}</p>
        </Reveal>
        <div className="mx-auto max-w-[760px] mt-8 border-y border-ink/15 py-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11.5px] uppercase tracking-[0.14em] text-ink-muted">
          <span className="text-ink">By {post.author}</span>
          <span className="text-ink/25">|</span>
          <time dateTime={post.date}>{formatPostDate(post.date)}</time>
          <span className="text-ink/25">|</span>
          <span>{post.readMins} min read</span>
        </div>
      </header>

      {/* Cover */}
      <figure className="px-4 sm:px-6 mt-10 sm:mt-12">
        <div className="mx-auto max-w-[1080px] overflow-hidden bg-cream-deep">
          <img src={post.cover} alt={post.title} className="w-full aspect-[16/9] sm:aspect-[2/1] object-cover" />
        </div>
      </figure>

      {/* Body */}
      <article className="px-4 sm:px-6 pt-10 sm:pt-14">
        <div className="mx-auto max-w-[680px]">
          {body[0] && (
            <div className="first-letter:float-left first-letter:font-serif first-letter:text-[4.6rem] first-letter:leading-[0.8] first-letter:mr-3 first-letter:mt-2 first-letter:text-berry">
              <Block block={body[0]} />
            </div>
          )}
          {body.slice(1).map((b, i) => <Block key={i} block={b} />)}

          <div className="mt-14 pt-5 border-t border-ink flex flex-wrap items-center justify-between gap-4">
            <span className={`${kicker} text-ink-muted`}>Filed under <span className="text-berry">{post.category}</span></span>
            <ShareBar post={post} />
          </div>

          {next && (
            <Link to={`/blog/${next.slug}`} className="group mt-10 grid grid-cols-[96px_1fr_auto] items-center gap-5 border-y border-ink/15 py-5">
              <img src={next.cover} alt="" loading="lazy" className="h-20 w-24 object-cover" />
              <div className="min-w-0">
                <p className={`${kicker} text-ink-muted`}>Read next</p>
                <p className="mt-1 font-serif text-[1.15rem] sm:text-[1.3rem] leading-snug text-ink group-hover:text-berry transition-colors line-clamp-2">{next.title}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-ink-muted transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
            </Link>
          )}
        </div>
      </article>

      {/* More from the journal */}
      {related.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-24 sm:pb-32">
          <div className="mx-auto max-w-[1240px]">
            <div className="flex items-end justify-between gap-6 border-t-2 border-ink pt-2.5">
              <h2 className={`${kicker} text-ink`}>More from the Journal</h2>
              <Link to="/blog" className={`${kicker} text-ink-muted hover:text-berry transition-colors inline-flex items-center gap-1.5`}>All articles <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} /></Link>
            </div>
            <div className="mt-6 grid md:grid-cols-3 gap-10 md:gap-0 md:divide-x divide-ink/15">
              {related.map((p, i) => (
                <Reveal key={p.slug} delay={i * 0.05} className={`${i === 0 ? 'md:pr-7' : i === related.length - 1 ? 'md:pl-7' : 'md:px-7'}`}>
                  <Link to={`/blog/${p.slug}`} className="group block">
                    <div className="overflow-hidden bg-cream-deep">
                      <img src={p.cover} alt="" loading="lazy" className="w-full aspect-[4/3] object-cover transition-transform duration-700 ease-soft group-hover:scale-[1.03]" />
                    </div>
                    <p className={`${kicker} mt-4 text-berry`}>{p.category}</p>
                    <h3 className="mt-2 font-serif text-[1.4rem] leading-snug text-ink group-hover:text-berry transition-colors">{p.title}</h3>
                    <p className="mt-2.5 text-[11px] uppercase tracking-[0.14em] text-ink-muted">{formatPostDate(p.date)} · {p.readMins} min read</p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
