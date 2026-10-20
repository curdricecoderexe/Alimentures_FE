import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Only the React core is pinned to its own long-cached chunk. Everything else
// is left to Rollup so libraries ride with the lazy pages that import them —
// a catch-all "vendor" chunk would make every visitor download the PDF/Excel/
// chart helpers that only admin screens use.
const REACT_CORE = /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (REACT_CORE.test(id)) return 'vendor-react';
        }
      }
    }
  }
})
