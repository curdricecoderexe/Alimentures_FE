import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { logout } from '../lib/api';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  BarChart3,
  LogOut,
  Star,
  MessageSquare,
  Image as ImageIcon,
  Moon,
  Sun,
  Sparkles,
  Leaf,
  Menu,
  X,
  Cookie,
  Tag,
  MapPin,
  Palette
} from 'lucide-react';
import { Button } from '../components/ui/button';
import logo from '../assets/logo.png';
import NotificationCenter from '../components/NotificationCenter';
import SEO from '../components/SEO';

// Static background — no infinite animations to avoid continuous GPU compositing
const BackgroundDecor = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden bg-[#FAFAFA]">
    <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-pink-100/40 blur-[120px]" />
    <div className="absolute top-[20%] -right-[5%] w-[40%] h-[40%] rounded-full bg-orange-50/50 blur-[100px]" />
  </div>
);

export default function AdminLayout() {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navGroups = [
    {
      title: 'Overview',
      items: [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/admin/cookies-analytics', label: 'Cookies & Events', icon: Cookie },
      ]
    },
    {
      title: 'Storefront',
      items: [
        { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
        { path: '/admin/products', label: 'Products', icon: Package },
        { path: '/admin/super-grains', label: 'Super Grains', icon: Leaf },
        { path: '/admin/coupon-codes', label: 'Coupons', icon: Tag },
        { path: '/admin/pincode-delivery', label: 'PIN Code Delivery', icon: MapPin },
      ]
    },
    {
      title: 'Community & Content',
      items: [
        { path: '/admin/users', label: 'Users', icon: Users },
        { path: '/admin/reviews', label: 'Reviews', icon: Star },
        { path: '/admin/chats', label: 'Chats', icon: MessageSquare },
        { path: '/admin/hero-slides', label: 'Hero Banners', icon: ImageIcon },
        { path: '/admin/appearance', label: 'Templates', icon: Palette },
      ]
    }
  ];



  return (
    <div className={`min-h-screen bg-transparent font-sans text-gray-900 ${isDarkMode ? 'dark-theme' : ''}`}>
      <SEO title="Admin Dashboard" noindex={true} />
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)} 
        className="fixed bottom-6 right-6 z-[100] p-4 rounded-full bg-white shadow-xl border border-gray-100 flex items-center justify-center no-invert hover:scale-110 transition-transform"
      >
        {isDarkMode ? <Sun className="text-orange-500 w-6 h-6" /> : <Moon className="text-indigo-600 w-6 h-6" />}
      </button>
      {/* Desktop Notification Center — single instance */}
      <div className="fixed top-6 right-8 z-[100] hidden lg:block">
        <NotificationCenter />
      </div>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 z-[90] flex items-center justify-between px-6">
        <img src={logo} alt="Alimenture" className="h-12 w-auto object-contain drop-shadow-sm" />
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-gray-50 border border-gray-100 text-gray-600 shadow-sm"
          >
            <Menu className="w-6 h-6" />
          </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-72 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 border-r border-gray-100 z-[120] flex flex-col transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 pb-4 flex items-center justify-between lg:block shrink-0">
          <div className="text-center lg:text-left">
            <img src={logo} alt="Alimenture Industries" className="h-14 sm:h-16 w-auto mx-auto lg:mx-0 object-contain drop-shadow-sm" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mt-4 ml-1">
              Management Hub
            </p>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="px-3 space-y-4 flex-1 overflow-y-auto pb-4 no-scrollbar">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-2">
                {group.title}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="relative group block"
                  >
                    <div className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 relative z-10
                      ${isActive 
                        ? 'text-white shadow-none' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-[#C41E6B] dark:hover:text-pink-400 hover:bg-pink-50/50 dark:hover:bg-white/5'
                      }
                    `}>
                      <Icon className={`h-[18px] w-[18px] transition-transform duration-300 ${isActive ? 'scale-110 text-white' : 'group-hover:scale-110'}`} />
                      <span className={`text-[13px] font-bold tracking-tight ${isActive ? 'text-white' : 'opacity-80 group-hover:opacity-100'}`}>
                        {item.label}
                      </span>
                    </div>

                    {/* Animated Background Pill */}
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 bg-gradient-to-r from-[#C41E6B] to-[#E83D6E] rounded-xl z-0 shadow-sm"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 sm:p-6 shrink-0 mt-auto sidebar-footer-container">
          <div className="p-3 sm:p-4 rounded-2xl sidebar-logout-card">
            <Button
              variant="ghost"
              className="w-full justify-start hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 rounded-xl font-bold sidebar-logout-btn transition-all group"
              onClick={() => logout()}
            >
              <div className="p-2 sidebar-logout-icon-box rounded-lg shadow-sm mr-3 group-hover:bg-red-100 dark:group-hover:bg-red-900/40 transition-colors">
                <LogOut className="h-4 w-4" />
              </div>
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:ml-72 min-h-screen transition-all duration-300">
        <div className="max-w-[1600px] mx-auto overflow-x-hidden pt-24 lg:pt-16 px-3 sm:px-6 lg:px-8 pb-16">
           <Outlet />
        </div>
      </main>
    </div>
  );
}