import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Server base URL - check environment variable first, then fallback to localhost
const API_URL = process.env.VITE_API_URL || 'http://localhost:8030/api';
// Extract base URL (remove /api suffix for proxy target)
const API_BASE_URL = API_URL.replace('/api', '');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5175,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
    proxy: {
      '/api': {
        target: API_BASE_URL,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      }
    }
  },
  // Make environment variables available to the client
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(API_URL),
  }
})

