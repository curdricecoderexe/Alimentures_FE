import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authenticatedFetch } from '../lib/api';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/notifications`);
      if (res && res.ok) {
        const data = await res.json();
        setNotifications(data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id) => {
    try {
      await authenticatedFetch(`${import.meta.env.VITE_API_URL}/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-6 w-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-3 w-3 bg-[#E83D6E] rounded-full border-2 border-white" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Transparent click-outside handler for mobile */}
            <div className="fixed inset-0 z-[140] sm:hidden" onClick={() => setIsOpen(false)} />

            <motion.div 
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className="fixed inset-x-3 top-[84px] sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-[calc(100vw-24px)] sm:w-80 bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border border-gray-100 overflow-hidden z-[150]"
            >
              <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 tracking-tight text-sm sm:text-base">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold text-[#E83D6E] bg-pink-50 px-2 py-0.5 rounded-full">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            
            <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm font-bold text-gray-400 italic">
                  All caught up!
                </div>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    onClick={() => { if (!notif.read) markAsRead(notif.id); }}
                    className={`p-4 cursor-pointer transition-colors ${notif.read ? 'bg-white' : 'bg-blue-50/30 hover:bg-blue-50/50'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`text-sm ${notif.read ? 'font-bold text-gray-700' : 'font-bold text-gray-900'}`}>
                        {notif.title}
                      </h4>
                      {!notif.read && <div className="h-2 w-2 rounded-full bg-blue-500 mt-1" />}
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">{notif.message}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                      {new Date(notif.createdAt?._seconds * 1000).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </div>
  );
}
