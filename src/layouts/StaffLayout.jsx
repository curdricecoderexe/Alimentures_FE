import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { logout } from '../lib/api';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  LogOut,
  ArrowRight,
  UserCircle,
  MessageSquare,
  Moon,
  Sun,
  Menu,
  X
} from 'lucide-react';
import { Button } from '../components/ui/button';
import logo from '../assets/logo.png';
import NotificationCenter from '../components/NotificationCenter';
import SEO from '../components/SEO';

export default function StaffLayout() {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: '/staff', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/staff/orders', label: 'Orders', icon: ShoppingBag },
    { path: '/staff/inventory', label: 'Inventory', icon: Package },
    { path: '/staff/chats', label: 'Support Desk', icon: MessageSquare },
  ];

  return (
    <div className={`min-h-screen bg-[#FAFAFA] ${isDarkMode ? 'dark-theme' : ''}`}>
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 sm:h-20 bg-white border-b border-gray-100 z-40 px-4 sm:px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-gray-50 border border-gray-100 text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <img src={logo} alt="Alimenture" className="h-9 sm:h-11 w-auto object-contain" />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-gray-700 hover:bg-gray-100 transition-colors no-invert"
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun className="text-orange-500 w-5 h-5" /> : <Moon className="text-indigo-600 w-5 h-5" />}
          </button>
          <NotificationCenter />
        </div>
      </div>

      {/* Desktop Floating Theme Toggle */}
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)} 
        className="hidden lg:flex fixed bottom-6 right-6 z-[100] p-4 rounded-full bg-white shadow-xl border border-gray-100 items-center justify-center no-invert hover:scale-110 transition-transform"
        aria-label="Toggle Theme"
      >
        {isDarkMode ? <Sun className="text-orange-500 w-6 h-6" /> : <Moon className="text-indigo-600 w-6 h-6" />}
      </button>
      <div className="hidden lg:block fixed top-6 right-8 z-[100]">
        <NotificationCenter />
      </div>

      {/* Mobile Drawer Backdrop Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40"
          />
        )}
      </AnimatePresence>

      {/* Responsive Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-72 bg-white border-r border-gray-100 z-50 flex flex-col shadow-xl lg:shadow-sm transition-transform duration-300 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Branding Area */}
        <div className="p-6 sm:p-8 flex items-center justify-between">
          <div>
            <img src={logo} alt="Alimenture" className="h-12 sm:h-16 w-auto object-contain drop-shadow-sm" />
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#C41E6B] animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 italic">
                Staff Portal
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-xl bg-gray-50 border border-gray-100 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 mt-2 sm:mt-4 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative group block"
              >
                <div
                  className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 relative z-10 ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-500 dark:text-gray-300 hover:text-[#C41E6B] dark:hover:text-pink-400 hover:bg-pink-50/50 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-transform duration-300 ${
                    isActive 
                      ? 'scale-110 text-white' 
                      : 'group-hover:scale-110 text-gray-500 dark:text-gray-300 group-hover:text-[#C41E6B] dark:group-hover:text-pink-400'
                  }`} />
                  <span className={`font-black italic tracking-tight ${isActive ? 'text-lg text-white' : 'text-md'}`}>
                    {item.label}
                  </span>
                  
                  {isActive && (
                    <motion.div
                      layoutId="staff-nav-active"
                      className="absolute inset-0 bg-[#C41E6B] rounded-2xl -z-10 shadow-[0_10px_20px_rgba(196,30,107,0.15)]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer Area: User Profile & Logout */}
        <div className="p-6 border-t border-gray-50 bg-gray-50/30">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center">
              <UserCircle className="text-white h-6 w-6 opacity-80" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-900 tracking-tight">Operations Team</p>
              <p className="text-[9px] font-bold text-[#C41E6B] uppercase tracking-widest italic">Terminal 01</p>
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full justify-between rounded-2xl h-12 hover:bg-white hover:shadow-md group transition-all"
            onClick={() => logout()}
          >
            <div className="flex items-center font-bold italic text-gray-500 group-hover:text-red-500 transition-colors">
              <LogOut className="h-5 w-5 mr-3 opacity-40 group-hover:opacity-100" />
              Logout
            </div>
            <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:ml-72 min-h-screen pt-16 sm:pt-20 lg:pt-0">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="p-3 sm:p-6 lg:p-10"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}