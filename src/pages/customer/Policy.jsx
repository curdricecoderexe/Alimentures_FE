import React, { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, ChevronRight, FileText, ShieldCheck, Mail, Phone, Home,
} from 'lucide-react';
import SEO from '../../components/SEO';
import { POLICIES, POLICY_BY_SLUG, SUPPORT_CONTACT } from '../../data/policies';

const slugify = (s) =>
  s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const scrollToId = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  if (window.lenis?.scrollTo) {
    window.lenis.scrollTo(el, { offset: -110 });
  } else {
    const y = el.getBoundingClientRect().top + window.pageYOffset - 110;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
};

function PolicyDirectory() {
  return (
    <div className="relative text-ink font-sans min-h-screen overflow-hidden">
      <SEO
        title="Policies & Legal"
        description="Alimenture policies: privacy, terms of service, shipping, returns & refunds, cancellation, and quality guidelines."
        url="/policies"
      />
      <PolicyHero
        eyebrow="Legal Centre"
        title="Policies & Legal"
        updated={null}
        intro="Everything that governs your orders and your relationship with Alimenture, in plain language. Choose a policy below."
      />
      <div className="relative z-[2] max-w-5xl mx-auto px-6 py-16 grid gap-5 sm:grid-cols-2">
        {POLICIES.map((p, i) => (
          <motion.div
            key={p.slug}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
          >
            <Link
              to={`/policies/${p.slug}`}
              className="group glass glass-hover foil-top block h-full rounded-panel p-7 relative z-[2]"
            >
              <div className="flex items-center gap-3">
                <span className="ico-chip h-11 w-11 rounded-2xl">
                  <FileText className="h-5 w-5" />
                </span>
                <h2 className="font-display text-lg font-extrabold text-ink group-hover:text-berry transition-colors">
                  {p.title}
                </h2>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">{p.summary}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-widest text-berry">
                Read policy
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PolicyHero({ eyebrow, title, updated, intro }) {
  return (
    <header
      className="relative overflow-hidden px-6 pb-16 pt-32 text-white foil-top"
      style={{ background: 'linear-gradient(155deg,#79083F 0%,#A50D5A 55%,#6A0637 100%)' }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />
      <div className="relative mx-auto max-w-5xl">
        <nav className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/60">
          <Link to="/" className="inline-flex items-center gap-1 hover:text-white">
            <Home className="h-3 w-3" /> Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/policies" className="hover:text-white">Policies</Link>
          {title !== 'Policies & Legal' && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="text-white/90">{title}</span>
            </>
          )}
        </nav>

        <span className="mt-6 inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.25em] text-gold-light">
          {eyebrow}
        </span>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
          {title}
        </h1>
        {updated && (
          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-white/55">
            Last updated: {updated}
          </p>
        )}
        {intro && (
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">{intro}</p>
        )}
      </div>
    </header>
  );
}

export default function Policy() {
  const { slug } = useParams();
  const policy = slug ? POLICY_BY_SLUG[slug] : null;

  const sections = useMemo(
    () => (policy?.sections || []).map((s, i) => ({ ...s, id: `${slugify(s.heading)}-${i}` })),
    [policy]
  );

  useEffect(() => {
    if (window.lenis?.scrollTo) window.lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [slug]);

  if (!slug) return <PolicyDirectory />;

  if (!policy) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-cream px-6 text-center font-sans text-ink">
        <SEO title="Policy not found" description="The requested policy page does not exist." noindex url="/policies" />
        <h1 className="font-display text-2xl font-extrabold text-ink">Policy not found</h1>
        <p className="max-w-sm text-sm text-ink-soft">
          The page you are looking for doesn&rsquo;t exist. Browse all Alimenture policies instead.
        </p>
        <Link
          to="/policies"
          className="btn-berry rounded-full px-6 py-3 text-xs font-extrabold uppercase tracking-widest"
        >
          View all policies
        </Link>
      </div>
    );
  }

  return (
    <div className="relative font-sans text-ink overflow-hidden">
      <SEO
        title={policy.title}
        description={policy.summary}
        url={`/policies/${policy.slug}`}
        type="article"
      />

      <PolicyHero
        eyebrow="Alimenture Policy"
        title={policy.title}
        updated={policy.updated}
        intro={policy.intro}
      />

      {/* Mobile policy switcher */}
      <div className="lg:hidden">
        <div className="mx-auto max-w-5xl overflow-x-auto px-6 py-4">
          <div className="flex gap-2">
            {POLICIES.map((p) => (
              <Link
                key={p.slug}
                to={`/policies/${p.slug}`}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
                  p.slug === policy.slug
                    ? 'border-transparent btn-berry'
                    : 'pill-glass hover:border-berry/45'
                }`}
              >
                {p.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-[2] mx-auto grid max-w-5xl gap-12 px-6 py-12 lg:grid-cols-[240px_1fr] lg:py-16">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-8">
            <div>
              <p className="mb-3 kicker text-ink-soft">
                Policies
              </p>
              <ul className="space-y-1">
                {POLICIES.map((p) => (
                  <li key={p.slug}>
                    <Link
                      to={`/policies/${p.slug}`}
                      className={`block rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                        p.slug === policy.slug
                          ? 'pill-berry-soft'
                          : 'text-ink-soft hover:bg-berry/[0.06] hover:text-berry'
                      }`}
                    >
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-3 kicker text-ink-soft">
                On this page
              </p>
              <ul className="space-y-1 border-l border-berry/15">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <button
                      onClick={() => scrollToId(s.id)}
                      className="-ml-px block border-l-2 border-transparent px-3 py-1.5 text-left text-xs font-medium text-ink-muted transition-colors hover:border-berry hover:text-berry"
                    >
                      {i + 1}. {s.heading}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Content */}
        <article className="min-w-0">
          <div className="space-y-10">
            {sections.map((s, i) => (
              <motion.section
                key={s.id}
                id={s.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4 }}
                className="scroll-mt-28"
              >
                <h2 className="flex items-baseline gap-3 font-display text-xl font-extrabold text-ink sm:text-2xl">
                  <span className="text-sm font-extrabold accent-text">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {s.heading}
                </h2>
                {s.body && (
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft sm:text-[15px]">
                    {s.body}
                  </p>
                )}
                {s.items && (
                  <ul className="mt-4 space-y-2.5">
                    {s.items.map((item, j) => (
                      <li key={j} className="flex gap-3 text-sm leading-relaxed text-ink-soft sm:text-[15px]">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-berry" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.section>
            ))}
          </div>

          {/* Support card */}
          <div className="glass foil-top mt-14 rounded-panel p-7 relative z-[2]">
            <div className="flex items-center gap-3">
              <span className="ico-chip h-10 w-10 rounded-2xl text-leaf">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <h3 className="font-display text-lg font-extrabold text-ink">
                Questions about this policy?
              </h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Our customer support team is happy to help with anything related to your orders,
              returns, or account.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={`mailto:${SUPPORT_CONTACT.email}`}
                className="btn-berry inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold uppercase tracking-widest"
              >
                <Mail className="h-3.5 w-3.5" /> Email us
              </a>
              <a
                href={`tel:${SUPPORT_CONTACT.phones[0].replace(/\s/g, '')}`}
                className="btn-glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold uppercase tracking-widest !text-berry"
              >
                <Phone className="h-3.5 w-3.5" /> {SUPPORT_CONTACT.phones[0]}
              </a>
            </div>
          </div>

          <div className="mt-8">
            <Link
              to="/policies"
              className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-ink-muted transition-colors hover:text-berry"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> All policies
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
