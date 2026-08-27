import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // gsap is only imported by the (lazily-loaded) Home route — let
            // Rollup bundle it into that chunk instead of the eager vendor one.
            if (id.includes('/gsap/') || id.includes('\\gsap\\')) return;
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
        }
      }
    }
  }
})
