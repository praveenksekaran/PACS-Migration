import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../dicomweb-viewer/public',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/rs': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/wadouri': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Resource-Policy': 'same-site',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
