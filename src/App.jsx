import { useState, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { CartProvider } from './context/CartContext';
import Loader from './components/ui/loader';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';

function App() {
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // Graceful timer to ensure all initial component assets settle before fading loader
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <CartProvider>
      {/* reducedMotion="user" makes every framer-motion animation in the app
          honour the OS "reduce motion" setting automatically. */}
      <MotionConfig reducedMotion="user">
        <AnimatePresence mode="wait">
          {initialLoading && (
            <motion.div
              key="initial-app-loader"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="fixed inset-0 z-[99999] bg-[#FAF8F5]"
            >
              <Loader fullScreen={true} text="Initializing Alimenture" />
            </motion.div>
          )}
        </AnimatePresence>
        <RouterProvider router={router} />
        <Toaster />
      </MotionConfig>
    </CartProvider>
  );
}

export default App;