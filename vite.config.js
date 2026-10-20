import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

<<<<<<< HEAD
=======
// Only the React core is pinned to its own long-cached chunk. Everything else
// is left to Rollup so libraries ride with the lazy pages that import them —
// a catch-all "vendor" chunk would make every visitor download the PDF/Excel/
// chart helpers that only admin screens use.
const REACT_CORE = /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/;

>>>>>>> 059c68a (Update frontend features)
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
<<<<<<< HEAD
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-recharts';
            }
            if (id.includes('html2canvas') || id.includes('jspdf') || id.includes('exceljs')) {
              return 'vendor-utils';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            if (id.includes('lucide-react') || id.includes('react-icons')) {
              return 'vendor-icons';
            }
            return 'vendor';
          }
=======
          if (REACT_CORE.test(id)) return 'vendor-react';
>>>>>>> 059c68a (Update frontend features)
        }
      }
    }
  }
})
