import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  build: {
    // Source maps make production stack traces readable. They expose your
    // source, so drop this to false if the code is meant to stay private.
    sourcemap: true,

    rollupOptions: {
      output: {
        // Split the large, rarely-changing dependencies into their own chunks.
        // Without this the whole app ships as one bundle that busts its cache
        // on every deploy, forcing users to re-download React each time.
        //
        // Must be a function: Vite 8 bundles with rolldown, which dropped the
        // object form Rollup accepted and fails the build outright with
        // "manualChunks is not a function".
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          // Matched against the path separator so a package whose name merely
          // starts with one of these (react-toastify, say) is not swept in.
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) {
            return 'react';
          }
          if (/[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) {
            return 'motion';
          }
          if (/[\\/]node_modules[\\/]lucide-react[\\/]/.test(id)) {
            return 'icons';
          }
          return undefined;
        },
      },
    },

    // The default 500 kB warning fires constantly on an app this size and
    // trains you to ignore it. Raised so it only speaks up about real problems.
    chunkSizeWarningLimit: 900,
  },

  server: {
    port: 5173,
    // Proxy /api during development so the browser sees a same-origin request.
    // Avoids CORS entirely locally; production talks cross-origin to Render
    // with the explicit allowlist configured in the backend settings.
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },

  preview: {
    port: 4173,
  },
})
