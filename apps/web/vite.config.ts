import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

import { reticle } from '@reticlehq/vite-plugin';
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  const backendUrl = process.env.VITE_BACKEND_API_URL;
  if (isProd && backendUrl && (backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1'))) {
    console.warn(
      '\x1b[33m%s\x1b[0m',
      '[Vite Build Guard] WARNING: VITE_BACKEND_API_URL points to localhost/127.0.0.1 in production build! The frontend will guard against this at runtime by falling back to relative /api.'
    );
  }

  return {
    plugins: [reticle(), react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (
                id.includes('three') ||
                id.includes('@react-three/fiber') ||
                id.includes('@react-three/drei')
              ) {
                return 'vendor-three';
              }
              if (id.includes('framer-motion')) {
                return 'vendor-motion';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-lucide';
              }
              if (
                id.includes('react') ||
                id.includes('react-dom') ||
                id.includes('react-router-dom')
              ) {
                return 'vendor-react';
              }
              return 'vendor-misc';
            }
          },
        },
      },
    },
  };
});
