import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Subresource Integrity: after the build is written, stamp a sha384
 * `integrity` on every <script>/<link> in dist/index.html that points at a
 * built asset, hashing the exact bytes on disk. (Lazy chunks loaded through
 * dynamic import() can't carry SRI in browsers; the entry chain does.)
 */
function subresourceIntegrity() {
  let outDir = 'dist';
  return {
    name: 'alimenture-sri',
    apply: 'build',
    configResolved(cfg) { outDir = cfg.build.outDir; },
    closeBundle() {
      const htmlPath = join(outDir, 'index.html');
      if (!existsSync(htmlPath)) return;
      const html = readFileSync(htmlPath, 'utf8').replace(
        /<(script|link)\b([^>]*?)\b(src|href)="(\/assets\/[^"]+\.(?:js|css))"([^>]*)>/g,
        (tag, name, pre, attr, url, post) => {
          if (/\bintegrity=/.test(tag)) return tag;
          const file = join(outDir, url);
          if (!existsSync(file)) return tag;
          const hash = createHash('sha384').update(readFileSync(file)).digest('base64');
          const cors = /\bcrossorigin\b/.test(tag) ? '' : ' crossorigin';
          return `<${name}${pre} ${attr}="${url}"${post} integrity="sha384-${hash}"${cors}>`.replace(/\s+>/, '>').replace('/ integrity', ' integrity');
        },
      );
      writeFileSync(htmlPath, html);
    },
  };
}

// Only the React core is pinned to its own long-cached chunk. Everything else
// is left to Rollup so libraries ride with the lazy pages that import them —
// a catch-all "vendor" chunk would make every visitor download the PDF/Excel/
// chart helpers that only admin screens use.
const REACT_CORE = /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), subresourceIntegrity()],
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
