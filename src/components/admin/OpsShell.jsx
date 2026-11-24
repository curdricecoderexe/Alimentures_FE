import { useEffect, useLayoutEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Menu, X, Moon, Sun, ExternalLink } from 'lucide-react';
import { logout } from '../../lib/api';
import logo from '../../assets/logo.png';
import NotificationCenter from '../NotificationCenter';
import { MilletSpray } from '../home/BotanicalArt';

/**
 * Shared chrome for the Admin and Staff portals, in the storefront's
 * editorial voice: cream field, white sidebar with a sandal hairline,
 * "● Label" group eyebrows, berry-tint active pills (same as the customer
 * navbar) and flat pill buttons. Page bodies are themed by `.ops-theme`
 * in index.css.
 *
 * `groups`   [{ title, items: [{ path, label, icon }] }]
 * `portal`   eyebrow under the logo ("Management hub", "Staff portal")
 * `account`  optional { name, role } shown above logout
 * `syncHtmlDark` also toggles <html class="dark"> (Admin pages rely on it)
 */
export default function OpsShell({ groups, portal, account, syncHtmlDark = false }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  // Layout effect: the theme lands before the browser paints, so switching
  // pages (or toggling) never shows a frame in the wrong theme.
  useLayoutEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (syncHtmlDark) document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode, syncHtmlDark]);
  // Leaving the portal: don't carry the dark page background into the storefront.
  useLayoutEffect(() => () => { if (syncHtmlDark) document.documentElement.classList.remove('dark'); }, [syncHtmlDark]);

  // Close the mobile drawer on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const ThemeIcon = isDarkMode ? Sun : Moon;
  const themeBtn = 'h-10 w-10 rounded-full border border-[#ECE6DA] bg-white flex items-center justify-center text-ink-soft hover:text-berry hover:border-berry/30 transition-colors no-invert';

  return (
    <div className={`ops-theme min-h-screen font-sans text-ink ${isDarkMode ? 'dark-theme' : ''}`}>
      {/* ── Mobile top bar ── */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-16 sm:h-20 bg-cream/90 backdrop-blur-md border-b border-[#ECE6DA] z-[90] flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className={themeBtn}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <img src={logo} alt="Alimenture" className="h-9 sm:h-11 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setIsDarkMode((v) => !v)} className={themeBtn} aria-label="Toggle theme">
            <ThemeIcon className="h-[18px] w-[18px]" />
          </button>
          <NotificationCenter />
        </div>
      </div>

      {/* ── Desktop utilities ── */}
      <div className="hidden lg:flex fixed top-6 right-8 z-[100] items-center gap-2">
        <button type="button" onClick={() => setIsDarkMode((v) => !v)} className={`${themeBtn} shadow-sm`} aria-label="Toggle theme">
          <ThemeIcon className="h-[18px] w-[18px]" />
        </button>
        <NotificationCenter />
      </div>

      {/* ── Mobile drawer backdrop ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden fixed inset-0 bg-night/40 backdrop-blur-sm z-[110]"
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-white border-r border-[#ECE6DA] z-[120] flex flex-col overflow-hidden transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <MilletSpray className="pointer-events-none absolute -right-14 -bottom-16 w-[170px] opacity-[0.18] rotate-[8deg]" />

        <div className="relative px-7 pt-7 pb-5 flex items-start justify-between shrink-0">
          <div>
            <Link to="/" aria-label="Alimenture storefront">
              <img src={logo} alt="Alimenture" className="h-12 sm:h-14 w-auto object-contain" />
            </Link>
            <span className="eyebrow mt-4">{portal}</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden h-9 w-9 rounded-full border border-[#ECE6DA] flex items-center justify-center text-ink-soft"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="relative flex-1 overflow-y-auto no-scrollbar px-4 pb-4 space-y-6">
          {groups.map((group) => (
            <div key={group.title || 'main'} className="space-y-1">
              {group.title && (
                <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A09A92]">{group.title}</p>
              )}
              {group.items.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    aria-current={isActive ? 'page' : undefined}
                    className={`group relative flex items-center gap-3 h-11 px-3 rounded-full transition-colors ${
                      isActive ? 'ops-nav-active text-berry' : 'text-ink-soft hover:text-ink hover:bg-ink/[0.04]'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="ops-nav-active"
                        className="absolute inset-0 rounded-full bg-berry-tint ops-nav-pill"
                        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                      />
                    )}
                    <Icon className="relative h-[18px] w-[18px] shrink-0" />
                    <span className="relative font-display text-[15px] tracking-[-0.005em]">{label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="relative shrink-0 border-t border-[#ECE6DA] p-4 space-y-3 sidebar-footer-container">
          {account && (
            <div className="flex items-center gap-3 px-2">
              <span className="h-10 w-10 rounded-full bg-mulberry text-white flex items-center justify-center font-display text-[15px]">
                {account.name.charAt(0)}
              </span>
              <div className="min-w-0">
                <p className="font-display text-[14.5px] text-ink truncate">{account.name}</p>
                <p className="text-[12px] text-ink-muted truncate">{account.role}</p>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Link
              to="/"
              className="flex-1 h-11 rounded-full border border-[#ECE6DA] inline-flex items-center justify-center gap-2 font-display text-[14px] text-ink-soft hover:text-berry hover:border-berry/30 transition-colors"
            >
              <ExternalLink className="h-4 w-4" /> Storefront
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="flex-1 h-11 rounded-full border border-[#ECE6DA] inline-flex items-center justify-center gap-2 font-display text-[14px] text-ink-soft hover:text-danger hover:border-danger/30 transition-colors sidebar-logout-btn"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* ── Content ── */}
      <main className="lg:ml-72 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-[1600px] mx-auto overflow-x-hidden pt-24 sm:pt-28 lg:pt-20 px-3 sm:px-6 lg:px-10 pb-16"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
