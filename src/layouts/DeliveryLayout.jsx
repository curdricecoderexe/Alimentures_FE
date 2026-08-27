import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { logout } from '../lib/api';
import {
  LayoutDashboard,
  Truck,
  LogOut,
  ArrowRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import logo from '../assets/logo.png';
import NotificationCenter from '../components/NotificationCenter';

export default function DeliveryLayout() {
  const location = useLocation();

  const navItems = [
    { path: '/delivery', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/delivery/orders', label: 'My Deliveries', icon: Truck },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="fixed top-6 right-8 z-[100]">
        <NotificationCenter />
      </div>
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-white border-r border-gray-100 z-50 flex flex-col shadow-sm">
        <div className="p-8">
          <img src={logo} alt="Alimenture Industries" className="h-14 sm:h-16 w-auto object-contain drop-shadow-sm" />
          <div className="mt-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 italic">
              Delivery Portal
            </p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto no-scrollbar">
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
                      layoutId="nav-active"
                      className="absolute inset-0 bg-[#C41E6B] rounded-2xl -z-10 shadow-[0_10px_20px_rgba(196,30,107,0.2)]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-6 border-t border-gray-50">
          <div className="bg-gray-50 rounded-3xl p-4 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-black italic text-xs">
              DP
            </div>
            <div>
              <p className="text-xs font-black text-gray-900">Delivery Partner</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">On Duty</p>
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full justify-between rounded-2xl h-12 hover:bg-pink-50 hover:text-[#C41E6B] group transition-all"
            onClick={() => logout()}
          >
            <div className="flex items-center font-bold italic">
              <LogOut className="h-5 w-5 mr-3 opacity-40 group-hover:opacity-100" />
              Logout
            </div>
            <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-72 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-10"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}